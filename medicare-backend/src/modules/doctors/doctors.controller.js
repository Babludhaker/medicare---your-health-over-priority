'use strict';

const doctorsService = require('./doctors.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * Doctor controllers. All operations are tenant-scoped via req.tenantId.
 */

const listDoctors = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { items, meta } = await doctorsService.listDoctors(req.tenantId, query);
  return sendSuccess(res, { doctors: items }, 200, meta);
});

const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorsService.getDoctor(req.tenantId, req.params.doctorId);
  return sendSuccess(res, { doctor });
});

const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorsService.updateDoctor(
    req.tenantId,
    req.params.doctorId,
    req.body
  );
  return sendSuccess(res, { doctor });
});

const setAvailability = asyncHandler(async (req, res) => {
  const availabilities = await doctorsService.setAvailability(
    req.tenantId,
    req.params.doctorId,
    req.body.slots
  );
  return sendSuccess(res, { availabilities });
});

const addBlockedDate = asyncHandler(async (req, res) => {
  const blockedDate = await doctorsService.addBlockedDate(
    req.tenantId,
    req.params.doctorId,
    req.body.date,
    req.body.reason
  );
  return sendSuccess(res, { blockedDate }, 201);
});

const removeBlockedDate = asyncHandler(async (req, res) => {
  const result = await doctorsService.removeBlockedDate(
    req.tenantId,
    req.params.doctorId,
    req.params.blockedDateId
  );
  return sendSuccess(res, result);
});

const getSlots = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await doctorsService.getAvailableSlots(
    req.tenantId,
    req.params.doctorId,
    query.date
  );
  return sendSuccess(res, result);
});

module.exports = {
  listDoctors,
  getDoctor,
  updateDoctor,
  setAvailability,
  addBlockedDate,
  removeBlockedDate,
  getSlots,
};
