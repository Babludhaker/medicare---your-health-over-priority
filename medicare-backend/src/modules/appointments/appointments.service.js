'use strict';

const { Prisma } = require('@prisma/client');
const { prisma } = require('../../config/prisma');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const { APPOINTMENT_STATUS, AUDIT_ACTIONS, NOTIFICATION_TYPE, ROLES } = require('../../utils/constants');
const { audit } = require('../../utils/audit');
const { addMinutes, startOfDay, endOfDay, dayOfWeek } = require('../../utils/datetime');
const { createNotification } = require('../../services/notification.service');
const emailService = require('../../services/email.service');

/**
 * ============================================================
 * APPOINTMENT SCHEDULING ENGINE
 * ============================================================
 *
 * The hard problem this module solves is concurrency: two patients
 * must never end up booked with the same doctor at the same time.
 *
 * Defence in depth:
 *  1. A database UNIQUE constraint on (doctorId, startTime) — the
 *     ultimate guarantee. Even with perfectly concurrent requests the
 *     DB rejects the second insert (Prisma error P2002).
 *  2. A Serializable transaction around hold/confirm/reschedule so
 *     the read-then-write is isolated.
 *  3. A HOLD status + holdExpiresAt: a slot is locked for
 *     SLOT_HOLD_MINUTES while the patient pays; a cron job releases
 *     expired holds.
 *
 * Statuses that "occupy" a slot: HOLD, CONFIRMED, COMPLETED.
 * CANCELLED and NO_SHOW free the slot for rebooking.
 */

const LIVE_STATUSES = [
  APPOINTMENT_STATUS.HOLD,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.COMPLETED,
];

/**
 * Resolve which patient profile an appointment is for.
 * - A PATIENT books only for themselves.
 * - Staff (receptionist) must pass an explicit patientId.
 */
async function resolvePatientId(clinicId, actor, suppliedPatientId) {
  if (actor.role === ROLES.PATIENT) {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: actor.id },
    });
    if (!profile) throw ApiError.badRequest('No patient profile found', 'NO_PROFILE');
    return profile.id;
  }
  if (!suppliedPatientId) {
    throw ApiError.badRequest('patientId is required', 'PATIENT_REQUIRED');
  }
  const profile = await prisma.patientProfile.findUnique({
    where: { id: suppliedPatientId },
  });
  if (!profile || profile.clinicId !== clinicId) {
    throw ApiError.notFound('Patient not found in this clinic');
  }
  return profile.id;
}

/**
 * Validate that `startTime` is a real bookable slot for the doctor:
 * it lands on an availability window, is not on a blocked date, and
 * is in the future. Returns the matching availability window so the
 * slot's endTime can be derived.
 */
async function validateSlot(doctorId, startTime, tx = prisma) {
  if (startTime <= new Date()) {
    throw ApiError.badRequest('Cannot book a slot in the past', 'SLOT_PAST');
  }

  // Blocked date?
  const blocked = await tx.blockedDate.findFirst({
    where: { doctorId, date: startOfDay(startTime) },
  });
  if (blocked) {
    throw ApiError.badRequest('Doctor is unavailable on this date', 'DATE_BLOCKED');
  }

  // Availability window covering this start time?
  const windows = await tx.availability.findMany({
    where: { doctorId, dayOfWeek: dayOfWeek(startTime), isActive: true },
  });

  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();

  for (const w of windows) {
    const [sh, sm] = w.startTime.split(':').map(Number);
    const [eh, em] = w.endTime.split(':').map(Number);
    const winStart = sh * 60 + sm;
    const winEnd = eh * 60 + em;

    // Must align to the slot grid and fit fully inside the window.
    if (
      startMinutes >= winStart &&
      startMinutes + w.slotMinutes <= winEnd &&
      (startMinutes - winStart) % w.slotMinutes === 0
    ) {
      return { slotMinutes: w.slotMinutes };
    }
  }

  throw ApiError.badRequest(
    'Selected time is not a valid slot for this doctor',
    'INVALID_SLOT'
  );
}

