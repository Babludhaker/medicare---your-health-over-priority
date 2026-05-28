"use strict";

const { z } = require("zod");

// const slug = z
//   .string()
//   .min(3)
//   .max(40)
//   .regex(/^[a-z0-9-]+$/, 'Slug may contain lowercase letters, numbers and hyphens only');

// BAAD MEIN
const createClinicSchema = {
  body: z.object({
    name: z.string().min(2).max(120),
    // slug removed — auto-generated from name in the service
    email: z.string().email(),
    phone: z.string().min(6).max(20).optional(),
    address: z.string().max(255).optional(),
    timezone: z.string().max(60).optional(),
    adminEmail: z.string().email(),
    adminPassword: z.string().min(8).max(72),
    adminFirstName: z.string().min(1).max(60),
    adminLastName: z.string().min(1).max(60),
    planTier: z.enum(["BASIC", "PRO", "ENTERPRISE"]).optional(),
  }),
};

const updateClinicSchema = {
  params: z.object({ clinicId: z.string().uuid() }),
  body: z
    .object({
      name: z.string().min(2).max(120).optional(),
      email: z.string().email().optional(),
      phone: z.string().min(6).max(20).optional(),
      address: z.string().max(255).optional(),
      timezone: z.string().max(60).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((d) => Object.keys(d).length > 0, {
      message: "No fields to update",
    }),
};

const clinicIdParam = {
  params: z.object({ clinicId: z.string().uuid() }),
};

const listClinicsSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().max(80).optional(),
    isActive: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
  }),
};

module.exports = {
  createClinicSchema,
  updateClinicSchema,
  clinicIdParam,
  listClinicsSchema,
};
