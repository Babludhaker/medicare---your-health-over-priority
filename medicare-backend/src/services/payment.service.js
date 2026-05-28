'use strict';

const Razorpay = require('razorpay');
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../config/logger');

/**
 * Razorpay wrapper — handles consultation payments, SaaS subscription
 * billing, refunds, and signature verification for webhooks.
 *
 * When keys are absent the service runs in mock mode so the rest of
 * the app can be exercised locally.
 */
const enabled = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
const client = enabled
  ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
  : null;

/**
 * Create an order. Amount is in the major unit (rupees) and is
 * converted to paise here.
 */
async function createOrder({ amount, currency = 'INR', receipt, notes }) {
  const amountPaise = Math.round(Number(amount) * 100);

  if (!enabled) {
    const mockId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
    logger.info({ mockId, amount }, '[razorpay:mock] order created');
    return { id: mockId, amount: amountPaise, currency, status: 'created', mocked: true };
  }

  const order = await client.orders.create({
    amount: amountPaise,
    currency,
    receipt,
    notes,
  });
  logger.info({ orderId: order.id, amount }, 'Razorpay order created');
  return order;
}

/**
 * Verify the checkout signature returned by Razorpay's frontend SDK.
 * signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
 */
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!enabled) {
    // In mock mode accept anything so local flows complete.
    return true;
  }
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ''));
}

/**
 * Verify a Razorpay webhook payload using the webhook secret.
 * `rawBody` must be the unparsed request body string.
 */
function verifyWebhookSignature(rawBody, signature) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    logger.warn('RAZORPAY_WEBHOOK_SECRET not set — webhook signature not verified');
    return true;
  }
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ''));
  } catch {
    return false;
  }
}

/**
 * Issue a refund for a captured payment.
 */
async function refundPayment(paymentId, amount) {
  if (!enabled) {
    logger.info({ paymentId, amount }, '[razorpay:mock] refund issued');
    return { id: `rfnd_mock_${crypto.randomBytes(6).toString('hex')}`, status: 'processed' };
  }
  const opts = amount ? { amount: Math.round(Number(amount) * 100) } : {};
  const refund = await client.payments.refund(paymentId, opts);
  logger.info({ paymentId, refundId: refund.id }, 'Refund issued');
  return refund;
}

/**
 * Create a subscription for SaaS plan billing.
 */
async function createSubscription({ planId, customerNotify = 1, totalCount = 12, notes }) {
  if (!enabled) {
    return { id: `sub_mock_${crypto.randomBytes(8).toString('hex')}`, status: 'created', mocked: true };
  }
  return client.subscriptions.create({
    plan_id: planId,
    customer_notify: customerNotify,
    total_count: totalCount,
    notes,
  });
}

module.exports = {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  refundPayment,
  createSubscription,
  isEnabled: enabled,
};
