'use strict';

const { Router } = require('express');
const controller = require('./payments.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const schemas = require('./payments.validation');
const { ROLES } = require('../../utils/constants');

/**
 * Payment routes.
 *
 * NOTE: the webhook route is intentionally registered BEFORE the
 * authenticate middleware — Razorpay calls it server-to-server with no
 * JWT; it is secured by webhook signature verification instead.
 */
const router = Router();

// --- Public webhook (signature-verified, no JWT) ---
router.post('/webhook', controller.webhook);

// --- Authenticated, tenant-scoped routes ---
router.use(authenticate, tenantScope);

// Create a Razorpay order — patient or receptionist
router.post(
  '/order',
  authorize(ROLES.PATIENT, ROLES.RECEPTIONIST),
  validate(schemas.createOrderSchema),
  controller.createOrder
);

// Verify checkout result and confirm the appointment
router.post(
  '/verify',
  authorize(ROLES.PATIENT, ROLES.RECEPTIONIST),
  validate(schemas.verifyPaymentSchema),
  controller.verifyPayment
);

// Refund — clinic admin or receptionist
router.post(
  '/:paymentId/refund',
  authorize(ROLES.CLINIC_ADMIN, ROLES.RECEPTIONIST),
  validate(schemas.refundSchema),
  controller.refund
);

// Fetch a payment + invoice
router.get(
  '/:paymentId',
  authorize(ROLES.CLINIC_ADMIN, ROLES.RECEPTIONIST, ROLES.PATIENT),
  validate(schemas.paymentIdParam),
  controller.getPayment
);

module.exports = router;
