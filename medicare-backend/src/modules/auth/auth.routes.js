'use strict';

const { Router } = require('express');
const controller = require('./auth.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const { authLimiter } = require('../../middleware/rateLimiter');
const schemas = require('./auth.validation');

/**
 * Auth routes — all public except GET /me.
 * The tighter authLimiter is applied to credential-sensitive endpoints.
 */
const router = Router();

router.post('/register', authLimiter, validate(schemas.registerSchema), controller.register);
router.post('/login', authLimiter, validate(schemas.loginSchema), controller.login);
router.post('/verify-otp', authLimiter, validate(schemas.verifyOtpSchema), controller.verifyOtp);
router.post('/refresh', validate(schemas.refreshSchema), controller.refresh);
router.post('/logout', controller.logout);
router.post('/verify-email', validate(schemas.verifyEmailSchema), controller.verifyEmail);
router.post(
  '/forgot-password',
  authLimiter,
  validate(schemas.forgotPasswordSchema),
  controller.forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  validate(schemas.resetPasswordSchema),
  controller.resetPassword
);

router.get('/me', authenticate, controller.me);

module.exports = router;
