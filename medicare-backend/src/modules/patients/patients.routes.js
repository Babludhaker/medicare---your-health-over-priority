'use strict';

const { Router } = require('express');
const controller = require('./patients.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const schemas = require('./patients.validation');
const { ROLES } = require('../../utils/constants');

/**
 * Patient routes — tenant-scoped. The service enforces that a PATIENT
 * only ever touches their own record.
 */
const router = Router();

router.use(authenticate, tenantScope);

// Register a patient — receptionist or clinic admin
router.post(
  '/',
  authorize(ROLES.RECEPTIONIST, ROLES.CLINIC_ADMIN),
  validate(schemas.registerPatientSchema),
  controller.registerPatient
);

// Directory — staff only
router.get(
  '/',
  authorize(ROLES.RECEPTIONIST, ROLES.CLINIC_ADMIN, ROLES.DOCTOR),
  validate(schemas.listPatientsSchema),
  controller.listPatients
);

// Single profile — staff or the patient themselves
router.get(
  '/:patientId',
  authorize(ROLES.RECEPTIONIST, ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.PATIENT),
  validate(schemas.patientIdParam),
  controller.getPatient
);

// Update profile — clinical staff or the patient themselves
router.patch(
  '/:patientId',
  authorize(ROLES.DOCTOR, ROLES.CLINIC_ADMIN, ROLES.PATIENT),
  validate(schemas.updatePatientSchema),
  controller.updatePatient
);

// Full clinical timeline — doctor (treating) or the patient
router.get(
  '/:patientId/history',
  authorize(ROLES.DOCTOR, ROLES.PATIENT, ROLES.CLINIC_ADMIN),
  validate(schemas.patientIdParam),
  controller.getPatientHistory
);

module.exports = router;
