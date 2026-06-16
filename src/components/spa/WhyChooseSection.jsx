import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Hand, Wind } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const icons = [Cpu, Hand, Wind];

export default function WhyChooseSection() {
  const { t } = useLang();
  const reasons = t.whyChoose.reasons;

  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground font-medium mb-4">
            {t.whyChoose.tagline}
          </p>
          <h2 className="font-heading italic font-light text-4xl md:text-6xl lg:text-7xl tracking-tight text-foreground">
            {t.whyChoose.title}
            <br />
            <span className="text-primary">Thera Derma</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {reasons.map((reason, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="group text-center"
            >
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-background border border-border flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-500">
                {React.createElement(icons[idx], { size: 28, className: 'text-primary', strokeWidth: 1.5 })}
              </div>
              <p className="text-xs tracking-[0.2em] uppercase text-primary font-semibold mb-2">
                {reason.kicker}
              </p>
              <h3 className="font-heading italic font-light text-2xl md:text-3xl text-foreground mb-4">
                {reason.title}
              </h3>
              <p className="text-base font-body leading-relaxed text-foreground/60 max-w-sm mx-auto">
                {reason.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}