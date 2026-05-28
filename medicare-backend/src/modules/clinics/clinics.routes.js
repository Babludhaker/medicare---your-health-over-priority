'use strict';

const { Router } = require('express');
const controller = require('./clinics.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const schemas = require('./clinics.validation');
const { ROLES } = require('../../utils/constants');

/**
 * Clinic (tenant) routes — SUPER_ADMIN only.
 */
const router = Router();

router.use(authenticate, authorize(ROLES.SUPER_ADMIN));

router.post('/', validate(schemas.createClinicSchema), controller.createClinic);
router.get('/', validate(schemas.listClinicsSchema), controller.listClinics);
router.get('/:clinicId', validate(schemas.clinicIdParam), controller.getClinic);
router.patch('/:clinicId', validate(schemas.updateClinicSchema), controller.updateClinic);
router.delete(
  '/:clinicId',
  validate(schemas.clinicIdParam),
  controller.deactivateClinic
);

module.exports = router;
