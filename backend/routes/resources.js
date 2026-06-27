const express = require('express');
const Resource = require('../models/Resource');
const ResourceAccessLog = require('../models/ResourceAccessLog');
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

router.get('/:id/versions', authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).select('title version previous_versions updated_at');
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    const versions = [
      { version: resource.version, file_url: resource.file_url, uploaded_at: resource.updated_at, current: true },
      ...(resource.previous_versions || []).map(v => ({ ...v, current: false })),
    ].sort((a, b) => b.version - a.version);
    res.json({ title: resource.title, versions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/access', authenticate, async (req, res) => {
  try {
    const { action = 'view' } = req.body;
    await ResourceAccessLog.create({ resource_id: req.params.id, student_id: req.user._id, action });
    await Resource.findByIdAndUpdate(req.params.id, { $inc: { download_count: action === 'download' ? 1 : 0 } });
    res.status(201).json({ message: 'Access logged' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/access-logs', authenticate, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const { resource_id, student_id, limit = 200 } = req.query;
    const filter = {};
    if (resource_id) filter.resource_id = resource_id;
    if (student_id) filter.student_id = student_id;
    const logs = await ResourceAccessLog.find(filter)
      .populate('student_id', 'name email role')
      .populate('resource_id', 'title file_type')
      .sort({ accessed_at: -1 })
      .limit(Number(limit));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
