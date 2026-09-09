const mongoose = require('mongoose');

const draftAttemptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
  },
  count: {
    type: Number,
    default: 1,
  }
}, { timestamps: true });

// Compound index to ensure uniqueness per student per assignment
draftAttemptSchema.index({ studentId: 1, assignmentId: 1 }, { unique: true });

module.exports = mongoose.model('DraftAttempt', draftAttemptSchema);
