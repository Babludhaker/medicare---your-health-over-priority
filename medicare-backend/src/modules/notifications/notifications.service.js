'use strict';

const { prisma } = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');

/**
 * Notification inbox.
 *
 * Real-time delivery (Socket.IO) and notification creation live in
 * src/services/notification.service.js. This module is the read side:
 * a user listing, reading, and clearing their own notifications.
 */

/**
 * Paginated list of the user's notifications.
 */
async function listNotifications(userId, query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

  const where = { userId };
  if (query.unreadOnly) where.isRead = false;

  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    items,
    unreadCount: unread,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

/**
 * Count unread notifications — used to drive a UI badge.
 */
async function unreadCount(userId) {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return { unreadCount: count };
}

/**
 * Mark one notification read. The notification must belong to the user.
 */
async function markRead(userId, notificationId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.userId !== userId) {
    throw ApiError.notFound('Notification not found');
  }
  if (notification.isRead) return notification;

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

/**
 * Mark every unread notification read.
 */
async function markAllRead(userId) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { updated: result.count };
}

module.exports = {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
};
