import api from './api.js';

export const applicationService = {
  list: (params = {}, signal) => api.get('/applications', { params, signal }).then((r) => r.data),

  stats: (signal) => api.get('/applications/stats', { signal }).then((r) => r.data),

  get: (id, signal) => api.get(`/applications/${id}`, { signal }).then((r) => r.data),

  /** Starts an application. `matchScore` is stored on the snapshot for later comparison. */
  create: (payload) => api.post('/applications', payload).then((r) => r.data),

  transition: (id, payload) => api.patch(`/applications/${id}/status`, payload).then((r) => r.data),

  addNote: (id, payload) => api.post(`/applications/${id}/notes`, payload).then((r) => r.data),
};

export default applicationService;
