const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
    required: true,
  }],
  correctOptionIndex: {
    type: Number,
    required: true,
  },
  points: {
    type: Number,
    default: 1,
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true,
  },

  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
    required: true,
  },
  deadline: {
    type: Date,
  },
  timeLimitMinutes: {
    type: Number,
    default: 0, // 0 means no time limit
  },
  isPasswordProtected: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    default: '',
  },
  questions: [questionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
