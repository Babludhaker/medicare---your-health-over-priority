'use strict';

const recordsService = require('./records.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * EMR controllers — tenant-scoped via req.tenantId.
 */

const createRecord = asyncHandler(async (req, res) => {
  const record = await recordsService.createRecord(
    req.tenantId,
    req.user,
    req.params.appointmentId,
    req.body
  );
  return sendSuccess(res, { record }, 201);
});

const getRecord = asyncHandler(async (req, res) => {
  const record = await recordsService.getRecord(
    req.tenantId,
    req.user,
    req.params.appointmentId
  );
  return sendSuccess(res, { record });
});

const createPrescription = asyncHandler(async (req, res) => {
  const result = await recordsService.createPrescription(
    req.tenantId,
    req.user,
    req.params.appointmentId,
    req.body
  );
  return sendSuccess(res, result, 201);
});

const getPrescription = asyncHandler(async (req, res) => {
  const prescription = await recordsService.getPrescription(
    req.tenantId,
    req.user,
    req.params.appointmentId
  );
  return sendSuccess(res, { prescription });
});

const getUploadUrl = asyncHandler(async (req, res) => {
  const result = await recordsService.getDocumentUploadUrl(
    req.tenantId,
    req.user,
    req.params.appointmentId,
    req.body.filename,
    req.body.contentType
  );
  return sendSuccess(res, result);
});

module.exports = {
  createRecord,
  getRecord,
  createPrescription,
  getPrescription,
  getUploadUrl,
};
