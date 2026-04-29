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
