'use strict';

const paymentsService = require('./payments.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * Payment controllers.
 *
 * The webhook controller is special: it is unauthenticated (called by
 * Razorpay) and relies on signature verification instead of a JWT.
 */

const createOrder = asyncHandler(async (req, res) => {
  const result = await paymentsService.createOrder(
    req.tenantId,
    req.user,
    req.body.appointmentId
  );
  return sendSuccess(res, result, 201);
});

const verifyPayment = asyncHandler(async (req, res) => {
  const result = await paymentsService.verifyAndConfirm(req.tenantId, req.body);
  return sendSuccess(res, result);
});

const webhook = asyncHandler(async (req, res) => {
  // rawBody is captured in app.js's express.json verify hook.
  const signature = req.headers['x-razorpay-signature'];
  const result = await paymentsService.handleWebhook(
    req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body),
    signature,
    req.body
  );
  return sendSuccess(res, result);
});

const refund = asyncHandler(async (req, res) => {
  const payment = await paymentsService.refund(
    req.tenantId,
    req.user,
    req.params.paymentId
  );
  return sendSuccess(res, { payment });
});

const getPayment = asyncHandler(async (req, res) => {
  const payment = await paymentsService.getPayment(req.tenantId, req.params.paymentId);
  return sendSuccess(res, { payment });
});

module.exports = {
  createOrder,
  verifyPayment,
  webhook,
  refund,
  getPayment,
};
