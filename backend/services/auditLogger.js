const AuditLog = require('../models/AuditLog');

const logAction = async ({ actor_id, action_type, target_entity, target_id, details, ip_address }) => {
  try {
    await AuditLog.create({ actor_id, action_type, target_entity, target_id, details, ip_address });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

module.exports = { logAction };
