import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';
import { PATHS } from '../constants/routes.js';
import RouteLoader from './RouteLoader.jsx';

/**
 * Gate for any authenticated area.
 *
 * Renders nothing decisive while the bootstrap refresh is in flight — without
 * that wait, every reload would bounce a signed-in user to /login for the
 * fraction of a second before their session is restored.
 *
 * The attempted URL is preserved in location state so that signing in returns
 * the user to where they were headed rather than dumping them on a dashboard.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <RouteLoader />;

  if (!isAuthenticated) {
    return <Navigate to={PATHS.login} state={{ from: location }} replace />;
  }

  return children ?? <Outlet />;
}
