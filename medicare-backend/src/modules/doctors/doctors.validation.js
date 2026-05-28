'use strict';

const { z } = require('zod');

const timeStr = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm (24-hour)');

const doctorIdParam = {
  params: z.object({ doctorId: z.string().uuid() }),
};

const updateDoctorSchema = {
  params: z.object({ doctorId: z.string().uuid() }),
  body: z
    .object({
      specialization: z.string().min(2).max(120).optional(),
      qualification: z.string().max(120).optional(),
      experienceYears: z.number().int().min(0).max(70).optional(),
      consultationFee: z.number().min(0).optional(),
      bio: z.string().max(1000).optional(),
      isAcceptingNew: z.boolean().optional(),
      departmentId: z.string().uuid().nullable().optional(),
    })
    .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' }),
};

const listDoctorsSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    departmentId: z.string().uuid().optional(),
    specialization: z.string().max(120).optional(),
    search: z.string().max(80).optional(),
  }),
};

/**
 * Set the doctor's entire weekly availability template. Sending the
 * full set keeps the editor simple — the service replaces all rows.
 */
const setAvailabilitySchema = {
  params: z.object({ doctorId: z.string().uuid() }),
  body: z.object({
    slots: z
      .array(
        z
          .object({
            dayOfWeek: z.number().int().min(0).max(6),
            startTime: timeStr,
            endTime: timeStr,
            slotMinutes: z.number().int().min(5).max(240).default(30),
          })
          .refine((s) => s.startTime < s.endTime, {
            message: 'startTime must be before endTime',
            path: ['endTime'],
          })
      )
      .max(50),
  }),
};

const blockDateSchema = {
  params: z.object({ doctorId: z.string().uuid() }),
  body: z.object({
    date: z.coerce.date(),
    reason: z.string().max(200).optional(),
  }),
};

const blockedDateIdParam = {
  params: z.object({
    doctorId: z.string().uuid(),
    blockedDateId: z.string().uuid(),
  }),
};

const slotsQuerySchema = {
  params: z.object({ doctorId: z.string().uuid() }),
  query: z.object({
    date: z.coerce.date(),
  }),
};

module.exports = {
  doctorIdParam,
  updateDoctorSchema,
  listDoctorsSchema,
  setAvailabilitySchema,
  blockDateSchema,
  blockedDateIdParam,
  slotsQuerySchema,
};
