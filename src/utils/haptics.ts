import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { usePreferencesStore } from '@/store/preferencesStore';

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * 100% Safe, non-blocking haptic trigger with error catching.
 * Respects user's haptic preferences.
 */
export const safeHaptic = (type: HapticFeedbackType = 'light') => {
  try {
    const isHapticsEnabled = usePreferencesStore.getState().hapticsEnabled;
    if (!isHapticsEnabled) return;

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      if (type === 'light') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } else if (type === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } else if (type === 'heavy') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      } else if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else if (type === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      } else if (type === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    }
  } catch (e) {
    // Silently ignore
  }
};

export default safeHaptic;
