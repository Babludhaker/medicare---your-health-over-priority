'use strict';

const pino = require('pino');
const env = require('./env');

/**
 * Structured logger. Pretty-prints in development, JSON in production.
 */
const logger = pino({
  level: env.isDev ? 'debug' : 'info',
  transport: env.isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: { service: 'medicare-backend' },
});

module.exports = logger;
