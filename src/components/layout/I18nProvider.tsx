'use client';
import React, { ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

export default function I18nProvider({ children }: { children: ReactNode }) {
  // This effect runs once on mount to load the persisted language
  // from localStorage, preventing a hydration mismatch.
  useEffect(() => {
    // The language detector is configured to cache in localStorage.
    // We manually read it on the client after the initial render.
    const savedLang = localStorage.getItem('i18nextLng');
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  // This will set the lang attribute on the html tag
  useEffect(() => {
    const setLang = (lng: string | undefined) => {
      if(lng) {
        document.documentElement.lang = lng;
      }
    };
    setLang(i18n.language);
    i18n.on('languageChanged', setLang);
    return () => {
      i18n.off('languageChanged', setLang);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
