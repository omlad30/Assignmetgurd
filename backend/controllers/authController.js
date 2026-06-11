const User = require('../models/User');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

exports.syncUser = async (req, res) => {
  try {
    // req.user is populated by the authMiddleware from the Firebase token
    const { email, uid } = req.user; 
    
    // Additional data sent from frontend on registration
    const { fullName, role, classInfo, subject, secretCode } = req.body;

    // Admin Initialization
    const adminEmail = process.env.ADMIN_EMAIL || 'ladom3003@gmail.com';
    let userRole = role || 'student';
    
    if (email === adminEmail) {
      userRole = 'admin';
    } else if (role === 'teacher') {
      const expectedCode = process.env.TEACHER_SECRET_CODE;
      if (secretCode && secretCode !== expectedCode) {
        return res.status(403).json({ message: 'Invalid Teacher Access Code' });
      }
    }

    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      user = await User.create({
        fullName: fullName || email.split('@')[0],
        email,
        role: userRole,
        classInfo: classInfo || null,
        subject: subject || null,
        authMethod: 'email',
      });
    } else if (req.body.role) {
      // Manual sync from registration form overrides existing empty info
      user.fullName = fullName || user.fullName;
      user.role = userRole;
      user.classInfo = classInfo || user.classInfo;
      user.subject = subject || user.subject;
      await user.save();
    }

    const signInProvider = req.firebaseUser?.firebase?.sign_in_provider || 'password';

    // Restore Admin OTP Logic
    if (user.role === 'admin' && signInProvider === 'password') {
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const salt = await bcrypt.genSalt(10);
      user.otp = await bcrypt.hash(otp, salt);
      user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      console.log(`\n\n=== ADMIN OTP GENERATED ===\nEmail: ${user.email}\nOTP: ${otp}\n===========================\n\n`);

      sendEmail({
        email: user.email,
        subject: 'Admin Login Verification OTP',
        message: `Your one-time password for Admin Login is: ${otp}\n\nThis code will expire in 10 minutes. Do not share it with anyone.`
      }).catch(err => console.log('Background email error:', err));

      return res.json({ requiresOtp: true, email: user.email, message: 'OTP sent to your email.' });
    }

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      classInfo: user.classInfo,
      subject: user.subject
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    // We get the email from the Firebase token via req.user!
    // But verifyOtp might be called with just the token and OTP body
    const user = await User.findOne({ email: req.user.email });

    if (!user || user.role !== 'admin') {
      return res.status(400).json({ message: 'Invalid request' });
    }

    if (!user.otp || !user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'OTP expired or invalid' });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpiry = undefined;
    
    // We can set a temporary session flag or just rely on the frontend
    // Because Firebase manages the session, we just return the full user to signal success
    await user.save();

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      classInfo: user.classInfo,
      subject: user.subject
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

