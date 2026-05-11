const express = require('express');
const router = express.Router();
const { createAssignment, getTeacherAssignments, getAllAssignments, getAssignmentById, getClassroomAssignments, getAssignmentAnalytics, deleteAssignment, exportAssignmentGrades } = require('../controllers/assignmentController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, teacherOnly, createAssignment)
  .get(protect, getAllAssignments);

router.route('/teacher').get(protect, teacherOnly, getTeacherAssignments);
router.route('/classroom/:classroomId').get(protect, getClassroomAssignments);

router.route('/:id')
  .get(protect, getAssignmentById)
  .delete(protect, teacherOnly, deleteAssignment);
  
router.route('/:id/analytics').get(protect, teacherOnly, getAssignmentAnalytics);
router.route('/:id/export').get(protect, teacherOnly, exportAssignmentGrades);

module.exports = router;
