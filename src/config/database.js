const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const v_mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mflix';
    await mongoose.connect(v_mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
