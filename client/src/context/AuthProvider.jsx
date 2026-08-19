import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { configureAuth } from '../services/api.js';
import authService from '../services/authService.js';
import { ROLES } from '../constants/routes.js';
import { hasSessionHint } from '../utils/cookies.js';
import { AuthContext, AUTH_STATUS } from './authContext.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(AUTH_STATUS.LOADING);

  /**
   * The access token lives in a ref, not state.
   *
   * It is read synchronously by the request interceptor on every call, and a
   * token swap must never trigger a re-render — that would remount the tree
   * mid-request during a silent refresh.
   */
  const accessTokenRef = useRef(null);

  /** De-dupes concurrent refreshes: ten parallel 401s must cause one refresh. */
  const refreshPromiseRef = useRef(null);

  const applySession = useCallback((session) => {
    accessTokenRef.current = session.accessToken;
    setUser(session.user);
    setStatus(AUTH_STATUS.AUTHENTICATED);
    return session;
  }, []);

  const clearSession = useCallback(() => {
    accessTokenRef.current = null;
    setUser(null);
    setStatus(AUTH_STATUS.ANONYMOUS);
  }, []);

  const runRefresh = useCallback(() => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = authService
        .refresh()
        .then((session) => applySession(session).accessToken)
        .catch((error) => {
          clearSession();
          throw error;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }
    return refreshPromiseRef.current;
  }, [applySession, clearSession]);

  // Hand the interceptors their hooks before any request can fire.
  useMemo(() => {
    configureAuth({
      getAccessToken: () => accessTokenRef.current,
      refresh: runRefresh,
      onAuthFailure: clearSession,
    });
  }, [runRefresh, clearSession]);

  /**
   * Bootstrap: restore a session from the httpOnly refresh cookie.
   *
   * This is what keeps a page reload signed in without ever persisting a token
   * where JavaScript could read it. The session-hint check skips the request
   * entirely for visitors who have no session to restore, which is most traffic
   * on the public site.
   */
  useEffect(() => {
    if (!hasSessionHint()) {
      setStatus(AUTH_STATUS.ANONYMOUS);
      return undefined;
    }

    let cancelled = false;
    runRefresh()
      .catch(() => {}) // An expired cookie is a normal outcome, not an error.
      .finally(() => {
        if (!cancelled) {
          setStatus((prev) => (prev === AUTH_STATUS.LOADING ? AUTH_STATUS.ANONYMOUS : prev));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [runRefresh]);

  const login = useCallback(
    async (credentials) => applySession(await authService.login(credentials)),
    [applySession]
  );

  const register = useCallback(
    async (payload) => applySession(await authService.register(payload)),
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Local state clears even if the network call fails — a user who clicks
      // "sign out" must end up signed out of this browser regardless.
      clearSession();
    }
  }, [clearSession]);

  /** Re-reads the user after a profile or verification change. */
  const reloadUser = useCallback(async () => {
    const { user: fresh } = await authService.me();
    setUser(fresh);
    return fresh;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === AUTH_STATUS.LOADING,
      isAuthenticated: status === AUTH_STATUS.AUTHENTICATED,
      isStudent: user?.role === ROLES.STUDENT,
      isCounsellor: user?.role === ROLES.COUNSELLOR,
      isAdmin: user?.role === ROLES.ADMIN,
      login,
      register,
      logout,
      reloadUser,
      setUser,
    }),
    [user, status, login, register, logout, reloadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
