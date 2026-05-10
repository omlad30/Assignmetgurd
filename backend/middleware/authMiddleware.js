const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('DEBUG: Received token in authMiddleware:', token);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      const currentUser = await User.findById(decoded.id).select('-password');
      if (!currentUser) {
        throw new Error('User not found');
      }
      
      req.user = currentUser;
      return next();
    } catch (error) {
      console.error('AuthMiddleware Error:', error.message, error.stack);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const teacherOnly = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a teacher' });
  }
};

module.exports = { protect, teacherOnly };
