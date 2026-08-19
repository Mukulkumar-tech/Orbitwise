import axios from 'axios';

/**
 * The single Axios instance for the whole client.
 *
 * `withCredentials` is required: the refresh token lives in an httpOnly cookie
 * the browser must attach automatically. The short-lived access token is held in
 * memory only (see AuthContext) and never touches localStorage, so an XSS
 * payload has nothing persistent to steal.
 */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

/** Normalized client-side error, so no component reaches into error.response.data. */
export class ApiClientError extends Error {
  constructor(message, { status = 0, errors = null, isNetworkError = false } = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = errors;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Auth hooks, populated once by AuthProvider.
 *
 * Kept as mutable module state rather than a second interceptor so that token
 * injection, silent refresh and error normalization all live in one ordered
 * pass. Axios runs response interceptors in registration order, so splitting
 * them would mean the refresh logic received an already-normalized error with
 * no `config` left to retry.
 */
const authHooks = {
  getAccessToken: () => null,
  refresh: null,
  onAuthFailure: () => {},
};

export const configureAuth = (hooks) => Object.assign(authHooks, hooks);

const AUTH_FREE_PATHS = ['/auth/refresh', '/auth/login', '/auth/register'];

api.interceptors.request.use((config) => {
  const token = authHooks.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  // Unwrap the { success, data, meta } envelope once, here, so callers receive
  // the payload directly while `meta` stays reachable for paginated lists.
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'success' in body) {
      return { data: body.data, meta: body.meta ?? null, raw: response };
    }
    return { data: body, meta: null, raw: response };
  },

  async (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const { config, response } = error;

    // ─── Silent refresh-and-retry ───────────────────────────────────────
    // An expired 15-minute access token should be invisible to the user: swap
    // it and replay the request. Attempted at most once per request, and never
    // for the refresh call itself, so a dead session cannot loop.
    const isAuthFree = AUTH_FREE_PATHS.some((path) => config?.url?.includes(path));
    if (response?.status === 401 && config && !config.__retried && !isAuthFree && authHooks.refresh) {
      config.__retried = true;
      try {
        const token = await authHooks.refresh();
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
        return await api(config);
      } catch {
        authHooks.onAuthFailure();
        return Promise.reject(new ApiClientError('Your session has expired. Please sign in again.', { status: 401 }));
      }
    }

    if (!response) {
      return Promise.reject(
        new ApiClientError(
          error.code === 'ECONNABORTED'
            ? 'That request took too long. Please try again.'
            : 'Cannot reach the server. Check your connection and try again.',
          { isNetworkError: true }
        )
      );
    }

    return Promise.reject(
      new ApiClientError(response.data?.message || 'Something went wrong', {
        status: response.status,
        errors: response.data?.errors ?? null,
      })
    );
  }
);

export default api;
