import React from 'react';
import { motion } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';

export default function PhilosophySection({ image }) {
  const { t } = useLang();

  return (
    <section id="philosophy" className="pt-10 md:pt-14 pb-24 md:pb-32 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground font-medium mb-4">
              {t.philosophy.badge}
            </p>
            <h2 className="font-heading italic font-light text-[2rem] md:text-6xl tracking-tight text-foreground mb-6 md:mb-8">
              {t.philosophy.title1}
              <br />
              <span className="text-primary">{t.philosophy.title2}</span>
            </h2>
            <p className="text-base md:text-lg font-body font-light leading-relaxed text-foreground/70 mb-6 md:mb-8 max-w-lg">
              {t.philosophy.body1}
            </p>
            <p className="text-base font-body leading-relaxed text-foreground/50 mb-10 max-w-lg">
              {t.philosophy.body2}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              {t.philosophy.badges.map((badge) => (
                <span
                  key={badge}
                  className="px-4 py-2 text-xs tracking-[0.15em] uppercase font-medium border border-border bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-300"
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1 }}
          >
            <div className="relative">
              <div className="overflow-hidden rounded-[3rem] rounded-tr-none">
                <img
                  src={image}
                  alt="Thera Derma organic skincare ingredients"
                  className="w-full aspect-[3/4] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-secondary/20 -z-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}