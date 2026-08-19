import { createContext } from 'react';

/**
 * The auth context object, kept in its own non-component module.
 *
 * Splitting it from the provider and the hook is what lets Vite's fast refresh
 * work on AuthProvider.jsx: a file that mixes component and non-component
 * exports loses hot-reload for the whole module.
 */
export const AuthContext = createContext(null);

/** `loading` means the bootstrap refresh is still deciding if a session exists. */
export const AUTH_STATUS = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  ANONYMOUS: 'anonymous',
};
