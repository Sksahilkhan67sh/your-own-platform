import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isAuthResolved } = useAuth();
  const location = useLocation();

  if (!isAuthResolved) {
    // Still attempting the silent refresh on first load — render nothing
    // briefly rather than flashing a redirect to login that then reverses.
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-ink-soft">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
