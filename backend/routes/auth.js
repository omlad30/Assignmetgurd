const express = require('express');
const router = express.Router();
const passport = require('passport');
const { registerUser, loginUser, getMe, googleOAuthSuccess } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  googleOAuthSuccess
);

module.exports = router;
