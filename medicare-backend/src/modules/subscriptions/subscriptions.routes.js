'use strict';

const { Router } = require('express');
const controller = require('./subscriptions.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const schemas = require('./subscriptions.validation');
const { ROLES } = require('../../utils/constants');

/**
 * Subscription routes.
 *
 * NOTE: the webhook route is registered BEFORE authenticate — Razorpay
 * calls it server-to-server with no JWT; it is secured by webhook
 * signature verification instead.
 */
const router = Router();

// --- Public webhook (signature-verified, no JWT) ---
router.post('/webhook', controller.webhook);

// --- Authenticated routes ---
router.use(authenticate);

// Plan catalogue — readable by any authenticated user
router.get('/plans', controller.listPlans);

// Create / edit a plan — SUPER_ADMIN only
router.post(
  '/plans',
  authorize(ROLES.SUPER_ADMIN),
  validate(schemas.upsertPlanSchema),
  controller.upsertPlan
);

// Subscribe the current clinic to a plan — CLINIC_ADMIN, tenant-scoped
router.post(
  '/subscribe',
  authorize(ROLES.CLINIC_ADMIN),
  tenantScope,
  validate(schemas.subscribeSchema),
  controller.subscribe
);

// Current clinic's subscription + usage — CLINIC_ADMIN, tenant-scoped
router.get(
  '/me',
  authorize(ROLES.CLINIC_ADMIN),
  tenantScope,
  controller.getMySubscription
);

module.exports = router;
