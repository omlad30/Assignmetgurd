const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const Classroom = require('../models/Classroom');

// Create a new Quiz (Teacher only)
exports.createQuiz = async (req, res) => {
  try {
    const {
      title,
      subject,
      description,
      classroomId,
      startTime,
      endTime,
      timeLimitMinutes,
      isPasswordProtected,
      password,
      questions
    } = req.body;

    const finalEndTime = endTime || req.body.deadline;
    const finalStartTime = startTime || Date.now();

    if (!title || !subject || !classroomId || !finalEndTime || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Title, subject, classroom, start date/time, end date/time, and at least one question are required.' });
    }

    if (isPasswordProtected && (!password || password.trim() === '')) {
      return res.status(400).json({ message: 'Password is required when quiz is password protected.' });
    }

    // Verify classroom exists and caller is teacher
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found.' });
    }
    if (classroom.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the classroom teacher can create a quiz.' });
    }

    const quiz = new Quiz({
      title,
      subject,
      description,
      teacherId: req.user._id,
      classroomId,
      startTime: finalStartTime,
      endTime: finalEndTime,
      deadline: finalEndTime,
      timeLimitMinutes: timeLimitMinutes || 0,
      isPasswordProtected: !!isPasswordProtected,
      password: isPasswordProtected ? password.trim() : '',
      questions
    });

    await quiz.save();

    // Socket.io real-time update
    if (req.io) {
      req.io.to(`classroom_${classroomId}`).emit('quiz_created', quiz);
    }

    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ message: 'Failed to create quiz.', error: error.message });
  }
};

// Get all quizzes for a classroom
exports.getClassroomQuizzes = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const isTeacherOrAdmin = req.user.role === 'teacher' || req.user.role === 'admin';

    let quizzes = await Quiz.find({ classroomId }).sort({ createdAt: -1 });

    // Transform quizzes to hide passwords and correct answers for students
    const sanitizedQuizzes = quizzes.map(quiz => {
      const qObj = quiz.toObject();
      if (!isTeacherOrAdmin) {
        delete qObj.password;
        qObj.questions = qObj.questions.map(q => {
          delete q.correctOptionIndex;
          return q;
        });
      }
      return qObj;
    });

    res.json(sanitizedQuizzes);
  } catch (error) {
    console.error('Error fetching classroom quizzes:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes.' });
  }
};

// Verify Quiz Password (Student)
exports.verifyQuizPassword = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { password } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    if (!quiz.isPasswordProtected) {
      return res.json({ success: true, message: 'Quiz does not require a password.' });
    }

    if (quiz.password !== password?.trim()) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Access denied.' });
    }

    res.json({ success: true, message: 'Password verified successfully.' });
  } catch (error) {
    console.error('Error verifying quiz password:', error);
    res.status(500).json({ message: 'Server error during password verification.' });
  }
};

// Get Single Quiz details for attempting
exports.getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { password } = req.query; // optional password passed via query if password protected

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const isTeacherOrAdmin = req.user.role === 'teacher' || req.user.role === 'admin';

    // If password protected and caller is student, verify password
    if (!isTeacherOrAdmin && quiz.isPasswordProtected) {
      if (!password || password.trim() !== quiz.password) {
        return res.status(401).json({ message: 'Password required or invalid password.', requiresPassword: true });
      }
    }

    // Check if student has already submitted
    let existingSubmission = null;
    if (req.user.role === 'student') {
      existingSubmission = await QuizSubmission.findOne({ quizId, studentId: req.user._id });
    }

    const quizObj = quiz.toObject();
    if (!isTeacherOrAdmin && !existingSubmission) {
      delete quizObj.password;
      quizObj.questions = quizObj.questions.map(q => {
        delete q.correctOptionIndex;
        return q;
      });
    }

    res.json({
      quiz: quizObj,
      alreadySubmitted: !!existingSubmission,
      submission: existingSubmission
    });
  } catch (error) {
    console.error('Error fetching quiz by ID:', error);
    res.status(500).json({ message: 'Failed to fetch quiz details.' });
  }
};

// Submit Quiz Answers (Student)
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, password } = req.body; // answers: [{ questionIndex, selectedOptionIndex }]

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    // Check start and end time window
    const now = new Date();
    const quizEndTime = quiz.endTime || quiz.deadline;
    if (quiz.startTime && new Date(quiz.startTime) > now) {
      return res.status(400).json({ message: 'Quiz has not started yet.' });
    }
    if (quizEndTime && new Date(quizEndTime) < now) {
      return res.status(400).json({ message: 'Quiz has ended. Submissions are closed.' });
    }

    // Check password if required
    if (quiz.isPasswordProtected && quiz.password !== password?.trim()) {
      return res.status(401).json({ message: 'Invalid password. Cannot submit quiz.' });
    }

    // Check existing submission
    const existing = await QuizSubmission.findOne({ quizId, studentId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted this quiz.' });
    }

    // Evaluate answers
    let score = 0;
    let totalScore = 0;
    const evaluatedAnswers = quiz.questions.map((q, idx) => {
      const pts = q.points || 1;
      totalScore += pts;
      const studentAns = (answers || []).find(a => a.questionIndex === idx);
      const selectedOptionIndex = studentAns ? studentAns.selectedOptionIndex : null;
      const isCorrect = selectedOptionIndex !== null && selectedOptionIndex === q.correctOptionIndex;
      if (isCorrect) {
        score += pts;
      }
      return {
        questionIndex: idx,
        selectedOptionIndex,
        isCorrect
      };
    });

    const percentage = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;

    const submission = new QuizSubmission({
      quizId,
      studentId: req.user._id,
      answers: evaluatedAnswers,
      score,
      totalScore,
      percentage
    });

    await submission.save();

    res.status(201).json({
      message: 'Quiz submitted successfully!',
      submission
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: 'Failed to submit quiz.', error: error.message });
  }
};

// Get Quiz Results for Teacher
exports.getQuizResultsForTeacher = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    if (quiz.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const submissions = await QuizSubmission.find({ quizId })
      .populate('studentId', 'fullName email division rollNumber')
      .sort({ score: -1, submittedAt: 1 });

    res.json({
      quiz,
      submissions
    });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ message: 'Failed to fetch quiz results.' });
  }
};

// Get Student Quiz Submissions for a Classroom
exports.getStudentQuizSubmissions = async (req, res) => {
  try {
    const { classroomId } = req.params;

    if (req.user.role !== 'student') {
      return res.json([]);
    }

    const classroomQuizzes = await Quiz.find({ classroomId }).select('_id');
    const quizIds = classroomQuizzes.map(q => q._id);

    const submissions = await QuizSubmission.find({
      quizId: { $in: quizIds },
      studentId: req.user._id
    }).populate('quizId', 'title subject deadline totalScore');

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching student quiz submissions:', error);
    res.status(500).json({ message: 'Failed to fetch quiz submissions.' });
  }
};

// Delete Quiz (Teacher)
exports.deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    if (quiz.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await Quiz.findByIdAndDelete(quizId);
    await QuizSubmission.deleteMany({ quizId });

    if (req.io) {
      req.io.to(`classroom_${quiz.classroomId}`).emit('quiz_deleted', quizId);
    }

    res.json({ message: 'Quiz deleted successfully.' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ message: 'Failed to delete quiz.' });
  }
};
