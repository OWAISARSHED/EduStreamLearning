const express = require('express');
const AuditLog = require('../models/AuditLog');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const logs = await AuditLog.find().populate('actor_id', 'name email role').sort({ timestamp: -1 }).limit(Number(limit));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
