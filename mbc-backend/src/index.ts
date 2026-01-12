import http from 'http';
import mongoose from 'mongoose';
import app from './app';
import config from '@/config/config';
import connectDB from '@/config/db';
import logger from '@/utils/logger';
import { initializeWebSocket } from '@/middleware/websocket';
import { notificationService } from '@/services/notificationService';
import notificationScheduler from '@/services/notificationScheduler';

// Connect to the database
connectDB();

const server = http.createServer(app);

// Initialize WebSocket server
initializeWebSocket(server);

// Initialize notification services
const initializeNotificationServices = async (): Promise<void> => {
  try {
    await notificationService.initialize();
    await notificationScheduler.initialize();
    logger.info('Notification services initialized successfully');
  } catch (error) {
    logger.warn('Failed to initialize notification services (continuing without them):', error);
    // Don't exit - continue without notification services
  }
};

const startServer = async (): Promise<void> => {
  // Initialize notification services
  await initializeNotificationServices();
  
  server.listen(config.port, () => {
    logger.info(`🚀 Server running in ${config.env} mode on port ${config.port}`);
    logger.info('WebSocket server initialized and ready for connections');
    logger.info('Notification services are running');
  });
};

startServer();

// --- Graceful Shutdown Handler ---
const shutdown = (signal: string): void => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  // Shutdown notification scheduler
  notificationScheduler.shutdown();
  
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      logger.info('MongoDB connection closed. Exiting process.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message || err}`);
  // We don't exit the process here in a graceful shutdown scenario,
  // but it's important to log it.
});