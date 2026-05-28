// Small, dependency-free utility helpers.

/**
 * Conditionally join class names. A tiny clsx replacement.
 *   cn('a', cond && 'b', null, 'c') -> 'a c' (when cond is false)
 */
export function cn(...args) {
  return args.filter(Boolean).join(' ');
}

/**
 * Format a currency amount (defaults to INR, matching the backend).
 */
export function formatCurrency(amount, currency = 'INR') {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format an ISO date string as a readable date, e.g. "20 May 2026".
 */
export function formatDate(input) {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format an ISO datetime as date + time, e.g. "20 May 2026, 9:30 AM".
 */
export function formatDateTime(input) {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a time only, e.g. "9:30 AM".
 */
export function formatTime(input) {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Initials from a name, for avatars. "Asha Verma" -> "AV".
 */
export function initials(first = '', last = '') {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || '?';
}

/**
 * Pull a friendly message out of an axios error.
 */
export function errorMessage(err, fallback = 'Something went wrong') {
  return (
    err?.response?.data?.error?.message ||
    err?.message ||
    fallback
  );
}

/**
 * Pull field-level validation details out of an axios error.
 * Returns a { fieldName: message } map, or null.
 */
export function fieldErrors(err) {
  const details = err?.response?.data?.error?.details;
  if (!Array.isArray(details)) return null;
  const map = {};
  for (const d of details) {
    if (d.path) map[d.path] = d.message;
  }
  return Object.keys(map).length ? map : null;
}

/**
 * Promise-based delay.
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
