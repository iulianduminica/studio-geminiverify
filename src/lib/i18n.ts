import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '@/locales/en.json';
import ro from '@/locales/ro.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    fallbackLng: 'en',
    // By setting an empty order, we prevent the detector from running on initial load,
    // which prevents a hydration mismatch. It will still be used to cache the
    // language choice in localStorage when the user changes it.
    detection: {
      order: [],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: en,
      },
      ro: {
        translation: ro,
      },
    },
  });

export default i18n;
