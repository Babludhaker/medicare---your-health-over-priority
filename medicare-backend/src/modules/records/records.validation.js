'use strict';

const { z } = require('zod');

const appointmentIdParam = {
  params: z.object({ appointmentId: z.string().uuid() }),
};

/**
 * Write a per-visit clinical note + vitals.
 */
const createRecordSchema = {
  params: z.object({ appointmentId: z.string().uuid() }),
  body: z.object({
    symptoms: z.string().max(2000).optional(),
    diagnosis: z.string().max(2000).optional(),
    bloodPressure: z
      .string()
      .regex(/^\d{2,3}\/\d{2,3}$/, 'Blood pressure must look like 120/80')
      .optional(),
    pulse: z.number().int().min(20).max(250).optional(),
    temperature: z.number().min(30).max(45).optional(),
    spo2: z.number().int().min(50).max(100).optional(),
    notes: z.string().max(4000).optional(),
    documentUrls: z.array(z.string()).max(20).optional(),
  }),
};

/**
 * Create an e-prescription with structured drug lines.
 */
const createPrescriptionSchema = {
  params: z.object({ appointmentId: z.string().uuid() }),
  body: z.object({
    advice: z.string().max(2000).optional(),
    followUpDate: z.coerce.date().optional(),
    items: z
      .array(
        z.object({
          drugName: z.string().min(1).max(120),
          dosage: z.string().min(1).max(60),
          frequency: z.string().min(1).max(60),
          durationDays: z.number().int().min(1).max(365),
          instructions: z.string().max(300).optional(),
        })
      )
      .min(1, 'At least one drug line is required')
      .max(30),
  }),
};

/**
 * Request a presigned S3 upload URL for a lab report / document.
 */
const uploadUrlSchema = {
  params: z.object({ appointmentId: z.string().uuid() }),
  body: z.object({
    filename: z.string().min(1).max(200),
    contentType: z.string().min(3).max(100).optional(),
  }),
};

module.exports = {
  appointmentIdParam,
  createRecordSchema,
  createPrescriptionSchema,
  uploadUrlSchema,
};
