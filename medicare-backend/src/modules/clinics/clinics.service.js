"use strict";

const { prisma } = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");
const { hashPassword } = require("../../utils/password");
const {
  ROLES,
  AUDIT_ACTIONS,
  SUBSCRIPTION_STATUS,
} = require("../../utils/constants");
const { audit } = require("../../utils/audit");
const { addDays } = require("../../utils/datetime");

/**
 * Clinic (tenant) management — operated by the SUPER_ADMIN.
 */

/**
 * Create a new clinic tenant together with its first CLINIC_ADMIN and,
 * optionally, a trialing subscription. Done in one transaction so a
 * half-created tenant can never exist.
 */
async function createClinic(input, actor) {
  // ✅ Slug auto-generate karo name se
  const baseSlug = input.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Agar slug taken ho toh suffix lagao
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.clinic.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const adminTaken = await prisma.user.findUnique({
    where: { email: input.adminEmail },
  });

  // input.slug = slug; // ← ab slug auto hai
  // const [slugTaken, adminTaken] = await Promise.all([
  //   prisma.clinic.findUnique({ where: { slug: input.slug } }),
  //   prisma.user.findUnique({ where: { email: input.adminEmail } }),
  // ]);
  // if (slugTaken)
  //   throw ApiError.conflict("Clinic slug already in use", "SLUG_TAKEN");
  if (adminTaken)
    throw ApiError.conflict("Admin email already in use", "EMAIL_TAKEN");

  let plan = null;
  if (input.planTier) {
    plan = await prisma.subscriptionPlan.findUnique({
      where: { tier: input.planTier },
    });
    if (!plan) throw ApiError.badRequest("Unknown plan tier", "BAD_PLAN");
  }

  const adminHash = await hashPassword(input.adminPassword);

  const clinic = await prisma.$transaction(async (tx) => {
    const createdClinic = await tx.clinic.create({
      data: {
        name: input.name,
        slug,
        email: input.email,
        phone: input.phone || null,
        address: input.address || null,
        timezone: input.timezone || "Asia/Kolkata",
      },
    });

    await tx.user.create({
      data: {
        email: input.adminEmail,
        passwordHash: adminHash,
        firstName: input.adminFirstName,
        lastName: input.adminLastName,
        role: ROLES.CLINIC_ADMIN,
        clinicId: createdClinic.id,
        isVerified: true,
      },
    });

    if (plan) {
      await tx.clinicSubscription.create({
        data: {
          clinicId: createdClinic.id,
          planId: plan.id,
          status: SUBSCRIPTION_STATUS.TRIALING,
          currentPeriodEnd: addDays(new Date(), 14),
        },
      });
    }

    return createdClinic;
  });

  await audit({
    userId: actor.id,
    clinicId: clinic.id,
    action: AUDIT_ACTIONS.CLINIC_CREATED,
    entityType: "Clinic",
    entityId: clinic.id,
    metadata: { name: clinic.name },
  });

  return clinic;
}

/**
 * Paginated list of all clinics with their subscription summary.
 */
async function listClinics(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

  const where = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { slug: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.isActive !== undefined) where.isActive = query.isActive;

  const [items, total] = await Promise.all([
    prisma.clinic.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        subscription: {
          include: { plan: { select: { name: true, tier: true } } },
        },
        _count: { select: { users: true, appointments: true } },
      },
    }),
    prisma.clinic.count({ where }),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

/**
 * Fetch a single clinic with detail.
 */
async function getClinic(clinicId) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      subscription: { include: { plan: true } },
      _count: {
        select: {
          users: true,
          doctors: true,
          patients: true,
          appointments: true,
        },
      },
    },
  });
  if (!clinic) throw ApiError.notFound("Clinic not found");
  return clinic;
}

/**
 * Update clinic details.
 */
async function updateClinic(clinicId, data, actor) {
  const exists = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!exists) throw ApiError.notFound("Clinic not found");

  const clinic = await prisma.clinic.update({ where: { id: clinicId }, data });

  await audit({
    userId: actor.id,
    clinicId,
    action: "CLINIC_UPDATED",
    entityType: "Clinic",
    entityId: clinicId,
    metadata: data,
  });

  return clinic;
}

/**
 * Soft-deactivate a clinic (never hard-delete — preserves audit trail).
 */
async function deactivateClinic(clinicId, actor) {
  const exists = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!exists) throw ApiError.notFound("Clinic not found");

  const clinic = await prisma.clinic.update({
    where: { id: clinicId },
    data: { isActive: false },
  });

  await audit({
    userId: actor.id,
    clinicId,
    action: "CLINIC_DEACTIVATED",
    entityType: "Clinic",
    entityId: clinicId,
  });

  return clinic;
}

module.exports = {
  createClinic,
  listClinics,
  getClinic,
  updateClinic,
  deactivateClinic,
};
