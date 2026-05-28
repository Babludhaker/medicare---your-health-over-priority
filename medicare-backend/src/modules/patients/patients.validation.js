'use strict';

const { z } = require('zod');

const patientIdParam = {
  params: z.object({ patientId: z.string().uuid() }),
};

/**
 * Receptionist registers a new patient (creates a User + PatientProfile).
 */
const registerPatientSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    firstName: z.string().min(1).max(60),
    lastName: z.string().min(1).max(60),
    phone: z.string().min(6).max(20).optional(),
    dateOfBirth: z.coerce.date().optional(),
    gender: z.string().max(20).optional(),
    bloodGroup: z.string().max(5).optional(),
    allergies: z.string().max(500).optional(),
    chronicNotes: z.string().max(1000).optional(),
  }),
};

const updatePatientSchema = {
  params: z.object({ patientId: z.string().uuid() }),
  body: z
    .object({
      dateOfBirth: z.coerce.date().optional(),
      gender: z.string().max(20).optional(),
      bloodGroup: z.string().max(5).optional(),
      allergies: z.string().max(500).optional(),
      chronicNotes: z.string().max(1000).optional(),
    })
    .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' }),
};

const listPatientsSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().max(80).optional(),
  }),
};

module.exports = {
  patientIdParam,
  registerPatientSchema,
  updatePatientSchema,
  listPatientsSchema,
};
