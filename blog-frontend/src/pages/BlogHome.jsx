import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Mail,
  Search,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { newsService } from '@/api/blogService';
import { resolvePublicUploadsUrl } from '@/api/apiUrl';
import { formatNewsDate } from '@/lib/newsDate';
import { useLang } from '@/lib/i18n';
import { useStaffAuth } from '@/lib/AuthContext';
import { notify } from '@/lib/notify';
import { getHomeUrl } from '@/lib/homeUrl';
import {
  TOPIC_FILTERS,
  CATEGORY_SHOWCASE,
  estimateReadingTime,
  formatCount,
  resolveFilterQuery,
  getCategoryBadge,
} from '@/lib/blogContent';

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg:           '#050505',
  surface:      '#0F0F0F',
  card:         '#151515',
  card2:        '#1A1A1A',
  text:         '#FFFFFF',
  muted:        '#A0A0A0',
  accent:       '#D4AF37',
  accentFaint:  'rgba(212,175,55,0.10)',
  accentBorder: 'rgba(212,175,55,0.22)',
  border:       'rgba(255,255,255,0.08)',
  dim:          'rgba(255,255,255,0.65)',
  dim2:         'rgba(255,255,255,0.38)',
};

// ─── Static data ─────────────────────────────────────────────────────────────
const EXPERTS = [
  { id: 'e1', name: 'BS. Nguyễn Thị Lan',  nameEn: 'Dr. Nguyen Thi Lan',  specialty: 'Da liễu thẩm mỹ', specialtyEn: 'Aesthetic Dermatology', articles: 24, ini: 'NL', hue: '#1a2a1a' },
  { id: 'e2', name: 'BS. Trần Minh Khoa',  nameEn: 'Dr. Tran Minh Khoa',  specialty: 'Laser & Công nghệ',  specialtyEn: 'Laser Technology',       articles: 18, ini: 'TK', hue: '#2a1e14' },
  { id: 'e3', name: 'BS. Phạm Thu Hương',  nameEn: 'Dr. Pham Thu Huong',  specialty: 'Trẻ hóa da',         specialtyEn: 'Skin Rejuvenation',       articles: 31, ini: 'PH', hue: '#1e2030' },
  { id: 'e4', name: 'BS. Lê Văn Đức',      nameEn: 'Dr. Le Van Duc',      specialty: 'Điều trị mụn',       specialtyEn: 'Acne Treatment',          articles: 15, ini: 'LD', hue: '#2a1e28' },
];

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

// ─── Atom components ──────────────────────────────────────────────────────────
function Thumb({ item, className = '' }) {
  const src = item?.thumbnail_url ? resolvePublicUploadsUrl(item.thumbnail_url) : '';
  return src ? (
    <img
      src={src}
      alt={item.title}
      className={`object-cover w-full h-full ${className}`}
      loading="lazy"
    />
  ) : (
    <div
      className={`w-full h-full flex items-center justify-center ${className}`}
      style={{ background: 'linear-gradient(135deg, #0f1a2e 0%, #1a0f1e 100%)' }}
    >
      <span className="text-5xl opacity-[0.06]">✦</span>
    </div>
  );
}

function GoldTag({ children }) {
  return (
    <span
      className="inline-flex items-center rounded-full font-semibold uppercase tracking-wide text-[9px] px-2.5 py-1 whitespace-nowrap"
      style={{ background: C.accentFaint, color: C.accent, border: `1px solid ${C.accentBorder}` }}
    >
      {children}
    </span>
  );
}

function MinRead({ item }) {
  const min = estimateReadingTime(`${item.title || ''} ${item.excerpt || ''} ${item.content || ''}`);
  return (
    <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: C.muted }}>
      <Clock3 className="w-3 h-3" />
      {min} min
    </span>
  );
}

