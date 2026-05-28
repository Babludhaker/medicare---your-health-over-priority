'use strict';

const { prisma } = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');
const { SUBSCRIPTION_STATUS, AUDIT_ACTIONS } = require('../../utils/constants');
const { audit } = require('../../utils/audit');
const { addDays } = require('../../utils/datetime');
const razorpay = require('../../services/payment.service');

/**
 * SaaS subscription billing — the platform charges clinics for using
 * MediCare Connect (separate from patient consultation payments).
 */

/**
 * List the public catalogue of plans.
 */
async function listPlans() {
  return prisma.subscriptionPlan.findMany({ orderBy: { priceMonthly: 'asc' } });
}

/**
 * Create or update a plan (super admin).
 */
async function upsertPlan(input) {
  return prisma.subscriptionPlan.upsert({
    where: { tier: input.tier },
    update: {
      name: input.name,
      priceMonthly: input.priceMonthly,
      maxDoctors: input.maxDoctors,
      maxAppointments: input.maxAppointments,
      features: input.features,
    },
    create: {
      tier: input.tier,
      name: input.name,
      priceMonthly: input.priceMonthly,
      maxDoctors: input.maxDoctors,
      maxAppointments: input.maxAppointments,
      features: input.features,
    },
  });
}

/**
 * Subscribe a clinic to a plan tier. Creates a Razorpay subscription
 * and an ACTIVE ClinicSubscription (TRIALING for the first period).
 */
async function subscribe(clinicId, actor, planTier) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { tier: planTier } });
  if (!plan) throw ApiError.badRequest('Unknown plan tier', 'BAD_PLAN');

  // Razorpay subscription (mock-safe).
  const rzpSub = await razorpay.createSubscription({
    planId: `plan_${plan.tier.toLowerCase()}`,
    notes: { clinicId, tier: plan.tier },
  });

  const subscription = await prisma.clinicSubscription.upsert({
    where: { clinicId },
    update: {
      planId: plan.id,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      razorpaySubId: rzpSub.id,
      currentPeriodEnd: addDays(new Date(), 30),
    },
    create: {
      clinicId,
      planId: plan.id,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      razorpaySubId: rzpSub.id,
      currentPeriodEnd: addDays(new Date(), 30),
    },
  });

  await audit({
    clinicId,
    userId: actor.id,
    action: AUDIT_ACTIONS.SUBSCRIPTION_CHANGED,
    entityType: 'ClinicSubscription',
    entityId: subscription.id,
    metadata: { tier: plan.tier },
  });

  return { subscription, plan };
}

/**
 * Current subscription for a clinic, including computed usage limits.
 */
async function getClinicSubscription(clinicId) {
  const subscription = await prisma.clinicSubscription.findUnique({
    where: { clinicId },
    include: { plan: true },
  });
  if (!subscription) {
    throw ApiError.notFound('This clinic has no subscription');
  }

  // Live usage figures vs plan limits.
  const [doctorCount, monthAppointments] = await Promise.all([
    prisma.doctorProfile.count({ where: { clinicId } }),
    prisma.appointment.count({
      where: {
        clinicId,
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
  ]);

  return {
    subscription,
    usage: {
      doctors: { used: doctorCount, max: subscription.plan.maxDoctors },
      appointmentsThisMonth: {
        used: monthAppointments,
        max: subscription.plan.maxAppointments, // -1 == unlimited
      },
    },
  };
}

/**
 * Enforce a plan limit before a tenant-bound create operation.
 * Returns nothing on success; throws if the limit is exceeded.
 */
async function assertWithinLimits(clinicId, kind) {
  const sub = await prisma.clinicSubscription.findUnique({
    where: { clinicId },
    include: { plan: true },
  });
  if (!sub) return; // no subscription configured -> do not block

  if (kind === 'doctor') {
    const count = await prisma.doctorProfile.count({ where: { clinicId } });
    if (count >= sub.plan.maxDoctors) {
      throw ApiError.forbidden(
        'Doctor limit reached for the current plan',
        'PLAN_LIMIT_DOCTORS'
      );
    }
  }
  if (kind === 'appointment' && sub.plan.maxAppointments !== -1) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const count = await prisma.appointment.count({
      where: { clinicId, createdAt: { gte: monthStart } },
    });
    if (count >= sub.plan.maxAppointments) {
      throw ApiError.forbidden(
        'Monthly appointment limit reached for the current plan',
        'PLAN_LIMIT_APPTS'
      );
    }
  }
}

/**
 * Razorpay subscription webhook — keeps the tenant's plan status in
 * sync with billing events.
 */
async function handleSubscriptionWebhook(rawBody, signature, parsedBody) {
  const valid = razorpay.verifyWebhookSignature(rawBody, signature);
  if (!valid) {
    throw ApiError.unauthorized('Invalid webhook signature', 'BAD_WEBHOOK_SIG');
  }

  const event = parsedBody?.event;
  const entity = parsedBody?.payload?.subscription?.entity;
  logger.info({ event }, 'Razorpay subscription webhook received');

  if (!entity?.id) return { received: true };

  const sub = await prisma.clinicSubscription.findFirst({
    where: { razorpaySubId: entity.id },
  });
  if (!sub) return { received: true };

  const statusMap = {
    'subscription.activated': SUBSCRIPTION_STATUS.ACTIVE,
    'subscription.charged': SUBSCRIPTION_STATUS.ACTIVE,
    'subscription.pending': SUBSCRIPTION_STATUS.PAST_DUE,
    'subscription.halted': SUBSCRIPTION_STATUS.PAST_DUE,
    'subscription.cancelled': SUBSCRIPTION_STATUS.CANCELLED,
    'subscription.completed': SUBSCRIPTION_STATUS.CANCELLED,
  };

  const newStatus = statusMap[event];
  if (newStatus) {
    await prisma.clinicSubscription.update({
      where: { id: sub.id },
      data: {
        status: newStatus,
        currentPeriodEnd:
          event === 'subscription.charged' ? addDays(new Date(), 30) : sub.currentPeriodEnd,
      },
    });
  }

  return { received: true };
}

module.exports = {
  listPlans,
  upsertPlan,
  subscribe,
  getClinicSubscription,
  assertWithinLimits,
  handleSubscriptionWebhook,
};
