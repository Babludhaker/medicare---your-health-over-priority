'use strict';

/**
 * Date / time helpers used by the scheduling engine and jobs.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** Add minutes to a date. */
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * MINUTE);
}

/** Add hours to a date. */
function addHours(date, hours) {
  return new Date(date.getTime() + hours * HOUR);
}

/** Add days to a date. */
function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * HOUR);
}

/** Start of day (00:00:00.000) for a given date. */
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** End of day (23:59:59.999) for a given date. */
function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Combine a date (Y/M/D) and a "HH:mm" time string into a Date.
 */
function combineDateAndTime(date, timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

/** "HH:mm" string -> minutes since midnight. */
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/** minutes since midnight -> "HH:mm" string. */
function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 0 (Sunday) .. 6 (Saturday) for a date. */
function dayOfWeek(date) {
  return new Date(date).getDay();
}

module.exports = {
  addMinutes,
  addHours,
  addDays,
  startOfDay,
  endOfDay,
  combineDateAndTime,
  timeToMinutes,
  minutesToTime,
  dayOfWeek,
};
