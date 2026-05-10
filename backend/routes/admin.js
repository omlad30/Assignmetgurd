const express = require('express');
const router = express.Router();
const { getAdminStats } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to ensure user is admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

router.get('/stats', protect, adminOnly, getAdminStats);

module.exports = router;
