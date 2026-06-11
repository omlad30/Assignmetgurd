const admin = require('../firebaseAdmin');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      // Verify Firebase ID Token
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.firebaseUser = decodedToken;
      
      // Find user by email since existing users might not have a firebaseUid
      let currentUser = await User.findOne({ email: decodedToken.email }).select('-password');
      
      if (!currentUser) {
        // Fallback: If user is not in DB but authenticated in Firebase, they might have just signed up
        // We allow the sync route to proceed so they can be created.
        if (req.originalUrl.includes('/sync')) {
          req.user = decodedToken;
          return next();
        }
        throw new Error('User not found in database');
      }
      
      req.user = currentUser;
      return next();
    } catch (error) {
      console.error('AuthMiddleware Error:', error.message);
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
