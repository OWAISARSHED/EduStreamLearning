const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const dotenv = require('dotenv');
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const users = await db.collection('users').deleteMany({ role: { $ne: 'admin' } });
  console.log('Deleted ' + users.deletedCount + ' non-admin users');

  const courses = await db.collection('courses').deleteMany({});
  console.log('Deleted ' + courses.deletedCount + ' courses');
  const enrollments = await db.collection('enrollments').deleteMany({});
  console.log('Deleted ' + enrollments.deletedCount + ' enrollments');
  const submissions = await db.collection('submissions').deleteMany({});
  console.log('Deleted ' + submissions.deletedCount + ' submissions');
  const quizzes = await db.collection('quizzes').deleteMany({});
  console.log('Deleted ' + quizzes.deletedCount + ' quizzes');
  const assignments = await db.collection('assignments').deleteMany({});
  console.log('Deleted ' + assignments.deletedCount + ' assignments');
  const resources = await db.collection('courseresources').deleteMany({});
  console.log('Deleted ' + resources.deletedCount + ' resources');

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
