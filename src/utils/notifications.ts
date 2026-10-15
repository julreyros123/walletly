import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getPreferencesState() {
  try {
    const { usePreferencesStore } = require('@/store/preferencesStore');
    return usePreferencesStore.getState();
  } catch (_) {
    return {
      notificationsEnabled: true,
      streakRemindersEnabled: true,
      weeklyReportEnabled: true,
    };
  }
}

let Notifications: any = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');

    // Set how notifications are handled when the app is foregrounded
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    if (__DEV__) {
      console.log('[Notifications] Push notifications are not available in this environment (e.g. Expo Go)');
    }
  }
}

export const NOTIFICATION_IDS = {
  STREAK_REMINDER: 'cbudget_daily_streak_reminder',
  WEEKLY_REPORT: 'cbudget_weekly_financial_report',
} as const;

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Notifications || Constants.appOwnership === 'expo') {
    if (__DEV__) {
      console.log('[Notifications] Push notifications are skipped in Expo Go environment.');
    }
    return undefined;
  }

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981', // Emerald Green for Walletly
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      if (__DEV__) console.log('[Notifications] Push notification permissions not granted.');
      return;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      if (!projectId) {
        if (__DEV__) console.log('[Notifications] Project ID not found. Ensure eas.projectId is configured in app.json.');
        return;
      }

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      if (__DEV__) console.log('[Notifications] Expo Push Token:', token);
    } catch (e) {
      if (__DEV__) console.log('[Notifications] Could not get push token in current environment:', e);
    }
  } else {
    if (__DEV__) console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Schedules a daily reminder at 8:00 PM to log expenses and protect the user's streak.
 */
export async function scheduleStreakReminderAsync(hour = 20, minute = 0): Promise<string | null> {
  if (!Notifications) return null;

  try {
    // Cancel existing streak reminder first to avoid duplicates
    await cancelNotificationAsync(NOTIFICATION_IDS.STREAK_REMINDER);

    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDS.STREAK_REMINDER,
      content: {
        title: '🔥 Keep Your Streak Alive!',
        body: "Don't break your momentum! Log today's allowance or complete a quick quiz in CBudget.",
        sound: true,
        data: { screen: '/(tabs)/budget' },
      },
      trigger: {
        type: 'daily',
        hour,
        minute,
        channelId: 'default',
      },
    });

    if (__DEV__) console.log('[Notifications] Scheduled daily streak reminder:', notificationId);
    return notificationId;
  } catch (error) {
    console.warn('[Notifications] Failed to schedule streak reminder:', error);
    return null;
  }
}

/**
 * Schedules a weekly financial recap notification every Sunday at 6:00 PM.
 */
export async function scheduleWeeklyReportAsync(weekday = 1, hour = 18, minute = 0): Promise<string | null> {
  if (!Notifications) return null;

  try {
    // Cancel existing weekly report reminder first
    await cancelNotificationAsync(NOTIFICATION_IDS.WEEKLY_REPORT);

    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDS.WEEKLY_REPORT,
      content: {
        title: '📊 Your Weekly Budget Summary is Ready',
        body: 'Check out your spending habits and see how much you saved this week!',
        sound: true,
        data: { screen: '/(tabs)/profile' },
      },
      trigger: {
        type: 'weekly',
        weekday, // 1 = Sunday
        hour,
        minute,
        channelId: 'default',
      },
    });

    if (__DEV__) console.log('[Notifications] Scheduled weekly report reminder:', notificationId);
    return notificationId;
  } catch (error) {
    console.warn('[Notifications] Failed to schedule weekly report:', error);
    return null;
  }
}

/**
 * Cancels a specific scheduled notification by identifier.
 */
export async function cancelNotificationAsync(identifier: string): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    // Silent fail if notification is not currently scheduled
  }
}

/**
 * Cancels all currently scheduled local notifications.
 */
export async function cancelAllNotificationsAsync(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[Notifications] Error cancelling notifications:', error);
  }
}

/**
 * Synchronizes scheduled notifications based on user preference toggles.
 */
export async function syncScheduledNotificationsAsync(prefs?: {
  notificationsEnabled?: boolean;
  streakRemindersEnabled?: boolean;
  weeklyReportEnabled?: boolean;
}): Promise<void> {
  if (!Notifications) return;

  const currentPrefs = prefs ?? getPreferencesState();
  const {
    notificationsEnabled = true,
    streakRemindersEnabled = true,
    weeklyReportEnabled = true,
  } = currentPrefs;

  if (!notificationsEnabled) {
    // If master notification toggle is OFF, cancel all scheduled notifications
    await cancelAllNotificationsAsync();
    return;
  }

  // Manage Streak Reminders
  if (streakRemindersEnabled) {
    await scheduleStreakReminderAsync(20, 0);
  } else {
    await cancelNotificationAsync(NOTIFICATION_IDS.STREAK_REMINDER);
  }

  // Manage Weekly Reports
  if (weeklyReportEnabled) {
    await scheduleWeeklyReportAsync(1, 18, 0);
  } else {
    await cancelNotificationAsync(NOTIFICATION_IDS.WEEKLY_REPORT);
  }
}
