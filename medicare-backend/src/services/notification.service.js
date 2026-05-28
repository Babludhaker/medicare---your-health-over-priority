'use strict';

const { prisma } = require('../config/prisma');
const logger = require('../config/logger');
const { pushNotification } = require('./socket.service');

/**
 * Create a notification row and push it in real time over Socket.IO.
 * Notification failures must never break the calling flow.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} [params.clinicId]
 * @param {string} params.title
 * @param {string} params.body
 * @param {string} params.type - APPOINTMENT | PAYMENT | SYSTEM
 */
async function createNotification({ userId, clinicId = null, title, body, type }) {
  try {
    const notification = await prisma.notification.create({
      data: { userId, clinicId, title, body, type },
    });
    pushNotification(notification);
    return notification;
  } catch (err) {
    logger.error({ err: err.message, userId }, 'Failed to create notification');
    return null;
  }
}

/**
 * Create the same notification for many users at once.
 */
async function notifyMany(userIds, { clinicId = null, title, body, type }) {
  return Promise.all(
    userIds.map((userId) => createNotification({ userId, clinicId, title, body, type }))
  );
}

module.exports = { createNotification, notifyMany };
