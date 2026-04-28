const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    // Optional because Google Sign in users might not have a password
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student',
  },
  googleId: {
    type: String,
  },
  profilePicture: {
    type: String,
  },
  classInfo: { // named classInfo instead of class because class is reserved keyword
    type: String,
  },
  subject: {
    type: String,
  },
  authMethod: {
    type: String,
    enum: ['email', 'google'],
    default: 'email',
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
