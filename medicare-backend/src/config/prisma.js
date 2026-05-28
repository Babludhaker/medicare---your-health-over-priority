'use strict';

const { PrismaClient } = require('@prisma/client');
const env = require('./env');

/**
 * Singleton Prisma client.
 * In development we attach it to globalThis so hot-reload (nodemon)
 * does not exhaust the database connection pool.
 */
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: env.isDev ? ['warn', 'error'] : ['error'],
  });

if (env.isDev) {
  globalForPrisma.__prisma = prisma;
}

async function disconnectPrisma() {
  await prisma.$disconnect();
}

module.exports = { prisma, disconnectPrisma };
