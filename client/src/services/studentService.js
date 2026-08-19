import api from './api.js';

/**
 * The student portal's transport layer.
 *
 * Components never touch `api` directly: a route or payload change stays a
 * one-file edit. Every method returns the unwrapped payload, since the response
 * interceptor has already peeled the `{ success, data, meta }` envelope.
 */
export const studentService = {
  /** Profile plus completion, guidance and eligibility, in one call. */
  getProfile: () => api.get('/students/me/profile').then((r) => r.data),

  /**
   * Saves part of a profile.
   *
   * A patch, always — the wizard saves one step at a time and the profile page
   * edits one card at a time, and the server merges leaf paths so an untouched
   * section is left alone rather than cleared.
   */
  updateProfile: (patch) => api.patch('/students/me/profile', patch).then((r) => r.data),

  getDashboard: (signal) => api.get('/students/me/dashboard', { signal }).then((r) => r.data),

  /** Ranked recommendations. Returns `{ items, meta }` — meta carries the total. */
  getRecommendations: (params = {}, signal) =>
    api.get('/students/me/recommendations', { params, signal }).then((r) => ({ items: r.data, meta: r.meta })),

  getShortlist: (signal) => api.get('/students/me/shortlist', { signal }).then((r) => r.data),
  addToShortlist: (courseId) => api.post(`/students/me/shortlist/${courseId}`).then((r) => r.data),
  removeFromShortlist: (courseId) => api.delete(`/students/me/shortlist/${courseId}`).then((r) => r.data),
};

export default studentService;
