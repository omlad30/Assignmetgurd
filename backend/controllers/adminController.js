const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Assignment = require('../models/Assignment');

exports.getAdminStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalClassrooms = await Classroom.countDocuments();
    const totalAssignments = await Assignment.countDocuments();

    // Fetch all classrooms with teacher details
    const classrooms = await Classroom.find()
      .populate('teacherId', 'fullName email')
      .populate('students', 'fullName')
      .sort({ createdAt: -1 });

    res.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalClassrooms,
        totalAssignments
      },
      classrooms
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
