import { create } from 'zustand';
import { storage } from '@/utils/storage';

import { ThemeMode } from '@/constants/theme';

export type AccentColor = 'green' | 'sky' | 'teal' | 'purple' | 'rose' | 'orange';

interface ThemeState {
  mode: ThemeMode;
  primaryColor: AccentColor;
  setMode: (mode: ThemeMode) => Promise<void>;
  setPrimaryColor: (color: AccentColor) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'hybrid',
  primaryColor: 'green',

  setMode: async (mode: ThemeMode) => {
    set({ mode });
    try {
      await storage.setItem('cbudget_theme_mode', mode);
    } catch (e) {
      console.error('Failed to persist theme mode:', e);
    }
  },

  setPrimaryColor: async (color: AccentColor) => {
    set({ primaryColor: color });
    try {
      await storage.setItem('cbudget_primary_color', color);
    } catch (e) {
      console.error('Failed to persist primary color:', e);
    }
  },

  hydrate: async () => {
    try {
      const mode = (await storage.getItem('cbudget_theme_mode')) as ThemeMode | null;
      const primaryColor = (await storage.getItem('cbudget_primary_color')) as AccentColor | null;

      set({
        mode: mode || 'hybrid',
        primaryColor: primaryColor || 'green',
      });
    } catch (e) {
      console.error('Failed to hydrate theme state:', e);
    }
  },
}));
