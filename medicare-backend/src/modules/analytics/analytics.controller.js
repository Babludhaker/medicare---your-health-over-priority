'use strict';

const analyticsService = require('./analytics.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * Analytics controllers.
 */

const clinicDashboard = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const data = await analyticsService.getClinicDashboard(req.tenantId, query);
  return sendSuccess(res, data);
});

const platformDashboard = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const data = await analyticsService.getPlatformDashboard(query);
  return sendSuccess(res, data);
});

/**
 * Export the clinic appointment report — streams a file download
 * rather than the usual JSON envelope.
 */
const exportClinicReport = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const report = await analyticsService.exportClinicReport(req.tenantId, query);

  res.setHeader('Content-Type', report.contentType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${report.filename}"`
  );
  return res.send(report.content);
});

module.exports = {
  clinicDashboard,
  platformDashboard,
  exportClinicReport,
};
