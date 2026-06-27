const mongoose = require('mongoose');

const forumReplySchema = new mongoose.Schema({
  thread_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumThread', required: true, index: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  body: { type: String, required: true },
  is_mentor_verified: { type: Boolean, default: false },
  attachment_url: { type: String, default: '' },
  attachment_name: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

forumReplySchema.index({ thread_id: 1, created_at: 1 });

module.exports = mongoose.model('ForumReply', forumReplySchema);
