const express = require('express');
const router = express.Router();
const { createClassroom, joinClassroom, getTeacherClassrooms, getStudentClassrooms, getClassroomById, updateClassroom, deleteClassroom, approveStudent, rejectStudent } = require('../controllers/classroomController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

router.post('/', protect, teacherOnly, createClassroom);
router.post('/join', protect, joinClassroom);
router.get('/teacher', protect, teacherOnly, getTeacherClassrooms);
router.get('/student', protect, getStudentClassrooms);
router.get('/:id', protect, getClassroomById);
router.put('/:id', protect, teacherOnly, updateClassroom);
router.delete('/:id', protect, teacherOnly, deleteClassroom);
router.post('/:id/approve/:studentId', protect, teacherOnly, approveStudent);
router.post('/:id/reject/:studentId', protect, teacherOnly, rejectStudent);

module.exports = router;
