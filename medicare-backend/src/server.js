'use strict';

const http = require('http');

const env = require('./config/env');
const logger = require('./config/logger');
const { createApp } = require('./app');
const { prisma, disconnectPrisma } = require('./config/prisma');
const { initSocket } = require('./services/socket.service');
const { startJobs } = require('./jobs');

/**
 * Server bootstrap:
 *  1. build the Express app
 *  2. wrap it in an HTTP server
 *  3. attach Socket.IO
 *  4. verify the database connection
 *  5. register cron jobs
 *  6. listen, and wire graceful shutdown
 */
async function start() {
  const app = createApp();
  const server = http.createServer(app);

  // Real-time layer.
  initSocket(server);

  // Fail fast if the database is unreachable.
  try {
    await prisma.$connect();
    logger.info('Database connection established');
  } catch (err) {
    logger.fatal({ err }, 'Could not connect to the database');
    process.exit(1);
  }

  // Scheduled background jobs.
  startJobs();

  server.listen(env.PORT, () => {
    logger.info(`MediCare Connect API listening on port ${env.PORT} (${env.NODE_ENV})`);
    logger.info(`Health check: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
  });

  // --- Graceful shutdown ---
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectPrisma();
      logger.info('Shutdown complete');
      process.exit(0);
    });
    // Force-exit if cleanup hangs.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — exiting');
    process.exit(1);
  });
}

start();
