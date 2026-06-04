import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import de from '../locales/de/translation.json';
import en from '../locales/en/translation.json';
import es from '../locales/es/translation.json';
import pt from '../locales/pt/translation.json';
import fr from '../locales/fr/translation.json';

// Globaler Markt: DE + EN + ES + PT + FR
const supportedLanguages = ['de', 'en', 'es', 'pt', 'fr'];
const fallbackLng = 'en'; // International fallback

const deviceLanguage = Localization.getLocales?.()[0]?.languageCode ?? 'en';
const detectedLng = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : fallbackLng;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
      fr: { translation: fr },
    },
    lng: detectedLng,
    fallbackLng,
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });

export default i18n;
