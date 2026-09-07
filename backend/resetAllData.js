const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');
const Classroom = require('./models/Classroom');
let admin = null;

try {
  admin = require('./firebaseAdmin');
} catch (e) {
  console.log('Firebase Admin SDK not configured or missing serviceAccountKey.json.');
}

async function resetAllData() {
  console.log('--- STARTING COMPLETE DATA RESET ---');

  // 1. Clear MongoDB Collections
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✔ Connected to MongoDB');

      await Promise.all([
        User.deleteMany({ email: { $ne: 'ladom3003@gmail.com' } }),
        Classroom.deleteMany({}),
        Assignment.deleteMany({}),
        Submission.deleteMany({}),
        require('./models/Quiz').deleteMany({}),
        require('./models/QuizSubmission').deleteMany({})
      ]);

      console.log('✔ Cleared MongoDB (Users, Classrooms, Assignments, Submissions)');
    } else {
      console.log('⚠ MONGODB_URI not found in .env, skipping MongoDB cleanup.');
    }
  } catch (err) {
    console.error('❌ MongoDB cleanup error:', err.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }

  // 2. Clear Firebase Users
  if (admin && admin.apps && admin.apps.length > 0) {
    try {
      const listUsersResult = await admin.auth().listUsers(1000);
      const uidsToDelete = listUsersResult.users
        .filter(u => u.email !== 'ladom3003@gmail.com')
        .map(u => u.uid);

      if (uidsToDelete.length > 0) {
        await admin.auth().deleteUsers(uidsToDelete);
        console.log(`✔ Cleared ${uidsToDelete.length} Firebase Auth users (kept ladom3003@gmail.com if present)`);
      } else {
        console.log('✔ No Firebase users found');
      }
    } catch (err) {
      console.log('⚠ Firebase user cleanup skipped:', err.message);
    }
  } else {
    console.log('⚠ Firebase Admin not initialized, skipping Firebase user cleanup.');
  }

  console.log('--- DATA RESET COMPLETE! YOU CAN NOW START FRESH ---');
  process.exit(0);
}

resetAllData();
