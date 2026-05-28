'use strict';

const { Prisma } = require('@prisma/client');
const ApiError = require('../utils/ApiError');
const { sendError } = require('../utils/apiResponse');
const logger = require('../config/logger');
const env = require('../config/env');

/**
 * 404 handler for unmatched routes.
 */
function notFound(req, res) {
  return sendError(res, 404, 'ROUTE_NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`);
}

/**
 * Translate Prisma errors into clean ApiErrors.
 */
function mapPrismaError(err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = Array.isArray(err.meta?.target)
          ? err.meta.target.join(', ')
          : err.meta?.target;
        // Unique constraint on (doctorId, startTime) == double-booking.
        if (typeof target === 'string' && target.includes('startTime')) {
          return ApiError.conflict('This slot was just booked.', 'SLOT_TAKEN');
        }
        return ApiError.conflict(
          `A record with this ${target || 'value'} already exists.`,
          'DUPLICATE'
        );
      }
      case 'P2025':
        return ApiError.notFound('The requested record was not found.', 'NOT_FOUND');
      case 'P2003':
        return ApiError.badRequest('Related record does not exist.', 'FK_VIOLATION');
      default:
        return ApiError.badRequest('Database request error.', 'DB_ERROR');
    }
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return ApiError.badRequest('Invalid data sent to the database.', 'DB_VALIDATION');
  }
  return null;
}

/**
 * Central error handler. Must be registered last, with 4 args.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let apiError = err;

  if (!(err instanceof ApiError)) {
    const mapped = mapPrismaError(err);
    apiError = mapped || ApiError.internal();
  }

  // Log server errors loudly, client errors quietly.
  if (apiError.statusCode >= 500) {
    logger.error({ err, path: req.originalUrl }, apiError.message);
  } else {
    logger.warn({ code: apiError.code, path: req.originalUrl }, apiError.message);
  }

  const details =
    apiError.details || (env.isDev && apiError.statusCode >= 500 ? err.stack : undefined);

  return sendError(res, apiError.statusCode, apiError.code, apiError.message, details);
}

module.exports = { errorHandler, notFound };
