'use strict';

const { Router } = require('express');
const controller = require('./records.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const schemas = require('./records.validation');
const { ROLES } = require('../../utils/constants');

/**
 * EMR routes — keyed by appointmentId.
 *
 * Writes are DOCTOR-only (the service further checks it is the
 * treating doctor). Reads are open to DOCTOR / PATIENT; receptionists
 * are blocked inside the service.
 */
const router = Router();

router.use(authenticate, tenantScope);

// --- Medical record (visit note + vitals) ---
router.post(
  '/:appointmentId',
  authorize(ROLES.DOCTOR),
  validate(schemas.createRecordSchema),
  controller.createRecord
);
router.get(
  '/:appointmentId',
  authorize(ROLES.DOCTOR, ROLES.PATIENT),
  validate(schemas.appointmentIdParam),
  controller.getRecord
);

// --- Document upload (presigned S3 URL) ---
router.post(
  '/:appointmentId/upload-url',
  authorize(ROLES.DOCTOR),
  validate(schemas.uploadUrlSchema),
  controller.getUploadUrl
);

// --- E-prescription ---
router.post(
  '/:appointmentId/prescription',
  authorize(ROLES.DOCTOR),
  validate(schemas.createPrescriptionSchema),
  controller.createPrescription
);
router.get(
  '/:appointmentId/prescription',
  authorize(ROLES.DOCTOR, ROLES.PATIENT),
  validate(schemas.appointmentIdParam),
  controller.getPrescription
);

module.exports = router;
