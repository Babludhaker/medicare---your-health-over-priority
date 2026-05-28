'use strict';

const { Router } = require('express');
const controller = require('./appointments.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const schemas = require('./appointments.validation');
const { ROLES } = require('../../utils/constants');

/**
 * Appointment routes — the scheduling engine surface.
 * All routes are tenant-scoped; specific actions are role-gated.
 */
const router = Router();

router.use(authenticate, tenantScope);

// List + detail (any clinic user; service self-scopes patients/doctors)
router.get('/', validate(schemas.listAppointmentsSchema), controller.list);
router.get('/:appointmentId', validate(schemas.appointmentIdParam), controller.getOne);

// Hold a slot — patient (self) or receptionist (for a patient)
router.post(
  '/hold',
  authorize(ROLES.PATIENT, ROLES.RECEPTIONIST),
  validate(schemas.holdSchema),
  controller.hold
);

// Confirm — receptionist, or system flows; patients confirm after pay
router.post(
  '/:appointmentId/confirm',
  authorize(ROLES.PATIENT, ROLES.RECEPTIONIST, ROLES.CLINIC_ADMIN),
  validate(schemas.confirmSchema),
  controller.confirm
);

// Reschedule — patient (own) or receptionist
router.patch(
  '/:appointmentId/reschedule',
  authorize(ROLES.PATIENT, ROLES.RECEPTIONIST),
  validate(schemas.rescheduleSchema),
  controller.reschedule
);

// Cancel — patient (own) or receptionist
router.patch(
  '/:appointmentId/cancel',
  authorize(ROLES.PATIENT, ROLES.RECEPTIONIST),
  validate(schemas.cancelSchema),
  controller.cancel
);

// Complete — doctor or receptionist marks the visit done
router.patch(
  '/:appointmentId/complete',
  authorize(ROLES.DOCTOR, ROLES.RECEPTIONIST),
  validate(schemas.completeSchema),
  controller.complete
);

// No-show — receptionist or doctor
router.patch(
  '/:appointmentId/no-show',
  authorize(ROLES.DOCTOR, ROLES.RECEPTIONIST),
  validate(schemas.completeSchema),
  controller.noShow
);

// Walk-in / queue token — receptionist front-desk flow
router.post(
  '/walk-in',
  authorize(ROLES.RECEPTIONIST),
  validate(schemas.walkInSchema),
  controller.walkIn
);

module.exports = router;
