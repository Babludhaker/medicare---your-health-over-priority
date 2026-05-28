'use strict';

const { Router } = require('express');
const controller = require('./doctors.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const schemas = require('./doctors.validation');
const { ROLES } = require('../../utils/constants');

/**
 * Doctor routes. Reads are open to all clinic users (and patients);
 * profile + availability writes are restricted to CLINIC_ADMIN and the
 * doctors themselves / receptionists where appropriate.
 */
const router = Router();

router.use(authenticate, tenantScope);

// --- Reads (any authenticated clinic user) ---
router.get('/', validate(schemas.listDoctorsSchema), controller.listDoctors);
router.get('/:doctorId', validate(schemas.doctorIdParam), controller.getDoctor);
router.get(
  '/:doctorId/slots',
  validate(schemas.slotsQuerySchema),
  controller.getSlots
);

// --- Profile management (clinic admin) ---
router.patch(
  '/:doctorId',
  authorize(ROLES.CLINIC_ADMIN),
  validate(schemas.updateDoctorSchema),
  controller.updateDoctor
);

// --- Availability (clinic admin or the doctor) ---
router.put(
  '/:doctorId/availability',
  authorize(ROLES.CLINIC_ADMIN, ROLES.DOCTOR),
  validate(schemas.setAvailabilitySchema),
  controller.setAvailability
);

router.post(
  '/:doctorId/blocked-dates',
  authorize(ROLES.CLINIC_ADMIN, ROLES.DOCTOR),
  validate(schemas.blockDateSchema),
  controller.addBlockedDate
);

router.delete(
  '/:doctorId/blocked-dates/:blockedDateId',
  authorize(ROLES.CLINIC_ADMIN, ROLES.DOCTOR),
  validate(schemas.blockedDateIdParam),
  controller.removeBlockedDate
);

module.exports = router;
