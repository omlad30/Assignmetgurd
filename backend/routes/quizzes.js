const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All quiz routes require user authentication
router.use(protect);

// Teacher creates a quiz
router.post('/', authorize('teacher', 'admin'), quizController.createQuiz);

// Get all quizzes for a classroom
router.get('/classroom/:classroomId', quizController.getClassroomQuizzes);

// Get student's quiz submissions in a classroom
router.get('/student/submissions/:classroomId', quizController.getStudentQuizSubmissions);

// Verify quiz password
router.post('/:quizId/verify-password', quizController.verifyQuizPassword);

// Get single quiz by ID (for attempting or reviewing)
router.get('/:quizId', quizController.getQuizById);

// Submit quiz answers (Student)
router.post('/:quizId/submit', authorize('student'), quizController.submitQuiz);

// Get quiz results/leaderboard (Teacher)
router.get('/:quizId/results', authorize('teacher', 'admin'), quizController.getQuizResultsForTeacher);

// Export quiz grades to CSV (Teacher)
router.get('/:quizId/export', authorize('teacher', 'admin'), quizController.exportQuizGrades);

// Delete quiz (Teacher)
router.delete('/:quizId', authorize('teacher', 'admin'), quizController.deleteQuiz);

module.exports = router;
