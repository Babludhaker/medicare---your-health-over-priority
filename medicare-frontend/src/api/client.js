import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants';

/**
 * The HTTP client for the MediCare Connect API.
 *
 * Responsibilities:
 *  - attach the access token to every request
 *  - on a 401, transparently refresh the token once and retry
 *  - rotate the stored refresh token (the backend rotates on every use)
 *  - if refresh fails, clear the session and hand control to the auth
 *    store via the registered `onAuthFailure` callback
 *
 * The backend envelope is { success, data } / { success, error }. We
 * unwrap `data` in a response interceptor so callers get the payload
 * directly.
 */

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// --- token helpers -------------------------------------------------

function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.ACCESS);
}
function getRefreshToken() {
  return localStorage.getItem(STORAGE_KEYS.REFRESH);
}
export function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(STORAGE_KEYS.ACCESS, accessToken);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH, refreshToken);
}
export function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS);
  localStorage.removeItem(STORAGE_KEYS.REFRESH);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

// The auth store registers a callback so the client can force a logout
// when refresh ultimately fails. Avoids a circular import.
let onAuthFailure = () => {};
export function registerAuthFailureHandler(fn) {
  onAuthFailure = fn;
}

// --- request interceptor: attach the access token -----------------

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- response interceptor: unwrap + refresh-on-401 ----------------

// While a refresh is in flight, queue any other 401'd requests so they
// retry with the new token instead of each firing its own refresh.
let isRefreshing = false;
let pendingQueue = [];

function flushQueue(error, token = null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  pendingQueue = [];
}

api.interceptors.response.use(
  // Success: unwrap the envelope so callers receive `data` directly,
  // but keep `meta` reachable via a non-enumerable property.
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'success' in body) {
      const payload = body.data ?? null;
      if (payload && typeof payload === 'object' && body.meta) {
        Object.defineProperty(payload, '_meta', {
          value: body.meta,
          enumerable: false,
        });
      }
      return payload;
    }
    return body;
  },

  // Error: attempt a single transparent refresh on 401.
  async (error) => {
    const { response, config } = error;
    const original = config || {};

    // Not a 401, or already retried, or this *is* the refresh call:
    // give up and propagate.
    const isRefreshCall = original.url?.includes('/auth/refresh');
    if (
      !response ||
      response.status !== 401 ||
      original._retried ||
      isRefreshCall
    ) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      onAuthFailure();
      return Promise.reject(error);
    }

    original._retried = true;

    // A refresh is already running — wait for it, then retry.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    // Run the refresh.
    isRefreshing = true;
    try {
      // Use a bare axios call so this request skips the interceptors.
      const res = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const data = res.data?.data || {};
      setTokens(data.accessToken, data.refreshToken);
      flushQueue(null, data.accessToken);

      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (refreshErr) {
      flushQueue(refreshErr, null);
      clearTokens();
      onAuthFailure();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
