// index.js

import http from 'http';
import initializeApp from './app.js';
import { PORT, NODE_ENV } from './config/config.js';
import logger from './utils/logger.js';

let activePort = Number(PORT) || 5000;
let server;

const startServer = async (port) => {
  try {
    const app = await initializeApp(); // Initialize the app

    server = http.createServer(app);

    server.listen(port, () => {
      activePort = port;
      logger.info(`🚀 Server running in ${NODE_ENV} mode on http://localhost:${port}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`⚠️ Port ${port} in use, retrying on ${port + 1}...`);
        startServer(port + 1);
      } else {
        logger.error(`❌ Server error: ${err.message}`);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error(`❌ Failed to initialize app: ${error.message}`);
    process.exit(1);
  }
};

const shutdown = (signal) => {
  logger.info(`🚦 ${signal} received. Gracefully shutting down...`);
  if (server) {
    server.close(() => process.exit(0));
  }
  setTimeout(() => process.exit(1), 10000); // Force exit after timeout
};

// Crash handling
process.on('uncaughtException', (err) => {
  logger.error(`💥 Uncaught Exception: ${err.stack}`);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (err) => {
  logger.error(`⚠️ Unhandled Rejection: ${err.message}`);
  shutdown('unhandledRejection');
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer(activePort);
 