'use strict';

const subsService = require('./subscriptions.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * Subscription controllers.
 */

const listPlans = asyncHandler(async (req, res) => {
  const plans = await subsService.listPlans();
  return sendSuccess(res, { plans });
});

const upsertPlan = asyncHandler(async (req, res) => {
  const plan = await subsService.upsertPlan(req.body);
  return sendSuccess(res, { plan }, 201);
});

const subscribe = asyncHandler(async (req, res) => {
  const result = await subsService.subscribe(
    req.tenantId,
    req.user,
    req.body.planTier
  );
  return sendSuccess(res, result, 201);
});

const getMySubscription = asyncHandler(async (req, res) => {
  const result = await subsService.getClinicSubscription(req.tenantId);
  return sendSuccess(res, result);
});

const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const result = await subsService.handleSubscriptionWebhook(
    req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body),
    signature,
    req.body
  );
  return sendSuccess(res, result);
});

module.exports = {
  listPlans,
  upsertPlan,
  subscribe,
  getMySubscription,
  webhook,
};
