'use strict';

const { prisma } = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');
const {
  PAYMENT_STATUS,
  APPOINTMENT_STATUS,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPE,
} = require('../../utils/constants');
const { audit } = require('../../utils/audit');
const razorpay = require('../../services/payment.service');
const pdfService = require('../../services/pdf.service');
const storageService = require('../../services/storage.service');
const emailService = require('../../services/email.service');
const { createNotification } = require('../../services/notification.service');

/**
 * Payments — consultation fee collection via Razorpay, invoice
 * generation, and refunds.
 *
 * Flow:
 *  1. Patient holds a slot (appointments module) -> HOLD appointment.
 *  2. createOrder() -> Payment(PENDING) + Razorpay order.
 *  3. Patient pays in the Razorpay checkout widget.
 *  4. verifyAndConfirm() -> signature check -> Payment(PAID),
 *     appointment CONFIRMED, invoice PDF generated + emailed.
 *  (A webhook provides a server-to-server backstop for step 4.)
 */

/**
 * Generate the next sequential invoice number.
 */
async function nextInvoiceNo() {
  const count = await prisma.invoice.count();
  const seq = String(count + 1).padStart(6, '0');
  return `INV-${new Date().getFullYear()}-${seq}`;
}

/**
 * Create a Razorpay order for a held appointment.
 */
async function createOrder(clinicId, actor, appointmentId) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: true, payment: true },
  });
  if (!appt || appt.clinicId !== clinicId) {
    throw ApiError.notFound('Appointment not found');
  }
  if (appt.status !== APPOINTMENT_STATUS.HOLD) {
    throw ApiError.badRequest(
      'Payment can only be started for a held appointment',
      'BAD_STATE'
    );
  }
  if (appt.payment && appt.payment.status === PAYMENT_STATUS.PAID) {
    throw ApiError.conflict('This appointment is already paid', 'ALREADY_PAID');
  }

  const amount = Number(appt.doctor.consultationFee);

  // Create the Razorpay order.
  const order = await razorpay.createOrder({
    amount,
    currency: 'INR',
    receipt: `appt_${appointmentId}`,
    notes: { appointmentId, clinicId },
  });

  // Upsert the Payment row in PENDING state.
  const payment = await prisma.payment.upsert({
    where: { appointmentId },
    update: {
      amount,
      status: PAYMENT_STATUS.PENDING,
      razorpayOrderId: order.id,
    },
    create: {
      appointmentId,
      amount,
      currency: 'INR',
      status: PAYMENT_STATUS.PENDING,
      razorpayOrderId: order.id,
    },
  });

  return {
    payment,
    razorpayOrder: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || '',
    },
  };
}

/**
 * Mark a payment PAID, confirm the appointment, generate + store the
 * invoice. Shared by verifyAndConfirm() and the webhook handler.
 */
async function settlePayment(payment, razorpayPaymentId, razorpaySignature) {
  const appt = await prisma.appointment.findUnique({
    where: { id: payment.appointmentId },
    include: {
      doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      patient: { include: { user: true } },
      clinic: { select: { name: true, id: true } },
    },
  });
  if (!appt) throw ApiError.notFound('Appointment not found');

  // Idempotency: if already settled, just return.
  if (payment.status === PAYMENT_STATUS.PAID) {
    return { payment, alreadySettled: true };
  }

  const invoiceNo = await nextInvoiceNo();

  // PDF invoice.
  const pdfBuffer = await pdfService.generateInvoicePdf({
    invoiceNo,
    clinicName: appt.clinic.name,
    patientName: `${appt.patient.user.firstName} ${appt.patient.user.lastName}`,
    doctorName: `${appt.doctor.user.firstName} ${appt.doctor.user.lastName}`,
    appointmentWhen: appt.startTime.toLocaleString(),
    amount: Number(payment.amount),
    currency: payment.currency,
    issuedAt: new Date(),
  });

  // Store the PDF (S3 or mock) — failure here must not block payment.
  let pdfUrl = null;
  try {
    const stored = await storageService.uploadBuffer({
      clinicId: appt.clinic.id,
      folder: 'invoices',
      filename: `${invoiceNo}.pdf`,
      buffer: pdfBuffer,
      contentType: 'application/pdf',
    });
    pdfUrl = stored.url;
  } catch (err) {
    logger.warn({ err: err.message }, 'Invoice PDF storage failed');
  }

  // Persist payment + appointment + invoice atomically.
  const [updatedPayment] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PAYMENT_STATUS.PAID,
        razorpayPayId: razorpayPaymentId,
        razorpaySign: razorpaySignature || null,
        paidAt: new Date(),
      },
    }),
    prisma.appointment.update({
      where: { id: appt.id },
      data: { status: APPOINTMENT_STATUS.CONFIRMED, holdExpiresAt: null },
    }),
    prisma.invoice.create({
      data: { paymentId: payment.id, invoiceNo, pdfUrl },
    }),
  ]);

  await audit({
    clinicId: appt.clinic.id,
    action: AUDIT_ACTIONS.PAYMENT_CAPTURED,
    entityType: 'Payment',
    entityId: payment.id,
    metadata: { invoiceNo, amount: Number(payment.amount) },
  });

  // Notify + email the invoice.
  createNotification({
    userId: appt.patient.user.id,
    clinicId: appt.clinic.id,
    title: 'Payment received',
    body: `Your payment for the appointment on ${appt.startTime.toLocaleString()} is confirmed.`,
    type: NOTIFICATION_TYPE.PAYMENT,
  });
  emailService
    .sendInvoiceEmail(
      appt.patient.user.email,
      appt.patient.user.firstName,
      invoiceNo,
      pdfBuffer
    )
    .catch(() => {});

  return { payment: updatedPayment, invoiceNo };
}

