// Date helpers for the scheduling / appointment screens.

/**
 * Today's date as a YYYY-MM-DD string (local time).
 */
export function todayISO() {
  const d = new Date();
  return toDateInput(d);
}

/**
 * A Date -> 'YYYY-MM-DD' (for <input type="date">).
 */
export function toDateInput(date) {
  const d = date instanceof Date ? date : new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Add `n` days to a YYYY-MM-DD string, returning a YYYY-MM-DD string.
 */
export function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return toDateInput(d);
}

/**
 * A friendly weekday + date label, e.g. "Mon, 18 May".
 */
export function dayLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Build the next `count` days starting today, as
 * { value: 'YYYY-MM-DD', label: 'Mon 18' } objects — handy for a
 * horizontal date picker.
 */
export function upcomingDays(count = 14) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const value = addDays(todayISO(), i);
    const d = new Date(value);
    out.push({
      value,
      weekday: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      day: d.getDate(),
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      isToday: i === 0,
    });
  }
  return out;
}

/**
 * Day-of-week index (0 = Sunday) for a date string — matches the
 * backend's availability dayOfWeek convention.
 */
export function dayOfWeek(dateStr) {
  return new Date(dateStr).getDay();
}

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
