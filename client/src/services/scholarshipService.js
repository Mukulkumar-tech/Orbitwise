import api from './api.js';

/**
 * Scholarships and the planning tools.
 *
 * The list endpoint personalizes itself when a student is signed in — the access
 * token rides along automatically — so one call serves both the public page and
 * the portal, and `meta.personalized` says which happened.
 */
export const scholarshipService = {
  list: (params = {}, signal) =>
    api.get('/scholarships', { params, signal }).then((r) => ({ items: r.data, meta: r.meta })),

  get: (slug, signal) => api.get(`/scholarships/${slug}`, { signal }).then((r) => r.data),

  deadlines: (signal) => api.get('/scholarships/deadlines', { signal }).then((r) => r.data),
};

export const toolsService = {
  costPrefill: (params = {}, signal) =>
    api.get('/tools/cost-calculator/prefill', { params, signal }).then((r) => r.data),

  calculateCost: (payload) => api.post('/tools/cost-calculator', payload).then((r) => r.data),
};

export default scholarshipService;
