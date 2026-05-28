'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const env = require('../config/env');

/**
 * Hash a plaintext password.
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a stored hash.
 */
async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * SHA-256 hash — used to store refresh tokens and reset tokens
 * so the raw value never sits in the database.
 */
function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Generate a cryptographically-random url-safe token.
 */
function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a numeric OTP of the given length (default 6 digits).
 */
function generateOtp(length = 6) {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return num.toString().padStart(length, '0');
}

module.exports = {
  hashPassword,
  verifyPassword,
  sha256,
  randomToken,
  generateOtp,
};
