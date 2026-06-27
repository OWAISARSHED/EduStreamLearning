const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, default: '' },
  file_url: { type: String, default: '' },
  grade: { type: Number },
  feedback: { type: String, default: '' },
  status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

submissionSchema.index({ assignment_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
