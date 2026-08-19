import { useContext } from 'react';
import { AuthContext } from '../context/authContext.js';

/**
 * Access the current session.
 *
 * Throws rather than returning null when used outside the provider — a silent
 * undefined would surface much later as a confusing "cannot read property role
 * of null" somewhere unrelated.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

export default useAuth;