function SecHead({ title, action, onAction }) {
  return (
    <div className="flex items-end justify-between mb-6 md:mb-8">
      <h2
        className="font-heading font-normal leading-[1.2]"
        style={{ color: C.text, fontSize: 'clamp(1.625rem, 1.3rem + 1vw, 2.5rem)' }}
      >
        {title}
      </h2>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap ml-4 transition-opacity hover:opacity-70 focus:outline-none focus:underline"
          style={{ color: C.accent }}
        >
          {action}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { id: 'featured',   vi: 'Nổi bật',    en: 'Featured' },
  { id: 'articles',   vi: 'Bài viết',   en: 'Articles' },
  { id: 'categories', vi: 'Chuyên mục', en: 'Topics'   },
];

function Header({ lang, canManageNews, onSearch }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const otherLang = lang === 'en' ? '/' : '/en';

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
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
          background: scrolled ? 'rgba(5,5,5,0.96)' : 'rgba(5,5,5,0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${scrolled ? C.accentBorder : C.border}`,
        }}
      >
        {/* Height: 64px mobile / 72px tablet / 80px desktop */}
        <div className="flex items-center justify-between max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 h-16 md:h-[72px] lg:h-20">

          {/* Left: logo + desktop nav */}
          <div className="flex items-center gap-3">
            <a
              href={getHomeUrl()}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
              style={{ background: C.accentFaint }}
              aria-label={lang === 'vi' ? 'Về trang chủ Thera Derma' : 'Back to Thera Derma'}
            >
              <ArrowLeft className="w-[15px] h-[15px]" style={{ color: C.accent }} />
            </a>
            <Link to={lang === 'en' ? '/en' : '/'} className="flex flex-col">
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

            {/* Desktop-only nav links */}
            <nav className="hidden lg:flex items-center gap-7 ml-5" aria-label="Primary navigation">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-[13px] font-medium transition-colors hover:text-white focus:outline-none focus:underline"
                  style={{ color: C.muted }}
                >
                  {lang === 'vi' ? item.vi : item.en}
                </a>
              ))}
            </nav>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              type="button"
              onClick={onSearch}
              className="flex items-center justify-center w-9 h-9 rounded-full transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
              style={{ background: C.accentFaint }}
              aria-label="Search"
            >
              <Search className="w-[15px] h-[15px]" style={{ color: C.dim }} />
            </button>

            <Link
              to={otherLang + (location.search || '')}
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

            <a
              href="#articles"
              className="hidden sm:flex items-center justify-center h-9 px-4 rounded-full text-[11px] font-bold transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
              style={{ background: C.accent, color: '#050505' }}
            >
              {lang === 'vi' ? 'Đọc ngay' : 'Read'}
            </a>

            {/* Hamburger – mobile / tablet only */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden flex flex-col items-center justify-center w-9 h-9 gap-[5px] rounded-full transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
              style={{ background: C.card2 }}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-drawer"
            >
              <span className="w-[18px] h-[1.5px] rounded-full block" style={{ background: C.text }} />
              <span className="w-[18px] h-[1.5px] rounded-full block" style={{ background: C.text }} />
              <span className="w-[12px] h-[1.5px] rounded-full block self-end" style={{ background: C.muted }} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer (from right) ── */}
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
              id="mobile-drawer"
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
              {/* Drawer header */}
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

              {/* Nav links */}
              <div className="flex flex-col px-4 py-4 gap-1">
                {NAV_LINKS.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center h-12 px-4 rounded-xl text-[15px] font-medium transition-colors hover:bg-white/5 focus:outline-none focus:bg-white/5"
                    style={{ color: C.text }}
                  >
                    {lang === 'vi' ? item.vi : item.en}
                  </a>
                ))}
              </div>

              <div className="mx-4" style={{ height: 1, background: C.border }} />

              {/* CTAs */}
              <div className="flex flex-col px-4 py-4 gap-2.5">
                <Link
                  to={otherLang}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center h-11 rounded-xl text-[13px] font-medium transition-opacity hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
                  style={{ background: C.card2, color: C.muted }}
                >
                  {lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
                </Link>
                <a
                  href="#articles"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center h-11 rounded-xl text-[13px] font-bold transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
                  style={{ background: C.accent, color: '#050505' }}
                >
                  {lang === 'vi' ? 'Đọc ngay' : 'Read now'}
                </a>
                {canManageNews && (
                  <Link
                    to="/admin/newsroom"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center h-11 rounded-xl text-[13px] font-medium transition-opacity hover:opacity-75"
                    style={{ background: C.card2, color: C.muted }}
                  >
                    Admin
                  </Link>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Hero section ─────────────────────────────────────────────────────────────
function HeroSection({ item, lang }) {
  if (!item) {
    return (
      <div
        className="w-full animate-pulse h-[500px] md:h-[60vh] lg:h-[70vh] lg:min-h-[600px] lg:max-h-[800px]"
        style={{ background: C.card }}
      />
    );
  }

  const badge = getCategoryBadge(item.categorySlug || item.category, lang);

  return (
    <Link
      to={`/${item.slug}`}
      className="block relative w-full overflow-hidden group"
      aria-label={item.title}
    >
      {/* Responsive height */}
      <div className="relative w-full overflow-hidden h-[500px] md:h-[60vh] lg:h-[70vh] lg:min-h-[600px] lg:max-h-[800px]">

        {/* Background image */}
        {item.thumbnail_url ? (
          <img
            src={resolvePublicUploadsUrl(item.thumbnail_url)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            fetchPriority="high"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #0f1a2e 0%, #2d1f2e 50%, #0f1a1a 100%)' }}
          />
        )}

        {/* Gradient overlays per spec */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, transparent 65%)' }}
        />

        {/* Content — center-left */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full px-6 md:px-12 lg:px-20">
            <div className="max-w-full md:max-w-[600px] lg:max-w-[720px]">

              {/* Meta pills */}
              <div className="flex items-center gap-3 mb-4">
                <GoldTag>{badge.label}</GoldTag>
                <span
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px]"
                  style={{ background: 'rgba(5,5,5,0.65)', color: C.dim, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                >
                  <Sparkles className="w-3 h-3 flex-shrink-0" style={{ color: C.accent }} />
                  Featured
                </span>
              </div>

              {/* Title — H1 responsive */}
              <h1
                className="font-heading font-bold leading-[1.2] mb-4"
                style={{ color: C.text, fontSize: 'clamp(1.75rem, 1.1rem + 2.8vw, 3.5rem)' }}
              >
                {item.title}
              </h1>

              {/* Excerpt */}
              {item.excerpt && (
                <p
                  className="leading-[1.7] line-clamp-2 mb-6"
                  style={{ color: C.dim, fontSize: 'clamp(0.9375rem, 0.85rem + 0.35vw, 1.125rem)', maxWidth: 480 }}
                >
                  {item.excerpt}
                </p>
              )}

              {/* Author + date + CTA row */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-bold"
                    style={{ background: C.accentFaint, color: C.accent, border: `1.5px solid ${C.accentBorder}` }}
                  >
                    {(item.authorName || 'T')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none truncate" style={{ color: C.text }}>
                      {item.authorName || 'Thera Derma'}
                    </p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: C.dim2 }}>
                      {formatNewsDate(item.created_at)}
                    </p>
                  </div>
                </div>

                <MinRead item={item} />

                <span
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all hover:brightness-110 active:scale-[0.97]"
                  style={{ background: C.accent, color: '#050505' }}
                >
                  {lang === 'vi' ? 'Đọc bài viết' : 'Read article'}
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Search bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, lang, inputRef }) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: C.muted }}
        />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={lang === 'vi' ? 'Tìm kiếm bài viết...' : 'Search articles...'}
          className="w-full h-12 pl-11 pr-4 text-sm focus:outline-none transition-colors"
          style={{ background: C.card2, color: C.text, borderRadius: 16, border: `1px solid ${C.border}` }}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.accentBorder; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = C.border; }}
        />
      </div>
      <button
        type="button"
        className="w-12 h-12 flex-shrink-0 flex items-center justify-center transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
        style={{ background: C.card2, borderRadius: 16, border: `1px solid ${C.border}` }}
        aria-label="Filter"
      >
        <Filter className="w-4 h-4" style={{ color: C.muted }} />
      </button>
    </div>
  );
}

