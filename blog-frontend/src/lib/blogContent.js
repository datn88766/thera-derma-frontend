import {
  Sparkles,
  Microscope,
  Zap,
  Sun,
  HeartPulse,
  CalendarDays,
  BookOpen,
  Stethoscope,
} from 'lucide-react';

export const HERO_IMAGE = '/blog/hero-thera-derma.jpg';

export const TOPIC_FILTERS = [
  { id: 'all', labelVi: 'Tất cả', labelEn: 'All' },
  { id: 'news', labelVi: 'Điều trị da', labelEn: 'Skin treatment', category: 'news' },
  { id: 'announcement', labelVi: 'Công nghệ', labelEn: 'Technology', category: 'announcement' },
  { id: 'laser', labelVi: 'Laser', labelEn: 'Laser', search: 'laser' },
  { id: 'rejuvenation', labelVi: 'Trẻ hóa', labelEn: 'Rejuvenation', search: 'trẻ hóa' },
  { id: 'knowledge', labelVi: 'Kiến thức y khoa', labelEn: 'Medical knowledge', category: 'knowledge' },
  { id: 'event', labelVi: 'Sự kiện', labelEn: 'Events', category: 'event' },
];

export const CATEGORY_SHOWCASE = [
  { id: 'melasma', labelVi: 'Điều trị nám', labelEn: 'Melasma care', icon: Sun, filter: 'news', search: 'nám' },
  { id: 'acne', labelVi: 'Điều trị mụn', labelEn: 'Acne treatment', icon: HeartPulse, filter: 'news', search: 'mụn' },
  { id: 'laser-tech', labelVi: 'Công nghệ laser', labelEn: 'Laser technology', icon: Zap, filter: 'laser' },
  { id: 'rejuvenation', labelVi: 'Trẻ hóa da', labelEn: 'Skin rejuvenation', icon: Sparkles, filter: 'rejuvenation' },
  { id: 'skincare', labelVi: 'Chăm sóc da', labelEn: 'Skincare', icon: BookOpen, filter: 'news' },
  { id: 'research', labelVi: 'Nghiên cứu y khoa', labelEn: 'Medical research', icon: Microscope, filter: 'knowledge' },
];

export const POPULAR_TAGS = [
  { vi: 'Laser', en: 'Laser' },
  { vi: 'Nám', en: 'Melasma' },
  { vi: 'Mụn', en: 'Acne' },
  { vi: 'Trẻ hóa', en: 'Rejuvenation' },
  { vi: 'Da liễu', en: 'Dermatology' },
  { vi: 'Thera Derma', en: 'Thera Derma' },
];

export function estimateReadingTime(text) {
  const words = String(text || '')
    .replace(/[#*![\]()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatCount(n, lang = 'vi') {
  const num = Number(n) || 0;
  if (num >= 1000) {
    const locale = lang === 'en' ? 'en-US' : 'vi-VN';
    return new Intl.NumberFormat(locale).format(num);
  }
  return `${num}`;
}

export function resolveFilterQuery(activeFilter, debouncedSearch) {
  const chip = TOPIC_FILTERS.find((f) => f.id === activeFilter);
  if (chip?.search) {
    return { category: undefined, search: chip.search };
  }
  if (chip?.category) {
    return { category: chip.category, search: debouncedSearch || undefined };
  }
  if (activeFilter !== 'all') {
    return { category: activeFilter, search: debouncedSearch || undefined };
  }
  return { category: undefined, search: debouncedSearch || undefined };
}

export function getCategoryBadge(categorySlug, lang) {
  const key = String(categorySlug || 'news').toLowerCase();
  const map = {
    announcement: { vi: 'Công nghệ', en: 'Technology', tone: 'bg-luxury-gold/15 text-luxury-charcoal' },
    event: { vi: 'Sự kiện', en: 'Event', tone: 'bg-luxury-sage/25 text-luxury-charcoal' },
    scholarship: { vi: 'Ưu đãi', en: 'Offers', tone: 'bg-luxury-ivory text-luxury-charcoal border border-luxury-sage/30' },
    news: { vi: 'Điều trị da', en: 'Treatment', tone: 'bg-luxury-charcoal/10 text-luxury-charcoal' },
    knowledge: { vi: 'Kiến thức', en: 'Knowledge', tone: 'bg-luxury-sage/20 text-luxury-charcoal' },
  };
  const item = map[key] || map.news;
  return { label: lang === 'en' ? item.en : item.vi, tone: item.tone };
}

export function StethoscopeIcon() {
  return Stethoscope;
}

export { CalendarDays };
