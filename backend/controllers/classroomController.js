const Classroom = require('../models/Classroom');
const Assignment = require('../models/Assignment');

exports.createClassroom = async (req, res) => {
  try {
    const { name } = req.body;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const classroom = await Classroom.create({
      name,
      teacherId: req.user._id,
      inviteCode,
    });
    res.status(201).json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.joinClassroom = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const classroom = await Classroom.findOne({ inviteCode });
    if (!classroom) {
      return res.status(404).json({ message: 'Invalid invite code.' });
    }
    if (classroom.students.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are already in this classroom.' });
    }
    classroom.students.push(req.user._id);
    await classroom.save();
    res.json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeacherClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({ teacherId: req.user._id });
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({ students: req.user._id }).populate('teacherId', 'fullName');
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
