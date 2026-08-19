import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';
import { PATHS } from '../constants/routes.js';
import RouteLoader from './RouteLoader.jsx';

/**
 * Restricts a route group to specific roles.
 *
 * A signed-in user with the wrong role is sent to an explicit 403 page rather
 * than silently redirected: a counsellor who clicks an admin link deserves to
 * know the link was forbidden, not to wonder why they keep landing on their own
 * dashboard. Signed-out users still go to login, since that is fixable.
 *
 * This is convenience and clarity only — the API enforces the same rules with
 * `authorize()`, because client-side routing is not a security boundary.
 */
export default function RoleRoute({ roles = [], children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <RouteLoader />;

  if (!isAuthenticated) {
    return <Navigate to={PATHS.login} state={{ from: location }} replace />;
  }

  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to={PATHS.forbidden} replace />;
  }

  return children ?? <Outlet />;
}
