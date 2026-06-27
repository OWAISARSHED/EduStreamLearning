const express = require('express');
const Milestone = require('../models/Milestone');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (req.user.role === 'student') filter.student_id = req.user._id;
    if (status) filter.status = status;
    const milestones = await Milestone.find(filter).populate('student_id', 'name').populate('mentor_id', 'name').sort({ deadline_date: 1 });
    res.json(milestones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticate, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const milestone = await Milestone.create({ ...req.body, mentor_id: req.user._id });
    res.status(201).json(milestone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authenticate, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const milestone = await Milestone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    res.json(milestone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
