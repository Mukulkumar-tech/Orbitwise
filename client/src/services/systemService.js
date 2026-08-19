import api from './api.js';

export const systemService = {
  health: () => api.get('/health').then((r) => r.data),
};

export default systemService;
