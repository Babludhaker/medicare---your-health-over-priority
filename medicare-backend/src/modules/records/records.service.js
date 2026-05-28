'use strict';

const { prisma } = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { ROLES, AUDIT_ACTIONS, APPOINTMENT_STATUS } = require('../../utils/constants');
const { audit } = require('../../utils/audit');
const storageService = require('../../services/storage.service');
const pdfService = require('../../services/pdf.service');

/**
 * Electronic medical records and e-prescriptions.
 *
 * Records are strictly role-scoped: only the treating DOCTOR may
 * create them; only the treating doctor and the patient may read them.
 * Receptionists never see clinical content.
 */

/**
 * Load an appointment and verify it belongs to the clinic. Optionally
 * verify the actor is the treating doctor.
 */
async function loadAppointment(clinicId, appointmentId, { requireTreatingDoctor, actor } = {}) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      patient: { include: { user: { select: { firstName: true, lastName: true } } } },
      clinic: { select: { name: true } },
    },
  });
  if (!appt || appt.clinicId !== clinicId) {
    throw ApiError.notFound('Appointment not found');
  }

  if (requireTreatingDoctor) {
    const docProfile = await prisma.doctorProfile.findUnique({
      where: { userId: actor.id },
    });
    if (!docProfile || docProfile.id !== appt.doctorId) {
      throw ApiError.forbidden(
        'Only the treating doctor can do this',
        'NOT_TREATING_DOCTOR'
      );
    }
  }

  return appt;
}

/**
 * Create (or replace) the medical record for an appointment.
 * The appointment must not be cancelled.
 */
async function createRecord(clinicId, actor, appointmentId, data) {
  const appt = await loadAppointment(clinicId, appointmentId, {
    requireTreatingDoctor: true,
    actor,
  });
  if (appt.status === APPOINTMENT_STATUS.CANCELLED) {
    throw ApiError.badRequest('Cannot write a record for a cancelled visit', 'BAD_STATE');
  }

  const payload = {
    patientId: appt.patientId,
    symptoms: data.symptoms || null,
    diagnosis: data.diagnosis || null,
    bloodPressure: data.bloodPressure || null,
    pulse: data.pulse ?? null,
    temperature: data.temperature ?? null,
    spo2: data.spo2 ?? null,
    notes: data.notes || null,
    documentUrls: data.documentUrls || [],
  };

  // One record per appointment — upsert.
  const record = await prisma.medicalRecord.upsert({
    where: { appointmentId },
    update: payload,
    create: { appointmentId, ...payload },
  });

  await audit({
    clinicId,
    userId: actor.id,
    action: AUDIT_ACTIONS.RECORD_CREATED,
    entityType: 'MedicalRecord',
    entityId: record.id,
  });

  return record;
}

/**
 * Read the medical record for an appointment, enforcing access.
 */
async function getRecord(clinicId, actor, appointmentId) {
  const appt = await loadAppointment(clinicId, appointmentId);

  // Access: treating doctor or the patient only.
  if (actor.role === ROLES.RECEPTIONIST) {
    throw ApiError.forbidden('Receptionists cannot view clinical records', 'CLINICAL_FORBIDDEN');
  }
  if (actor.role === ROLES.DOCTOR) {
    const docProfile = await prisma.doctorProfile.findUnique({
      where: { userId: actor.id },
    });
    if (!docProfile || docProfile.id !== appt.doctorId) {
      throw ApiError.forbidden('Not your patient', 'NOT_TREATING_DOCTOR');
    }
  }
  if (actor.role === ROLES.PATIENT) {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: actor.id },
    });
    if (!profile || profile.id !== appt.patientId) {
      throw ApiError.forbidden('Not your record', 'NOT_YOURS');
    }
  }

  const record = await prisma.medicalRecord.findUnique({ where: { appointmentId } });
  if (!record) throw ApiError.notFound('No medical record for this appointment');

  // Turn stored S3 keys into short-lived download URLs.
  const documents = (record.documentUrls || []).map((key) => ({
    key,
    url: storageService.getDownloadUrl(key),
  }));

  return { ...record, documents };
}

/**
 * Create an e-prescription (header + structured drug lines).
 * Returns the prescription plus a generated PDF buffer (base64) the
 * caller can download.
 */
async function createPrescription(clinicId, actor, appointmentId, data) {
  const appt = await loadAppointment(clinicId, appointmentId, {
    requireTreatingDoctor: true,
    actor,
  });

  // One prescription per appointment.
  const existing = await prisma.prescription.findUnique({ where: { appointmentId } });
  if (existing) {
    throw ApiError.conflict('A prescription already exists for this visit', 'RX_EXISTS');
  }

  const prescription = await prisma.prescription.create({
    data: {
      appointmentId,
      advice: data.advice || null,
      followUpDate: data.followUpDate || null,
      items: {
        create: data.items.map((it) => ({
          drugName: it.drugName,
          dosage: it.dosage,
          frequency: it.frequency,
          durationDays: it.durationDays,
          instructions: it.instructions || null,
        })),
      },
    },
    include: { items: true },
  });

  await audit({
    clinicId,
    userId: actor.id,
    action: AUDIT_ACTIONS.PRESCRIPTION_CREATED,
    entityType: 'Prescription',
    entityId: prescription.id,
  });

  // Generate a PDF for download / printing.
  const pdfBuffer = await pdfService.generatePrescriptionPdf({
    clinicName: appt.clinic.name,
    doctorName: `${appt.doctor.user.firstName} ${appt.doctor.user.lastName}`,
    doctorSpecialization: appt.doctor.specialization,
    patientName: `${appt.patient.user.firstName} ${appt.patient.user.lastName}`,
    date: prescription.createdAt,
    advice: prescription.advice,
    followUpDate: prescription.followUpDate,
    items: prescription.items,
  });

  return { prescription, pdfBase64: pdfBuffer.toString('base64') };
}

/**
 * Read the prescription for an appointment, enforcing access.
 */
async function getPrescription(clinicId, actor, appointmentId) {
  const appt = await loadAppointment(clinicId, appointmentId);

  if (actor.role === ROLES.PATIENT) {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: actor.id },
    });
    if (!profile || profile.id !== appt.patientId) {
      throw ApiError.forbidden('Not your prescription', 'NOT_YOURS');
    }
  }

  const prescription = await prisma.prescription.findUnique({
    where: { appointmentId },
    include: { items: true },
  });
  if (!prescription) throw ApiError.notFound('No prescription for this appointment');
  return prescription;
}

/**
 * Issue a presigned S3 URL so the client can upload a lab report
 * directly. The returned `key` is stored on the medical record's
 * documentUrls array by a follow-up createRecord call.
 */
async function getDocumentUploadUrl(clinicId, actor, appointmentId, filename, contentType) {
  await loadAppointment(clinicId, appointmentId, {
    requireTreatingDoctor: true,
    actor,
  });

  return storageService.getUploadUrl({
    clinicId,
    folder: `appointments/${appointmentId}`,
    filename,
    contentType,
  });
}

module.exports = {
  createRecord,
  getRecord,
  createPrescription,
  getPrescription,
  getDocumentUploadUrl,
};
