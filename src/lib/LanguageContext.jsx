import React, { createContext, useContext, useState } from 'react';
import vi from '../locales/vi.json';
import en from '../locales/en.json';

export const translations = { vi, en };

const LANG_KEY = 'theraderma_lang';

function readStoredLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === 'en' || stored === 'vi' ? stored : 'vi';
  } catch {
    return 'vi';
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);
  const setLang = (next) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // ignore
    }
  };
  const t = translations[lang];
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

const LanguageContext = createContext();

export function useLang() {
  return useContext(LanguageContext);
}