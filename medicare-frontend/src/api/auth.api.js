import api from './client';

/**
 * Auth endpoints. Each returns the unwrapped `data` payload.
 */
export const authApi = {
  register: (body) => api.post('/auth/register', body),

  login: (email, password) => api.post('/auth/login', { email, password }),

  verifyOtp: (userId, otp) => api.post('/auth/verify-otp', { userId, otp }),

  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),

  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),

  verifyEmail: (token) => api.post('/auth/verify-email', { token }),

  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token, password) =>
    api.post('/auth/reset-password', { token, password }),

  me: () => api.get('/auth/me'),
};
