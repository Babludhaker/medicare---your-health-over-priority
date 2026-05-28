'use strict';

const { verifyAccessToken } = require('../utils/token');
const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verify the Bearer JWT, load the user, and attach a lean identity
 * object to `req.user`. Every route except /auth/* uses this.
 *
 * req.user = { id, email, role, clinicId, firstName, lastName }
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing Bearer token', 'NO_TOKEN');
  }

  const token = header.slice(7).trim();
  const payload = verifyAccessToken(token);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      role: true,
      clinicId: true,
      firstName: true,
      lastName: true,
      isActive: true,
      isVerified: true,
    },
  });

  if (!user) throw ApiError.unauthorized('User no longer exists', 'USER_GONE');
  if (!user.isActive) throw ApiError.forbidden('Account is disabled', 'ACCOUNT_DISABLED');

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    clinicId: user.clinicId,
    firstName: user.firstName,
    lastName: user.lastName,
    isVerified: user.isVerified,
  };

  next();
});

module.exports = authenticate;
