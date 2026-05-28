'use strict';

const { Router } = require('express');

/**
 * Central API router.
 *
 * Each feature module exposes a `*.routes.js` file. They are mounted
 * here so app.js stays clean. As each module's routes are implemented
 * (next build phase) they get added to the list below.
 *
 * Example once a module exists:
 *   const authRoutes = require('./modules/auth/auth.routes');
 *   router.use('/auth', authRoutes);
 */
const router = Router();

// --- Health check ---
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', service: 'medicare-backend', time: new Date().toISOString() },
  });
});

/**
 * Module route registration. app.js never changes when a new module
 * lands — only this list does. `departments` is a sub-resource of the
 * doctors module but mounted at its own top-level path for clean URLs.
 */
const moduleRoutes = [
  { path: '/auth', loader: () => require('./modules/auth/auth.routes') },
  { path: '/clinics', loader: () => require('./modules/clinics/clinics.routes') },
  { path: '/users', loader: () => require('./modules/users/users.routes') },
  { path: '/doctors', loader: () => require('./modules/doctors/doctors.routes') },
  { path: '/departments', loader: () => require('./modules/doctors/departments.routes') },
  { path: '/patients', loader: () => require('./modules/patients/patients.routes') },
  { path: '/appointments', loader: () => require('./modules/appointments/appointments.routes') },
  { path: '/records', loader: () => require('./modules/records/records.routes') },
  { path: '/payments', loader: () => require('./modules/payments/payments.routes') },
  { path: '/subscriptions', loader: () => require('./modules/subscriptions/subscriptions.routes') },
  { path: '/notifications', loader: () => require('./modules/notifications/notifications.routes') },
  { path: '/analytics', loader: () => require('./modules/analytics/analytics.routes') },
];

moduleRoutes.forEach(({ path, loader }) => {
  router.use(path, loader());
});

module.exports = router;
