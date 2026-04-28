const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const extractText = require('../utils/extractText');
const { checkDuplicate } = require('../utils/duplicateCheck');
const { checkAiContent } = require('../utils/geminiCheck');
const sendEmail = require('../utils/sendEmail');
const cloudinary = require('../config/cloudinary');

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
    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this assignment.' });
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

    // 5. Save submission
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

    // 6. Emails
    sendEmail({
      email: req.user.email,
      subject: `Submission Received: ${assignment.title}`,
      message: `Your assignment "${assignment.title}" has been successfully received. Status: ${status}.\n\nReason: ${rejectionReason}`,
    });

    sendEmail({
      email: assignment.teacherId.email,
      subject: `New Submission: ${assignment.title}`,
      message: `Student ${req.user.fullName} has submitted assignment "${assignment.title}".\nSimilarity: ${duplicateResult.similarityScore}%\nAI Score: ${aiResult.ai_probability}%`,
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
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.grade = grade;
    await submission.save();

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
