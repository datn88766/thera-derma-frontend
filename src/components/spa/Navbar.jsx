import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Menu, X, LayoutDashboard, ChevronDown, User, LogOut } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const BLOG_URL = import.meta.env.VITE_BLOG_URL || 'http://blog.localhost:5174';

const SECTION_IDS = ['hero', 'services', 'academy', 'philosophy', 'contact'];

const LABELS = {
  en: {
    home: 'Home',
    services: 'Services',
    academy: 'Science',
    philosophy: 'Philosophy',
    contact: 'Contact',
    blog: 'Blog',
    signIn: 'Sign In',
    book: 'Book Consultation',
    dashboard: 'Dashboard',
    profile: 'Profile',
    logout: 'Sign Out',
  },
  vi: {
    home: 'Trang chủ',
    services: 'Dịch vụ',
    academy: 'Khoa học',
    philosophy: 'Triết lý',
    contact: 'Liên hệ',
    blog: 'Blog',
    signIn: 'Đăng nhập',
    book: 'Đặt lịch tư vấn',
    dashboard: 'Dashboard',
    profile: 'Hồ sơ',
    logout: 'Đăng xuất',
  },
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { lang, setLang } = useLang();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const isHome = location.pathname === '/';
  const isBlog = location.pathname.startsWith('/blog');
  const labels = LABELS[lang] || LABELS.en;

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'staff'
        ? '/staff'
        : user?.role === 'customer'
          ? '/customer'
          : null;

  const navLinks = [
    { key: 'home', href: '#hero' },
    { key: 'services', href: '#services' },
    { key: 'academy', href: '#academy' },
    { key: 'philosophy', href: '#philosophy' },
    { key: 'contact', href: '#contact' },
    { key: 'blog', href: BLOG_URL, route: true, external: true },
  ];

  const updateScroll = useCallback(() => {
    setScrolled(window.scrollY > 24);
    if (!isHome) return;

    const offset = 120;
    let current = 'hero';
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= offset) {
        current = id;
      }
    }
    setActiveSection(current);
  }, [isHome]);

  useEffect(() => {
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, [updateScroll]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollTo = (href) => {
    setMobileOpen(false);
    const id = href.replace('#', '');
    if (!isHome) {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 350);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(id);
  };

  const isLinkActive = (link) => {
    if (link.route) return isBlog;
    if (!isHome) return false;
    return activeSection === link.href.replace('#', '');
  };

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : '?';

  const NavItem = ({ link, mobile = false }) => {
    const active = isLinkActive(link);
    const label = labels[link.key];

    if (link.route) {
      const className = `relative font-nav text-[13px] font-medium tracking-[0.02em] transition-colors duration-200 ${
        mobile ? 'block px-4 py-3.5 rounded-xl' : 'px-4 py-2 rounded-full'
      } ${active ? 'text-foreground' : 'text-foreground/55 hover:text-foreground'}`;
      if (link.external) {
        return (
          <a href={link.href} onClick={() => setMobileOpen(false)} className={className}>
            <span className="relative z-10">{label}</span>
          </a>
        );
      }
      return (
        <Link
          to={link.href}
          onClick={() => setMobileOpen(false)}
          className={className}
        >
          {active && !mobile && (
            <motion.span
              layoutId="nav-pill"
              className="absolute inset-0 rounded-full bg-foreground/[0.07]"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            />
          )}
          <span className="relative z-10">{label}</span>
          <span
            className={`absolute bottom-1 left-4 right-4 h-px bg-foreground/30 origin-left transition-transform duration-200 ${
              active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
            }`}
          />
        </Link>
      );
    }

    return (
      <a
        href={link.href}
        onClick={(e) => {
          e.preventDefault();
          scrollTo(link.href);
        }}
        className={`group relative font-nav text-[13px] font-medium tracking-[0.02em] transition-colors duration-200 ${
          mobile ? 'block px-4 py-3.5 rounded-xl' : 'px-4 py-2 rounded-full'
        } ${active ? 'text-foreground' : 'text-foreground/55 hover:text-foreground'}`}
      >
        {active && !mobile && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 rounded-full bg-foreground/[0.07]"
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          />
        )}
        <span className="relative z-10">{label}</span>
        <span
          className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 h-px bg-foreground/25 transition-all duration-200 ${
            active ? 'w-3/4' : 'w-0 group-hover:w-3/4'
          }`}
        />
      </a>
    );
  };

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-5 md:px-8 pt-6 pointer-events-none"
      >
        <motion.div
          animate={{
            height: scrolled ? 64 : 80,
            backdropFilter: scrolled ? 'blur(28px)' : 'blur(22px)',
          }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-auto mx-auto flex max-w-[1440px] items-center justify-between gap-4 rounded-[24px] px-5 md:px-8 lg:px-10 transition-[background,box-shadow,border-color] duration-300 ${
            scrolled ? 'navbar-glass-scrolled' : 'navbar-glass'
          }`}
          style={{ WebkitBackdropFilter: scrolled ? 'blur(28px)' : 'blur(22px)' }}
        >
          {/* Logo */}
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              if (isHome) scrollTo('#hero');
              else navigate('/');
            }}
            className="flex-shrink-0 font-heading text-[1.65rem] md:text-[1.75rem] italic font-light tracking-[-0.02em] text-foreground leading-none"
          >
            Thera Derma
          </a>

          {/* Center nav — desktop */}
          <LayoutGroup>
            <nav className="hidden lg:flex flex-1 items-center justify-center gap-0.5">
              {navLinks.map((link) => (
                <NavItem key={link.key} link={link} />
              ))}
            </nav>
          </LayoutGroup>

          {/* Right actions — desktop */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            {/* Language */}
            <div className="flex items-center rounded-full border border-foreground/10 bg-white/30 p-0.5 text-[11px] font-nav font-medium tracking-widest">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-full transition-all duration-200 ${
                  lang === 'en' ? 'bg-foreground/8 text-foreground' : 'text-foreground/45 hover:text-foreground/70'
                }`}
              >
                EN
              </button>
              <span className="text-foreground/20">|</span>
              <button
                type="button"
                onClick={() => setLang('vi')}
                className={`px-2.5 py-1 rounded-full transition-all duration-200 ${
                  lang === 'vi' ? 'bg-foreground/8 text-foreground' : 'text-foreground/45 hover:text-foreground/70'
                }`}
              >
                VI
              </button>
            </div>

            {user && dashboardPath && (
              <Link
                to={dashboardPath}
                className="hidden xl:flex items-center gap-1.5 px-3 py-2 text-[13px] font-nav font-medium text-foreground/55 hover:text-foreground transition-colors duration-200"
              >
                <LayoutDashboard size={14} />
                {labels.dashboard}
              </Link>
            )}

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-foreground/10 bg-white/25 px-2 py-1.5 hover:bg-white/40 transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-full bg-[#C9D8CF]/60 text-[var(--sage-dark)] flex items-center justify-center text-xs font-semibold font-nav">
                    {userInitial}
                  </div>
                  <ChevronDown
                    size={13}
                    className={`text-foreground/50 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/50 bg-white/85 backdrop-blur-xl shadow-xl overflow-hidden font-nav"
                    >
                      <div className="px-4 py-3 border-b border-foreground/8">
                        <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
                        <p className="text-xs text-foreground/50 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/customer"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground/80 hover:bg-foreground/5 transition-colors"
                      >
                        <User size={14} />
                        {labels.profile}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600/90 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} />
                        {labels.logout}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2.5 text-[13px] font-nav font-medium text-foreground/70 hover:text-foreground border border-transparent hover:border-foreground/12 rounded-2xl hover:bg-white/30 transition-all duration-200"
              >
                {labels.signIn}
              </Link>
            )}

            <a
              href="#booking"
              onClick={(e) => {
                e.preventDefault();
                scrollTo('booking');
              }}
              className="group relative px-5 py-2.5 text-[13px] font-nav font-medium text-[var(--sage-dark)] rounded-2xl bg-[#C9D8CF] shadow-[0_4px_14px_rgba(61,74,66,0.12)] hover:shadow-[0_8px_24px_rgba(61,74,66,0.18)] hover:-translate-y-0.5 transition-all duration-200"
            >
              {labels.book}
            </a>
          </div>

          {/* Mobile toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <a
              href="#booking"
              onClick={(e) => {
                e.preventDefault();
                scrollTo('booking');
              }}
              className="px-3.5 py-2 text-xs font-nav font-medium text-[var(--sage-dark)] rounded-xl bg-[#C9D8CF]"
            >
              {lang === 'vi' ? 'Đặt lịch' : 'Book'}
            </a>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl text-foreground/70 hover:bg-foreground/5 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </motion.div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-foreground/15 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-50 w-[min(100%,320px)] navbar-glass-scrolled backdrop-blur-2xl border-l border-white/40 shadow-2xl flex flex-col font-nav"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-foreground/8">
                <span className="font-heading text-xl italic font-light">Thera Derma</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-foreground/5">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
                {navLinks.map((link) => (
                  <NavItem key={link.key} link={link} mobile />
                ))}
              </div>
              <div className="p-5 border-t border-foreground/8 space-y-3">
                <div className="flex justify-center gap-1 rounded-full border border-foreground/10 p-1 text-xs font-medium">
                  <button type="button" onClick={() => setLang('en')} className={`flex-1 py-2 rounded-full ${lang === 'en' ? 'bg-foreground/8' : ''}`}>EN</button>
                  <button type="button" onClick={() => setLang('vi')} className={`flex-1 py-2 rounded-full ${lang === 'vi' ? 'bg-foreground/8' : ''}`}>VI</button>
                </div>
                {!user ? (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center py-3 border border-foreground/12 rounded-2xl text-sm font-medium"
                  >
                    {labels.signIn}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="w-full py-3 text-sm text-red-600 border border-red-100 rounded-2xl"
                  >
                    {labels.logout}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
