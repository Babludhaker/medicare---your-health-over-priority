'use strict';

const { Router } = require('express');
const controller = require('./notifications.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const schemas = require('./notifications.validation');

/**
 * Notification routes — any authenticated user, scoped to themselves.
 */
const router = Router();

router.use(authenticate);

router.get('/', validate(schemas.listNotificationsSchema), controller.list);
router.get('/unread-count', controller.unreadCount);
router.patch('/read-all', controller.markAllRead);
router.patch(
  '/:notificationId/read',
  validate(schemas.notificationIdParam),
  controller.markRead
);

module.exports = router;
