'use strict';

const apptService = require('./appointments.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * Appointment controllers. Tenant scope comes from req.tenantId; the
 * actor (req.user) drives patient/doctor self-scoping inside the
 * service.
 */

const hold = asyncHandler(async (req, res) => {
  const appointment = await apptService.holdSlot(req.tenantId, req.user, req.body);
  return sendSuccess(res, { appointment }, 201);
});

const confirm = asyncHandler(async (req, res) => {
  const appointment = await apptService.confirmAppointment(
    req.tenantId,
    req.user,
    req.params.appointmentId
  );
  return sendSuccess(res, { appointment });
});

const reschedule = asyncHandler(async (req, res) => {
  const appointment = await apptService.rescheduleAppointment(
    req.tenantId,
    req.user,
    req.params.appointmentId,
    req.body.startTime
  );
  return sendSuccess(res, { appointment });
});

const cancel = asyncHandler(async (req, res) => {
  const result = await apptService.cancelAppointment(
    req.tenantId,
    req.user,
    req.params.appointmentId,
    req.body.reason
  );
  return sendSuccess(res, result);
});

const complete = asyncHandler(async (req, res) => {
  const appointment = await apptService.completeAppointment(
    req.tenantId,
    req.user,
    req.params.appointmentId
  );
  return sendSuccess(res, { appointment });
});

const noShow = asyncHandler(async (req, res) => {
  const appointment = await apptService.markNoShow(
    req.tenantId,
    req.user,
    req.params.appointmentId
  );
  return sendSuccess(res, { appointment });
});

const walkIn = asyncHandler(async (req, res) => {
  const appointment = await apptService.createWalkIn(req.tenantId, req.user, req.body);
  return sendSuccess(res, { appointment }, 201);
});

const list = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { items, meta } = await apptService.listAppointments(
    req.tenantId,
    req.user,
    query
  );
  return sendSuccess(res, { appointments: items }, 200, meta);
});

const getOne = asyncHandler(async (req, res) => {
  const appointment = await apptService.getAppointment(
    req.tenantId,
    req.user,
    req.params.appointmentId
  );
  return sendSuccess(res, { appointment });
});

module.exports = {
  hold,
  confirm,
  reschedule,
  cancel,
  complete,
  noShow,
  walkIn,
  list,
  getOne,
};
