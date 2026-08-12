import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'sky' | 'teal' | 'purple' | 'rose' | 'orange';

interface ThemeState {
  mode: ThemeMode;
  primaryColor: AccentColor;
  setMode: (mode: ThemeMode) => Promise<void>;
  setPrimaryColor: (color: AccentColor) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  primaryColor: 'sky',

  setMode: async (mode: ThemeMode) => {
    try {
      await SecureStore.setItemAsync('cbudget_theme_mode', mode);
    } catch (e) {
      console.error(e);
    }
    set({ mode });
  },

  setPrimaryColor: async (color: AccentColor) => {
    try {
      await SecureStore.setItemAsync('cbudget_primary_color', color);
    } catch (e) {
      console.error(e);
    }
    set({ primaryColor: color });
  },

  hydrate: async () => {
    try {
      const mode = await SecureStore.getItemAsync('cbudget_theme_mode') as ThemeMode | null;
      const primaryColor = await SecureStore.getItemAsync('cbudget_primary_color') as AccentColor | null;
      
      set({
        mode: mode || 'light',
        primaryColor: primaryColor || 'sky',
      });
    } catch (e) {
      console.error('Failed to hydrate theme state:', e);
    }
  },
}));
