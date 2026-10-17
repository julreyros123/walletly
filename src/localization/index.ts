import { usePreferencesStore } from '@/store/preferencesStore';
import { translations, TranslationKey, LanguageCode } from './translations';

export * from './translations';

export function resolveLanguageCode(languageName?: string | null): LanguageCode {
  if (!languageName) return 'en';
  const lower = languageName.toLowerCase();
  if (lower.includes('filipino') || lower.includes('tagalog') || lower.includes('fil') || lower.includes('tl')) {
    return 'fil';
  }
  return 'en';
}

/**
 * Reactive hook for accessing localized strings. Re-renders automatically when user changes language.
 */
export function useTranslation() {
  const language = usePreferencesStore((state) => state.language);
  const langCode: LanguageCode = resolveLanguageCode(language);

  const t = (key: TranslationKey, fallback?: string): string => {
    const dict = translations[langCode] || translations.en;
    return dict[key] ?? translations.en[key] ?? fallback ?? key;
  };

  return {
    t,
    language: language || 'English (US)',
    langCode,
    isFilipino: langCode === 'fil',
  };
}

/**
 * Imperative translation accessor for outside React components (e.g. notifications, store actions).
 */
export function getTranslation(key: TranslationKey, fallback?: string): string {
  try {
    const { usePreferencesStore } = require('@/store/preferencesStore');
    const language = usePreferencesStore.getState()?.language;
    const langCode = resolveLanguageCode(language);
    return translations[langCode]?.[key] ?? translations.en[key] ?? fallback ?? key;
  } catch (_) {
    return translations.en[key] ?? fallback ?? key;
  }
}
