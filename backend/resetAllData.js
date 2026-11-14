const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');
const Classroom = require('./models/Classroom');
const Quiz = require('./models/Quiz');
const QuizSubmission = require('./models/QuizSubmission');
const Material = require('./models/Material');
const DraftAttempt = require('./models/DraftAttempt');
let admin = null;

try {
  admin = require('./firebaseAdmin');
} catch (e) {
  console.log('Firebase Admin SDK not configured or missing serviceAccountKey.json.');
}

async function resetAllData() {
  console.log('--- STARTING COMPLETE DATA RESET ---');

  const adminEmail = process.env.ADMIN_EMAIL || 'ladom3003@gmail.com';

  // 1. Clear MongoDB Collections
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✔ Connected to MongoDB');

      await Promise.all([
        // Keep ONLY the admin user, delete all students and teachers
        User.deleteMany({ email: { $ne: adminEmail } }),
        Classroom.deleteMany({}),
        Assignment.deleteMany({}),
        Submission.deleteMany({}),
        Quiz.deleteMany({}),
        QuizSubmission.deleteMany({}),
        Material.deleteMany({}),
        DraftAttempt.deleteMany({})
      ]);

      // Ensure the remaining admin user has role 'admin'
      await User.updateOne({ email: adminEmail }, { $set: { role: 'admin' } });

      console.log(`✔ Cleared MongoDB collections (Deleted all students, teachers, assignments, submissions, quizzes, materials). Kept Admin: ${adminEmail}`);
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
        .filter(u => u.email !== adminEmail)
        .map(u => u.uid);

      if (uidsToDelete.length > 0) {
        await admin.auth().deleteUsers(uidsToDelete);
        console.log(`✔ Cleared ${uidsToDelete.length} Firebase Auth users (Kept Admin: ${adminEmail})`);
      } else {
        console.log(`✔ No extraneous Firebase users to delete (Admin kept: ${adminEmail})`);
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
