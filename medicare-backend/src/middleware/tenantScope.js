'use strict';

const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');

/**
 * Tenant isolation guard.
 *
 * Attaches `req.tenantId` — the clinicId that every query in the
 * request must be scoped to. Services should always filter by it.
 *
 * - SUPER_ADMIN has no tenant of their own. They may operate on a
 *   specific clinic by passing ?clinicId= or an :clinicId route param.
 * - All other roles are locked to their own user.clinicId; any attempt
 *   to reference a different clinic is rejected.
 *
 * Must run after `authenticate`.
 */
function tenantScope(req, res, next) {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required', 'NO_AUTH'));
  }

  const { role, clinicId } = req.user;
  const requestedClinicId = req.params.clinicId || req.query.clinicId || null;

  if (role === ROLES.SUPER_ADMIN) {
    // Super admin: tenant is whatever they explicitly target (may be null
    // for platform-wide routes).
    req.tenantId = requestedClinicId;
    req.isSuperAdmin = true;
    return next();
  }

  // Every tenant-bound user must belong to a clinic.
  if (!clinicId) {
    return next(ApiError.forbidden('User is not attached to any clinic', 'NO_TENANT'));
  }

  // Reject cross-tenant access attempts.
  if (requestedClinicId && requestedClinicId !== clinicId) {
    return next(
      ApiError.forbidden('Cross-tenant access is not allowed', 'TENANT_MISMATCH')
    );
  }

  req.tenantId = clinicId;
  req.isSuperAdmin = false;
  return next();
}

/**
 * Stricter variant: requires a concrete tenantId to be present.
 * Use on routes a super admin must scope to a specific clinic.
 */
function requireTenant(req, res, next) {
  return tenantScope(req, res, (err) => {
    if (err) return next(err);
    if (!req.tenantId) {
      return next(ApiError.badRequest('A clinicId is required', 'TENANT_REQUIRED'));
    }
    return next();
  });
}

module.exports = { tenantScope, requireTenant };
