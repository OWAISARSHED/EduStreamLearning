const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  enrolled_at: { type: Date, default: Date.now },
  watch_time_seconds: { type: Number, default: 0 },
  progress_percent: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

enrollmentSchema.index({ student_id: 1, course_id: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
