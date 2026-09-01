const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
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
  },
  targetDivision: {
    type: String,
    enum: ['ALL', 'A', 'B'],
    default: 'ALL',
  },
  deadline: {
    type: Date,
    required: true,
  },
  totalSubmissions: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
