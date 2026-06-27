const mongoose = require('mongoose');

const resourceAccessLogSchema = new mongoose.Schema({
  resource_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true, index: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, enum: ['view', 'download'], required: true },
  accessed_at: { type: Date, default: Date.now, index: -1 },
});

module.exports = mongoose.model('ResourceAccessLog', resourceAccessLogSchema);
