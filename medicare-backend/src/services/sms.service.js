'use strict';

const twilio = require('twilio');
const env = require('../config/env');
const logger = require('../config/logger');

/**
 * Twilio SMS wrapper for appointment reminders and OTP delivery.
 *
 * If Twilio credentials are absent, SMS is logged instead of sent so
 * local development works without an account.
 */
const enabled = Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN);
const client = enabled
  ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
  : null;

async function sendSms(to, body) {
  if (!to) {
    logger.warn('sendSms called without a phone number');
    return { skipped: true };
  }

  if (!enabled) {
    logger.info({ to, body }, '[sms:mock] Twilio not configured — SMS not sent');
    return { mocked: true };
  }

  try {
    const msg = await client.messages.create({
      from: env.TWILIO_PHONE_NUMBER,
      to,
      body,
    });
    logger.info({ to, sid: msg.sid }, 'SMS sent');
    return { sent: true, sid: msg.sid };
  } catch (err) {
    logger.error({ err: err.message, to }, 'SMS send failed');
    throw err;
  }
}

function sendOtpSms(to, otp) {
  return sendSms(to, `Your MediCare Connect verification code is ${otp}. It expires in 5 minutes.`);
}

function sendReminderSms(to, details) {
  return sendSms(
    to,
    `Reminder: appointment with Dr. ${details.doctorName} on ${details.when} at ${details.clinicName}.`
  );
}

module.exports = { sendSms, sendOtpSms, sendReminderSms };
