const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mentor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  course_or_module_name: { type: String, required: true },
  title: { type: String, required: true },
  progress_percent: { type: Number, min: 0, max: 100, default: 0 },
  deadline_date: { type: Date, index: true },
  status: { type: String, enum: ['not_started', 'in_progress', 'under_review', 'completed'], default: 'not_started' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Milestone', milestoneSchema);
