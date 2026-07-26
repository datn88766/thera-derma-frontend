import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function TestimonialsSection() {
  const { t } = useLang();

  return (
    <section className="py-12 md:py-32 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="mb-8 md:mb-20"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground font-medium mb-4">
            {t.testimonials.tagline}
          </p>
          <h2 className="font-heading italic font-light text-[2rem] md:text-6xl tracking-tight text-foreground">
            {t.testimonials.title1} <span className="text-primary">{t.testimonials.title2}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {t.testimonials.items.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="group p-5 md:p-10 border border-border/60 hover:border-primary/30 bg-card/50 hover:bg-muted/30 transition-all duration-500"
            >
              <Quote size={24} className="text-primary/30 mb-6" />
              <p className="text-base font-body leading-relaxed text-foreground/70 mb-8">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-1 mb-4">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} size={14} className="fill-primary text-primary" />
                ))}
              </div>
              <p className="font-heading italic text-xl text-foreground">{testimonial.name}</p>
              <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-1">
                {testimonial.treatment}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}