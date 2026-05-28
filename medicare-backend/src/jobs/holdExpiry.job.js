'use strict';

const cron = require('node-cron');
const { prisma } = require('../config/prisma');
const logger = require('../config/logger');
const { APPOINTMENT_STATUS, AUDIT_ACTIONS } = require('../utils/constants');
const { audit } = require('../utils/audit');

/**
 * Hold-expiry job.
 *
 * When a patient holds a slot it is locked for SLOT_HOLD_MINUTES while
 * they pay. This job runs every minute and cancels any HOLD whose
 * holdExpiresAt has passed — freeing the (doctorId, startTime) slot so
 * someone else can book it.
 */
async function releaseExpiredHolds() {
  const now = new Date();

  const expired = await prisma.appointment.findMany({
    where: {
      status: APPOINTMENT_STATUS.HOLD,
      holdExpiresAt: { lt: now },
    },
    select: { id: true, clinicId: true, doctorId: true, startTime: true },
  });

  if (expired.length === 0) return 0;

  for (const appt of expired) {
    await prisma.appointment.update({
      where: { id: appt.id },
      data: { status: APPOINTMENT_STATUS.CANCELLED, holdExpiresAt: null },
    });
    await audit({
      clinicId: appt.clinicId,
      action: AUDIT_ACTIONS.APPOINTMENT_CANCELLED,
      entityType: 'Appointment',
      entityId: appt.id,
      metadata: { reason: 'HOLD_EXPIRED' },
    });
  }

  logger.info({ count: expired.length }, 'Released expired slot holds');
  return expired.length;
}

/**
 * Register the cron schedule. Runs every minute.
 */
function registerHoldExpiryJob() {
  cron.schedule('* * * * *', async () => {
    try {
      await releaseExpiredHolds();
    } catch (err) {
      logger.error({ err }, 'holdExpiry job failed');
    }
  });
  logger.info('Job registered: holdExpiry (every minute)');
}

module.exports = { registerHoldExpiryJob, releaseExpiredHolds };
