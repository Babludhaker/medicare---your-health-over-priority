'use strict';

const usersService = require('./users.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * Staff management controllers. All operations use req.tenantId set by
 * the tenantScope middleware so a clinic admin can only ever touch
 * their own clinic's users.
 */

const createStaff = asyncHandler(async (req, res) => {
  const user = await usersService.createStaff(req.tenantId, req.body, req.user);
  return sendSuccess(res, { user }, 201);
});

const listStaff = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { items, meta } = await usersService.listStaff(req.tenantId, query);
  return sendSuccess(res, { users: items }, 200, meta);
});

const getStaff = asyncHandler(async (req, res) => {
  const user = await usersService.getStaff(req.tenantId, req.params.userId);
  return sendSuccess(res, { user });
});

const updateStaff = asyncHandler(async (req, res) => {
  const user = await usersService.updateStaff(
    req.tenantId,
    req.params.userId,
    req.body,
    req.user
  );
  return sendSuccess(res, { user });
});

const deactivateStaff = asyncHandler(async (req, res) => {
  const user = await usersService.deactivateStaff(
    req.tenantId,
    req.params.userId,
    req.user
  );
  return sendSuccess(res, { user });
});

module.exports = {
  createStaff,
  listStaff,
  getStaff,
  updateStaff,
  deactivateStaff,
};
