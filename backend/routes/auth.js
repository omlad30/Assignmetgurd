const express = require('express');
const router = express.Router();
const { syncUser, getMe, verifyOtp } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Endpoint to sync user data after Firebase login/registration
router.post('/sync', protect, syncUser);

// Verify Admin OTP
router.post('/verify-otp', protect, verifyOtp);

// Get current user data
router.get('/me', protect, getMe);

module.exports = router;
