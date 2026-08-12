import { create } from 'zustand';
import { sqliteStorage } from '@/utils/sqliteStorage';

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'green' | 'sky' | 'teal' | 'purple' | 'rose' | 'orange';

interface ThemeState {
  mode: ThemeMode;
  primaryColor: AccentColor;
  setMode: (mode: ThemeMode) => Promise<void>;
  setPrimaryColor: (color: AccentColor) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  primaryColor: 'green',

  setMode: async (mode: ThemeMode) => {
    try {
      await sqliteStorage.setItem('cbudget_theme_mode', mode);
    } catch (e) {
      console.error(e);
    }
    set({ mode });
  },

  setPrimaryColor: async (color: AccentColor) => {
    try {
      await sqliteStorage.setItem('cbudget_primary_color', color);
    } catch (e) {
      console.error(e);
    }
    set({ primaryColor: color });
  },

  hydrate: async () => {
    try {
      const mode = await sqliteStorage.getItem('cbudget_theme_mode') as ThemeMode | null;
      const primaryColor = await sqliteStorage.getItem('cbudget_primary_color') as AccentColor | null;
      
      set({
        mode: mode || 'light',
        primaryColor: 'green', // Force Apple Green as default regardless of saved state
      });
    } catch (e) {
      console.error('Failed to hydrate theme state:', e);
    }
  },
}));
