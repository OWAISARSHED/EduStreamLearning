const express = require('express');
const multer = require('multer');
const path = require('path');
const Course = require('../models/Course');
const CourseResource = require('../models/CourseResource');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

router.post('/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ file_url: `/uploads/${req.file.filename}`, file_name: req.file.originalname, file_size: req.file.size, file_type: req.file.originalname.split('.').pop() });
});

router.post('/upload-public', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const allowed = ['jpg', 'jpeg', 'png', 'gif', 'pdf'];
  const ext = req.file.originalname.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    const fs = require('fs');
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Only image files and PDF are allowed' });
  }
  res.json({ file_url: `/uploads/${req.file.filename}`, file_name: req.file.originalname, file_size: req.file.size, file_type: ext });
});

router.post('/', authenticate, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const course = await Course.create({ ...req.body, mentor_id: req.user._id });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, mentor_id } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (mentor_id) filter.mentor_id = mentor_id;
    if (req.user.role === 'mentor') filter.mentor_id = req.user._id;
    if (req.user.role === 'student') filter.status = 'approved';
    const courses = await Course.find(filter).populate('mentor_id', 'name email profile_picture_url').sort({ created_at: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/pending', authenticate, authorize('admin'), async (req, res) => {
  try {
    const courses = await Course.find({ status: 'pending' }).populate('mentor_id', 'name email profile_picture_url').sort({ created_at: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('mentor_id', 'name email profile_picture_url title');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const resources = await CourseResource.find({ course_id: course._id }).sort({ order: 1 });
    const assignments = await Assignment.find({ course_id: course._id });
    const quizzes = await Quiz.find({ course_id: course._id });
    res.json({ course, resources, assignments, quizzes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authenticate, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role === 'mentor' && course.mentor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    Object.assign(course, req.body);
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', authenticate, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role === 'mentor' && course.mentor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await CourseResource.deleteMany({ course_id: course._id });
    await Assignment.deleteMany({ course_id: course._id });
    await Quiz.deleteMany({ course_id: course._id });
    await Enrollment.deleteMany({ course_id: course._id });
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    await Notification.create({
      user_id: course.mentor_id,
      type: 'course_approved',
      title: 'Course Approved',
      message: `Your course "${course.title}" has been approved by admin.`,
      related_entity_type: 'course',
      related_entity_id: course._id,
      cta_label: 'View Course',
    });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/reject', authenticate, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, { status: 'rejected', rejection_reason: req.body.reason || '' }, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    await Notification.create({
      user_id: course.mentor_id,
      type: 'course_rejected',
      title: 'Course Rejected',
      message: `Your course "${course.title}" was rejected. Reason: ${req.body.reason || 'Not specified'}`,
      related_entity_type: 'course',
      related_entity_id: course._id,
      cta_label: 'View Details',
    });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/submit', authenticate, authorize('mentor'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.mentor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    course.status = 'pending';
    await course.save();
    const admins = await User.find({ role: 'admin' }).select('_id');
    const notifs = admins.map(a => ({
      user_id: a._id,
      type: 'course_submitted',
      title: 'New Course Pending Approval',
      message: `${req.user.name} submitted "${course.title}" for approval.`,
      related_entity_type: 'course',
      related_entity_id: course._id,
      cta_label: 'Review Course',
    }));
    if (notifs.length) await Notification.insertMany(notifs);
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/enroll', authenticate, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.status !== 'approved') return res.status(400).json({ message: 'Course not available' });
    const existing = await Enrollment.findOne({ student_id: req.user._id, course_id: course._id });
    if (existing) return res.status(400).json({ message: 'Already enrolled' });
    await Enrollment.create({ student_id: req.user._id, course_id: course._id });
    course.enrolled_count += 1;
    await course.save();
    await Notification.create({
      user_id: course.mentor_id,
      type: 'course_enrolled',
      title: 'New Enrollment',
      message: `${req.user.name} has enrolled in your course "${course.title}".`,
      related_entity_type: 'course',
      related_entity_id: course._id,
      cta_label: 'View Students',
    });
    res.status(201).json({ message: 'Enrolled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/students', authenticate, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role === 'mentor' && course.mentor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const enrollments = await Enrollment.find({ course_id: course._id }).populate('student_id', 'name email profile_picture_url');
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/resources', authenticate, authorize('mentor'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.mentor_id.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    const resource = await CourseResource.create({ ...req.body, course_id: course._id });
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/resources/:resourceId', authenticate, authorize('mentor'), async (req, res) => {
  try {
    const resource = await CourseResource.findById(req.params.resourceId);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    const course = await Course.findById(resource.course_id);
    if (course.mentor_id.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    await CourseResource.findByIdAndDelete(req.params.resourceId);
    res.json({ message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/assignments', authenticate, authorize('mentor'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.mentor_id.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    const assignment = await Assignment.create({ ...req.body, course_id: course._id });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/assignments/:id', authenticate, authorize('mentor'), async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/assignments/:id', authenticate, authorize('mentor'), async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/assignments/:id/grade', authenticate, authorize('mentor'), async (req, res) => {
  try {
    const submission = await Submission.findByIdAndUpdate(req.params.id, { grade: req.body.grade, feedback: req.body.feedback, status: 'graded' }, { new: true });
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/quizzes', authenticate, authorize('mentor'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.mentor_id.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    const quiz = await Quiz.create({ ...req.body, course_id: course._id });
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/quizzes/:id', authenticate, authorize('mentor'), async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/quizzes/:id', authenticate, authorize('mentor'), async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/quizzes/:id/submit', authenticate, authorize('student'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const { answers } = req.body;
    let score = 0;
    let total = 0;
    quiz.questions.forEach((q, i) => {
      total += q.points;
      if (answers[i] !== undefined && answers[i] === q.correct_answer) score += q.points;
    });
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    res.json({ score, total, percentage, passed: percentage >= quiz.passing_score });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
