import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

/**
 * Route guard.
 * - Not logged in  -> redirect to /login?from=<current path>
 * - Logged in but role not in `roles` -> redirect to /unauthorized
 * - `roles` omitted -> any authenticated user may pass
 */
export default function ProtectedRoute({ roles, fallback = <DefaultFallback /> }) {
  const { isAuthenticated, isLoadingAuth, authChecked, user } = useAuth();
  const location = useLocation();

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (!isAuthenticated) {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?from=${from}`} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
