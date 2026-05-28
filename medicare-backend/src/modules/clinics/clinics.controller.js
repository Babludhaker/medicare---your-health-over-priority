'use strict';

const clinicsService = require('./clinics.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * Clinic controllers. The route layer restricts all of these to
 * SUPER_ADMIN.
 */

const createClinic = asyncHandler(async (req, res) => {
  const clinic = await clinicsService.createClinic(req.body, req.user);
  return sendSuccess(res, { clinic }, 201);
});

const listClinics = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { items, meta } = await clinicsService.listClinics(query);
  return sendSuccess(res, { clinics: items }, 200, meta);
});

const getClinic = asyncHandler(async (req, res) => {
  const clinic = await clinicsService.getClinic(req.params.clinicId);
  return sendSuccess(res, { clinic });
});

const updateClinic = asyncHandler(async (req, res) => {
  const clinic = await clinicsService.updateClinic(
    req.params.clinicId,
    req.body,
    req.user
  );
  return sendSuccess(res, { clinic });
});

const deactivateClinic = asyncHandler(async (req, res) => {
  const clinic = await clinicsService.deactivateClinic(req.params.clinicId, req.user);
  return sendSuccess(res, { clinic });
});

module.exports = {
  createClinic,
  listClinics,
  getClinic,
  updateClinic,
  deactivateClinic,
};
