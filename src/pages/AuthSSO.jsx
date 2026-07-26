import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/api/entities';
import { getBlogUrl } from '@/lib/blogUrl';

function isTrustedReturnTo(url) {
  try {
    const parsed = new URL(url);
    const blogOrigin = new URL(getBlogUrl()).origin;
    return parsed.origin === blogOrigin;
  } catch {
    return false;
  }
}

export default function AuthSSO() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoadingAuth, authChecked } = useAuth();
  const returnTo = searchParams.get('returnTo');

  useEffect(() => {
    if (isLoadingAuth || !authChecked) return;

    if (!returnTo || !isTrustedReturnTo(returnTo)) {
      window.location.replace('/');
      return;
    }

    if (!isAuthenticated) {
      window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    auth.issueCrossDomainCode()
      .then((code) => {
        const url = new URL(returnTo);
        url.searchParams.set('code', code);
        window.location.replace(url.toString());
      })
      .catch(() => {
        window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      });
  }, [isLoadingAuth, authChecked, isAuthenticated, returnTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );
}
