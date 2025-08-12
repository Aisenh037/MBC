import http from 'http';
import mongoose from 'mongoose';
import app from './app.js'; 
import config from './config/config.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

// Connect to the database
connectDB();

const server = http.createServer(app);

const startServer = () => {
  server.listen(config.port, () => {
    logger.info(`🚀 Server running in ${config.env} mode on port ${config.port}`);
  });
};

startServer();

// --- Graceful Shutdown Handler ---
const shutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      logger.info('MongoDB connection closed. Exiting process.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message || err}`);
  // We don't exit the process here in a graceful shutdown scenario,
  // but it's important to log it.
});