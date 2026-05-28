'use strict';

const notificationsService = require('./notifications.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * Notification controllers — each user only ever touches their own
 * notifications (req.user.id).
 */

const list = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { items, unreadCount, meta } = await notificationsService.listNotifications(
    req.user.id,
    query
  );
  return sendSuccess(res, { notifications: items, unreadCount }, 200, meta);
});

const unreadCount = asyncHandler(async (req, res) => {
  const result = await notificationsService.unreadCount(req.user.id);
  return sendSuccess(res, result);
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationsService.markRead(
    req.user.id,
    req.params.notificationId
  );
  return sendSuccess(res, { notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationsService.markAllRead(req.user.id);
  return sendSuccess(res, result);
});

module.exports = {
  list,
  unreadCount,
  markRead,
  markAllRead,
};
