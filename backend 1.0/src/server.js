// Ensure environment variables are loaded and validated first
const config = require('./config/env');
const app = require('./app');
const connectDB = require('./config/db');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Connect to Database
connectDB().then(() => {
  // Start server
  const server = app.listen(config.PORT, () => {
    console.log(`🚀 Server is running on port ${config.PORT} in ${config.NODE_ENV} mode.`);
  });

  // Start cron jobs if not in test environment
  if (config.NODE_ENV !== 'test') {
    const overdueReturnsJob = require('./jobs/overdueReturnsJob');
    const bookingReminderJob = require('./jobs/bookingReminderJob');
    
    overdueReturnsJob.start();
    bookingReminderJob.start();
    console.log('🕒 CRON jobs initialized.');
  }

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('❌ UNHANDLED REJECTION! Shutting down gracefully...');
    console.error(err.name, err.message, err.stack);
    server.close(() => {
      process.exit(1);
    });
  });
});
