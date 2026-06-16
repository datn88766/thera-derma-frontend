import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useFooterSettings } from '@/shared/hooks/useServices';

export default function Footer() {
  const { t } = useLang();
  const { data: settings } = useFooterSettings();

  const phone = settings?.phone || t.footer.phone;
  const email = settings?.email || t.footer.email;
  const address = settings?.address || t.footer.address;
  const hours = settings?.openingHours || t.footer.hours;
  const rights = settings?.copyrightText || t.footer.rights;

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
              <div className="flex items-start gap-3">
                <Phone size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-background/60">{phone}</p>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-background/60">{email}</p>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-background/60">{address}</p>
              </div>
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
