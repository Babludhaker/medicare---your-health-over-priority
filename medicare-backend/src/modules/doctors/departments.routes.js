"use strict";

const { Router } = require("express");
const { z } = require("zod");
const deptService = require("./departments.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const validate = require("../../middleware/validate");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const { tenantScope } = require("../../middleware/tenantScope");
const { ROLES } = require("../../utils/constants");

/**
 * Department routes. Reads are open to clinic users; writes are
 * CLINIC_ADMIN only.
 */
const router = Router();

const createSchema = {
  body: z.object({
    name: z.string().min(2).max(80),
    description: z.string().max(255).optional(),
  }),
};
const idParam = {
  params: z.object({ departmentId: z.string().uuid() }),
};

router.use(authenticate, tenantScope);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const departments = await deptService.listDepartments(req.tenantId);
    return sendSuccess(res, { departments });
  }),
);

router.post(
  "/",
  authorize(ROLES.CLINIC_ADMIN),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const department = await deptService.createDepartment(
      req.tenantId,
      req.body.name,
      req.body.description,
    );
    return sendSuccess(res, { department }, 201);
  }),
);

router.delete(
  "/:departmentId",
  authorize(ROLES.CLINIC_ADMIN),
  validate(idParam),
  asyncHandler(async (req, res) => {
    const result = await deptService.deleteDepartment(
      req.tenantId,
      req.params.departmentId,
    );
    return sendSuccess(res, result);
  }),
);

module.exports = router;
