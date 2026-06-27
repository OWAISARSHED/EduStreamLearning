const express = require('express');
const Resource = require('../models/Resource');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { category, tag } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    const resources = await Resource.find(filter).populate('uploaded_by', 'name').sort({ created_at: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate('uploaded_by', 'name');
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticate, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const resource = await Resource.create({ ...req.body, uploaded_by: req.user._id });
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authenticate, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    Object.assign(resource, req.body);
    resource.version += 1;
    await resource.save();
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', authenticate, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json({ message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/increment-download', authenticate, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, { $inc: { download_count: 1 } }, { new: true });
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
