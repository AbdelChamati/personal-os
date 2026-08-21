import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import de from './locales/de.json';
import it from './locales/it.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

const STORAGE_KEY = 'appLanguage';
const supportedLanguages = ['en', 'de', 'it', 'fr', 'es'];

function resolveInitialLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && supportedLanguages.includes(saved)) {
    return saved;
  }

  const browserLanguage = navigator.language?.slice(0, 2).toLowerCase();
  return supportedLanguages.includes(browserLanguage) ? browserLanguage : 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      it: { translation: it },
      fr: { translation: fr },
      es: { translation: es },
    },
    lng: resolveInitialLanguage(),
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    interpolation: {
      escapeValue: false,
    },
  });

export { STORAGE_KEY, supportedLanguages };
export default i18n;
