import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { getHomeUrl } from '@/lib/homeUrl';

const C = {
  bg:           '#050505',
  surface:      '#0F0F0F',
  card2:        '#1A1A1A',
  text:         '#FFFFFF',
  muted:        '#A0A0A0',
  accent:       '#D4AF37',
  accentFaint:  'rgba(212,175,55,0.10)',
  accentBorder: 'rgba(212,175,55,0.22)',
  border:       'rgba(255,255,255,0.08)',
  dim:          'rgba(255,255,255,0.65)',
};

const NAV_LINKS = [
  { id: 'featured',   vi: 'Nổi bật',    en: 'Featured' },
  { id: 'articles',   vi: 'Bài viết',   en: 'Articles' },
  { id: 'categories', vi: 'Chuyên mục', en: 'Topics'   },
];

export default function BlogNavbar({ canManageNews }) {
  const { lang } = useLang();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const homePath     = lang === 'en' ? '/en' : '/';
  const otherLangPath = lang === 'en' ? '/' : '/en';

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      {/* ── Sticky bar ── */}
      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background:           scrolled ? 'rgba(5,5,5,0.96)' : 'rgba(5,5,5,0.72)',
          backdropFilter:       'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom:         `1px solid ${scrolled ? C.accentBorder : C.border}`,
        }}
      >
        {/* Height: 64px mobile / 72px tablet / 80px desktop */}
        <div className="flex items-center justify-between max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 h-16 md:h-[72px] lg:h-20">

          {/* Left */}
          <div className="flex items-center gap-3">
            <a
              href={getHomeUrl()}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
              style={{ background: C.accentFaint }}
              aria-label={lang === 'vi' ? 'Về trang chủ Thera Derma' : 'Back to Thera Derma'}
            >
              <ArrowLeft className="w-[15px] h-[15px]" style={{ color: C.accent }} />
            </a>
            <Link to={homePath} className="flex flex-col">
              <span
                className="font-heading text-[1.05rem] lg:text-[1.1rem] leading-none tracking-tight"
                style={{ color: C.text }}
              >
                Thera Derma
              </span>
              <span
                className="text-[7.5px] uppercase tracking-[0.24em] mt-[3px]"
                style={{ color: C.accent }}
              >
                Journal
              </span>
            </Link>

            {/* Desktop-only nav */}
            <nav className="hidden lg:flex items-center gap-7 ml-5" aria-label="Blog navigation">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.id}
                  to={`${homePath}#${item.id}`}
                  className="text-[13px] font-medium transition-colors hover:text-white focus:outline-none focus:underline"
                  style={{ color: C.muted }}
                >
                  {lang === 'vi' ? item.vi : item.en}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <Link
              to={otherLangPath + location.search}
              className="hidden sm:flex items-center justify-center h-9 px-3 rounded-full text-[11px] font-semibold transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
              style={{ background: C.card2, color: C.muted }}
            >
              {lang === 'vi' ? 'EN' : 'VI'}
            </Link>

            {canManageNews && (
              <Link
                to="/admin/newsroom"
                className="hidden md:flex items-center justify-center h-9 px-3 rounded-full text-[11px] font-semibold transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
                style={{ background: C.card2, color: C.muted }}
              >
                Admin
              </Link>
            )}

            <Link
              to={homePath}
              className="hidden sm:flex items-center justify-center h-9 px-4 rounded-full text-[11px] font-bold transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
              style={{ background: C.accent, color: '#050505' }}
            >
              {lang === 'vi' ? 'Đọc thêm' : 'More articles'}
            </Link>

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden flex flex-col items-center justify-center w-9 h-9 gap-[5px] rounded-full transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
              style={{ background: C.card2 }}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
            >
              <span className="w-[18px] h-[1.5px] rounded-full block" style={{ background: C.text }} />
              <span className="w-[18px] h-[1.5px] rounded-full block" style={{ background: C.text }} />
              <span className="w-[12px] h-[1.5px] rounded-full block self-end" style={{ background: C.muted }} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60]"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.nav
              role="dialog"
              aria-modal="true"
              aria-label={lang === 'vi' ? 'Menu điều hướng' : 'Navigation menu'}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-72 flex flex-col"
              style={{ background: C.surface, borderLeft: `1px solid ${C.border}` }}
            >
              <div
                className="flex items-center justify-between px-5 h-16 flex-shrink-0"
                style={{ borderBottom: `1px solid ${C.border}` }}
              >
                <span className="font-heading text-[0.95rem] tracking-tight" style={{ color: C.text }}>
                  Thera Derma Journal
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
                  style={{ background: C.card2 }}
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" style={{ color: C.muted }} />
                </button>
              </div>

              <div className="flex flex-col px-4 py-4 gap-1">
                {NAV_LINKS.map((item) => (
                  <Link
                    key={item.id}
                    to={`${homePath}#${item.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center h-12 px-4 rounded-xl text-[15px] font-medium transition-colors hover:bg-white/5 focus:outline-none focus:bg-white/5"
                    style={{ color: C.text }}
                  >
                    {lang === 'vi' ? item.vi : item.en}
                  </Link>
                ))}
              </div>

              <div className="mx-4" style={{ height: 1, background: C.border }} />

              <div className="flex flex-col px-4 py-4 gap-2.5">
                <Link
                  to={otherLangPath + location.search}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center h-11 rounded-xl text-[13px] font-medium transition-opacity hover:opacity-75"
                  style={{ background: C.card2, color: C.muted }}
                >
                  {lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
                </Link>
                <Link
                  to={homePath}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center h-11 rounded-xl text-[13px] font-bold transition-all hover:brightness-110"
                  style={{ background: C.accent, color: '#050505' }}
                >
                  {lang === 'vi' ? 'Đọc thêm' : 'More articles'}
                </Link>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
