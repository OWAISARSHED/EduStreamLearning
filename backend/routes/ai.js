const express = require('express');
const AISummary = require('../models/AISummary');
const Resource = require('../models/Resource');
const { authenticate, authorize } = require('../middleware/auth');
const { translatePrompt, summarizeDocument, suggestTags, chatWithAI } = require('../services/ollama');

const router = express.Router();

/**
 * @openapi
 * /api/ai/translate:
 *   post:
 *     tags: [AI]
 *     summary: Translate text using AI
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: string }
 *               target_language: { type: string }
 *     responses:
 *       200:
 *         description: Translated text
 */
router.post('/translate', authenticate, async (req, res) => {
  try {
    const { text, target_language } = req.body;
    if (!text || !target_language) return res.status(400).json({ message: 'text and target_language required' });
    const translated = await translatePrompt(text, target_language);
    const record = await AISummary.create({
      generated_for_user: req.user._id,
      type: 'translation',
      original_query_text: text,
      detected_language: req.body.source_language || 'en',
      ai_translated_text: translated,
    });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @openapi
 * /api/ai/summarize:
 *   post:
 *     tags: [AI]
 *     summary: Summarize document text
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: string }
 *               resource_id: { type: string }
 *     responses:
 *       200:
 *         description: Document summary
 */
router.post('/summarize', authenticate, async (req, res) => {
  try {
    const { text, resource_id } = req.body;
    const result = await summarizeDocument(text);
    const record = await AISummary.create({
      resource_id: resource_id || undefined,
      generated_for_user: req.user._id,
      type: 'summary',
      original_query_text: text,
      summary_text: result.summary_text,
      core_concepts: result.core_concepts || [],
      actionable_tasks: result.actionable_tasks || [],
      key_deadlines: result.key_deadlines || [],
    });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/suggest-tags', authenticate, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const { resource_id } = req.body;
    const resource = await Resource.findById(resource_id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    const tags = await suggestTags(resource.title, resource.description);
    resource.ai_tags_suggested = tags;
    resource.ai_tags_approved = false;
    await resource.save();
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/approve-tags', authenticate, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const { resource_id } = req.body;
    const resource = await Resource.findByIdAndUpdate(resource_id, { tags: resource.ai_tags_suggested, ai_tags_approved: true }, { new: true });
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ message: 'message required' });
    const reply = await chatWithAI(message, history || []);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/usage-analytics', authenticate, authorize('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const daily = await AISummary.aggregate([
      { $match: { created_at: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, type: { $first: '$type' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } },
    ]);
    const byType = await AISummary.aggregate([
      { $match: { created_at: { $gte: since } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const total = await AISummary.countDocuments({ created_at: { $gte: since } });
    const byUser = await AISummary.aggregate([
      { $match: { created_at: { $gte: since } } },
      { $group: { _id: '$generated_for_user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$user.name', email: '$user.email', count: 1 } },
    ]);
    res.json({ daily, byType, total, byUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/summaries', authenticate, async (req, res) => {
  try {
    const filter = { generated_for_user: req.user._id };
    if (req.user.role === 'admin' && req.query.all === 'true') delete filter.generated_for_user;
    const summaries = await AISummary.find(filter).sort({ created_at: -1 }).limit(50);
    const stats = req.user.role === 'admin' ? await AISummary.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]) : null;
    res.json({ summaries, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
