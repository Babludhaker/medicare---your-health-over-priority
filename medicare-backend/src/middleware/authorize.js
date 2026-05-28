'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Role guard. Pass the roles allowed to hit the route.
 *
 *   router.post('/', authenticate, authorize('CLINIC_ADMIN'), handler);
 *   router.get('/', authenticate, authorize('DOCTOR', 'RECEPTIONIST'), handler);
 *
 * Must run after `authenticate` (it relies on req.user).
 */
function authorize(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required', 'NO_AUTH'));
    }
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role ${req.user.role} cannot access this resource`,
          'ROLE_FORBIDDEN'
        )
      );
    }
    return next();
  };
}

module.exports = authorize;
