'use strict';

/**
 * Uniform JSON response envelope used by every endpoint.
 *
 * success: { success: true, data: {...}, meta?: {...} }
 * error:   { success: false, error: { code, message, details? } }
 */

function sendSuccess(res, data = null, statusCode = 200, meta = undefined) {
  const body = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
}

function sendError(res, statusCode, code, message, details = undefined) {
  const error = { code, message };
  if (details !== undefined) error.details = details;
  return res.status(statusCode).json({ success: false, error });
}

/**
 * Build a pagination meta object from query params + a total count.
 */
function buildPageMeta(page, limit, total) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 20);
  return {
    page: p,
    limit: l,
    total,
    totalPages: Math.ceil(total / l) || 1,
  };
}

/**
 * Convert page/limit query params into Prisma skip/take.
 */
function getPagination(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

module.exports = { sendSuccess, sendError, buildPageMeta, getPagination };
