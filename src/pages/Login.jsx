import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useLang } from '@/lib/LanguageContext';
import AuthLangSwitcher from '@/components/auth/AuthLangSwitcher';
import { auth } from '@/api/entities';
import { getBlogUrl } from '@/lib/blogUrl';
import { SITE_IMAGES } from '@/shared/constants/siteImages';
import { toast } from 'sonner';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.6 3.5-5.5 3.5-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2 6.8 2.2 2.5 6.5 2.5 11.7S6.8 21.2 12 21.2c6.9 0 8.6-4.8 8.6-7.2 0-.5 0-.9-.1-1.3H12z" />
      <path fill="#34A853" d="M3.7 14.7l3.2 2.3c.9 2.1 3 3.6 5.1 3.6 1.5 0 2.8-.5 3.8-1.3l3.9 3C17.1 20.3 14.7 21.2 12 21.2c-5.2 0-9.5-4.3-9.5-9.5 0-1.3.3-2.6.8-3.7z" />
      <path fill="#4A90E2" d="M3.7 7.3C2.9 9.1 2.5 11 2.5 11.7c0 .7.4 2.6 1.2 4.4l3.2-2.3c-.2-.6-.3-1.2-.3-1.9 0-.7.1-1.3.3-1.9L3.7 7.3z" />
      <path fill="#FBBC05" d="M12 6.5c1.3 0 2.2.6 2.7 1.1l2-2C15.1 4.3 13.7 3.7 12 3.7c-2.7 0-5 1.4-6.3 3.6l3.2 2.3c.7-1.3 2-2.1 3.1-2.1z" />
    </svg>
  );
}

const inputClass =
  'h-12 rounded-full pl-11 pr-4 bg-background/80 border-border/70 font-body shadow-sm focus-visible:ring-primary/30';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLang();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectByRole = async (user) => {
    const returnTo = searchParams.get('returnTo');
    if (returnTo) {
      try {
        const parsed = new URL(returnTo);
        const blogOrigin = new URL(getBlogUrl()).origin;
        if (parsed.origin === blogOrigin) {
          const code = await auth.issueCrossDomainCode();
          parsed.searchParams.set('code', code);
          window.location.href = parsed.toString();
          return;
        }
      } catch { /* ignore invalid URLs */ }
    }
    const from = searchParams.get('from');
    if (from && from.startsWith('/') && !from.startsWith('//')) {
      navigate(from);
      return;
    }
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'staff') navigate('/staff');
    else navigate('/customer');
  };

  const finishLogin = async (user) => {
    toast.success(t.auth.loginSuccess);
    await redirectByRole(user);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t.auth.fillRequired);
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      finishLogin(user);
    } catch (error) {
      toast.error(error.message || t.auth.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const returnTo = searchParams.get('returnTo');
    if (returnTo) sessionStorage.setItem('ssoReturnTo', returnTo);
    const from = searchParams.get('from');
    window.location.href = auth.getGoogleOAuthStartUrl(from || '');
  };

  const registerTo = `/register${searchParams.get('from') ? `?from=${encodeURIComponent(searchParams.get('from'))}` : ''}`;

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0">
        <img src={SITE_IMAGES.login} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/92 via-background/75 to-background/55" />
        <div className="absolute inset-0 bg-foreground/10 backdrop-blur-[1px]" />
      </div>

      <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          {t.auth.backHome}
        </Link>
        <AuthLangSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="rounded-3xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-2xl px-8 py-10 md:px-10 md:py-12">
          <h1 className="font-heading italic font-light text-4xl text-foreground text-center mb-8">
            {t.auth.welcome}
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="text-sm font-medium text-foreground mb-2 block font-body">
                {t.auth.email}
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.auth.emailPlaceholder}
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="text-sm font-medium text-foreground mb-2 block font-body">
                {t.auth.password}
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.auth.passwordPlaceholder}
                  disabled={loading}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => toast.message(t.auth.forgotPasswordHint)}
                  className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 font-body"
                >
                  {t.auth.forgotPassword}
                </button>
              </div>
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card/90 px-3 text-xs text-muted-foreground font-body">
                  {t.auth.orContinueWith}
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                aria-label={t.auth.googleLogin}
                className="w-12 h-12 rounded-full border border-border/70 bg-background flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-all duration-300 disabled:opacity-50 shadow-sm"
              >
                <GoogleIcon />
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-wide text-sm font-body shadow-md transition-all duration-300 disabled:opacity-60 mt-2"
            >
              {loading ? t.auth.loggingIn : t.auth.login}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground font-body">
            {t.auth.noAccount}{' '}
            <Link
              to={registerTo}
              className="text-primary font-medium underline underline-offset-2 hover:text-primary/80"
            >
              {t.auth.registerNow}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
