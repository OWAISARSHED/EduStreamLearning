const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  mentor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft', index: true },
  category: { type: String, default: '' },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  language: { type: String, default: 'English' },
  thumbnail_url: { type: String, default: '' },
  enrolled_count: { type: Number, default: 0 },
  rejection_reason: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

courseSchema.index({ status: 1, mentor_id: 1 });

module.exports = mongoose.model('Course', courseSchema);
