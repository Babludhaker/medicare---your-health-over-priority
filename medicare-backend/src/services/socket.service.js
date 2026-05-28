'use strict';

const { Server } = require('socket.io');
const env = require('../config/env');
const logger = require('../config/logger');
const { verifyAccessToken } = require('../utils/token');

/**
 * Socket.IO service for real-time in-app notifications.
 *
 * Clients connect with a JWT; on connection they are joined to a
 * personal room (`user:<id>`) and a clinic room (`clinic:<id>`).
 * Other modules push events via the emit helpers below.
 */
let io = null;

/**
 * Attach Socket.IO to an existing HTTP server.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  // Authenticate every socket using the JWT in the handshake.
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || '').replace('Bearer ', '');
      if (!token) return next(new Error('Auth token required'));

      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      socket.clinicId = payload.clinicId || null;
      socket.role = payload.role;
      return next();
    } catch (err) {
      return next(new Error('Invalid auth token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    if (socket.clinicId) socket.join(`clinic:${socket.clinicId}`);

    logger.debug({ userId: socket.userId }, 'Socket connected');

    socket.on('disconnect', () => {
      logger.debug({ userId: socket.userId }, 'Socket disconnected');
    });
  });

  logger.info('Socket.IO initialised');
  return io;
}

/** Emit an event to a single user. */
function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

/** Emit an event to everyone in a clinic tenant. */
function emitToClinic(clinicId, event, payload) {
  if (!io) return;
  io.to(`clinic:${clinicId}`).emit(event, payload);
}

/** Push a freshly-created notification to its owner. */
function pushNotification(notification) {
  emitToUser(notification.userId, 'notification:new', notification);
}

function getIo() {
  return io;
}

module.exports = { initSocket, emitToUser, emitToClinic, pushNotification, getIo };
