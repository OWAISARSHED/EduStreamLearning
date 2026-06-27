const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  due_date: { type: Date },
  total_points: { type: Number, default: 100 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Assignment', assignmentSchema);