// ─── Category pills ───────────────────────────────────────────────────────────
function CategoryPills({ active, onChange, lang }) {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
      <div className="flex gap-2 pb-1 w-max">
        {TOPIC_FILTERS.map((chip) => {
          const on = active === chip.id;
          return (
            <motion.button
              key={chip.id}
              type="button"
              onClick={() => onChange(chip.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="flex-shrink-0 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
              style={{
                height:       40,
                padding:      '0 16px',
                borderRadius: 999,
                background:   on ? C.accent : C.card2,
                color:        on ? '#050505' : C.muted,
                border:       `1px solid ${on ? C.accent : C.border}`,
                fontSize:     13,
                fontWeight:   on ? 700 : 500,
              }}
            >
              {lang === 'en' ? chip.labelEn : chip.labelVi}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Featured card (3-col grid) ───────────────────────────────────────────────
function FeaturedCard({ item, lang, saved, onSave }) {
  if (!item) return null;
  const badge = getCategoryBadge(item.categorySlug || item.category, lang);

  return (
    <motion.div
      className="group relative overflow-hidden h-full flex flex-col"
      style={{ borderRadius: 20, background: C.card }}
      whileHover={{ y: -8, boxShadow: '0 32px 64px rgba(0,0,0,0.45)' }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link to={`/${item.slug}`} className="flex flex-col flex-1">
        {/* Image */}
        <div
          className="relative w-full overflow-hidden flex-shrink-0"
          style={{ aspectRatio: '16/9', borderRadius: '20px 20px 0 0' }}
        >
          <Thumb item={item} className="transition-transform duration-500 group-hover:scale-105" />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(21,21,21,0.85) 0%, transparent 60%)' }}
          />
          <div className="absolute top-3 left-3">
            <GoldTag>{badge.label}</GoldTag>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 flex flex-col flex-1">
          <h3
            className="font-heading font-normal leading-snug line-clamp-2 mb-2 flex-1"
            style={{ color: C.text, fontSize: 'clamp(1rem, 0.9rem + 0.35vw, 1.25rem)' }}
          >
            {item.title}
          </h3>
          {item.excerpt && (
            <p className="text-[13px] leading-[1.7] line-clamp-2 mb-4" style={{ color: C.muted }}>
              {item.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between gap-2 mt-auto">
            <div className="flex items-center gap-2 min-w-0">
              <MinRead item={item} />
              <span style={{ color: C.dim2 }}>·</span>
              <span className="text-[11px] truncate" style={{ color: C.dim2 }}>
                {formatNewsDate(item.created_at)}
              </span>
            </div>
            {item.authorName && (
              <span className="text-[11px] font-medium truncate max-w-[100px]" style={{ color: C.muted }}>
                {item.authorName}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Bookmark */}
      <button
        type="button"
        onClick={() => onSave(item.id)}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
        style={{ background: 'rgba(5,5,5,0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        aria-label={saved ? 'Remove bookmark' : 'Bookmark article'}
      >
        {saved ? (
          <BookmarkCheck className="w-4 h-4" style={{ color: C.accent }} />
        ) : (
          <Bookmark className="w-4 h-4" style={{ color: C.dim }} />
        )}
      </button>
    </motion.div>
  );
}

// ─── Editorial carousel card ──────────────────────────────────────────────────
function EditorialCard({ item, lang }) {
  const badge = getCategoryBadge(item.categorySlug || item.category, lang);
  return (
    <Link
      to={`/${item.slug}`}
      className="relative flex-shrink-0 overflow-hidden block group"
      style={{ width: 240, borderRadius: 20 }}
    >
      <div className="relative" style={{ height: 320 }}>
        <Thumb item={item} className="transition-transform duration-500 group-hover:scale-105" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(5,5,5,0.96) 0%, rgba(5,5,5,0.3) 55%, transparent 100%)' }}
        />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <GoldTag>{badge.label}</GoldTag>
          <h3
            className="font-heading font-normal mt-2 leading-snug line-clamp-3"
            style={{ color: C.text, fontSize: '1.05rem' }}
          >
            {item.title}
          </h3>
          <div className="mt-2">
            <MinRead item={item} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Latest article card (grid-based, replaces list FeedItem) ─────────────────
function LatestCard({ item, lang }) {
  const badge = getCategoryBadge(item.categorySlug || item.category, lang);
  return (
    <motion.div variants={fadeUp} className="group">
      <Link
        to={`/${item.slug}`}
        className="block overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
        style={{ borderRadius: 16, background: C.card }}
      >
        <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <Thumb item={item} className="transition-transform duration-500 group-hover:scale-105" />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(21,21,21,0.8) 0%, transparent 60%)' }}
          />
          <div className="absolute top-3 left-3">
            <GoldTag>{badge.label}</GoldTag>
          </div>
        </div>
        <div className="p-4">
          <h4
            className="font-heading font-normal leading-snug line-clamp-2 mb-2.5"
            style={{ color: C.text, fontSize: '1rem' }}
          >
            {item.title}
          </h4>
          <div className="flex items-center gap-2">
            <MinRead item={item} />
            <span style={{ color: C.dim2 }}>·</span>
            <span className="text-[11px]" style={{ color: C.dim2 }}>
              {formatNewsDate(item.created_at)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function LatestCardSkeleton() {
  return (
    <div className="overflow-hidden animate-pulse" style={{ borderRadius: 16, background: C.card }}>
      <div style={{ aspectRatio: '16/9', background: C.card2 }} />
      <div className="p-4 space-y-2">
        <div className="h-3 rounded" style={{ background: C.card2, width: '40%' }} />
        <div className="h-4 rounded" style={{ background: C.card2 }} />
        <div className="h-4 rounded" style={{ background: C.card2, width: '70%' }} />
        <div className="h-3 rounded mt-3" style={{ background: C.card2, width: '55%' }} />
      </div>
    </div>
  );
}

// ─── Expert card ──────────────────────────────────────────────────────────────
function ExpertCard({ expert, lang }) {
  return (
    <div className="flex-shrink-0 flex flex-col items-center text-center p-4 md:p-5" style={{ width: 140 }}>
      <div
        className="w-16 h-16 rounded-full mb-3 flex items-center justify-center text-lg font-bold"
        style={{ background: expert.hue, color: C.text, border: `2px solid ${C.accentBorder}` }}
      >
        {expert.ini}
      </div>
      <p className="text-[13px] font-semibold leading-tight mb-0.5" style={{ color: C.text }}>
        {lang === 'en' ? expert.nameEn : expert.name}
      </p>
      <p className="text-[11px] mb-3" style={{ color: C.muted }}>
        {lang === 'en' ? expert.specialtyEn : expert.specialty}
      </p>
      <div className="flex items-center gap-1 mb-3">
        <Star className="w-3 h-3" style={{ color: C.accent }} fill={C.accent} />
        <span className="text-[11px] font-medium" style={{ color: C.accent }}>
          {expert.articles} {lang === 'vi' ? 'bài' : 'posts'}
        </span>
      </div>
      <span
        className="text-[11px] font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-opacity hover:opacity-75"
        style={{ background: C.accentFaint, color: C.accent, border: `1px solid ${C.accentBorder}` }}
      >
        {lang === 'vi' ? 'Xem hồ sơ' : 'Profile'}
      </span>
    </div>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────
function CatCard({ cat, lang, onClick }) {
  const Icon = cat.icon;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="flex flex-col items-center justify-center p-5 lg:p-6 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
      style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: C.accentFaint }}
      >
        <Icon className="w-5 h-5" style={{ color: C.accent }} />
      </div>
      <span className="text-[13px] font-semibold leading-tight text-center" style={{ color: C.text }}>
        {lang === 'en' ? cat.labelEn : cat.labelVi}
      </span>
    </motion.button>
  );
}

// ─── Container helper ─────────────────────────────────────────────────────────
function Container({ children, className = '' }) {
  return (
    <div className={`max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BlogHome() {
  const { lang } = useLang();
  const { isAuthenticated, user } = useStaffAuth();

  const [active, setActive] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort]  = useState('newest');
  const [page, setPage] = useState(1);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [saved, setSaved] = useState(new Set());
  const searchRef = useRef(null);
  const limit = 12;

  const canManageNews = isAuthenticated && ['admin', 'staff'].includes(user?.role);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 450);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [active]);

  const filterQuery = useMemo(
    () => resolveFilterQuery(active, debouncedSearch),
    [active, debouncedSearch],
  );

  const { data: newsData, isLoading } = useQuery({
    queryKey: ['news-list', lang, active, debouncedSearch, sort, page],
    queryFn: () =>
      newsService.listNews({
        lang,
        status: 'published',
        limit,
        page,
        category: filterQuery.category,
        search:   filterQuery.search,
        sort,
      }),
    keepPreviousData: true,
  });

  const { data: featuredPool = [] } = useQuery({
    queryKey: ['news-featured-pool', lang],
    queryFn: async () => {
      const res = await newsService.listNews({ lang, status: 'published', limit: 12, sort: 'newest' });
      return res.data || [];
    },
  });

  const { data: popularNewsData = [] } = useQuery({
    queryKey: ['news-popular', lang],
    queryFn: async () => {
      const res = await newsService.listNews({ lang, status: 'published', limit: 8, sort: 'popular' });
      return res.data || [];
    },
  });

  const newsItems     = newsData?.data || [];
  const totalPages    = newsData?.total ? Math.ceil(newsData.total / limit) : 1;
  const totalArticles = Math.max(newsData?.total || 0, featuredPool.length);
  const totalViews    = featuredPool.reduce((sum, x) => sum + (x.views || 0), 0);

  const featuredPosts = useMemo(() => {
    const fl = featuredPool.filter((p) => p.is_featured || p.isFeatured);
    return (fl.length >= 3 ? fl : featuredPool).slice(0, 5);
  }, [featuredPool]);

  const heroPost      = featuredPosts[0] || featuredPool[0] || null;
  const featuredCards = featuredPosts.slice(1, 4);
  const editorialItems = [...popularNewsData].slice(0, 6);

  const toggleSave = (id) =>
    setSaved((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    notify.success({
      title:       lang === 'vi' ? 'Đã đăng ký nhận tin' : 'Subscribed!',
      description: lang === 'vi'
        ? 'Cảm ơn bạn — kiến thức da liễu đang trên đường đến.'
        : 'Thank you — weekly insights are on the way.',
    });
    setNewsletterEmail('');
  };

  const toArticles = () => document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen overflow-x-hidden font-body" style={{ background: C.bg, color: C.text }}>

      {/* ══ HEADER ══ */}
      <Header lang={lang} canManageNews={canManageNews} onSearch={() => searchRef.current?.focus()} />

      {/* ══ HERO ══ */}
      {/* Offset for sticky header: 64px mobile / 72px tablet / 80px desktop */}
      <div className="pt-16 md:pt-[72px] lg:pt-20">
        <HeroSection item={heroPost} lang={lang} />
      </div>

      {/* ══ STATS STRIP ══ */}
      <div style={{ borderBottom: `1px solid ${C.border}` }}>
        <Container className="flex items-center justify-around py-5 md:py-6">
          {[
            [formatCount(Math.max(totalArticles, 120), lang) + '+', lang === 'vi' ? 'Bài viết'          : 'Articles'],
            [formatCount(Math.max(totalViews, 50000), lang) + '+', lang === 'vi' ? 'Lượt đọc / tháng'  : 'Monthly reads'],
            ['100+',                                                lang === 'vi' ? 'Nghiên cứu'        : 'Studies'],
          ].map(([val, label]) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="font-heading text-xl md:text-2xl leading-none" style={{ color: C.accent }}>
                {val}
              </span>
              <span className="text-[10px] md:text-xs" style={{ color: C.muted }}>
                {label}
              </span>
            </div>
          ))}
        </Container>
      </div>

      {/* ══ SEARCH + CATEGORY PILLS ══ */}
      <Container className="py-6 md:py-8 space-y-4">
        <SearchBar value={search} onChange={setSearch} lang={lang} inputRef={searchRef} />
        <CategoryPills
          active={active}
          onChange={(id) => { setActive(id); toArticles(); }}
          lang={lang}
        />
      </Container>

      {/* ══ FEATURED ARTICLES ══ */}
      {featuredCards.length > 0 && (
        <section id="featured" className="pb-12 md:pb-16 lg:pb-20">
          <Container>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
            >
              <SecHead
                title={lang === 'vi' ? 'Bài Viết Nổi Bật' : 'Featured Articles'}
                action={lang === 'vi' ? 'Xem thêm' : 'See more'}
                onAction={toArticles}
              />
              {/* 1 col → 2 col → 3 col */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                {featuredCards.map((item) => (
                  <motion.div key={item.id} variants={fadeUp} className="flex">
                    <FeaturedCard
                      item={item}
                      lang={lang}
                      saved={saved.has(item.id)}
                      onSave={toggleSave}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </Container>
        </section>
      )}

      {/* ══ EDITORIAL CAROUSEL ══ */}
      {editorialItems.length > 0 && (
        <section
          className="pb-12 md:pb-16"
          style={{ borderTop: `1px solid ${C.border}`, paddingTop: 40 }}
        >
          <Container className="mb-4 md:mb-6">
            <SecHead title={lang === 'vi' ? 'Khám Phá Thêm' : 'Editorial Collection'} />
          </Container>
          {/* Carousel: scrolls past container on mobile/tablet */}
          <div className="overflow-x-auto scrollbar-hide pl-4 md:pl-6 lg:pl-8">
            <div className="flex gap-4 pb-2 w-max pr-4 md:pr-6 lg:pr-8">
              {editorialItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                >
                  <EditorialCard item={item} lang={lang} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ LATEST ARTICLES ══ */}
      <section id="articles" className="pb-12 md:pb-16 lg:pb-20">
        <Container>
          <SecHead title={lang === 'vi' ? 'Tin Mới Nhất' : 'Latest Articles'} />

          {isLoading ? (
            /* Skeleton grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }, (_, i) => <LatestCardSkeleton key={i} />)}
            </div>
          ) : newsItems.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-heading text-xl mb-2" style={{ color: C.muted }}>
                {lang === 'vi' ? 'Không tìm thấy bài viết' : 'No articles found'}
              </p>
              <p className="text-sm" style={{ color: C.dim2 }}>
                {lang === 'vi' ? 'Thử đổi bộ lọc khác.' : 'Try a different filter.'}
              </p>
            </div>
          ) : (
            <>
              {/* 1 → 2 → 3 → 4 col grid */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                variants={stagger}
              >
                {newsItems.map((item) => (
                  <LatestCard key={item.id} item={item} lang={lang} />
                ))}
              </motion.div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-10">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-30 transition-all hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
                    style={{ background: C.card2, border: `1px solid ${C.border}` }}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-[18px] h-[18px]" style={{ color: C.text }} />
                  </button>
                  <span className="text-sm font-medium px-4" style={{ color: C.muted }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-30 transition-all hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
                    style={{ background: C.card2, border: `1px solid ${C.border}` }}
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-[18px] h-[18px]" style={{ color: C.text }} />
                  </button>
                </div>
              )}
            </>
          )}
        </Container>
      </section>

      {/* ══ EXPERT CORNER ══ */}
      <section
        className="pb-12 md:pb-16"
        style={{ borderTop: `1px solid ${C.border}`, paddingTop: 40 }}
      >
        <Container className="mb-2">
          <SecHead title={lang === 'vi' ? 'Góc Chuyên Gia' : 'Expert Corner'} />
        </Container>
        <div className="overflow-x-auto scrollbar-hide pl-4 md:pl-6 lg:pl-8">
          <div className="flex pb-2 w-max gap-2 pr-4 md:pr-6 lg:pr-8">
            {EXPERTS.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} lang={lang} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ KNOWLEDGE CATEGORIES ══ */}
      <section
        id="categories"
        className="pb-12 md:pb-16 lg:pb-20"
        style={{ borderTop: `1px solid ${C.border}`, paddingTop: 40 }}
      >
        <Container>
          <SecHead title={lang === 'vi' ? 'Chuyên Mục Kiến Thức' : 'Knowledge Topics'} />
          {/* 2 → 3 → 4 → 6 col responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
            {CATEGORY_SHOWCASE.map((cat) => (
              <CatCard
                key={cat.id}
                cat={cat}
                lang={lang}
                onClick={() => {
                  if (cat.filter === 'laser' || cat.filter === 'rejuvenation') {
                    setActive(cat.filter);
                  } else if (cat.search) {
                    setActive('all');
                    setSearch(cat.search);
                  } else {
                    setActive(cat.filter || 'news');
                  }
                  toArticles();
                }}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* ══ NEWSLETTER ══ */}
      <section className="pb-16 md:pb-20">
        <Container>
          <div
            className="relative overflow-hidden p-6 md:p-10 lg:p-12"
            style={{
              borderRadius: 24,
              background: 'linear-gradient(135deg, #141510 0%, #1E1A0F 100%)',
              border: `1.5px solid ${C.accentBorder}`,
            }}
          >
            {/* Decorative glow */}
            <div
              className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)' }}
            />

            <div className="relative max-w-xl">
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: C.accentFaint }}
                >
                  <Mail className="w-4 h-4" style={{ color: C.accent }} />
                </div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: C.accent }}
                >
                  Newsletter
                </span>
              </div>

              <h3
                className="font-heading font-normal leading-snug mb-2"
                style={{ color: C.text, fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.75rem)' }}
              >
                {lang === 'vi' ? 'Kiến thức da liễu mỗi tuần' : 'Weekly dermatology insights'}
              </h3>
              <p className="text-sm mb-6 leading-[1.7]" style={{ color: C.dim }}>
                {lang === 'vi'
                  ? 'Tuyển chọn bởi chuyên gia Thera Derma — không spam, bao giờ.'
                  : 'Curated by Thera Derma experts — no spam, ever.'}
              </p>

              <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: C.muted }}
                  />
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={lang === 'vi' ? 'Email của bạn' : 'Your email'}
                    className="w-full h-12 pl-11 pr-4 text-sm focus:outline-none transition-colors"
                    style={{
                      background:   'rgba(255,255,255,0.06)',
                      color:        C.text,
                      borderRadius: 14,
                      border:       '1px solid rgba(255,255,255,0.1)',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = C.accentBorder; }}
                    onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  />
                </div>
                <button
                  type="submit"
                  className="h-12 px-6 text-sm font-bold rounded-[14px] transition-all hover:brightness-110 active:scale-[0.98] whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
                  style={{ background: C.accent, color: '#050505' }}
                >
                  {lang === 'vi' ? 'Đăng ký miễn phí' : 'Subscribe free'}
                </button>
              </form>
            </div>
          </div>
        </Container>
      </section>

      <div className="h-8" />
    </div>
  );
}
