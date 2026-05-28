/**
 * Query key factory.
 *
 * Centralising keys keeps caching predictable and makes invalidation
 * precise — a mutation can invalidate `qk.clinics.all` to refresh
 * every clinic list regardless of its page/filter params.
 *
 * Convention: `.all` is the broad prefix for a domain; `.list(params)`
 * and `.detail(id)` are specific. Invalidating a prefix invalidates
 * everything nested under it.
 */
export const qk = {
  clinics: {
    all: ['clinics'],
    list: (params) => ['clinics', 'list', params],
    detail: (id) => ['clinics', 'detail', id],
  },
  plans: {
    all: ['plans'],
    list: () => ['plans', 'list'],
  },
  subscription: {
    all: ['subscription'],
    mine: () => ['subscription', 'mine'],
  },
  staff: {
    all: ['staff'],
    list: (params) => ['staff', 'list', params],
  },
  departments: {
    all: ['departments'],
    list: () => ['departments', 'list'],
  },
  doctors: {
    all: ['doctors'],
    list: (params) => ['doctors', 'list', params],
    detail: (id) => ['doctors', 'detail', id],
    slots: (id, date) => ['doctors', 'slots', id, date],
  },
  patients: {
    all: ['patients'],
    list: (params) => ['patients', 'list', params],
    detail: (id) => ['patients', 'detail', id],
    history: (id) => ['patients', 'history', id],
  },
  appointments: {
    all: ['appointments'],
    list: (params) => ['appointments', 'list', params],
    detail: (id) => ['appointments', 'detail', id],
  },
  records: {
    all: ['records'],
    record: (appointmentId) => ['records', 'record', appointmentId],
    prescription: (appointmentId) => [
      'records',
      'prescription',
      appointmentId,
    ],
  },
  notifications: {
    all: ['notifications'],
    list: (params) => ['notifications', 'list', params],
    unreadCount: () => ['notifications', 'unread-count'],
  },
  analytics: {
    all: ['analytics'],
    clinic: (params) => ['analytics', 'clinic', params],
    platform: (params) => ['analytics', 'platform', params],
  },
};
