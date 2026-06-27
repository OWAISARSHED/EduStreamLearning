const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const express = require('express');
const multer = require('multer');
const ForumThread = require('../models/ForumThread');
const ForumReply = require('../models/ForumReply');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const forumUploadDir = path.join(__dirname, '..', 'uploads', 'forum');
if (!fs.existsSync(forumUploadDir)) fs.mkdirSync(forumUploadDir, { recursive: true });
const forumStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, forumUploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const forumUpload = multer({
  storage: forumStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, true),
});

/**
 * @openapi
 * /api/forum/threads:
 *   get:
 *     tags: [Forum]
 *     summary: List forum threads
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: channel
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of forum threads
 *   post:
 *     tags: [Forum]
 *     summary: Create a new forum thread
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               body: { type: string }
 *               channel: { type: string }
 *     responses:
 *       201:
 *         description: Thread created
 */
router.get('/threads', authenticate, async (req, res) => {
  try {
    const { status, tag, verified, search, author, channel } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (tag) filter.tags = tag;
    if (verified === 'true') filter.verified = true;
    if (verified === 'false') filter.verified = false;
    if (channel) filter.channel = channel;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    if (author) {
      const user = await mongoose.model('User').findOne({ name: { $regex: author, $options: 'i' } }).select('_id');
      if (user) filter.author_id = user._id;
    }
    const threads = await ForumThread.find(filter).populate('author_id', 'name role profile_picture_url deleted_at').sort({ created_at: -1 });
    res.json(threads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/threads/:id', authenticate, async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.id).populate('author_id', 'name role profile_picture_url');
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    const replies = await ForumReply.find({ thread_id: thread._id }).populate('author_id', 'name role profile_picture_url').sort({ created_at: 1 });
    res.json({ thread, replies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/threads', authenticate, async (req, res) => {
  try {
    const thread = await ForumThread.create({ ...req.body, author_id: req.user._id });
    res.status(201).json(thread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/upload', authenticate, forumUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ url: `/uploads/forum/${req.file.filename}`, name: req.file.originalname });
});

router.put('/threads/:id', authenticate, async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (thread.author_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    Object.assign(thread, req.body);
    await thread.save();
    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/threads/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await ForumThread.findByIdAndDelete(req.params.id);
    await ForumReply.deleteMany({ thread_id: req.params.id });
    res.json({ message: 'Thread removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/threads/:id/verify', authenticate, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const thread = await ForumThread.findByIdAndUpdate(req.params.id, { verified: true, verified_by: req.user._id }, { new: true });
    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/threads/:id/replies', authenticate, async (req, res) => {
  try {
    const reply = await ForumReply.create({ thread_id: req.params.id, author_id: req.user._id, body: req.body.body, is_mentor_verified: req.user.role === 'mentor' });
    await ForumThread.findByIdAndUpdate(req.params.id, { $inc: { reply_count: 1 } });
    const thread = await ForumThread.findById(req.params.id);
    if (thread.author_id.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        user_id: thread.author_id,
        type: 'mentor_reply',
        title: 'New reply to your thread',
        message: `${req.user.name} replied to "${thread.title.substring(0, 50)}"`,
        related_entity_type: 'thread',
        related_entity_id: thread._id,
        cta_label: 'View Reply',
      });
      const io = req.app.get('io');
      if (io) io.to(`user:${thread.author_id}`).emit('notification', notif);
    }
    await reply.populate('author_id', 'name role profile_picture_url');
    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
