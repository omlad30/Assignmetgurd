const Classroom = require('../models/Classroom');
const Assignment = require('../models/Assignment');
const User = require('../models/User');

exports.createClassroom = async (req, res) => {
  try {
    const { name, year, division } = req.body;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const classroom = await Classroom.create({
      name,
      year,
      division,
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
    const { inviteCode, rollNo, division } = req.body;
    const classroom = await Classroom.findOne({ inviteCode });
    if (!classroom) {
      return res.status(404).json({ message: 'Invalid invite code.' });
    }
    if (classroom.students.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are already in this classroom.' });
    }
    if (classroom.pendingStudents.includes(req.user._id)) {
      return res.status(400).json({ message: 'Your join request is already pending.' });
    }

    // Update student details if provided
    if (rollNo || division) {
      const user = await User.findById(req.user._id);
      if (rollNo) user.rollNo = rollNo;
      if (division) user.division = division;
      await user.save();
    }

    classroom.pendingStudents.push(req.user._id);
    await classroom.save();
    res.json({ message: 'Join request sent. Waiting for teacher approval.', classroom });
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

exports.getClassroomById = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('teacherId', 'fullName')
      .populate('students', 'fullName rollNo email division')
      .populate('pendingStudents', 'fullName rollNo email division');
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    res.json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateClassroom = async (req, res) => {
  try {
    const { name, year, division } = req.body;
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Make sure user is the teacher of this classroom
    if (classroom.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this classroom' });
    }

    classroom.name = name || classroom.name;
    classroom.year = year || classroom.year;
    classroom.division = division || classroom.division;

    await classroom.save();
    res.json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Make sure user is the teacher of this classroom
    if (classroom.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this classroom' });
    }

    await Classroom.findByIdAndDelete(req.params.id);
    
    // Optionally delete related assignments, quizzes, and submissions
    await Assignment.deleteMany({ classroomId: req.params.id });

    res.json({ message: 'Classroom removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveStudent = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const classroom = await Classroom.findById(id);

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (classroom.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to approve students' });
    }

    classroom.pendingStudents = classroom.pendingStudents.filter(
      (sId) => sId.toString() !== studentId
    );
    if (!classroom.students.includes(studentId)) {
      classroom.students.push(studentId);
    }

    await classroom.save();
    res.json({ message: 'Student approved', classroom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectStudent = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const classroom = await Classroom.findById(id);

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (classroom.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject students' });
    }

    classroom.pendingStudents = classroom.pendingStudents.filter(
      (sId) => sId.toString() !== studentId
    );

    await classroom.save();
    res.json({ message: 'Student rejected', classroom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
