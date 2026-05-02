const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const extractText = require('../utils/extractText');
const { checkDuplicate } = require('../utils/duplicateCheck');
const { checkAiContent, checkAiContentDraft } = require('../utils/geminiCheck');
const sendEmail = require('../utils/sendEmail');
const cloudinary = require('../config/cloudinary');

exports.checkDraft = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF, DOCX, or Image file' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // 1. Extract text from file buffer
    let text = '';
    try {
      text = await extractText(req.file.buffer, req.file.mimetype);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Could not extract text or file is empty.' });
    }

    // 2. Duplicate check
    const previousSubmissions = await Submission.find({ assignmentId });
    const duplicateResult = checkDuplicate(text, previousSubmissions);

    // 3. AI Content Check with Constructive Feedback
    const aiResult = await checkAiContentDraft(text);

    // Return the results without saving to DB
    res.status(200).json({
      similarityScore: duplicateResult.similarityScore,
      aiScore: aiResult.ai_probability,
      feedback: aiResult.feedback,
      message: 'Pre-Flight check completed successfully. This attempt was not saved.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const studentId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF or DOCX file' });
    }

    const assignment = await Assignment.findById(assignmentId).populate('teacherId');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (new Date() > new Date(assignment.deadline)) {
      return res.status(400).json({ message: 'Deadline has passed. Submission locked.' });
    }

    const existingSubmission = await Submission.findOne({ assignmentId, studentId });
    if (existingSubmission && existingSubmission.status !== 'rejected') {
      return res.status(400).json({ message: 'You have already submitted this assignment.' });
    }

    if (existingSubmission && existingSubmission.status === 'rejected') {
      await Submission.findByIdAndDelete(existingSubmission._id);
      assignment.totalSubmissions = Math.max(0, assignment.totalSubmissions - 1);
    }

    // 1. Extract text from file buffer
    let text = '';
    try {
      text = await extractText(req.file.buffer, req.file.mimetype);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Could not extract text or file is empty.' });
    }

    // 2. Upload file to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
    const cldRes = await cloudinary.uploader.upload(dataURI, {
      resource_type: 'auto',
      folder: 'assignments',
    });
    const fileUrl = cldRes.secure_url;

    // 3. Duplicate check
    const previousSubmissions = await Submission.find({ assignmentId });
    const duplicateResult = checkDuplicate(text, previousSubmissions);

    let status = 'accepted';
    let rejectionReason = '';

    if (duplicateResult.isDuplicate) {
      status = 'rejected';
      rejectionReason = `Duplicate found. Similarity: ${duplicateResult.similarityScore}%`;
    }

    // 4. AI Content Check
    const aiResult = await checkAiContent(text);
    if (!duplicateResult.isDuplicate && aiResult.ai_probability > 80) {
      status = 'ai_flagged';
      rejectionReason = aiResult.reason || 'High AI-generation probability.';
    }

    // If rejected due to similarity or AI, set to quarantine
    if (status === 'rejected' || status === 'ai_flagged') {
      status = 'quarantine';
      sendEmail({
        email: req.user.email,
        subject: `Submission Under Review: ${assignment.title}`,
        message: `Hello,\n\nYour submission for "${assignment.title}" has been flagged and placed under review by your teacher.\nReason: ${rejectionReason}\n\nPlease wait for your teacher's decision.`,
      });
    }

    // 5. Save submission if accepted
    const submission = await Submission.create({
      assignmentId,
      studentId,
      fileUrl,
      extractedText: text,
      similarityScore: duplicateResult.similarityScore,
      matchedWithStudentId: duplicateResult.matchedWith,
      aiScore: aiResult.ai_probability,
      aiVerdict: aiResult.verdict,
      suspiciousSentences: aiResult.suspicious_sentences,
      status,
      rejectionReason,
    });

    // Update assignment submission count
    assignment.totalSubmissions += 1;
    await assignment.save();

    // 6. Emails for successful or quarantined submission
    if (status === 'accepted') {
      sendEmail({
        email: req.user.email,
        subject: `Submission Successful: ${assignment.title}`,
        message: `Your assignment "${assignment.title}" has been successfully received and passed all automated checks.`,
      });
    }

    sendEmail({
      email: assignment.teacherId.email,
      subject: status === 'quarantine' ? `Action Required: Flagged Submission for ${assignment.title}` : `New Submission: ${assignment.title}`,
      message: `Student ${req.user.fullName} has submitted assignment "${assignment.title}".\nStatus: ${status}\nSimilarity: ${duplicateResult.similarityScore}%\nAI Score: ${aiResult.ai_probability}%${status === 'quarantine' ? '\n\nPlease review this submission in your dashboard.' : ''}`,
    });

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ assignmentId: req.params.assignmentId })
      .populate('studentId', 'fullName email')
      .populate('matchedWithStudentId', 'fullName')
      .select('-extractedText') // Don't send huge text payload by default
      .sort({ createdAt: -1 });
    
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ studentId: req.user._id })
      .populate('assignmentId', 'title deadline subject')
      .select('-extractedText')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { grade } = req.body;
    const submission = await Submission.findById(req.params.id)
      .populate('studentId')
      .populate('assignmentId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.grade = grade;
    await submission.save();

    // Send email to student about their grade
    sendEmail({
      email: submission.studentId.email,
      subject: `Assignment Graded: ${submission.assignmentId.title}`,
      message: `Hello ${submission.studentId.fullName},\n\nYour assignment "${submission.assignmentId.title}" has been graded by your teacher.\n\nGrade Received: ${grade}\n\nLog in to your dashboard to view more details.`,
    });

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSubmissionStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const submission = await Submission.findById(req.params.id)
      .populate('studentId')
      .populate('assignmentId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    submission.status = status;
    await submission.save();

    // Notify student of decision
    sendEmail({
      email: submission.studentId.email,
      subject: `Update on Flagged Submission: ${submission.assignmentId.title}`,
      message: `Hello ${submission.studentId.fullName},\n\nYour teacher has reviewed your flagged submission for "${submission.assignmentId.title}".\n\nDecision: ${status.toUpperCase()}\n\n${status === 'rejected' ? 'Please submit a new, original attempt if permitted by your teacher.' : 'Your submission has been accepted for grading.'}`,
    });

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