/**
 * HOLD a slot.
 *
 * Creates an appointment in HOLD status with a holdExpiresAt timestamp.
 * The (doctorId, startTime) unique constraint guarantees no two holds
 * collide; a P2002 is surfaced as a friendly SLOT_TAKEN error.
 */
async function holdSlot(clinicId, actor, input) {
  const patientId = await resolvePatientId(clinicId, actor, input.patientId);

  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: input.doctorId },
  });
  if (!doctor || doctor.clinicId !== clinicId) {
    throw ApiError.notFound('Doctor not found in this clinic');
  }
  if (!doctor.isAcceptingNew) {
    throw ApiError.badRequest('Doctor is not accepting new appointments', 'DOCTOR_CLOSED');
  }

  const startTime = new Date(input.startTime);

  try {
    const appointment = await prisma.$transaction(
      async (tx) => {
        const { slotMinutes } = await validateSlot(input.doctorId, startTime, tx);

        // If a CANCELLED/NO_SHOW row already occupies this exact
        // (doctorId, startTime), the unique constraint would still
        // block a fresh insert — so revive that row instead.
        const stale = await tx.appointment.findUnique({
          where: { doctorId_startTime: { doctorId: input.doctorId, startTime } },
        });

        const data = {
          clinicId,
          doctorId: input.doctorId,
          patientId,
          startTime,
          endTime: addMinutes(startTime, slotMinutes),
          status: APPOINTMENT_STATUS.HOLD,
          holdExpiresAt: addMinutes(new Date(), env.SLOT_HOLD_MINUTES),
          reason: input.reason || null,
          createdById: actor.id,
        };

        if (stale) {
          if (LIVE_STATUSES.includes(stale.status)) {
            throw ApiError.conflict('This slot was just booked.', 'SLOT_TAKEN');
          }
          return tx.appointment.update({ where: { id: stale.id }, data });
        }
        return tx.appointment.create({ data });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    await audit({
      clinicId,
      userId: actor.id,
      action: AUDIT_ACTIONS.APPOINTMENT_HELD,
      entityType: 'Appointment',
      entityId: appointment.id,
    });

    return appointment;
  } catch (err) {
    // Unique-constraint collision == someone won the race.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw ApiError.conflict('This slot was just booked.', 'SLOT_TAKEN');
    }
    throw err;
  }
}

/**
 * CONFIRM a held appointment.
 *
 * Normally called after a successful payment. Validates the hold has
 * not expired, then flips status HOLD -> CONFIRMED.
 */
async function confirmAppointment(clinicId, actor, appointmentId) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
      clinic: { select: { name: true } },
    },
  });
  if (!appt || appt.clinicId !== clinicId) {
    throw ApiError.notFound('Appointment not found');
  }
  if (appt.status === APPOINTMENT_STATUS.CONFIRMED) {
    return appt; // idempotent
  }
  if (appt.status !== APPOINTMENT_STATUS.HOLD) {
    throw ApiError.badRequest(
      `Cannot confirm an appointment in status ${appt.status}`,
      'BAD_STATE'
    );
  }
  if (appt.holdExpiresAt && appt.holdExpiresAt < new Date()) {
    throw ApiError.badRequest('The slot hold has expired', 'HOLD_EXPIRED');
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: APPOINTMENT_STATUS.CONFIRMED, holdExpiresAt: null },
  });

  await audit({
    clinicId,
    userId: actor.id,
    action: AUDIT_ACTIONS.APPOINTMENT_CONFIRMED,
    entityType: 'Appointment',
    entityId: appointmentId,
  });

  // Notify the patient (in-app + email).
  const doctorName = `${appt.doctor.user.firstName} ${appt.doctor.user.lastName}`;
  const when = appt.startTime.toLocaleString();
  createNotification({
    userId: appt.patient.user.id,
    clinicId,
    title: 'Appointment confirmed',
    body: `Your appointment with Dr. ${doctorName} on ${when} is confirmed.`,
    type: NOTIFICATION_TYPE.APPOINTMENT,
  });
  emailService
    .sendBookingConfirmation(appt.patient.user.email, appt.patient.user.firstName, {
      doctorName,
      when,
      clinicName: appt.clinic.name,
    })
    .catch(() => {});

  return updated;
}