/**
 * Verify a checkout signature and settle the payment.
 */
async function verifyAndConfirm(clinicId, input) {
  const payment = await prisma.payment.findFirst({
    where: { appointmentId: input.appointmentId, razorpayOrderId: input.razorpayOrderId },
  });
  if (!payment) throw ApiError.notFound('Payment record not found');

  const valid = razorpay.verifyPaymentSignature({
    orderId: input.razorpayOrderId,
    paymentId: input.razorpayPaymentId,
    signature: input.razorpaySignature,
  });
  if (!valid) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PAYMENT_STATUS.FAILED },
    });
    throw ApiError.badRequest('Payment signature verification failed', 'BAD_SIGNATURE');
  }

  return settlePayment(payment, input.razorpayPaymentId, input.razorpaySignature);
}

/**
 * Razorpay webhook handler — server-to-server settlement backstop.
 * `rawBody` is the unparsed request body (needed for signature check).
 */
async function handleWebhook(rawBody, signature, parsedBody) {
  const valid = razorpay.verifyWebhookSignature(rawBody, signature);
  if (!valid) {
    throw ApiError.unauthorized('Invalid webhook signature', 'BAD_WEBHOOK_SIG');
  }

  const event = parsedBody?.event;
  logger.info({ event }, 'Razorpay webhook received');

  if (event === 'payment.captured') {
    const entity = parsedBody.payload?.payment?.entity;
    if (entity?.order_id) {
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: entity.order_id },
      });
      if (payment && payment.status !== PAYMENT_STATUS.PAID) {
        await settlePayment(payment, entity.id, null);
      }
    }
  }

  return { received: true };
}

/**
 * Refund a paid payment (e.g. after an in-policy cancellation).
 */
async function refund(clinicId, actor, paymentId) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { appointment: true },
  });
  if (!payment || payment.appointment.clinicId !== clinicId) {
    throw ApiError.notFound('Payment not found');
  }
  if (payment.status !== PAYMENT_STATUS.PAID) {
    throw ApiError.badRequest('Only paid payments can be refunded', 'NOT_REFUNDABLE');
  }

  await razorpay.refundPayment(payment.razorpayPayId, Number(payment.amount));

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: PAYMENT_STATUS.REFUNDED, refundedAt: new Date() },
  });

  await audit({
    clinicId,
    userId: actor.id,
    action: AUDIT_ACTIONS.PAYMENT_REFUNDED,
    entityType: 'Payment',
    entityId: paymentId,
    metadata: { amount: Number(payment.amount) },
  });

  return updated;
}

/**
 * Fetch one payment with its invoice.
 */
async function getPayment(clinicId, paymentId) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { invoice: true, appointment: { select: { clinicId: true } } },
  });
  if (!payment || payment.appointment.clinicId !== clinicId) {
    throw ApiError.notFound('Payment not found');
  }
  return payment;
}

module.exports = {
  createOrder,
  verifyAndConfirm,
  handleWebhook,
  refund,
  getPayment,
};
