const express = require('express');
const router = express.Router();
const { createAssignment, getTeacherAssignments, getAllAssignments, getAssignmentById } = require('../controllers/assignmentController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, teacherOnly, createAssignment)
  .get(protect, getAllAssignments);

router.route('/teacher').get(protect, teacherOnly, getTeacherAssignments);

router.route('/:id').get(protect, getAssignmentById);

module.exports = router;
