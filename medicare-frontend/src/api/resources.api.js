import api from "./client";

/**
 * Resource API services, grouped by backend module. Every method
 * returns the unwrapped `data` payload; list responses also carry a
 * non-enumerable `_meta` for pagination.
 */

// --- Subscriptions / plans (used by the public Pricing page) -------
export const subscriptionApi = {
  listPlans: () => api.get("/subscriptions/plans"),
  upsertPlan: (body) => api.post("/subscriptions/plans", body),
  subscribe: (planTier) => api.post("/subscriptions/subscribe", { planTier }),
  mySubscription: () => api.get("/subscriptions/me"),
};

// --- Clinics (super-admin) -----------------------------------------
export const clinicApi = {
  list: (params) => api.get("/clinics", { params }),
  get: (id) => api.get(`/clinics/${id}`),
  create: (body) => api.post("/clinics", body),
  update: (id, body) => api.patch(`/clinics/${id}`, body),
  deactivate: (id) => api.delete(`/clinics/${id}`),
};

// --- Staff / users (clinic-admin) ----------------------------------
export const userApi = {
  list: (params) => api.get("/users", { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (body) => api.post("/users", body),
  update: (id, body) => api.patch(`/users/${id}`, body),
  deactivate: (id) => api.delete(`/users/${id}`),
};

// --- Departments ----------------------------------------------------
export const departmentApi = {
  list: () => api.get("/departments"),
  create: (body) => api.post("/departments", body),
  remove: (id) => api.delete(`/departments/${id}`),
};

// --- Doctors --------------------------------------------------------
export const doctorApi = {
  list: (params) => api.get("/doctors", { params }),
  get: (id) => api.get(`/doctors/${id}`),
  update: (id, body) => api.patch(`/doctors/${id}`, body),
  setAvailability: (id, slots) =>
    api.put(`/doctors/${id}/availability`, { slots }),
  slots: (id, date) => api.get(`/doctors/${id}/slots`, { params: { date } }),
  addBlockedDate: (id, body) => api.post(`/doctors/${id}/blocked-dates`, body),
  removeBlockedDate: (id, blockedId) =>
    api.delete(`/doctors/${id}/blocked-dates/${blockedId}`),
};

// --- Patients -------------------------------------------------------
export const patientApi = {
  list: (params) => api.get("/patients", { params }),
  get: (id) => api.get(`/patients/${id}`),
  register: (body) => api.post("/patients", body),
  update: (id, body) => api.patch(`/patients/${id}`, body),
  history: (id) => api.get(`/patients/${id}/history`),
};

// --- Appointments ---------------------------------------------------
export const appointmentApi = {
  list: (params) => api.get("/appointments", { params }),
  get: (id) => api.get(`/appointments/${id}`),
  hold: (body) => api.post("/appointments/hold", body),
  confirm: (id, body = {}) => api.post(`/appointments/${id}/confirm`, body),
  reschedule: (id, startTime) =>
    api.patch(`/appointments/${id}/reschedule`, { startTime }),
  cancel: (id, reason) => api.patch(`/appointments/${id}/cancel`, { reason }),
  complete: (id) => api.patch(`/appointments/${id}/complete`),
  noShow: (id) => api.patch(`/appointments/${id}/no-show`),
  walkIn: (body) => api.post("/appointments/walk-in", body),
};

// --- Records (EMR) --------------------------------------------------
export const recordApi = {
  createRecord: (appointmentId, body) =>
    api.post(`/records/${appointmentId}`, body),
  getRecord: (appointmentId) => api.get(`/records/${appointmentId}`),
  uploadUrl: (appointmentId, body) =>
    api.post(`/records/${appointmentId}/upload-url`, body),
  createPrescription: (appointmentId, body) =>
    api.post(`/records/${appointmentId}/prescription`, body),
  getPrescription: (appointmentId) =>
    api.get(`/records/${appointmentId}/prescription`),
};

// --- Payments -------------------------------------------------------
export const paymentApi = {
  createOrder: (appointmentId) =>
    api.post("/payments/order", { appointmentId }),
  verify: (body) => api.post("/payments/verify", body),
  get: (id) => api.get(`/payments/${id}`),
  refund: (id, reason) => api.post(`/payments/${id}/refund`, { reason }),
};

// --- Notifications --------------------------------------------------
export const notificationApi = {
  list: (params) => api.get("/notifications", { params }),
  unreadCount: () => api.get("/notifications/unread-count"),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};

// --- Analytics ------------------------------------------------------
export const analyticsApi = {
  clinic: (params) => api.get("/analytics/clinic", { params }),
  platform: (params) => api.get("/analytics/platform", { params }),
  exportClinic: (params) =>
    api.get("/analytics/clinic/export", { params, responseType: "blob" }),
};
