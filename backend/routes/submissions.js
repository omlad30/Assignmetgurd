const express = require('express');
const router = express.Router();
const { submitAssignment, checkDraft, getAssignmentSubmissions, getStudentSubmissions, gradeSubmission, updateSubmissionStatus } = require('../controllers/submissionController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('file'), submitAssignment);
router.post('/draft', protect, upload.single('file'), checkDraft);
router.get('/student', protect, getStudentSubmissions);
router.get('/assignment/:assignmentId', protect, teacherOnly, getAssignmentSubmissions);
router.put('/:id/grade', protect, teacherOnly, gradeSubmission);
router.put('/:id/status', protect, teacherOnly, updateSubmissionStatus);

module.exports = router;
