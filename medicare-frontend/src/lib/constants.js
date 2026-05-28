// Application-wide constants.

// API base. In dev, Vite proxies /api to the backend (see vite.config.js).
// In production set VITE_API_URL to the deployed API origin.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || '/api/v1';

// Roles — must mirror the backend's ROLES enum.
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CLINIC_ADMIN: 'CLINIC_ADMIN',
  DOCTOR: 'DOCTOR',
  RECEPTIONIST: 'RECEPTIONIST',
  PATIENT: 'PATIENT',
};

// Human-readable role labels.
export const ROLE_LABELS = {
  SUPER_ADMIN: 'Platform Admin',
  CLINIC_ADMIN: 'Clinic Administrator',
  DOCTOR: 'Doctor',
  RECEPTIONIST: 'Receptionist',
  PATIENT: 'Patient',
};

// Where each role lands after login.
export const ROLE_HOME = {
  SUPER_ADMIN: '/app/platform',
  CLINIC_ADMIN: '/app/clinic',
  DOCTOR: '/app/schedule',
  RECEPTIONIST: '/app/front-desk',
  PATIENT: '/app/appointments',
};

// Appointment status — mirrors the backend enum.
export const APPOINTMENT_STATUS = {
  HOLD: 'HOLD',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
};

// localStorage keys for token persistence.
export const STORAGE_KEYS = {
  ACCESS: 'mc_access_token',
  REFRESH: 'mc_refresh_token',
  USER: 'mc_user',
};
