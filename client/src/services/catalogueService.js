import api from './api.js';

/**
 * Catalogue reads.
 *
 * These endpoints are public but personalize themselves when a student is signed
 * in — the access token rides along automatically — so the same call powers the
 * marketing site and the portal.
 */
export const catalogueService = {
  /**
   * Every enum the onboarding wizard renders, in one request.
   *
   * Fetched rather than hardcoded: a destination added server-side appears in the
   * wizard without a client release, and the two lists cannot drift into a 400.
   */
  getOptions: (signal) => api.get('/options', { signal }).then((r) => r.data),

  listCountries: (signal) => api.get('/countries', { signal }).then((r) => r.data),

  listUniversities: (params = {}, signal) =>
    api.get('/universities', { params, signal }).then((r) => ({ items: r.data, meta: r.meta })),

  listCourses: (params = {}, signal) =>
    api.get('/courses', { params, signal }).then((r) => ({ items: r.data, meta: r.meta })),

  getCourse: (slug, signal) => api.get(`/courses/${slug}`, { signal }).then((r) => r.data),
};

export default catalogueService;
