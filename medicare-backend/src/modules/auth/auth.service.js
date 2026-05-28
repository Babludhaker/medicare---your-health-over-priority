"use strict";

const { prisma } = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");
const env = require("../../config/env");
const {
  hashPassword,
  verifyPassword,
  sha256,
  randomToken,
  generateOtp,
} = require("../../utils/password");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshExpiryDate,
} = require("../../utils/token");
const { addMinutes, addHours } = require("../../utils/datetime");
const { ROLES, AUDIT_ACTIONS } = require("../../utils/constants");
const { audit } = require("../../utils/audit");
const emailService = require("../../services/email.service");
const smsService = require("../../services/sms.service");

/**
 * Build the JWT payload from a user record.
 */
function tokenPayload(user) {
  return { sub: user.id, role: user.role, clinicId: user.clinicId || null };
}

/**
 * Issue an access + refresh token pair and persist the refresh token
 * (hashed) so it can be rotated and revoked.
 */
async function issueTokens(user) {
  const payload = tokenPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: refreshExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
}

/**
 * Shape a user for safe return to the client (no secrets).
 */
function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    clinicId: user.clinicId || null,
    isVerified: user.isVerified,
    twoFactorOn: user.twoFactorOn,
  };
}

/**
 * Register a new patient account.
 */
