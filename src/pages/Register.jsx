import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { auth } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { useLang } from '@/lib/LanguageContext';
import AuthLangSwitcher from '@/components/auth/AuthLangSwitcher';
import { SITE_IMAGES } from '@/shared/constants/siteImages';
import { toast } from 'sonner';

const inputClass =
  'h-12 rounded-full pl-11 pr-4 bg-background/80 border-border/70 font-body shadow-sm focus-visible:ring-primary/30';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLang();
  const { checkUserAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error(t.auth.fillRegisterRequired);
      return;
    }
    setLoading(true);
    try {
      await auth.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        ...(form.phone ? { phone: form.phone } : {}),
      });
      await checkUserAuth();
      toast.success(t.auth.registerSuccess);
      const from = searchParams.get('from');
      if (from && from.startsWith('/') && !from.startsWith('//')) navigate(from);
      else navigate('/customer');
    } catch (error) {
      toast.error(error.message || t.auth.registerFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0">
        <img src={SITE_IMAGES.login} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/92 via-background/75 to-background/55" />
        <div className="absolute inset-0 bg-foreground/10 backdrop-blur-[1px]" />
      </div>

      <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between gap-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          {t.auth.backLogin}
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
            {t.auth.registerTitle}
          </h1>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block font-body">{t.auth.fullName}</label>
              <div className="relative">
                <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder={t.auth.namePlaceholder}
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block font-body">{t.auth.email}</label>
              <div className="relative">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={t.auth.emailPlaceholder}
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block font-body">{t.auth.phone}</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t.auth.phonePlaceholder}
                disabled={loading}
                className={`${inputClass} pl-4`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block font-body">{t.auth.password}</label>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={t.auth.passwordMinPlaceholder}
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
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-wide text-sm font-body shadow-md transition-all duration-300 disabled:opacity-60 mt-2"
            >
              {loading ? t.auth.processing : t.auth.createAccount}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground font-body">
            {t.auth.hasAccount}{' '}
            <Link to="/login" className="text-primary font-medium underline underline-offset-2 hover:text-primary/80">
              {t.auth.signIn}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
