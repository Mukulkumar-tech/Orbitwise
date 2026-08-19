import api from './api.js';

/**
 * Thin transport layer over the auth API.
 *
 * Components never call `api` directly — they go through a service, so a route
 * or payload change is a one-file edit rather than a codebase-wide search.
 */
export const authService = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (credentials) => api.post('/auth/login', credentials).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  refresh: () => api.post('/auth/refresh').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),

  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`).then((r) => r.data),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }).then((r) => r.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then((r) => r.data),
  changePassword: (payload) => api.post('/auth/change-password', payload).then((r) => r.data),
};

export default authService;
