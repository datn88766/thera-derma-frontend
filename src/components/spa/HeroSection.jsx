import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Star, MapPin, Users } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function HeroSection({ heroImage }) {
  const { t } = useLang();

  const scrollToServices = () => {
    const el = document.querySelector('#services');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const stats = [
    { icon: Users, label: t.hero.stat1label, sub: t.hero.stat1sub },
    { icon: Star, label: t.hero.stat2label, sub: t.hero.stat2sub },
    { icon: MapPin, label: t.hero.stat3label, sub: t.hero.stat3sub },
  ];

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
          src={heroImage}
          alt="Thera Derma luxury spa atmosphere"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full pt-32 pb-20">
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-sm tracking-[0.3em] uppercase text-muted-foreground font-medium mb-6"
          >
            {t.hero.topBadge}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="font-heading italic font-light text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight text-foreground mb-8"
          >
            {t.hero.title1}
            <br />
            {t.hero.title2}
            <br />
            <span className="text-primary">{t.hero.title3}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-lg md:text-xl font-body font-light leading-relaxed text-foreground/70 mb-10 max-w-lg"
          >
            {t.hero.subtitle}
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-wrap gap-6 mb-12"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <stat.icon size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex flex-wrap gap-4"
          >
            <a
              href="#booking"
              onClick={(e) => { e.preventDefault(); document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background text-sm font-semibold tracking-widest uppercase hover:bg-primary transition-all duration-500"
            >
              {t.hero.cta1}
              <ArrowDown size={16} className="group-hover:translate-y-1 transition-transform" />
            </a>
            <a
              href="#services"
              onClick={(e) => { e.preventDefault(); scrollToServices(); }}
              className="inline-flex items-center gap-3 px-8 py-4 border border-foreground/20 text-sm font-medium tracking-widest uppercase text-foreground hover:border-foreground/50 transition-all duration-500"
            >
              {t.hero.cta2}
            </a>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-px h-16 bg-gradient-to-b from-transparent via-foreground/30 to-transparent"
        />
      </motion.div>
    </section>
  );
}