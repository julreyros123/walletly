import { create } from 'zustand';
import { storage } from '@/utils/storage';

export const PREFERENCE_STORAGE_KEYS = {
  PREFERENCES: 'cbudget_user_preferences',
} as const;

export type SupportedCurrency = 'PHP' | 'USD' | 'EUR' | 'GBP';

export interface UserPreferences {
  soundEffectsEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  streakRemindersEnabled: boolean;
  weeklyReportEnabled: boolean;
  currency: SupportedCurrency;
  guardianEmail: string;
  guardianLinked: boolean;
  /** Whether the user has accepted the mandatory financial disclaimer */
  disclaimerAccepted: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  soundEffectsEnabled: true,
  hapticsEnabled: true,
  notificationsEnabled: true,
  streakRemindersEnabled: true,
  weeklyReportEnabled: true,
  currency: 'PHP',
  guardianEmail: '',
  guardianLinked: false,
  disclaimerAccepted: false,
};

interface PreferencesState extends UserPreferences {
  setSoundEffectsEnabled: (enabled: boolean) => Promise<void>;
  setHapticsEnabled: (enabled: boolean) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setStreakRemindersEnabled: (enabled: boolean) => Promise<void>;
  setWeeklyReportEnabled: (enabled: boolean) => Promise<void>;
  setCurrency: (currency: SupportedCurrency) => Promise<void>;
  setGuardianInfo: (email: string, linked: boolean) => Promise<void>;
  setDisclaimerAccepted: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...DEFAULT_PREFERENCES,

  setSoundEffectsEnabled: async (enabled: boolean) => {
    set({ soundEffectsEnabled: enabled });
    await savePreferences(get());
  },

  setHapticsEnabled: async (enabled: boolean) => {
    set({ hapticsEnabled: enabled });
    await savePreferences(get());
  },

  setNotificationsEnabled: async (enabled: boolean) => {
    set({ notificationsEnabled: enabled });
    await savePreferences(get());
  },

  setStreakRemindersEnabled: async (enabled: boolean) => {
    set({ streakRemindersEnabled: enabled });
    await savePreferences(get());
  },

  setWeeklyReportEnabled: async (enabled: boolean) => {
    set({ weeklyReportEnabled: enabled });
    await savePreferences(get());
  },

  setCurrency: async (currency: SupportedCurrency) => {
    set({ currency });
    await savePreferences(get());
  },

  setGuardianInfo: async (email: string, linked: boolean) => {
    set({ guardianEmail: email, guardianLinked: linked });
    await savePreferences(get());
  },

  setDisclaimerAccepted: async () => {
    set({ disclaimerAccepted: true });
    await savePreferences(get());
  },

  hydrate: async () => {
    try {
      const stored = await storage.getItem(PREFERENCE_STORAGE_KEYS.PREFERENCES);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UserPreferences>;
        set({
          soundEffectsEnabled: parsed.soundEffectsEnabled ?? DEFAULT_PREFERENCES.soundEffectsEnabled,
          hapticsEnabled: parsed.hapticsEnabled ?? DEFAULT_PREFERENCES.hapticsEnabled,
          notificationsEnabled: parsed.notificationsEnabled ?? DEFAULT_PREFERENCES.notificationsEnabled,
          streakRemindersEnabled: parsed.streakRemindersEnabled ?? DEFAULT_PREFERENCES.streakRemindersEnabled,
          weeklyReportEnabled: parsed.weeklyReportEnabled ?? DEFAULT_PREFERENCES.weeklyReportEnabled,
          currency: parsed.currency ?? DEFAULT_PREFERENCES.currency,
          guardianEmail: parsed.guardianEmail ?? DEFAULT_PREFERENCES.guardianEmail,
          guardianLinked: parsed.guardianLinked ?? DEFAULT_PREFERENCES.guardianLinked,
          disclaimerAccepted: parsed.disclaimerAccepted ?? DEFAULT_PREFERENCES.disclaimerAccepted,
        });
      }
    } catch (e) {
      console.error('Failed to hydrate preferences store:', e);
    }
  },
}));

async function savePreferences(state: PreferencesState) {
  try {
    const dataToSave: UserPreferences = {
      soundEffectsEnabled: state.soundEffectsEnabled,
      hapticsEnabled: state.hapticsEnabled,
      notificationsEnabled: state.notificationsEnabled,
      streakRemindersEnabled: state.streakRemindersEnabled,
      weeklyReportEnabled: state.weeklyReportEnabled,
      currency: state.currency,
      guardianEmail: state.guardianEmail,
      guardianLinked: state.guardianLinked,
      disclaimerAccepted: state.disclaimerAccepted,
    };
    await storage.setItem(PREFERENCE_STORAGE_KEYS.PREFERENCES, JSON.stringify(dataToSave));
  } catch (e) {
    console.error('Failed to persist user preferences:', e);
  }
}
