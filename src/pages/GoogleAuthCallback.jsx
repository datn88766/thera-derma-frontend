import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLang } from '@/lib/LanguageContext';
import { auth } from '@/api/entities';
import { getBlogUrl } from '@/lib/blogUrl';
import { toast } from 'sonner';

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkUserAuth } = useAuth();
  const { t } = useLang();
  const [message, setMessage] = useState(t.auth.googleCompleting);

  useEffect(() => {
    const code = searchParams.get('code');
    const from = searchParams.get('from');
    const error = searchParams.get('error');

    if (error) {
      setMessage(t.auth.googleCancelled);
      toast.error(t.auth.googleCancelled);
      navigate('/login', { replace: true });
      return;
    }

    if (!code) {
      setMessage(t.auth.googleMissingCode);
      toast.error(t.auth.googleMissingCode);
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const user = await auth.completeGoogleOAuth(code);
        if (cancelled) return;
        await checkUserAuth();
        toast.success(t.auth.googleSuccess);

        const ssoReturnTo = sessionStorage.getItem('ssoReturnTo');
        if (ssoReturnTo) {
          sessionStorage.removeItem('ssoReturnTo');
          try {
            const parsed = new URL(ssoReturnTo);
            const blogOrigin = new URL(getBlogUrl()).origin;
            if (parsed.origin === blogOrigin) {
              const crossCode = await auth.issueCrossDomainCode();
              parsed.searchParams.set('code', crossCode);
              window.location.replace(parsed.toString());
              return;
            }
          } catch { /* fall through to default redirect */ }
        }

        if (from && from.startsWith('/') && !from.startsWith('//')) {
          navigate(from, { replace: true });
          return;
        }
        if (user.role === 'admin') navigate('/admin', { replace: true });
        else if (user.role === 'staff') navigate('/staff', { replace: true });
        else navigate('/customer', { replace: true });
      } catch (err) {
        if (cancelled) return;
        setMessage(err.message || t.auth.googleFailed);
        toast.error(err.message || t.auth.googleFailed);
        navigate('/login', { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate, checkUserAuth, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