async function register(input, ipAddress) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw ApiError.conflict(
      "An account with this email already exists",
      "EMAIL_TAKEN",
    );
  }

  // If a clinicId is supplied, it must reference a real, active clinic.
  if (input.clinicId) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: input.clinicId },
    });
    if (!clinic || !clinic.isActive) {
      throw ApiError.badRequest("Invalid clinic", "BAD_CLINIC");
    }
  }

  const verifyToken = randomToken(24);
  console.log("verifyToken", verifyToken);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone || null,
      role: ROLES.PATIENT,
      clinicId: input.clinicId || null,
      verifyToken,
    },
  });

  // Create the patient profile so the account is usable immediately.
  if (input.clinicId) {
    await prisma.patientProfile.create({
      data: { userId: user.id, clinicId: input.clinicId },
    });
  }

  await audit({
    clinicId: user.clinicId,
    userId: user.id,
    action: AUDIT_ACTIONS.USER_REGISTERED,
    entityType: "User",
    entityId: user.id,
    ipAddress,
  });

  // Fire-and-forget verification email.
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${verifyToken}`;
  emailService
    .sendVerificationEmail(user.email, user.firstName, verifyUrl)
    .catch(() => {});

  return { user: publicUser(user) };
}

/**
 * Authenticate by email + password.
 *
 * Handles account lockout after too many failures and, when 2FA is on,
 * sends an OTP and returns a `twoFactorRequired` response instead of
 * tokens.
 */
async function login(email, password, ipAddress) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Uniform error to avoid leaking which emails exist.
  const invalid = () =>
    ApiError.unauthorized("Invalid email or password", "BAD_CREDENTIALS");

  if (!user) {
    await audit({
      action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
      entityType: "User",
      metadata: { email },
      ipAddress,
    });
    throw invalid();
  }

  if (!user.isActive) {
    throw ApiError.forbidden("Account is disabled", "ACCOUNT_DISABLED");
  }

  // Locked out?
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw ApiError.forbidden(
      "Account temporarily locked due to failed logins",
      "ACCOUNT_LOCKED",
    );
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const failedLogins = user.failedLogins + 1;
    const shouldLock = failedLogins >= env.MAX_LOGIN_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: shouldLock ? 0 : failedLogins,
        lockedUntil: shouldLock
          ? addMinutes(new Date(), env.LOCKOUT_MINUTES)
          : null,
      },
    });

    await audit({
      clinicId: user.clinicId,
      userId: user.id,
      action: shouldLock
        ? AUDIT_ACTIONS.USER_LOCKED
        : AUDIT_ACTIONS.USER_LOGIN_FAILED,
      entityType: "User",
      entityId: user.id,
      ipAddress,
    });

    throw invalid();
  }

  // Successful password check — reset the failure counter.
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  // Two-factor: send an OTP and stop here.
  console.log("user.twoFactorOn", user.twoFactorOn);
  if (user.twoFactorOn) {
    const otp = generateOtp(6);
    console.log("Generated OTP for user", user.id, otp);
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: sha256(otp), otpExpiresAt: addMinutes(new Date(), 5) },
    });
    // if (user.phone) {
    //   smsService.sendOtpSms(user.phone, otp).catch(() => {});
    // }
    emailService.sendOtpEmail(user.email, user.firstName, otp).catch((err) => {
      console.log("OTP email failed", err.message);
    });

    return { twoFactorRequired: true, userId: user.id };
  }

  const tokens = await issueTokens(user);
  await audit({
    clinicId: user.clinicId,
    userId: user.id,
    action: AUDIT_ACTIONS.USER_LOGIN,
    entityType: "User",
    entityId: user.id,
    ipAddress,
  });

  return { user: publicUser(user), ...tokens };
}

/**
 * Verify a 2FA OTP and complete login.
 */
async function verifyOtp(userId, otp) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");

  if (!user.otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw ApiError.badRequest(
      "OTP expired, please log in again",
      "OTP_EXPIRED",
    );
  }
  if (user.otpCode !== sha256(otp)) {
    throw ApiError.badRequest("Incorrect OTP", "OTP_INVALID");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode: null, otpExpiresAt: null, lastLoginAt: new Date() },
  });

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

/**
 * Rotate tokens: validate the refresh token, revoke the old one, and
 * issue a fresh pair.
 */
async function refresh(oldRefreshToken) {
  const payload = verifyRefreshToken(oldRefreshToken);
  const tokenHash = sha256(oldRefreshToken);

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized(
      "Refresh token is no longer valid",
      "REFRESH_REVOKED",
    );
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("User is no longer active", "USER_INACTIVE");
  }

  // Revoke the used token (rotation) and issue a new pair.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokens(user);
  return { ...tokens };
}

/**
 * Log out: revoke a single refresh token.
 */
async function logout(refreshToken) {
  if (!refreshToken) return;
  await prisma.refreshToken
    .updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    })
    .catch(() => {});
}

/**
 * Verify an email-verification token.
 */
async function verifyEmail(token) {
  const user = await prisma.user.findFirst({ where: { verifyToken: token } });
  if (!user)
    throw ApiError.badRequest("Invalid verification token", "BAD_VERIFY_TOKEN");

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verifyToken: null },
  });
  return { verified: true };
}

/**
 * Start a password-reset flow. Always returns success to avoid
 * revealing whether an email is registered.
 */
async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const resetToken = randomToken(24);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: sha256(resetToken),
        resetExpiresAt: addHours(new Date(), 1),
      },
    });
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
    console.log("Generated password reset token for user", user.id, resetUrl);
    emailService
      .sendPasswordResetEmail(user.email, user.firstName, resetUrl)
      .catch(() => {});
  }
  return { message: "If that email exists, a reset link has been sent" };
}

/**
 * Complete a password reset and revoke all existing refresh tokens.
 */
async function resetPassword(token, newPassword, ipAddress) {
  const user = await prisma.user.findFirst({
    where: { resetToken: sha256(token) },
  });
  if (!user || !user.resetExpiresAt || user.resetExpiresAt < new Date()) {
    throw ApiError.badRequest(
      "Reset link is invalid or expired",
      "BAD_RESET_TOKEN",
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(newPassword),
        resetToken: null,
        resetExpiresAt: null,
        failedLogins: 0,
        lockedUntil: null,
      },
    }),
    // Invalidate every active session.
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await audit({
    clinicId: user.clinicId,
    userId: user.id,
    action: AUDIT_ACTIONS.PASSWORD_RESET,
    entityType: "User",
    entityId: user.id,
    ipAddress,
  });

  return { message: "Password has been reset" };
}

/**
 * Return the current authenticated user's profile.
 */
async function me(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");
  return { user: publicUser(user) };
}

module.exports = {
  register,
  login,
  verifyOtp,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  me,
  publicUser,
};
