import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

/**
 * Gates a route by role, on top of ProtectedRoute's auth check. Used for
 * Branding & Analytics Management, which per spec only super_admin and
 * admin may reach — a logged-in viewer is redirected to the dashboard
 * rather than shown a broken/empty page.
 */
export function RequireRole({ roles, children }) {
  const { user } = useAuth();

  if (user && !roles.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
