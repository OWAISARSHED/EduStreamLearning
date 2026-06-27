const mongoose = require('mongoose');

const courseResourceSchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  file_url: { type: String, default: '' },
  file_type: { type: String, default: '' },
  file_size: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  module_number: { type: Number, default: 1 },
  module_title: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('CourseResource', courseResourceSchema);