/**
 * RESCHEDULE to a new slot.
 *
 * Moves the appointment to a new (validated, free) start time. The
 * unique constraint protects the target slot just as in holdSlot.
 */
async function rescheduleAppointment(clinicId, actor, appointmentId, newStartTime) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt || appt.clinicId !== clinicId) {
    throw ApiError.notFound('Appointment not found');
  }
  if (![APPOINTMENT_STATUS.HOLD, APPOINTMENT_STATUS.CONFIRMED].includes(appt.status)) {
    throw ApiError.badRequest(
      `Cannot reschedule an appointment in status ${appt.status}`,
      'BAD_STATE'
    );
  }

  const startTime = new Date(newStartTime);

  try {
    const updated = await prisma.$transaction(
      async (tx) => {
        const { slotMinutes } = await validateSlot(appt.doctorId, startTime, tx);

        // Target slot must be free.
        const occupant = await tx.appointment.findUnique({
          where: {
            doctorId_startTime: { doctorId: appt.doctorId, startTime },
          },
        });
        if (occupant && occupant.id !== appt.id) {
          if (LIVE_STATUSES.includes(occupant.status)) {
            throw ApiError.conflict('Target slot is already booked.', 'SLOT_TAKEN');
          }
          // A stale CANCELLED row sits on the slot — clear it so the
          // unique constraint does not block the move.
          await tx.appointment.delete({ where: { id: occupant.id } });
        }

        return tx.appointment.update({
          where: { id: appt.id },
          data: { startTime, endTime: addMinutes(startTime, slotMinutes) },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    await audit({
      clinicId,
      userId: actor.id,
      action: AUDIT_ACTIONS.APPOINTMENT_RESCHEDULED,
      entityType: 'Appointment',
      entityId: appointmentId,
      metadata: { from: appt.startTime, to: startTime },
    });

    return updated;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw ApiError.conflict('Target slot is already booked.', 'SLOT_TAKEN');
    }
    throw err;
  }
}

/**
 * CANCEL an appointment.
 *
 * Applies a configurable cancellation policy (placeholder window of
 * 24h) and flags whether the cancellation falls inside the fee window.
 * The actual refund is handled by the payments module.
 */
async function cancelAppointment(clinicId, actor, appointmentId, reason) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
    },
  });
  if (!appt || appt.clinicId !== clinicId) {
    throw ApiError.notFound('Appointment not found');
  }
  if (![APPOINTMENT_STATUS.HOLD, APPOINTMENT_STATUS.CONFIRMED].includes(appt.status)) {
    throw ApiError.badRequest(
      `Cannot cancel an appointment in status ${appt.status}`,
      'BAD_STATE'
    );
  }

  const CANCELLATION_WINDOW_HOURS = 24;
  const hoursUntil = (appt.startTime - new Date()) / 36e5;
  const lateCancellation = hoursUntil < CANCELLATION_WINDOW_HOURS;

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: APPOINTMENT_STATUS.CANCELLED,
      holdExpiresAt: null,
      reason: reason || appt.reason,
    },
  });

  await audit({
    clinicId,
    userId: actor.id,
    action: AUDIT_ACTIONS.APPOINTMENT_CANCELLED,
    entityType: 'Appointment',
    entityId: appointmentId,
    metadata: { lateCancellation, hoursUntil: Math.round(hoursUntil) },
  });

  // Notify the patient.
  const doctorName = `${appt.doctor.user.firstName} ${appt.doctor.user.lastName}`;
  createNotification({
    userId: appt.patient.user.id,
    clinicId,
    title: 'Appointment cancelled',
    body: `Your appointment with Dr. ${doctorName} on ${appt.startTime.toLocaleString()} was cancelled.`,
    type: NOTIFICATION_TYPE.APPOINTMENT,
  });
  emailService
    .sendCancellationEmail(appt.patient.user.email, appt.patient.user.firstName, {
      when: appt.startTime.toLocaleString(),
      refundNote: lateCancellation
        ? 'A cancellation fee may apply as this is a late cancellation.'
        : 'Any payment made will be refunded as per policy.',
    })
    .catch(() => {});

  return { appointment: updated, lateCancellation };
}

