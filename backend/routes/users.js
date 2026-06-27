const crypto = require('crypto');
const express = require('express');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role, mentor_status } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (mentor_status) filter.mentor_status = mentor_status;
    const users = await User.find(filter).sort({ created_at: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const allowed = ['name', 'role', 'account_status', 'language_preference', 'auto_translate_enabled', 'permissions', 'profile_picture_url', 'title', 'mentor_status', 'bio', 'expertise'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/mentors', authenticate, async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor', mentor_status: 'approved' }).select('name email profile_picture_url title bio expertise');
    res.json(mentors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/pending-mentors', authenticate, authorize('admin'), async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor', mentor_status: 'pending' }).select('name email profile_picture_url id_card_url title created_at');
    res.json(mentors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/approve-mentor', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { mentor_status: 'approved' }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/reject-mentor', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { mentor_status: 'rejected' }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalMentors = await User.countDocuments({ role: 'mentor', mentor_status: 'approved' });
    const pendingMentors = await User.countDocuments({ role: 'mentor', mentor_status: 'pending' });
    const totalCourses = await Course.countDocuments();
    const pendingCourses = await Course.countDocuments({ status: 'pending' });
    const approvedCourses = await Course.countDocuments({ status: 'approved' });
    const totalEnrollments = await Enrollment.countDocuments();
    res.json({ totalStudents, totalMentors, pendingMentors, totalCourses, pendingCourses, approvedCourses, totalEnrollments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/mentor-stats', authenticate, authorize('mentor'), async (req, res) => {
  try {
    const courses = await Course.find({ mentor_id: req.user._id });
    const courseIds = courses.map(c => c._id);
    const totalEnrollments = await Enrollment.countDocuments({ course_id: { $in: courseIds } });
    const totalWatchTime = await Enrollment.aggregate([
      { $match: { course_id: { $in: courseIds } } },
      { $group: { _id: null, total: { $sum: '$watch_time_seconds' } } },
    ]);
    res.json({
      totalCourses: courses.length,
      pendingCourses: courses.filter(c => c.status === 'pending').length,
      approvedCourses: courses.filter(c => c.status === 'approved').length,
      totalEnrollments,
      totalWatchTimeSeconds: totalWatchTime[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/create', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password_hash: password, role: role || 'student' });
    await AuditLog.create({ actor_id: req.user._id, action_type: 'user_created_by_admin', target_entity: 'users', target_id: user._id, details: { email, role } });
    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin accounts' });
    const suffix = Math.random().toString(36).substring(2, 8);
    user.name = 'Deleted User';
    user.email = `deleted-${suffix}@edustream.local`;
    user.password_hash = crypto.randomBytes(20).toString('hex');
    user.profile_picture_url = '';
    user.bio = '';
    user.expertise = [];
    user.id_card_url = '';
    user.account_status = 'suspended';
    user.deleted_at = new Date();
    await user.save();
    await AuditLog.create({ actor_id: req.user._id, action_type: 'user_deleted', target_entity: 'users', target_id: user._id, details: { anonymized: true } });
    res.json({ message: 'User account deleted and anonymized' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/online-time', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role, days } = req.query;
    const filter = { role: { $in: ['student', 'mentor'] } };
    if (role) filter.role = role;
    const users = await User.find(filter).select('name email role stats.total_hours last_login account_status').sort({ 'stats.total_hours': -1 }).limit(100);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
