'use strict';

const { prisma } = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { hashPassword } = require('../../utils/password');
const { ROLES, AUDIT_ACTIONS } = require('../../utils/constants');
const { audit } = require('../../utils/audit');
const { publicUser } = require('../auth/auth.service');

/**
 * Staff management — operated by a CLINIC_ADMIN, always scoped to the
 * admin's own tenant (clinicId).
 */

/**
 * Create a staff member (doctor / receptionist / clinic admin).
 * Doctors get a DoctorProfile created in the same transaction.
 */
async function createStaff(clinicId, input, actor) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('Email already in use', 'EMAIL_TAKEN');

  // Validate the department belongs to this clinic, if supplied.
  if (input.role === ROLES.DOCTOR && input.doctorProfile?.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: input.doctorProfile.departmentId },
    });
    if (!dept || dept.clinicId !== clinicId) {
      throw ApiError.badRequest('Invalid department', 'BAD_DEPARTMENT');
    }
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || null,
        role: input.role,
        clinicId,
        isVerified: true, // staff are created trusted by the admin
      },
    });

    if (input.role === ROLES.DOCTOR) {
      await tx.doctorProfile.create({
        data: {
          userId: createdUser.id,
          clinicId,
          departmentId: input.doctorProfile.departmentId || null,
          specialization: input.doctorProfile.specialization,
          qualification: input.doctorProfile.qualification || null,
          experienceYears: input.doctorProfile.experienceYears || 0,
          consultationFee: input.doctorProfile.consultationFee,
          bio: input.doctorProfile.bio || null,
        },
      });
    }

    return createdUser;
  });

  await audit({
    userId: actor.id,
    clinicId,
    action: AUDIT_ACTIONS.STAFF_CREATED,
    entityType: 'User',
    entityId: user.id,
    metadata: { role: user.role },
  });

  return publicUser(user);
}

/**
 * Paginated staff list for a clinic.
 */
async function listStaff(clinicId, query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

  const where = { clinicId };
  if (query.role) where.role = query.role;
  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        twoFactorOn: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: users,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

/**
 * Fetch one staff member, ensuring they belong to the caller's clinic.
 */
async function getStaff(clinicId, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { doctorProfile: true },
  });
  if (!user || user.clinicId !== clinicId) {
    throw ApiError.notFound('User not found in this clinic');
  }
  return { ...publicUser(user), doctorProfile: user.doctorProfile || null };
}

/**
 * Update a staff member's profile / status.
 */
async function updateStaff(clinicId, userId, data, actor) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.clinicId !== clinicId) {
    throw ApiError.notFound('User not found in this clinic');
  }

  const updated = await prisma.user.update({ where: { id: userId }, data });

  await audit({
    userId: actor.id,
    clinicId,
    action: 'STAFF_UPDATED',
    entityType: 'User',
    entityId: userId,
    metadata: data,
  });

  return publicUser(updated);
}

/**
 * Deactivate a staff member (soft — preserves history).
 */
async function deactivateStaff(clinicId, userId, actor) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.clinicId !== clinicId) {
    throw ApiError.notFound('User not found in this clinic');
  }
  if (user.id === actor.id) {
    throw ApiError.badRequest('You cannot deactivate your own account', 'SELF_DEACTIVATE');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  // Revoke active sessions so the change takes effect immediately.
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await audit({
    userId: actor.id,
    clinicId,
    action: 'STAFF_DEACTIVATED',
    entityType: 'User',
    entityId: userId,
  });

  return publicUser(updated);
}

module.exports = {
  createStaff,
  listStaff,
  getStaff,
  updateStaff,
  deactivateStaff,
};
