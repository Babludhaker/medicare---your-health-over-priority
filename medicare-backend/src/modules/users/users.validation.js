'use strict';

const { z } = require('zod');

/**
 * Staff a clinic admin may create: DOCTOR, RECEPTIONIST, CLINIC_ADMIN.
 * PATIENT and SUPER_ADMIN are intentionally excluded.
 */
const staffRole = z.enum(['CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST']);

const createStaffSchema = {
  body: z
    .object({
      email: z.string().email(),
      password: z.string().min(8).max(72),
      firstName: z.string().min(1).max(60),
      lastName: z.string().min(1).max(60),
      phone: z.string().min(6).max(20).optional(),
      role: staffRole,
      // Required when role === DOCTOR.
      doctorProfile: z
        .object({
          specialization: z.string().min(2).max(120),
          qualification: z.string().max(120).optional(),
          experienceYears: z.number().int().min(0).max(70).optional(),
          consultationFee: z.number().min(0),
          bio: z.string().max(1000).optional(),
          departmentId: z.string().uuid().optional(),
        })
        .optional(),
    })
    .refine((d) => d.role !== 'DOCTOR' || d.doctorProfile, {
      message: 'doctorProfile is required when role is DOCTOR',
      path: ['doctorProfile'],
    }),
};

const updateStaffSchema = {
  params: z.object({ userId: z.string().uuid() }),
  body: z
    .object({
      firstName: z.string().min(1).max(60).optional(),
      lastName: z.string().min(1).max(60).optional(),
      phone: z.string().min(6).max(20).optional(),
      isActive: z.boolean().optional(),
      twoFactorOn: z.boolean().optional(),
    })
    .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' }),
};

const userIdParam = {
  params: z.object({ userId: z.string().uuid() }),
};

const listStaffSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    role: z.enum(['CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']).optional(),
    search: z.string().max(80).optional(),
  }),
};

module.exports = {
  createStaffSchema,
  updateStaffSchema,
  userIdParam,
  listStaffSchema,
};
