import {
  resolveLanguageCode,
  getTranslation,
} from '../../src/localization/index';
import { usePreferencesStore } from '../../src/store/preferencesStore';

describe('localization utils', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ language: 'English (US)' });
  });

  describe('resolveLanguageCode', () => {
    test('resolveLanguageCode undefined or null returns en', () => {
      expect(resolveLanguageCode()).toBe('en');
      expect(resolveLanguageCode(null)).toBe('en');
      expect(resolveLanguageCode('')).toBe('en');
    });

    test('resolveLanguageCode Filipino or Tagalog names returns fil', () => {
      expect(resolveLanguageCode('Filipino')).toBe('fil');
      expect(resolveLanguageCode('Tagalog')).toBe('fil');
      expect(resolveLanguageCode('fil')).toBe('fil');
      expect(resolveLanguageCode('tl-PH')).toBe('fil');
    });

    test('resolveLanguageCode English or other languages returns en', () => {
      expect(resolveLanguageCode('English (US)')).toBe('en');
      expect(resolveLanguageCode('Spanish')).toBe('en');
      expect(resolveLanguageCode('Japanese')).toBe('en');
    });
  });

  describe('getTranslation', () => {
    test('getTranslation English key returns correct translated text', () => {
      usePreferencesStore.setState({ language: 'English (US)' });
      const text = getTranslation('streak_notification_title');
      expect(text).toBe('🔥 Keep Your Streak Alive!');
    });

    test('getTranslation Filipino language setting returns Filipino translation', () => {
      usePreferencesStore.setState({ language: 'Filipino' });
      const text = getTranslation('streak_notification_title');
      expect(text).toBe('🔥 Panatilihing Buhay ang Iyong Streak!');
    });

    test('getTranslation unknown key returns provided fallback or key itself', () => {
      const fallback = getTranslation('unknown_random_key' as any, 'Default Fallback Text');
      expect(fallback).toBe('Default Fallback Text');

      const keyItself = getTranslation('unknown_key_no_fallback' as any);
      expect(keyItself).toBe('unknown_key_no_fallback');
    });
  });
});
