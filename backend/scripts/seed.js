require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Course = require('../models/Course');
const CourseResource = require('../models/CourseResource');
const Resource = require('../models/Resource');
const ForumThread = require('../models/ForumThread');
const ForumReply = require('../models/ForumReply');
const Milestone = require('../models/Milestone');
const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');
const AISummary = require('../models/AISummary');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edustream';

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    CourseResource.deleteMany({}),
    Resource.deleteMany({}),
    ForumThread.deleteMany({}),
    ForumReply.deleteMany({}),
    Milestone.deleteMany({}),
    Notification.deleteMany({}),
    Enrollment.deleteMany({}),
    AISummary.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ─── USERS ───────────────────────────────────────────────
  const adminPass   = await hashPassword('Admin@123');
  const mentorPass  = await hashPassword('Mentor@123');
  const studentPass = await hashPassword('Student@123');

  const [admin, mentor1, mentor2, student1, student2, student3] = await User.insertMany([
    {
      name: 'Admin User',
      email: 'admin@edustream.com',
      password_hash: adminPass,
      role: 'admin',
      title: 'Platform Administrator',
      account_status: 'active',
      mentor_status: 'none',
      stats: { total_hours: 0, certificates_count: 0, weekly_goal_percent: 0 },
    },
    {
      name: 'Dr. Ayesha Khan',
      email: 'mentor1@edustream.com',
      password_hash: mentorPass,
      role: 'mentor',
      title: 'Lead Mentor — Web Development',
      account_status: 'active',
      mentor_status: 'approved',
      bio: 'Senior full-stack developer with 8 years of experience in React and Node.js.',
      expertise: ['React', 'Node.js', 'MongoDB', 'System Design'],
      stats: { total_hours: 240, certificates_count: 5, weekly_goal_percent: 85 },
    },
    {
      name: 'Prof. Bilal Ahmed',
      email: 'mentor2@edustream.com',
      password_hash: mentorPass,
      role: 'mentor',
      title: 'Lead Mentor — AI & Data Science',
      account_status: 'active',
      mentor_status: 'approved',
      bio: 'AI researcher specializing in NLP and machine learning pipelines.',
      expertise: ['Python', 'Machine Learning', 'NLP', 'TensorFlow'],
      stats: { total_hours: 180, certificates_count: 7, weekly_goal_percent: 90 },
    },
    {
      name: 'Ali Hassan',
      email: 'student1@edustream.com',
      password_hash: studentPass,
      role: 'student',
      title: 'Pro Learner',
      account_status: 'active',
      mentor_status: 'none',
      language_preference: 'en',
      stats: { total_hours: 42, certificates_count: 2, weekly_goal_percent: 72 },
    },
    {
      name: 'Sara Malik',
      email: 'student2@edustream.com',
      password_hash: studentPass,
      role: 'student',
      title: 'Rising Star',
      account_status: 'active',
      mentor_status: 'none',
      language_preference: 'ur',
      stats: { total_hours: 28, certificates_count: 1, weekly_goal_percent: 55 },
    },
    {
      name: 'Usman Tariq',
      email: 'student3@edustream.com',
      password_hash: studentPass,
      role: 'student',
      title: 'Active Learner',
      account_status: 'active',
      mentor_status: 'none',
      language_preference: 'en',
      stats: { total_hours: 15, certificates_count: 0, weekly_goal_percent: 30 },
    },
  ]);
  console.log('👥 Users seeded');

  // ─── COURSES ──────────────────────────────────────────────
  const [course1, course2, course3] = await Course.insertMany([
    {
      title: 'Full-Stack Web Development with React & Node.js',
      description: 'Master modern full-stack development — from React hooks to REST APIs and MongoDB.',
      mentor_id: mentor1._id,
      status: 'approved',
      category: 'Web Development',
      tags: ['React', 'Node.js', 'MongoDB', 'Express'],
      thumbnail_url: '',
      modules: [
        {
          title: 'Module 1: React Fundamentals',
          order: 1,
          description: 'JSX, components, props, state, and hooks.',
        },
        {
          title: 'Module 2: Backend with Node.js & Express',
          order: 2,
          description: 'REST APIs, middleware, authentication with JWT.',
        },
        {
          title: 'Module 3: MongoDB & Mongoose',
          order: 3,
          description: 'Schema design, CRUD operations, aggregation.',
        },
      ],
    },
    {
      title: 'Machine Learning with Python',
      description: 'Learn supervised and unsupervised ML algorithms using scikit-learn and TensorFlow.',
      mentor_id: mentor2._id,
      status: 'approved',
      category: 'Artificial Intelligence',
      tags: ['Python', 'Machine Learning', 'TensorFlow', 'scikit-learn'],
      thumbnail_url: '',
      modules: [
        {
          title: 'Module 1: Python for Data Science',
          order: 1,
          description: 'NumPy, Pandas, Matplotlib — data manipulation and visualization.',
        },
        {
          title: 'Module 2: Supervised Learning',
          order: 2,
          description: 'Linear regression, decision trees, SVM, and model evaluation.',
        },
        {
          title: 'Module 3: Neural Networks & Deep Learning',
          order: 3,
          description: 'Building and training neural networks with TensorFlow/Keras.',
        },
      ],
    },
    {
      title: 'Data Structures & Algorithms',
      description: 'A comprehensive guide to DSA — from arrays and linked lists to graphs and dynamic programming.',
      mentor_id: mentor1._id,
      status: 'pending',
      category: 'Computer Science',
      tags: ['DSA', 'Algorithms', 'Problem Solving'],
      thumbnail_url: '',
      modules: [
        {
          title: 'Module 1: Arrays & Strings',
          order: 1,
          description: 'Core array manipulation, two-pointer, and sliding window techniques.',
        },
        {
          title: 'Module 2: Trees & Graphs',
          order: 2,
          description: 'BFS, DFS, binary trees, and graph traversal algorithms.',
        },
      ],
    },
  ]);
  console.log('📚 Courses seeded');

  // ─── ENROLLMENTS ─────────────────────────────────────────
  await Enrollment.insertMany([
    { student_id: student1._id, course_id: course1._id, progress_percent: 65, status: 'active' },
    { student_id: student1._id, course_id: course2._id, progress_percent: 30, status: 'active' },
    { student_id: student2._id, course_id: course1._id, progress_percent: 45, status: 'active' },
    { student_id: student3._id, course_id: course2._id, progress_percent: 10, status: 'active' },
  ]);
  console.log('🎓 Enrollments seeded');

  // ─── RESOURCES ────────────────────────────────────────────
  await Resource.insertMany([
    {
      title: 'React Hooks Complete Guide.pdf',
      description: 'A deep dive into useState, useEffect, useContext, and custom hooks.',
      file_url: '/uploads/react-hooks-guide.pdf',
      file_type: 'pdf',
      file_size: 2457600,
      category: 'core_curriculum',
      tags: ['React', 'Hooks', 'Frontend'],
      uploaded_by: mentor1._id,
      download_count: 34,
    },
    {
      title: 'MongoDB Schema Design Best Practices.pdf',
      description: 'Embedding vs referencing, indexing strategies, and performance tips.',
      file_url: '/uploads/mongodb-schema-design.pdf',
      file_type: 'pdf',
      file_size: 1843200,
      category: 'core_curriculum',
      tags: ['MongoDB', 'Database', 'Schema'],
      uploaded_by: mentor1._id,
      download_count: 22,
    },
    {
      title: 'Machine Learning Algorithms Cheatsheet.pdf',
      description: 'Quick reference for all major ML algorithms with complexity and use cases.',
      file_url: '/uploads/ml-cheatsheet.pdf',
      file_type: 'pdf',
      file_size: 921600,
      category: 'advanced_labs',
      tags: ['Machine Learning', 'Python', 'Algorithms'],
      uploaded_by: mentor2._id,
      download_count: 58,
    },
    {
      title: 'DSA Problem Set — Arrays & Strings.docx',
      description: '50 curated practice problems on arrays and strings with solutions.',
      file_url: '/uploads/dsa-arrays-problems.docx',
      file_type: 'docx',
      file_size: 614400,
      category: 'advanced_labs',
      tags: ['DSA', 'Arrays', 'Practice'],
      uploaded_by: mentor1._id,
      download_count: 41,
    },
    {
      title: 'EduStream Community Notes — Week 1.md',
      description: 'Collaborative notes from the first week of the web dev cohort.',
      file_url: '/uploads/community-notes-week1.md',
      file_type: 'md',
      file_size: 102400,
      category: 'community_assets',
      tags: ['Community', 'Notes', 'Web Dev'],
      uploaded_by: student1._id,
      download_count: 15,
    },
  ]);
  console.log('📁 Resources seeded');

  // ─── FORUM THREADS ────────────────────────────────────────
  const [thread1, thread2, thread3] = await ForumThread.insertMany([
    {
      title: 'State management issue with async hooks in React',
      body: 'I am using useEffect with an async function inside but my state is not updating correctly. Here is my code:\n\n```javascript\nuseEffect(() => {\n  async function fetchData() {\n    const res = await fetch("/api/data");\n    const json = await res.json();\n    setData(json); // This sometimes does not work\n  }\n  fetchData();\n}, []);\n```\nWhat am I doing wrong?',
      author_id: student1._id,
      tags: ['React', 'Hooks', 'Async'],
      language: 'en',
      status: 'resolved',
      priority: 'standard',
      reply_count: 2,
      code_snippet: 'useEffect(() => { async function fetchData() { ... } fetchData(); }, []);',
    },
    {
      title: 'How to prevent overfitting in neural networks?',
      body: 'My model is achieving 98% accuracy on training data but only 72% on test data. I have tried dropout layers but still getting the same issue. What other techniques can I use to reduce overfitting?',
      author_id: student2._id,
      tags: ['Machine Learning', 'Neural Networks', 'Overfitting'],
      language: 'en',
      status: 'open',
      priority: 'critical',
      reply_count: 1,
    },
    {
      title: 'MongoDB aggregation pipeline — $lookup performance issue',
      body: 'I am using $lookup to join users with their courses but the query is very slow with large datasets. Is there a better approach?\n\n```javascript\ndb.enrollments.aggregate([\n  { $lookup: { from: "users", localField: "student_id", foreignField: "_id", as: "student" } }\n]);\n```',
      author_id: student1._id,
      tags: ['MongoDB', 'Aggregation', 'Performance'],
      language: 'en',
      status: 'open',
      priority: 'standard',
      reply_count: 1,
      code_snippet: 'db.enrollments.aggregate([{ $lookup: {...} }])',
    },
  ]);
  console.log('💬 Forum threads seeded');

  // ─── FORUM REPLIES ────────────────────────────────────────
  await ForumReply.insertMany([
    {
      thread_id: thread1._id,
      author_id: mentor1._id,
      body: 'The issue is a race condition. You should add a cleanup function to useEffect to avoid state updates on unmounted components. Also, make sure your dependency array is correct.\n\n```javascript\nuseEffect(() => {\n  let cancelled = false;\n  async function fetchData() {\n    const res = await fetch("/api/data");\n    const json = await res.json();\n    if (!cancelled) setData(json);\n  }\n  fetchData();\n  return () => { cancelled = true; };\n}, []);\n```',
      is_mentor_verified: true,
    },
    {
      thread_id: thread1._id,
      author_id: student3._id,
      body: 'I had the same issue! The cleanup function solution worked perfectly for me.',
      is_mentor_verified: false,
    },
    {
      thread_id: thread2._id,
      author_id: mentor2._id,
      body: 'Great question! Here are the key techniques to combat overfitting:\n\n1. **Dropout layers** — you already tried this\n2. **L1/L2 Regularization** — add `kernel_regularizer=l2(0.01)` to Dense layers\n3. **Early Stopping** — stop training when val_loss stops improving\n4. **Data Augmentation** — generate more training samples\n5. **Reduce model complexity** — fewer layers/neurons\n\nTry combining early stopping with L2 regularization first.',
      is_mentor_verified: true,
    },
    {
      thread_id: thread3._id,
      author_id: mentor1._id,
      body: 'For better $lookup performance:\n\n1. **Add an index** on the join field: `db.enrollments.createIndex({ student_id: 1 })`\n2. **Use $match before $lookup** to reduce the dataset size\n3. **Consider embedding** for frequently co-accessed data\n\nAlso check your MongoDB explain plan with `.explain("executionStats")` to identify bottlenecks.',
      is_mentor_verified: true,
    },
  ]);
  console.log('💬 Forum replies seeded');

  // ─── MILESTONES ───────────────────────────────────────────
  await Milestone.insertMany([
    {
      student_id: student1._id,
      course_or_module_name: 'Module 1: React Fundamentals',
      title: 'Complete React Hooks Assignment',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'in_progress',
      progress_percent: 70,
    },
    {
      student_id: student1._id,
      course_or_module_name: 'Module 2: Backend with Node.js',
      title: 'Build REST API Project',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'not_started',
      progress_percent: 0,
    },
    {
      student_id: student1._id,
      course_or_module_name: 'Module 1: Python for Data Science',
      title: 'Pandas Data Analysis Lab',
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'in_progress',
      progress_percent: 30,
    },
    {
      student_id: student2._id,
      course_or_module_name: 'Module 1: React Fundamentals',
      title: 'JSX & Components Quiz',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'in_progress',
      progress_percent: 50,
    },
    {
      student_id: student3._id,
      course_or_module_name: 'Module 1: Python for Data Science',
      title: 'NumPy Exercises',
      due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'not_started',
      progress_percent: 0,
    },
  ]);
  console.log('🎯 Milestones seeded');

  // ─── NOTIFICATIONS ────────────────────────────────────────
  await Notification.insertMany([
    {
      user_id: student1._id,
      title: 'New Verified Reply',
      message: 'Dr. Ayesha Khan verified a reply on your thread "State management issue with async hooks in React".',
      type: 'mentor_reply',
      is_read: false,
    },
    {
      user_id: student1._id,
      title: 'Course Progress Update',
      message: 'You have completed 65% of Full-Stack Web Development. Keep going!',
      type: 'milestone',
      is_read: true,
    },
    {
      user_id: student2._id,
      title: 'Deadline Reminder',
      message: 'Your milestone "JSX & Components Quiz" is due in 2 days.',
      type: 'milestone',
      is_read: false,
    },
    {
      user_id: mentor1._id,
      title: 'New Resource Added',
      message: 'A new resource has been uploaded to the repository.',
      type: 'new_resource',
      is_read: false,
    },
    {
      user_id: admin._id,
      title: 'New Course Pending Approval',
      message: 'Dr. Ayesha Khan submitted "Data Structures & Algorithms" for approval.',
      type: 'course_submitted',
      is_read: false,
    },
    {
      user_id: student1._id,
      title: 'Course Approved',
      message: 'Full-Stack Web Development course has been approved and is now live.',
      type: 'course_approved',
      is_read: true,
    },
  ]);
  console.log('🔔 Notifications seeded');

  // ─── AI SUMMARIES ─────────────────────────────────────────
  await AISummary.insertMany([
    {
      generated_for_user: student1._id,
      type: 'summary',
      summary_text: 'This document covers the complete React Hooks API including useState for local state management, useEffect for side effects with cleanup, useContext for prop drilling elimination, and custom hooks for logic reuse. Key takeaway: always clean up async effects to prevent memory leaks.',
      core_concepts: ['useState', 'useEffect', 'useContext', 'Custom Hooks', 'Cleanup Functions'],
      actionable_tasks: [
        { task: 'Practice cleanup function pattern', completed: false },
        { task: 'Build a custom useFetch hook', completed: false },
        { task: 'Refactor class components to functional', completed: true },
      ],
      confidence_level: 'high_fidelity',
    },
    {
      generated_for_user: student2._id,
      type: 'summary',
      summary_text: 'A comprehensive reference covering supervised learning (linear regression, SVM, decision trees), unsupervised learning (k-means, PCA), and model evaluation metrics. Includes time complexity for each algorithm and practical use-case guidance.',
      core_concepts: ['Linear Regression', 'SVM', 'Decision Trees', 'K-Means', 'Model Evaluation'],
      actionable_tasks: [
        { task: 'Implement linear regression from scratch', completed: false },
        { task: 'Compare SVM vs decision tree on a dataset', completed: false },
        { task: 'Practice cross-validation', completed: false },
      ],
      confidence_level: 'high_fidelity',
    },
  ]);
  console.log('🤖 AI Summaries seeded');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 LOGIN CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 ADMIN:');
  console.log('   Email   : admin@edustream.com');
  console.log('   Password: Admin@123');
  console.log('');
  console.log('👨‍🏫 MENTOR 1:');
  console.log('   Email   : mentor1@edustream.com');
  console.log('   Password: Mentor@123');
  console.log('');
  console.log('👨‍🏫 MENTOR 2:');
  console.log('   Email   : mentor2@edustream.com');
  console.log('   Password: Mentor@123');
  console.log('');
  console.log('👨‍🎓 STUDENT 1:');
  console.log('   Email   : student1@edustream.com');
  console.log('   Password: Student@123');
  console.log('');
  console.log('👨‍🎓 STUDENT 2:');
  console.log('   Email   : student2@edustream.com');
  console.log('   Password: Student@123');
  console.log('');
  console.log('👨‍🎓 STUDENT 3:');
  console.log('   Email   : student3@edustream.com');
  console.log('   Password: Student@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
