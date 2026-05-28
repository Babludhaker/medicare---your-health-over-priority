'use strict';

const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');

/**
 * Reusable rate limiters. Auth endpoints are limited tightly to blunt
 * credential-stuffing; the general API limiter is looser.
 */

function buildLimiter({ windowMs, max, code, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => sendError(res, 429, code, message),
  });
}

const generalLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  code: 'RATE_LIMITED',
  message: 'Too many requests, please slow down.',
});

const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  code: 'AUTH_RATE_LIMITED',
  message: 'Too many authentication attempts, try again later.',
});

module.exports = { generalLimiter, authLimiter };
