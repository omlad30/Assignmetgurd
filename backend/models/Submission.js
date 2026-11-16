const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  extractedText: {
    type: String,
  },
  similarityScore: {
    type: Number,
    default: 0,
  },
  isCode: {
    type: Boolean,
    default: false,
  },
  matchedWithStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  aiScore: {
    type: Number,
  },
  aiVerdict: {
    type: String,
    enum: ['Human', 'AI', 'Mixed', 'Pending'],
    default: 'Pending',
  },
  suspiciousSentences: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['accepted', 'rejected', 'ai_flagged', 'quarantine', 'pending', 'processing'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
  },
  grade: {
    type: String,
  },
  suggestedGrade: {
    type: String,
    default: '',
  },
  conceptScore: {
    type: Number,
    default: null,
  },
  rubricFeedback: {
    type: String,
    default: '',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
