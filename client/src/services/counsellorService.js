import api from './api.js';

/**
 * Counsellor portal reads.
 *
 * Every path says `me`. There is no endpoint that takes an arbitrary counsellor
 * id, and the student detail route is scoped server-side to the caller's own
 * caseload — so the id in the URL grants nothing by itself.
 */
export const counsellorService = {
  dashboard: (signal) => api.get('/counsellors/me/dashboard', { signal }).then((r) => r.data),
  students: (signal) => api.get('/counsellors/me/students', { signal }).then((r) => r.data),
  student: (studentId, signal) => api.get(`/counsellors/me/students/${studentId}`, { signal }).then((r) => r.data),
  reviewQueue: (signal) => api.get('/counsellors/me/review-queue', { signal }).then((r) => r.data),
  updateProfile: (patch) => api.patch('/counsellors/me/profile', patch).then((r) => r.data),
};

/** Appointments — shared by both roles; the API scopes results by who is asking. */
export const appointmentService = {
  listCounsellors: (signal) => api.get('/appointments/counsellors', { signal }).then((r) => r.data),

  availability: (counsellorUserId, date, signal) =>
    api.get(`/appointments/availability/${counsellorUserId}`, { params: { date }, signal }).then((r) => r.data),

  list: (params = {}, signal) => api.get('/appointments', { params, signal }).then((r) => r.data),

  book: (payload) => api.post('/appointments', payload).then((r) => r.data),

  setStatus: (id, payload) => api.patch(`/appointments/${id}/status`, payload).then((r) => r.data),

  reschedule: (id, startsAt) => api.patch(`/appointments/${id}/reschedule`, { startsAt }).then((r) => r.data),
};

/** Document review — the counsellor half of the Phase 10 workflow. */
export const reviewService = {
  review: (documentId, payload) => api.patch(`/documents/${documentId}/review`, payload).then((r) => r.data),
  fileUrl: (documentId) => `/api/documents/${documentId}/file`,
};

export default counsellorService;
