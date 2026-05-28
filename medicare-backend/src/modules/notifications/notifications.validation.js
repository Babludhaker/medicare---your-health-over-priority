'use strict';

const { z } = require('zod');

const listNotificationsSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    unreadOnly: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
  }),
};

const notificationIdParam = {
  params: z.object({ notificationId: z.string().uuid() }),
};

module.exports = {
  listNotificationsSchema,
  notificationIdParam,
};
