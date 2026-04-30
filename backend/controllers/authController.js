const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '7d',
  });
};

exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role, classInfo, subject, secretCode } = req.body;

    // Security check: Only allow teacher registration if the correct secret code is provided
    if (role === 'teacher') {
      const expectedCode = process.env.TEACHER_SECRET_CODE || 'admin123';
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

    const user = await User.findOne({ email });

    if (user && user.authMethod === 'google' && !user.password) {
      return res.status(400).json({ message: 'Please sign in with Google' });
    }

    if (user && (await bcrypt.compare(password, user.password))) {
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
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/auth/success?token=${token}`);
};
