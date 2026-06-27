const mongoose = require('mongoose');

const forumThreadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tags: [{ type: String, index: true }],
  language: { type: String, enum: ['en', 'ur', 'ks', 'ps'], index: true },
  status: { type: String, enum: ['open', 'resolved', 'unresolved'], default: 'open', index: true },
  priority: { type: String, enum: ['critical', 'standard'], default: 'standard' },
  code_snippet: { type: String, default: '' },
  reply_count: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  channel: { type: String, enum: ['general', 'code_review', 'project_tracking'], default: 'general' },
  attachment_url: { type: String, default: '' },
  attachment_name: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

forumThreadSchema.index({ status: 1, created_at: -1 });

module.exports = mongoose.model('ForumThread', forumThreadSchema);