/**
 * Mark a CONFIRMED appointment as COMPLETED (after the consultation).
 */
async function completeAppointment(clinicId, actor, appointmentId) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt || appt.clinicId !== clinicId) {
    throw ApiError.notFound('Appointment not found');
  }
  if (appt.status !== APPOINTMENT_STATUS.CONFIRMED) {
    throw ApiError.badRequest(
      `Only CONFIRMED appointments can be completed (current: ${appt.status})`,
      'BAD_STATE'
    );
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: APPOINTMENT_STATUS.COMPLETED },
  });

  await audit({
    clinicId,
    userId: actor.id,
    action: AUDIT_ACTIONS.APPOINTMENT_COMPLETED,
    entityType: 'Appointment',
    entityId: appointmentId,
  });

  return updated;
}

/**
 * Mark a CONFIRMED appointment as NO_SHOW.
 */
async function markNoShow(clinicId, actor, appointmentId) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt || appt.clinicId !== clinicId) {
    throw ApiError.notFound('Appointment not found');
  }
  if (appt.status !== APPOINTMENT_STATUS.CONFIRMED) {
    throw ApiError.badRequest('Only CONFIRMED appointments can be no-show', 'BAD_STATE');
  }
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: APPOINTMENT_STATUS.NO_SHOW },
  });
}

/**
 * Walk-in: receptionist books + confirms a same-day appointment in one
 * step (no online payment / hold step).
 */
async function createWalkIn(clinicId, actor, input) {
  const held = await holdSlot(clinicId, actor, {
    doctorId: input.doctorId,
    patientId: input.patientId,
    startTime: input.startTime,
    reason: input.reason,
  });
  return confirmAppointment(clinicId, actor, held.id);
}

/**
 * Paginated, filterable appointment list — auto tenant-scoped.
 * A PATIENT only sees their own appointments.
 */
async function listAppointments(clinicId, actor, query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

  const where = { clinicId };
  if (query.status) where.status = query.status;
  if (query.doctorId) where.doctorId = query.doctorId;
  if (query.from || query.to) {
    where.startTime = {};
    if (query.from) where.startTime.gte = startOfDay(query.from);
    if (query.to) where.startTime.lte = endOfDay(query.to);
  }

  // Patients are restricted to their own record.
  if (actor.role === ROLES.PATIENT) {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: actor.id },
    });
    where.patientId = profile?.id || '__none__';
  } else if (query.patientId) {
    where.patientId = query.patientId;
  }

  // A doctor sees their own schedule by default.
  if (actor.role === ROLES.DOCTOR && !query.doctorId) {
    const docProfile = await prisma.doctorProfile.findUnique({
      where: { userId: actor.id },
    });
    where.doctorId = docProfile?.id || '__none__';
  }

  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { startTime: 'asc' },
      include: {
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        payment: { select: { status: true, amount: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

/**
 * Fetch a single appointment with full detail, enforcing access:
 * patients and doctors only see appointments they are party to.
 */
async function getAppointment(clinicId, actor, appointmentId) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      patient: { include: { user: { select: { firstName: true, lastName: true } } } },
      payment: true,
      medicalRecord: true,
      prescription: { include: { items: true } },
    },
  });
  if (!appt || appt.clinicId !== clinicId) {
    throw ApiError.notFound('Appointment not found');
  }

  if (actor.role === ROLES.PATIENT) {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: actor.id },
    });
    if (!profile || appt.patientId !== profile.id) {
      throw ApiError.forbidden('You can only view your own appointments', 'NOT_YOURS');
    }
  }
  if (actor.role === ROLES.DOCTOR) {
    const docProfile = await prisma.doctorProfile.findUnique({
      where: { userId: actor.id },
    });
    if (!docProfile || appt.doctorId !== docProfile.id) {
      throw ApiError.forbidden('You can only view your own appointments', 'NOT_YOURS');
    }
  }

  return appt;
}

module.exports = {
  holdSlot,
  confirmAppointment,
  rescheduleAppointment,
  cancelAppointment,
  completeAppointment,
  markNoShow,
  createWalkIn,
  listAppointments,
  getAppointment,
};
