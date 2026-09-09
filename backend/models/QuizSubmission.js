const mongoose = require('mongoose');

const quizSubmissionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: [{
    questionIndex: Number,
    selectedOptionIndex: Number,
    isCorrect: Boolean,
  }],
  score: {
    type: Number,
    required: true,
  },
  totalScore: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  tabSwitches: {
    type: Number,
    default: 0,
  },
  wasAutoSubmitted: {
    type: Boolean,
    default: false,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

// Prevent multiple submissions for the same quiz by a student
quizSubmissionSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('QuizSubmission', quizSubmissionSchema);
