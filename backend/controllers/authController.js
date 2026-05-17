const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role, classInfo, subject, secretCode } = req.body;

    // Security check: Only allow teacher registration if the correct secret code is provided
    if (role === 'teacher') {
      const expectedCode = process.env.TEACHER_SECRET_CODE;
      if (!expectedCode) {
        return res.status(500).json({ message: 'Server configuration error: TEACHER_SECRET_CODE not set' });
      }
      if (secretCode !== expectedCode) {
        return res.status(403).json({ message: 'Invalid Teacher Access Code' });
      }
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      classInfo,
      subject,
      authMethod: 'email'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Dynamic Admin Initialization from Environment Variables
    if (email === process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL) {
      let adminUser = await User.findOne({ email });
      if (!adminUser) {
        if (!process.env.ADMIN_PASSWORD) {
          return res.status(500).json({ message: 'Server configuration error: ADMIN_PASSWORD not set' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
        await User.create({
          fullName: 'Main Authority',
          email: process.env.ADMIN_EMAIL,
          password: hashedPassword,
          role: 'admin'
        });
      } else if (!adminUser.password && process.env.ADMIN_PASSWORD) {
        // If admin was created via Google and has no password, set it now
        const salt = await bcrypt.genSalt(10);
        adminUser.password = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
        adminUser.role = 'admin'; // Ensure they have the admin role
        await adminUser.save();
      }
    }

    const user = await User.findOne({ email });

    if (user && user.authMethod === 'google' && !user.password) {
      return res.status(400).json({ message: 'Please sign in with Google' });
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      
      if (user.role === 'admin') {
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        user.otp = await bcrypt.hash(otp, salt);
        user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        console.log(`\n\n=== ADMIN OTP GENERATED ===\nEmail: ${user.email}\nOTP: ${otp}\n===========================\n\n`);

        await sendEmail({
          email: user.email,
          subject: 'Admin Login Verification OTP',
          message: `Your one-time password for Admin Login is: ${otp}\n\nThis code will expire in 10 minutes. Do not share it with anyone.`
        });

        return res.json({ requiresOtp: true, email: user.email, message: 'OTP sent to your email.' });
      }

      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

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
    await user.save();

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.googleOAuthSuccess = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Google Authentication failed' });
  }
  
  // Create JWT for the google user
  const token = generateToken(req.user._id);

  // Instead of res.json, we redirect to frontend with token in URL 
  // since the flow started from a browser navigation
  let frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  
  // Force override the wrong URL just in case Render has the typo in env variables
  if (frontendUrl.includes('assignguard.vercel.app')) {
    frontendUrl = 'https://assignmetgurd.vercel.app';
  }

  res.redirect(`${frontendUrl}/auth/success?token=${token}`);
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    if (user.authMethod === 'google') {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please reset your password through Google.' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    user.resetPasswordOtp = await bcrypt.hash(otp, salt);
    user.resetPasswordOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    console.log(`\n\n=== PASSWORD RESET OTP ===\nEmail: ${user.email}\nOTP: ${otp}\n==========================\n\n`);

    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP - AssignGuard',
      message: `Your OTP for password reset is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.`
    });

    res.json({ message: 'Password reset OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpiry || user.resetPasswordOtpExpiry < Date.now()) {
      return res.status(400).json({ message: 'OTP expired or invalid' });
    }

    const isMatch = await bcrypt.compare(otp, user.resetPasswordOtp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear OTP fields
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;
    
    await user.save();

    res.json({ message: 'Password successfully reset. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
