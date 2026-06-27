const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['mentor_reply', 'new_resource', 'system_warning', 'milestone', 'course_submitted', 'course_approved', 'course_rejected', 'course_enrolled'], index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  related_entity_type: { type: String },
  related_entity_id: { type: mongoose.Schema.Types.ObjectId },
  cta_label: { type: String },
  is_read: { type: Boolean, default: false, index: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
