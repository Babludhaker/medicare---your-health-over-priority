import { create } from 'zustand';
import { authApi } from '@/api/auth.api';
import {
  setTokens,
  clearTokens,
  registerAuthFailureHandler,
} from '@/api/client';
import { STORAGE_KEYS } from '@/lib/constants';

/**
 * Auth store — the single source of truth for the session.
 *
 * The user object and tokens are persisted to localStorage so a page
 * refresh keeps the user signed in. `bootstrap()` rehydrates from
 * storage on app start and re-validates against the API.
 */

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create((set, get) => ({
  user: readStoredUser(),
  status: 'idle', // 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  // Holds the userId between a 2FA login and OTP verification.
  pendingTwoFactorUserId: null,

  /** Re-validate a stored session on app load. */
  bootstrap: async () => {
    const hasToken = localStorage.getItem(STORAGE_KEYS.ACCESS);
    if (!hasToken) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    set({ status: 'loading' });
    try {
      const { user } = await authApi.me();
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      set({ user, status: 'authenticated' });
    } catch {
      clearTokens();
      set({ user: null, status: 'unauthenticated' });
    }
  },

  /**
   * Log in. Resolves to one of:
   *  { twoFactorRequired: true }  — caller should route to OTP screen
   *  { user }                     — fully authenticated
   */
  login: async (email, password) => {
    const result = await authApi.login(email, password);

    if (result?.twoFactorRequired) {
      set({ pendingTwoFactorUserId: result.userId });
      return { twoFactorRequired: true };
    }

    setTokens(result.accessToken, result.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user));
    set({ user: result.user, status: 'authenticated', pendingTwoFactorUserId: null });
    return { user: result.user };
  },

  /** Complete a 2FA login by verifying the OTP. */
  verifyOtp: async (otp) => {
    const userId = get().pendingTwoFactorUserId;
    if (!userId) throw new Error('No pending two-factor login');

    const result = await authApi.verifyOtp(userId, otp);
    setTokens(result.accessToken, result.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user));
    set({ user: result.user, status: 'authenticated', pendingTwoFactorUserId: null });
    return { user: result.user };
  },

  /** Register a new patient account. */
  register: async (body) => {
    return authApi.register(body);
  },

  /** Log out — best-effort server revoke, then local clear. */
  logout: async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH);
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Ignore — we clear locally regardless.
    }
    clearTokens();
    set({ user: null, status: 'unauthenticated', pendingTwoFactorUserId: null });
  },

  /** Force a local logout (used when token refresh fails). */
  forceLogout: () => {
    clearTokens();
    set({ user: null, status: 'unauthenticated' });
  },
}));

// Let the API client trigger a logout when refresh ultimately fails.
registerAuthFailureHandler(() => {
  useAuthStore.getState().forceLogout();
});
