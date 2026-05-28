'use strict';

const { z } = require('zod');
const { ROLE_LIST } = require('../../utils/constants');

/**
 * Validation schemas for the auth module.
 */

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long');

const registerSchema = {
  body: z
    .object({
      email: z.string().email(),
      password,
      firstName: z.string().min(1).max(60),
      lastName: z.string().min(1).max(60),
      phone: z.string().min(6).max(20).optional(),
      // Self-service registration is PATIENT-only; a clinicId attaches
      // the patient to a tenant. Staff are created by a clinic admin.
      role: z.enum(ROLE_LIST).optional().default('PATIENT'),
      clinicId: z.string().uuid().optional(),
    })
    .refine((d) => d.role === 'PATIENT' || d.role === undefined, {
      message: 'Only patients may self-register',
      path: ['role'],
    }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
  }),
};

const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(10),
  }),
};

const verifyEmailSchema = {
  body: z.object({
    token: z.string().min(10),
  }),
};

const verifyOtpSchema = {
  body: z.object({
    userId: z.string().uuid(),
    otp: z.string().length(6),
  }),
};

const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email(),
  }),
};

const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(10),
    password,
  }),
};

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyEmailSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
