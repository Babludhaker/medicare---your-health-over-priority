'use strict';

const { z } = require('zod');

/**
 * Super admin creates / edits the SaaS subscription plans.
 */
const upsertPlanSchema = {
  body: z.object({
    tier: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),
    name: z.string().min(2).max(60),
    priceMonthly: z.number().min(0),
    maxDoctors: z.number().int().min(1),
    maxAppointments: z.number().int().min(-1), // -1 == unlimited
    features: z.array(z.string().max(120)).max(30).default([]),
  }),
};

/**
 * A clinic admin subscribes their clinic to a plan tier.
 */
const subscribeSchema = {
  body: z.object({
    planTier: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),
  }),
};

/**
 * Razorpay subscription webhook.
 */
const subscriptionWebhookSchema = {
  body: z.object({}).passthrough(),
};

module.exports = {
  upsertPlanSchema,
  subscribeSchema,
  subscriptionWebhookSchema,
};
