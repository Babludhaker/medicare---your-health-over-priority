'use strict';

const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * Auth controllers — parse the request, call the service, shape the
 * response. No business logic lives here.
 */

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, req.ip);
  return sendSuccess(res, result, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password, req.ip);
  return sendSuccess(res, result);
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;
  const result = await authService.verifyOtp(userId, otp);
  return sendSuccess(res, result);
});

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  return sendSuccess(res, result);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body?.refreshToken);
  return sendSuccess(res, { message: 'Logged out' });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body.token);
  return sendSuccess(res, result);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return sendSuccess(res, result);
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(
    req.body.token,
    req.body.password,
    req.ip
  );
  return sendSuccess(res, result);
});

const me = asyncHandler(async (req, res) => {
  const result = await authService.me(req.user.id);
  return sendSuccess(res, result);
});

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
};
