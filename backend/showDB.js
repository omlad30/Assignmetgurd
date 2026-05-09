const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');
const Classroom = require('./models/Classroom');

async function showDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.\n');

    const users = await User.find().select('-password -__v').limit(3);
    console.log('--- USERS (Sample up to 3) ---');
    console.log(JSON.stringify(users, null, 2));

    const classrooms = await Classroom.find().select('-__v').limit(3);
    console.log('\n--- CLASSROOMS (Sample up to 3) ---');
    console.log(JSON.stringify(classrooms, null, 2));

    const assignments = await Assignment.find().select('-__v').limit(3);
    console.log('\n--- ASSIGNMENTS (Sample up to 3) ---');
    console.log(JSON.stringify(assignments, null, 2));

    const submissions = await Submission.find().select('-__v').limit(3);
    console.log('\n--- SUBMISSIONS (Sample up to 3) ---');
    console.log(JSON.stringify(submissions, null, 2));

    console.log('\nFinished querying database.');
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    mongoose.connection.close();
  }
}

showDB();
