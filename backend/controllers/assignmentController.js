const Assignment = require('../models/Assignment');

exports.createAssignment = async (req, res) => {
  try {
    const { title, subject, description, deadline, classroomId } = req.body;

    const assignment = await Assignment.create({
      title,
      subject,
      description,
      deadline,
      teacherId: req.user._id,
      classroomId: classroomId || null,
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeacherAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacherId: req.user._id }).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAssignments = async (req, res) => {
  // For students to view assignments (could filter by subject/class in future)
  try {
    const assignments = await Assignment.find()
      .populate('teacherId', 'fullName')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('teacherId', 'fullName');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getClassroomAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ classroomId: req.params.classroomId })
      .populate('teacherId', 'fullName')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssignmentAnalytics = async (req, res) => {
  try {
    const Submission = require('../models/Submission');
    
    const submissions = await Submission.find({ assignmentId: req.params.id })
      .populate('studentId', 'fullName')
      .populate('matchedWithStudentId', 'fullName');

    const nodes = [];
    const links = [];
    const nodeIds = new Set();
    let totalAiScore = 0;
    const allSuspiciousSentences = [];

    submissions.forEach(sub => {
      if (sub.studentId) {
        if (!nodeIds.has(sub.studentId._id.toString())) {
          nodes.push({ id: sub.studentId._id.toString(), name: sub.studentId.fullName, val: 1 });
          nodeIds.add(sub.studentId._id.toString());
        }
        
        if (sub.matchedWithStudentId && sub.similarityScore > 0) {
          if (!nodeIds.has(sub.matchedWithStudentId._id.toString())) {
            nodes.push({ id: sub.matchedWithStudentId._id.toString(), name: sub.matchedWithStudentId.fullName, val: 1 });
            nodeIds.add(sub.matchedWithStudentId._id.toString());
          }
          links.push({
            source: sub.studentId._id.toString(),
            target: sub.matchedWithStudentId._id.toString(),
            value: sub.similarityScore,
            label: `${sub.similarityScore}% Similar`
          });
        }
      }
      if (sub.aiScore) totalAiScore += sub.aiScore;
      if (sub.suspiciousSentences && sub.suspiciousSentences.length > 0) {
        allSuspiciousSentences.push(...sub.suspiciousSentences);
      }
    });

    const averageAiScore = submissions.length > 0 ? (totalAiScore / submissions.length).toFixed(1) : 0;

    res.json({
      graphData: { nodes, links },
      averageAiScore,
      totalSubmissions: submissions.length,
      struggleMetrics: allSuspiciousSentences.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
