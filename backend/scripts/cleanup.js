// Cleanup script — removes all seed/dummy data but keeps users
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const collections = ['courses', 'courseresources', 'resources', 'enrollments',
    'assignments', 'submissions', 'quizzes', 'aisummaries',
    'notifications', 'forumthreads', 'milestones', 'auditlogs'];

  for (const col of collections) {
    try {
      const result = await mongoose.connection.collection(col).deleteMany({});
      console.log(`✅ Cleared ${col}: ${result.deletedCount} documents`);
    } catch (e) {
      console.log(`⚠️  ${col}: ${e.message}`);
    }
  }

  // Reset mentor_status for seed mentors so they appear as pending again (optional)
  // Keeping users intact
  console.log('\n✅ Cleanup complete. Users are preserved.');
  await mongoose.disconnect();
}

cleanup().catch(console.error);
