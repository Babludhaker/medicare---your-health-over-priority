'use strict';

const { z } = require('zod');
const { APPOINTMENT_STATUS } = require('../../utils/constants');

/**
 * Hold a slot. The patient/receptionist picks a doctor + exact start
 * time (which must match a generated slot).
 */
const holdSchema = {
  body: z.object({
    doctorId: z.string().uuid(),
    // Patient is optional: a receptionist supplies it; a patient
    // booking for themselves omits it (server uses their own profile).
    patientId: z.string().uuid().optional(),
    startTime: z.coerce.date(),
    reason: z.string().max(300).optional(),
  }),
};

const appointmentIdParam = {
  params: z.object({ appointmentId: z.string().uuid() }),
};

/**
 * Confirm a held appointment (after payment, or directly for a
 * receptionist-managed walk-in).
 */
const confirmSchema = {
  params: z.object({ appointmentId: z.string().uuid() }),
  body: z.object({
    // Optional — present when confirmation follows an online payment.
    paymentId: z.string().uuid().optional(),
  }),
};

const rescheduleSchema = {
  params: z.object({ appointmentId: z.string().uuid() }),
  body: z.object({
    startTime: z.coerce.date(),
  }),
};

const cancelSchema = {
  params: z.object({ appointmentId: z.string().uuid() }),
  body: z.object({
    reason: z.string().max(300).optional(),
  }),
};

const completeSchema = {
  params: z.object({ appointmentId: z.string().uuid() }),
};

const listAppointmentsSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.nativeEnum(APPOINTMENT_STATUS).optional(),
    doctorId: z.string().uuid().optional(),
    patientId: z.string().uuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
};

/**
 * Walk-in / queue token: a receptionist registers a same-day patient
 * directly into a CONFIRMED appointment for the next free slot.
 */
const walkInSchema = {
  body: z.object({
    doctorId: z.string().uuid(),
    patientId: z.string().uuid(),
    startTime: z.coerce.date(),
    reason: z.string().max(300).optional(),
  }),
};

module.exports = {
  holdSchema,
  appointmentIdParam,
  confirmSchema,
  rescheduleSchema,
  cancelSchema,
  completeSchema,
  listAppointmentsSchema,
  walkInSchema,
};
