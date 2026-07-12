const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

const connectDB = async () => {
  let attempt = 1;
  
  while (attempt <= MAX_RETRIES) {
    try {
      console.log(`🔌 Attempting to connect to MongoDB (Attempt ${attempt}/${MAX_RETRIES})...`);
      const conn = await mongoose.connect(MONGO_URI);
      console.log(`✨ MongoDB connected successfully to host: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`❌ MongoDB connection error on attempt ${attempt}:`, error.message);
      attempt++;
      if (attempt <= MAX_RETRIES) {
        console.log(`🕒 Retrying connection in ${RETRY_INTERVAL_MS / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      } else {
        console.error('💥 Max database connection retries reached. Exiting process.');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
