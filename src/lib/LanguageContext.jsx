import React, { createContext, useContext, useState } from 'react';
import vi from '../locales/vi.json';
import en from '../locales/en.json';

export const translations = { vi, en };

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('vi');
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