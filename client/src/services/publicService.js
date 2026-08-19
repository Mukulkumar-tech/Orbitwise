import api from './api.js';

export const publicService = {
  /** Stats, destinations, featured universities and testimonials in one request. */
  home: () => api.get('/public/home').then((r) => r.data),

  testimonials: (params) => api.get('/public/testimonials', { params }).then((r) => r.data),

  country: (slug) => api.get(`/public/countries/${slug}`).then((r) => r.data),

  university: (slug) => api.get(`/public/universities/${slug}`).then((r) => r.data),

  submitEnquiry: (payload) => api.post('/public/enquiries', payload).then((r) => r.data),
};

export default publicService;
