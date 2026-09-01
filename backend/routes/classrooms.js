const express = require('express');
const router = express.Router();
const { createClassroom, joinClassroom, getTeacherClassrooms, getStudentClassrooms, getClassroomById } = require('../controllers/classroomController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

router.post('/', protect, teacherOnly, createClassroom);
router.post('/join', protect, joinClassroom);
router.get('/teacher', protect, teacherOnly, getTeacherClassrooms);
router.get('/student', protect, getStudentClassrooms);
router.get('/:id', protect, getClassroomById);

module.exports = router;
