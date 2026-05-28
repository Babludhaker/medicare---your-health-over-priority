'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('./ApiError');

/**
 * Access token — short-lived, carries identity + role + tenant.
 */
function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  });
}

/**
 * Refresh token — long-lived, only used to rotate access tokens.
 * The raw value is hashed before being stored in the DB.
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  });
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired access token', 'TOKEN_INVALID');
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token', 'REFRESH_INVALID');
  }
}

/**
 * Compute an absolute Date for a refresh token's expiry, from the
 * configured duration string (e.g. "7d", "15m", "24h").
 */
function refreshExpiryDate(now = new Date()) {
  const str = env.JWT_REFRESH_EXPIRES;
  const match = /^(\d+)([smhd])$/.exec(str);
  const units = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 };
  const ms = match ? Number(match[1]) * units[match[2]] : 7 * units.d;
  return new Date(now.getTime() + ms);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshExpiryDate,
};
