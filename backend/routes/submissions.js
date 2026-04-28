const express = require('express');
const router = express.Router();
const { submitAssignment, getAssignmentSubmissions, getStudentSubmissions, gradeSubmission } = require('../controllers/submissionController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('file'), submitAssignment);
router.get('/student', protect, getStudentSubmissions);
router.get('/assignment/:assignmentId', protect, teacherOnly, getAssignmentSubmissions);
router.put('/:id/grade', protect, teacherOnly, gradeSubmission);

module.exports = router;
