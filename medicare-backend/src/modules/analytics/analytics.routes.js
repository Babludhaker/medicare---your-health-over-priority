'use strict';

const { Router } = require('express');
const controller = require('./analytics.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const schemas = require('./analytics.validation');
const { ROLES } = require('../../utils/constants');

/**
 * Analytics routes.
 *
 *  /clinic   — per-tenant operational dashboard (CLINIC_ADMIN)
 *  /clinic/export — CSV / PDF appointment report (CLINIC_ADMIN)
 *  /platform — cross-tenant SaaS metrics (SUPER_ADMIN)
 */
const router = Router();

router.use(authenticate);

// --- Clinic-scoped analytics ---
router.get(
  '/clinic',
  authorize(ROLES.CLINIC_ADMIN),
  tenantScope,
  validate(schemas.dashboardQuerySchema),
  controller.clinicDashboard
);

router.get(
  '/clinic/export',
  authorize(ROLES.CLINIC_ADMIN),
  tenantScope,
  validate(schemas.exportQuerySchema),
  controller.exportClinicReport
);

// --- Platform-wide analytics ---
router.get(
  '/platform',
  authorize(ROLES.SUPER_ADMIN),
  validate(schemas.dashboardQuerySchema),
  controller.platformDashboard
);

module.exports = router;
