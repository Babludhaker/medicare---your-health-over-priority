'use strict';

const { prisma } = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { APPOINTMENT_STATUS } = require('../../utils/constants');
const {
  startOfDay,
  endOfDay,
  combineDateAndTime,
  timeToMinutes,
  minutesToTime,
  addMinutes,
  dayOfWeek,
} = require('../../utils/datetime');

/**
 * Doctor profiles, availability templates, blocked dates, and the
 * slot-generation engine that powers booking.
 */

/**
 * Ensure a doctor profile exists and belongs to the given clinic.
 */
async function getDoctorOrThrow(clinicId, doctorId) {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorId },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, isActive: true } },
      department: { select: { id: true, name: true } },
    },
  });
  if (!doctor || doctor.clinicId !== clinicId) {
    throw ApiError.notFound('Doctor not found in this clinic');
  }
  return doctor;
}

/**
 * Paginated, filterable doctor directory for a clinic.
 */
async function listDoctors(clinicId, query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

  const where = { clinicId };
  if (query.departmentId) where.departmentId = query.departmentId;
  if (query.specialization) {
    where.specialization = { contains: query.specialization, mode: 'insensitive' };
  }
  if (query.search) {
    where.user = {
      OR: [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ],
    };
  }

  const [items, total] = await Promise.all([
    prisma.doctorProfile.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'asc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    }),
    prisma.doctorProfile.count({ where }),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

/**
 * Single doctor with availability + upcoming blocked dates.
 */
async function getDoctor(clinicId, doctorId) {
  const doctor = await getDoctorOrThrow(clinicId, doctorId);
  const [availabilities, blockedDates] = await Promise.all([
    prisma.availability.findMany({
      where: { doctorId, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.blockedDate.findMany({
      where: { doctorId, date: { gte: startOfDay(new Date()) } },
      orderBy: { date: 'asc' },
    }),
  ]);
  return { ...doctor, availabilities, blockedDates };
}

/**
 * Update a doctor profile.
 */
async function updateDoctor(clinicId, doctorId, data) {
  await getDoctorOrThrow(clinicId, doctorId);

  if (data.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });
    if (!dept || dept.clinicId !== clinicId) {
      throw ApiError.badRequest('Invalid department', 'BAD_DEPARTMENT');
    }
  }

  return prisma.doctorProfile.update({ where: { id: doctorId }, data });
}

/**
 * Replace the doctor's whole weekly availability template.
 * Overlapping windows on the same day are rejected.
 */
async function setAvailability(clinicId, doctorId, slots) {
  await getDoctorOrThrow(clinicId, doctorId);

  // Reject overlaps within the same day.
  const byDay = {};
  for (const s of slots) {
    (byDay[s.dayOfWeek] = byDay[s.dayOfWeek] || []).push(s);
  }
  for (const day of Object.keys(byDay)) {
    const ranges = byDay[day]
      .map((s) => ({ start: timeToMinutes(s.startTime), end: timeToMinutes(s.endTime) }))
      .sort((a, b) => a.start - b.start);
    for (let i = 1; i < ranges.length; i += 1) {
      if (ranges[i].start < ranges[i - 1].end) {
        throw ApiError.badRequest(
          `Overlapping availability on day ${day}`,
          'AVAILABILITY_OVERLAP'
        );
      }
    }
  }

  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { doctorId } }),
    prisma.availability.createMany({
      data: slots.map((s) => ({
        doctorId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        slotMinutes: s.slotMinutes,
      })),
    }),
  ]);

  return prisma.availability.findMany({
    where: { doctorId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

/**
 * Add a blocked date (leave / day off).
 */
async function addBlockedDate(clinicId, doctorId, date, reason) {
  await getDoctorOrThrow(clinicId, doctorId);
  return prisma.blockedDate.create({
    data: { doctorId, date: startOfDay(date), reason: reason || null },
  });
}

/**
 * Remove a blocked date.
 */
async function removeBlockedDate(clinicId, doctorId, blockedDateId) {
  await getDoctorOrThrow(clinicId, doctorId);
  const blocked = await prisma.blockedDate.findUnique({ where: { id: blockedDateId } });
  if (!blocked || blocked.doctorId !== doctorId) {
    throw ApiError.notFound('Blocked date not found');
  }
  await prisma.blockedDate.delete({ where: { id: blockedDateId } });
  return { removed: true };
}

/**
 * ============================================================
 * SLOT GENERATION ENGINE
 * ============================================================
 *
 * For a given doctor and date, produce the bookable slots:
 *   slots = availability template for that weekday,
 *           sliced into slotMinutes-long windows,
 *           minus blocked dates,
 *           minus slots already taken by a live appointment
 *           (HOLD / CONFIRMED / COMPLETED),
 *           minus any slot whose start time is already in the past.
 *
 * Each returned slot: { startTime, endTime, available }.
 */
async function getAvailableSlots(clinicId, doctorId, date) {
  await getDoctorOrThrow(clinicId, doctorId);

  const targetDay = dayOfWeek(date);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // 1. Is the whole day blocked?
  const blocked = await prisma.blockedDate.findFirst({
    where: { doctorId, date: dayStart },
  });
  if (blocked) {
    return { date: dayStart, slots: [], blocked: true, reason: blocked.reason };
  }

  // 2. Availability windows for this weekday.
  const windows = await prisma.availability.findMany({
    where: { doctorId, dayOfWeek: targetDay, isActive: true },
    orderBy: { startTime: 'asc' },
  });
  if (windows.length === 0) {
    return { date: dayStart, slots: [], blocked: false };
  }

  // 3. Appointments that occupy a slot on this date.
  const taken = await prisma.appointment.findMany({
    where: {
      doctorId,
      startTime: { gte: dayStart, lte: dayEnd },
      status: {
        in: [
          APPOINTMENT_STATUS.HOLD,
          APPOINTMENT_STATUS.CONFIRMED,
          APPOINTMENT_STATUS.COMPLETED,
        ],
      },
    },
    select: { startTime: true },
  });
  const takenSet = new Set(taken.map((a) => a.startTime.getTime()));

  // 4. Slice each window into slots.
  const now = new Date();
  const slots = [];

  for (const w of windows) {
    let cursor = timeToMinutes(w.startTime);
    const endMin = timeToMinutes(w.endTime);

    while (cursor + w.slotMinutes <= endMin) {
      const slotStart = combineDateAndTime(date, minutesToTime(cursor));
      const slotEnd = addMinutes(slotStart, w.slotMinutes);
      const isPast = slotStart <= now;
      const isTaken = takenSet.has(slotStart.getTime());

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available: !isPast && !isTaken,
      });
      cursor += w.slotMinutes;
    }
  }

  return { date: dayStart, blocked: false, slots };
}

module.exports = {
  getDoctorOrThrow,
  listDoctors,
  getDoctor,
  updateDoctor,
  setAvailability,
  addBlockedDate,
  removeBlockedDate,
  getAvailableSlots,
};
