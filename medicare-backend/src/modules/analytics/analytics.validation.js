'use strict';

const { z } = require('zod');

/**
 * Optional date-range filter for dashboards and report exports.
 */
const dashboardQuerySchema = {
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
};

const exportQuerySchema = {
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    format: z.enum(['csv', 'pdf']).optional().default('csv'),
  }),
};

module.exports = {
  dashboardQuerySchema,
  exportQuerySchema,
};
