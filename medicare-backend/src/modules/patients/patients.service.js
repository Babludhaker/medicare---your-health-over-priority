'use strict';

const { prisma } = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { hashPassword } = require('../../utils/password');
const { ROLES } = require('../../utils/constants');

/**
 * Patient profiles and visit history.
 *
 * Access rules:
 *  - Staff (admin / doctor / receptionist) operate within their clinic.
 *  - A PATIENT may only read their own profile and history.
 */

/**
 * Resolve the PatientProfile id for the current actor when they are a
 * patient; throws for anyone else.
 */
async function ownProfileId(actor) {
  const profile = await prisma.patientProfile.findUnique({
    where: { userId: actor.id },
  });
  if (!profile) throw ApiError.notFound('No patient profile found');
  return profile.id;
}

/**
 * Register a new patient: creates the User and PatientProfile together.
 * Used by a receptionist at the front desk.
 */
async function registerPatient(clinicId, input) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('Email already in use', 'EMAIL_TAKEN');

  const passwordHash = await hashPassword(input.password);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || null,
        role: ROLES.PATIENT,
        clinicId,
        isVerified: true,
      },
    });
    const profile = await tx.patientProfile.create({
      data: {
        userId: user.id,
        clinicId,
        dateOfBirth: input.dateOfBirth || null,
        gender: input.gender || null,
        bloodGroup: input.bloodGroup || null,
        allergies: input.allergies || null,
        chronicNotes: input.chronicNotes || null,
      },
    });
    return { user, profile };
  });

  return {
    id: result.profile.id,
    userId: result.user.id,
    email: result.user.email,
    firstName: result.user.firstName,
    lastName: result.user.lastName,
    ...result.profile,
  };
}

/**
 * Paginated patient directory for a clinic.
 */
async function listPatients(clinicId, query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

  const where = { clinicId };
  if (query.search) {
    where.user = {
      OR: [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ],
    };
  }

  const [items, total] = await Promise.all([
    prisma.patientProfile.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'asc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
      },
    }),
    prisma.patientProfile.count({ where }),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

/**
 * Fetch a single patient profile, enforcing access.
 */
async function getPatient(clinicId, actor, patientId) {
  // A patient can only fetch their own record.
  if (actor.role === ROLES.PATIENT) {
    const own = await ownProfileId(actor);
    if (own !== patientId) {
      throw ApiError.forbidden('You can only view your own profile', 'NOT_YOURS');
    }
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
        },
      },
    },
  });
  if (!profile || profile.clinicId !== clinicId) {
    throw ApiError.notFound('Patient not found in this clinic');
  }
  return profile;
}

/**
 * Update a patient's clinical profile fields.
 */
async function updatePatient(clinicId, actor, patientId, data) {
  if (actor.role === ROLES.PATIENT) {
    const own = await ownProfileId(actor);
    if (own !== patientId) {
      throw ApiError.forbidden('You can only update your own profile', 'NOT_YOURS');
    }
  }

  const profile = await prisma.patientProfile.findUnique({ where: { id: patientId } });
  if (!profile || profile.clinicId !== clinicId) {
    throw ApiError.notFound('Patient not found in this clinic');
  }

  return prisma.patientProfile.update({ where: { id: patientId }, data });
}

/**
 * Full visit timeline for a patient.
 *
 * Access: the patient themselves, or a doctor who has treated them.
 * Receptionists are deliberately excluded from clinical detail — they
 * see appointments but never medical records / prescriptions.
 */
async function getPatientHistory(clinicId, actor, patientId) {
  const profile = await prisma.patientProfile.findUnique({
    where: { id: patientId },
  });
  if (!profile || profile.clinicId !== clinicId) {
    throw ApiError.notFound('Patient not found in this clinic');
  }

  // Access enforcement.
  if (actor.role === ROLES.PATIENT) {
    const own = await ownProfileId(actor);
    if (own !== patientId) {
      throw ApiError.forbidden('You can only view your own history', 'NOT_YOURS');
    }
  } else if (actor.role === ROLES.DOCTOR) {
    const docProfile = await prisma.doctorProfile.findUnique({
      where: { userId: actor.id },
    });
    const treated = await prisma.appointment.count({
      where: { patientId, doctorId: docProfile?.id },
    });
    if (treated === 0) {
      throw ApiError.forbidden(
        'You have not treated this patient',
        'NOT_TREATING_DOCTOR'
      );
    }
  } else if (actor.role === ROLES.RECEPTIONIST) {
    throw ApiError.forbidden(
      'Receptionists cannot view clinical history',
      'CLINICAL_FORBIDDEN'
    );
  }

  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    orderBy: { startTime: 'desc' },
    include: {
      doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      medicalRecord: true,
      prescription: { include: { items: true } },
    },
  });

  return { patient: profile, timeline: appointments };
}

module.exports = {
  registerPatient,
  listPatients,
  getPatient,
  updatePatient,
  getPatientHistory,
  ownProfileId,
};
