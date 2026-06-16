import React from 'react';
import { motion } from 'framer-motion';
import { Beaker, ShieldCheck, Leaf, Sparkles } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const icons = [Beaker, ShieldCheck, Leaf, Sparkles];

export default function ClinicalSection({ productImage, interiorImage }) {
  const { t } = useLang();
  const features = t.clinical.features;

  return (
    <section id="academy" className="py-24 md:py-32 px-6 md:px-12 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground font-medium mb-4">
            {t.clinical.tagline}
          </p>
          <h2 className="font-heading italic font-light text-4xl md:text-6xl lg:text-7xl tracking-tight text-foreground">
            {t.clinical.title1}
            <br />
            <span className="text-primary">{t.clinical.title2}</span>
          </h2>
        </motion.div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left - Sticky Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1 }}
            className="lg:sticky lg:top-32"
          >
            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] rounded-tl-none">
                <img
                  src={productImage}
                  alt="Thera Derma clinical skincare science"
                  className="w-full aspect-square object-cover"
                />
              </div>
              {/* Floating accent */}
              <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-primary/10 -z-10" />
              <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-secondary/30 -z-10" />
            </div>
          </motion.div>

          {/* Right - Features */}
          <div className="space-y-12">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="group"
              >
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-14 h-14 rounded-full bg-background border border-border flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-500">
                    {React.createElement(icons[idx], { size: 22, className: 'text-primary' })}
                  </div>
                  <div>
                    <h3 className="font-heading italic font-light text-2xl md:text-3xl text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-base font-body leading-relaxed text-foreground/60">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Interior Image */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="pt-8"
            >
              <div className="overflow-hidden rounded-[2rem] rounded-br-none">
                <img
                  src={interiorImage}
                  alt="Thera Derma spa interior"
                  className="w-full aspect-video object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}