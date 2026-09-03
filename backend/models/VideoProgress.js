const mongoose = require('mongoose');

const videoProgressSchema = new mongoose.Schema({
  student_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  resource_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'CourseResource', required: true },
  watched_seconds: { type: Number, default: 0 },
  duration_seconds:{ type: Number, default: 0 },
  progress_percent:{ type: Number, default: 0 },   // 0–100
  completed:    { type: Boolean, default: false },  // true when >= 90%
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

videoProgressSchema.index({ student_id: 1, course_id: 1, resource_id: 1 }, { unique: true });

module.exports = mongoose.model('VideoProgress', videoProgressSchema);
