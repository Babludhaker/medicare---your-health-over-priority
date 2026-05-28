"use strict";

const sgMail = require("@sendgrid/mail");
const env = require("../config/env");
const logger = require("../config/logger");

/**
 * SendGrid transactional email wrapper.
 *
 * If SENDGRID_API_KEY is not configured (e.g. local dev) emails are
 * logged to the console instead of being sent, so the app still runs.
 */
const enabled = Boolean(env.SENDGRID_API_KEY);
if (enabled) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

async function sendEmail({ to, subject, html, text, attachments }) {
  const msg = {
    to,
    from: { email: env.EMAIL_FROM, name: env.EMAIL_FROM_NAME },
    subject,
    text: text || subject,
    html: html || `<p>${text || subject}</p>`,
  };
  if (attachments) msg.attachments = attachments;

  if (!enabled) {
    logger.info(
      { to, subject },
      "[email:mock] SendGrid not configured — email not sent",
    );
    return { mocked: true };
  }

  try {
    await sgMail.send(msg);
    // const response = await sgMail.send(msg);

    logger.info({ to, subject }, "Email sent");
    return { sent: true };
  } catch (err) {
    logger.error({ err: err.message, to }, "Email send failed");
    throw err;
  }
}

// ---- Templated helpers ----

function sendVerificationEmail(to, name, verifyUrl) {
  return sendEmail({
    to,
    subject: "Verify your MediCare Connect account",
    html: `<p>Hi ${name},</p>
           <p>Please verify your email to activate your account:</p>
           <p><a href="${verifyUrl}">Verify my account</a></p>
           <p>If you did not sign up, ignore this email.</p>`,
  });
}

function sendPasswordResetEmail(to, name, resetUrl) {
  return sendEmail({
    to,
    subject: "Reset your MediCare Connect password",
    html: `<p>Hi ${name},</p>
           <p>We received a request to reset your password:</p>
           <p><a href="${resetUrl}">Reset password</a></p>
           <p>This link expires in 1 hour. If you did not request this, ignore it.</p>`,
  });
}

function sendBookingConfirmation(to, name, details) {
  return sendEmail({
    to,
    subject: "Your appointment is confirmed",
    html: `<p>Hi ${name},</p>
           <p>Your appointment with <b>Dr. ${details.doctorName}</b> is confirmed.</p>
           <p><b>When:</b> ${details.when}<br/>
              <b>Clinic:</b> ${details.clinicName}</p>`,
  });
}

function sendAppointmentReminder(to, name, details) {
  return sendEmail({
    to,
    subject: `Reminder: appointment ${details.when}`,
    html: `<p>Hi ${name},</p>
           <p>This is a reminder of your appointment with
              <b>Dr. ${details.doctorName}</b> on <b>${details.when}</b>.</p>`,
  });
}

function sendCancellationEmail(to, name, details) {
  return sendEmail({
    to,
    subject: "Your appointment was cancelled",
    html: `<p>Hi ${name},</p>
           <p>Your appointment on <b>${details.when}</b> has been cancelled.</p>
           ${details.refundNote ? `<p>${details.refundNote}</p>` : ""}`,
  });
}

function sendInvoiceEmail(to, name, invoiceNo, pdfBuffer) {
  return sendEmail({
    to,
    subject: `Invoice ${invoiceNo} — MediCare Connect`,
    html: `<p>Hi ${name},</p><p>Please find your invoice ${invoiceNo} attached.</p>`,
    attachments: pdfBuffer
      ? [
          {
            content: pdfBuffer.toString("base64"),
            filename: `${invoiceNo}.pdf`,
            type: "application/pdf",
            disposition: "attachment",
          },
        ]
      : undefined,
  });
}

function sendOtpEmail(to, name, otp) {
  return sendEmail({
    to,
    subject: "Your MediCare Connect OTP",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${name},</h2>

        <p>Your verification OTP is:</p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 6px;
          margin: 20px 0;
          color: #2563eb;
        ">
          ${otp}
        </div>

        <p>This OTP will expire in <b>5 minutes</b>.</p>

        <p>If you did not request this OTP, please ignore this email.</p>

        <br />

        <p>Thanks,<br />MediCare Connect Team</p>
      </div>
    `,
    text: `Your MediCare Connect OTP is ${otp}. It expires in 5 minutes.`,
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmation,
  sendAppointmentReminder,
  sendCancellationEmail,
  sendInvoiceEmail,
  sendOtpEmail,
};
