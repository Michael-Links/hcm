import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './resources';

export const APP_LANGUAGES = ['en', 'zh-HK'] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: AppLanguage = 'en';
export const LANGUAGE_STORAGE_KEY = 'links_one_language';

export function normalizeAppLanguage(value?: string | null): AppLanguage {
  if (!value) return DEFAULT_LANGUAGE;

  const normalized = value.toLowerCase();
  if (normalized === 'zh-hk' || normalized === 'zh-hant-hk' || normalized === 'zh-hant') {
    return 'zh-HK';
  }

  return DEFAULT_LANGUAGE;
}

if (!i18n.isInitialized) {
  void i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: DEFAULT_LANGUAGE,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: APP_LANGUAGES,
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;
