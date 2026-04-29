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
  matchedWithStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  aiScore: {
    type: Number,
  },
  aiVerdict: {
    type: String,
    enum: ['Human', 'AI', 'Mixed'],
  },
  suspiciousSentences: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['accepted', 'rejected', 'ai_flagged', 'quarantine', 'pending'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
  },
  grade: {
    type: String,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
