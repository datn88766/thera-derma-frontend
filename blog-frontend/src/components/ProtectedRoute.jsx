import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getHomeUrl } from '@/lib/homeUrl';

export default function ProtectedRoute({ children, roles = ['admin'] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (loading || user) return;
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(location.pathname + location.search)}`;
    const ssoUrl = `${getHomeUrl()}/auth/sso?returnTo=${encodeURIComponent(callbackUrl)}`;
    window.location.replace(ssoUrl);
  }, [loading, user, location]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
