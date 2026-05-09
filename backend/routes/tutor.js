const express = require('express');
const router = express.Router();
const tutorController = require('../controllers/tutorController');
const { protect } = require('../middleware/authMiddleware');

// Allow only students to ask the tutor? Well, anyone logged in is fine for now, or just protect it.
router.post('/ask', protect, tutorController.askTutor);

module.exports = router;
