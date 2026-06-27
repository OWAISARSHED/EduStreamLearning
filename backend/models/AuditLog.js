const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  action_type: { type: String, required: true, index: true },
  target_entity: { type: String, required: true },
  target_id: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed },
  ip_address: { type: String },
  timestamp: { type: Date, default: Date.now, index: -1 },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
