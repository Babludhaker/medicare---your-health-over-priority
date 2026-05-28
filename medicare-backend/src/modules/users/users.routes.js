'use strict';

const { Router } = require('express');
const controller = require('./users.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const schemas = require('./users.validation');
const { ROLES } = require('../../utils/constants');

/**
 * Staff management routes — CLINIC_ADMIN only, tenant-scoped.
 */
const router = Router();

router.use(authenticate, authorize(ROLES.CLINIC_ADMIN), tenantScope);

router.post('/', validate(schemas.createStaffSchema), controller.createStaff);
router.get('/', validate(schemas.listStaffSchema), controller.listStaff);
router.get('/:userId', validate(schemas.userIdParam), controller.getStaff);
router.patch('/:userId', validate(schemas.updateStaffSchema), controller.updateStaff);
router.delete('/:userId', validate(schemas.userIdParam), controller.deactivateStaff);

module.exports = router;
