import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest, setTokens } from '@/api/client';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/admin/newsroom';
    const safeNext = next.startsWith('/') ? next : '/admin/newsroom';

    if (!code) {
      window.location.replace(`/admin/login`);
      return;
    }

    apiRequest('/auth/google/complete', {
      method: 'POST',
      body: { code },
    })
      .then((data) => {
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        window.location.replace(safeNext);
      })
      .catch(() => {
        window.location.replace('/admin/login');
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );
}
