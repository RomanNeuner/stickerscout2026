import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import de from '../locales/de/translation.json';
import en from '../locales/en/translation.json';

const deviceLanguage = Localization.getLocales?.()[0]?.languageCode ?? 'de';
const supportedLanguages = ['de', 'en'];
const fallbackLng = 'de';

const detectedLng = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : fallbackLng;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    lng: detectedLng,
    fallbackLng,
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });

export default i18n;
