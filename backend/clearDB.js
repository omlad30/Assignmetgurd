const mongoose = require('mongoose');
require('dotenv').config();

const clearDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');
    
    console.log('Dropping database...');
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped successfully!');
    
    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
};

clearDB();
