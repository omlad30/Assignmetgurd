const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

exports.getAdminStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalClassrooms = await Classroom.countDocuments();
    const totalAssignments = await Assignment.countDocuments();

    // Fetch all classrooms with teacher details
    const classrooms = await Classroom.find()
      .populate('teacherId', 'fullName email subject')
      .populate('students', 'fullName')
      .sort({ createdAt: -1 });

    // --- ANALYTICS DATA ---
    
    // 1. Role Distribution
    const roleDistribution = [
      { name: 'Students', value: totalStudents },
      { name: 'Teachers', value: totalTeachers },
    ];

    // 2. User Growth (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const userGrowthRaw = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, role: { $in: ['student', 'teacher'] } } },
      { 
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format user growth for charts (fill in missing days if needed, but for simplicity we return raw dates)
    const userGrowth = userGrowthRaw.map(item => ({
      date: item._id,
      users: item.count
    }));

    // 3. Platform Activity (Assignments vs Submissions over time)
    const totalSubmissions = await Submission.countDocuments();
    
    const activityData = [
      { name: 'Total Created', value: totalAssignments },
      { name: 'Total Submitted', value: totalSubmissions }
    ];

    res.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalClassrooms,
        totalAssignments,
        totalSubmissions
      },
      classrooms,
      analytics: {
        roleDistribution,
        userGrowth,
        activityData
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
