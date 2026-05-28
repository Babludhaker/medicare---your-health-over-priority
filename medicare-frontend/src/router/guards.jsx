import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_HOME } from '@/lib/constants';
import { PageLoader } from '@/components/ui/Card';

/**
 * ProtectedRoute — gates a subtree behind authentication.
 *
 * While the session is still resolving (bootstrap in flight) it shows
 * a loader rather than flashing the login page. Unauthenticated users
 * are redirected to /login with the attempted path preserved in
 * location state, so they return there after signing in.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isResolving } = useAuth();
  const location = useLocation();

  if (isResolving) {
    return (
      <div className="min-h-screen">
        <PageLoader label="Checking your session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return children;
}

/**
 * RoleRoute — gates a subtree behind one or more roles.
 *
 * Assumes it sits inside a ProtectedRoute (so the user is already
 * authenticated). A user whose role isn't allowed is redirected to
 * their own role's home dashboard instead of seeing a dead end.
 */
export function RoleRoute({ allow = [], children }) {
  const { role } = useAuth();
  const allowed = Array.isArray(allow) ? allow : [allow];

  if (!role || !allowed.includes(role)) {
    return <Navigate to={ROLE_HOME[role] || '/app'} replace />;
  }

  return children;
}

/**
 * GuestOnlyRoute — for auth pages (login, register, …). If the user is
 * already signed in, send them to their dashboard instead.
 */
export function GuestOnlyRoute({ children }) {
  const { isAuthenticated, isResolving, role } = useAuth();

  if (isResolving) {
    return (
      <div className="min-h-screen">
        <PageLoader label="Loading…" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={ROLE_HOME[role] || '/app'} replace />;
  }

  return children;
}
