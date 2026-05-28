'use strict';

const cron = require('node-cron');
const { prisma } = require('../config/prisma');
const logger = require('../config/logger');
const { APPOINTMENT_STATUS, NOTIFICATION_TYPE } = require('../utils/constants');
const { addHours } = require('../utils/datetime');
const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');
const { createNotification } = require('../services/notification.service');

/**
 * Reminder job.
 *
 * Runs hourly and finds CONFIRMED appointments starting within the
 * next 24h (±30 min) and next 2h (±30 min) windows, then dispatches
 * email + SMS + in-app reminders.
 *
 * Idempotency note: in a real deployment you would record a
 * "reminderSent24h / reminderSent2h" flag to avoid duplicates. The
 * tight ±30 min window plus an hourly cron keeps duplicates rare; the
 * flag columns can be added to the Appointment model later.
 */
async function sendRemindersForWindow(hoursAhead) {
  const now = new Date();
  const target = addHours(now, hoursAhead);
  const windowStart = addHours(target, -0.5);
  const windowEnd = addHours(target, 0.5);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: APPOINTMENT_STATUS.CONFIRMED,
      startTime: { gte: windowStart, lte: windowEnd },
    },
    include: {
      clinic: { select: { name: true } },
      doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      patient: {
        include: {
          user: { select: { firstName: true, email: true, phone: true, id: true } },
        },
      },
    },
  });

  for (const appt of appointments) {
    const patientUser = appt.patient.user;
    const doctorName = `${appt.doctor.user.firstName} ${appt.doctor.user.lastName}`;
    const when = appt.startTime.toLocaleString();
    const details = { doctorName, when, clinicName: appt.clinic.name };

    // Email
    await emailService
      .sendAppointmentReminder(patientUser.email, patientUser.firstName, details)
      .catch((err) => logger.warn({ err: err.message }, 'reminder email failed'));

    // SMS
    if (patientUser.phone) {
      await smsService
        .sendReminderSms(patientUser.phone, details)
        .catch((err) => logger.warn({ err: err.message }, 'reminder sms failed'));
    }

    // In-app
    await createNotification({
      userId: patientUser.id,
      clinicId: appt.clinicId,
      title: 'Appointment reminder',
      body: `Your appointment with Dr. ${doctorName} is on ${when}.`,
      type: NOTIFICATION_TYPE.APPOINTMENT,
    });
  }

  if (appointments.length) {
    logger.info(
      { count: appointments.length, hoursAhead },
      'Appointment reminders dispatched'
    );
  }
  return appointments.length;
}

/**
 * Register the reminder cron. Runs at the top of every hour.
 */
function registerReminderJob() {
  cron.schedule('0 * * * *', async () => {
    try {
      await sendRemindersForWindow(24);
      await sendRemindersForWindow(2);
    } catch (err) {
      logger.error({ err }, 'reminder job failed');
    }
  });
  logger.info('Job registered: reminders (hourly)');
}

module.exports = { registerReminderJob, sendRemindersForWindow };
