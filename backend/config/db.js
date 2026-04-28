const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.error('⚠️  Server running WITHOUT database. Please whitelist your IP on MongoDB Atlas.');
    // Don't exit — let server run so frontend can still load
  }
};

module.exports = connectDB;
