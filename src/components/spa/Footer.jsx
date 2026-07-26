import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useFooterSettings } from '@/shared/hooks/useServices';

export default function Footer() {
  const { t } = useLang();
  const { data: settings, isLoading } = useFooterSettings();

  const contactFromAdmin = settings != null;
  const phone = contactFromAdmin
    ? (settings.phone?.trim() || '—')
    : (isLoading ? '…' : t.footer.phone);
  const email = contactFromAdmin
    ? (settings.email?.trim() || '—')
    : (isLoading ? '…' : t.footer.email);
  const address = contactFromAdmin
    ? (settings.address?.trim() || '—')
    : (isLoading ? '…' : t.footer.address);
  const hours = contactFromAdmin
    ? (settings.openingHours?.trim() || '—')
    : (isLoading ? '…' : t.footer.hours);
  const rights = contactFromAdmin
    ? (settings.copyrightText?.trim() || t.footer.rights)
    : (isLoading ? '…' : t.footer.rights);

  return (
    <footer id="contact" className="bg-foreground text-background/80 py-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-1">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Thera Derma" className="h-12 mb-4 object-contain" />
            ) : (
              <h3 className="font-heading italic font-light text-3xl text-background mb-4">
                Thera Derma
              </h3>
            )}
            <p className="text-sm leading-relaxed text-background/50 max-w-xs">
              {t.footer.brandDesc}
            </p>
          </div>

          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-background/40 font-semibold mb-6">
              {t.footer.quickLinks}
            </p>
            <div className="space-y-3">
              {t.footer.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="block text-sm text-background/60 hover:text-background transition-colors duration-300"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-background/40 font-semibold mb-6">
              {t.footer.treatments}
            </p>
            <div className="space-y-3">
              {t.footer.treatmentList.map((item) => (
                <p key={item} className="text-sm text-background/60">{item}</p>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-background/40 font-semibold mb-6">
              {t.footer.contact}
            </p>
            <div className="space-y-4">
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-start gap-3 group">
                <Phone size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-background/60 group-hover:text-background transition-colors">{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="flex items-start gap-3 group">
                <Mail size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-background/60 group-hover:text-background transition-colors">{email}</span>
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 group"
              >
                <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-background/60 group-hover:text-background transition-colors">{address}</span>
              </a>
              <div className="flex items-start gap-3">
                <Clock size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-background/60">{hours}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/30">{rights}</p>
          <p className="text-xs text-background/30">{t.footer.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
