'use strict';

const { z } = require('zod');

/**
 * Create a Razorpay order for a held appointment's consultation fee.
 */
const createOrderSchema = {
  body: z.object({
    appointmentId: z.string().uuid(),
  }),
};

/**
 * Verify a checkout result returned by the Razorpay frontend SDK and
 * confirm the appointment.
 */
const verifyPaymentSchema = {
  body: z.object({
    appointmentId: z.string().uuid(),
    razorpayOrderId: z.string().min(3),
    razorpayPaymentId: z.string().min(3),
    razorpaySignature: z.string().min(3),
  }),
};

const refundSchema = {
  params: z.object({ paymentId: z.string().uuid() }),
  body: z.object({
    reason: z.string().max(300).optional(),
  }),
};

const paymentIdParam = {
  params: z.object({ paymentId: z.string().uuid() }),
};

module.exports = {
  createOrderSchema,
  verifyPaymentSchema,
  refundSchema,
  paymentIdParam,
};
