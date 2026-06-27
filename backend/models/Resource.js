const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  file_url: { type: String, required: true },
  file_type: { type: String, enum: ['pdf', 'docx', 'md', 'xlsx', 'zip', 'pptx', 'mp4'], required: true },
  file_size: { type: Number, required: true },
  category: { type: String, enum: ['core_curriculum', 'advanced_labs', 'community_assets'], index: true },
  tags: [{ type: String, index: true }],
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  download_count: { type: Number, default: 0 },
  ai_tags_suggested: [{ type: String }],
  ai_tags_approved: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  previous_versions: [{
    file_url: String,
    version: Number,
    uploaded_at: Date,
  }],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Resource', resourceSchema);
