'use strict';

const patientsService = require('./patients.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * Patient controllers — tenant-scoped via req.tenantId.
 */

const registerPatient = asyncHandler(async (req, res) => {
  const patient = await patientsService.registerPatient(req.tenantId, req.body);
  return sendSuccess(res, { patient }, 201);
});

const listPatients = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { items, meta } = await patientsService.listPatients(req.tenantId, query);
  return sendSuccess(res, { patients: items }, 200, meta);
});

const getPatient = asyncHandler(async (req, res) => {
  const patient = await patientsService.getPatient(
    req.tenantId,
    req.user,
    req.params.patientId
  );
  return sendSuccess(res, { patient });
});

const updatePatient = asyncHandler(async (req, res) => {
  const patient = await patientsService.updatePatient(
    req.tenantId,
    req.user,
    req.params.patientId,
    req.body
  );
  return sendSuccess(res, { patient });
});

const getPatientHistory = asyncHandler(async (req, res) => {
  const result = await patientsService.getPatientHistory(
    req.tenantId,
    req.user,
    req.params.patientId
  );
  return sendSuccess(res, result);
});

module.exports = {
  registerPatient,
  listPatients,
  getPatient,
  updatePatient,
  getPatientHistory,
};
