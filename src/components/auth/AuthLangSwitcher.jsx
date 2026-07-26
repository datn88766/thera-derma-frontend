import { useLang } from '@/lib/LanguageContext';

export default function AuthLangSwitcher({ className = '' }) {
  const { lang, setLang } = useLang();

  return (
    <div
      className={`inline-flex items-center rounded-full border border-border/60 bg-background/80 p-0.5 text-xs font-medium ${className}`}
    >
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-3 py-1.5 rounded-full transition-colors ${
          lang === 'en' ? 'bg-foreground/8 text-foreground' : 'text-foreground/45 hover:text-foreground/70'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('vi')}
        className={`px-3 py-1.5 rounded-full transition-colors ${
          lang === 'vi' ? 'bg-foreground/8 text-foreground' : 'text-foreground/45 hover:text-foreground/70'
        }`}
      >
        VI
      </button>
    </div>
  );
}
