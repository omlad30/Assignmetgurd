require('dotenv').config();
const mongoose = require('mongoose');

const clearDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    await mongoose.connection.db.dropDatabase();
    console.log('Successfully cleared MongoDB database');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing DB:', error);
    process.exit(1);
  }
};
clearDB();
