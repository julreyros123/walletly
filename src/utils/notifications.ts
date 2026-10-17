import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getTranslation } from '@/localization';

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

    // Set how notifications are handled when the app is foregrounded or active
    // Returning true for shouldShowAlert / shouldShowBanner ensures heads-up banner & status bar display
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    if (__DEV__) {
      console.log('[Notifications] Notifications module not available in this environment');
    }
  }
}

export const NOTIFICATION_IDS = {
  STREAK_REMINDER: 'cbudget_daily_streak_reminder',
  WEEKLY_REPORT: 'cbudget_weekly_financial_report',
  BUDGET_GUARD: 'cbudget_budget_guard_alert',
  TEST_NOTIFICATION: 'cbudget_test_notification',
} as const;

export const NOTIFICATION_CHANNELS = {
  DEFAULT: 'default',
  REMINDERS: 'reminders',
  BUDGET_GUARD: 'budget-guard',
} as const;

/**
 * Creates system notification channels on Android.
 * Essential for Android 8.0+ (API 26+) so notifications pop up outside the app in the status bar and lock screen.
 */
export async function initNotificationChannelsAsync(): Promise<void> {
  if (!Notifications || Platform.OS !== 'android') return;

  try {
    // 1. Default channel for general notifications
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DEFAULT, {
      name: 'General Alerts & Updates',
      description: 'Account activity, achievements, and system announcements',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981', // Emerald Green
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
      bypassDnd: false,
    });

    // 2. Reminders channel for daily streak and weekly recap
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.REMINDERS, {
      name: 'Daily Streaks & Reminders',
      description: 'Daily expense logging nudges, streak savers, and weekly summaries',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#EF4444', // Red/Orange for streak fire
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
      bypassDnd: false,
    });

    // 3. Smart Guard channel for urgent budget overspending warnings
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.BUDGET_GUARD, {
      name: 'Smart Budget Guard',
      description: 'High-priority alerts when spending exceeds daily or category budgets',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400],
      lightColor: '#F59E0B', // Amber
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
      bypassDnd: false,
    });

    if (__DEV__) {
      console.log('[Notifications] Android system notification channels registered successfully.');
    }
  } catch (err) {
    console.warn('[Notifications] Failed to set notification channels:', err);
  }
}

/**
 * Checks if the user has granted notification permissions.
 */
export async function checkNotificationPermissionsAsync(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Requests native system notification permissions (including Android 13+ POST_NOTIFICATIONS).
 */
export async function requestNotificationPermissionsAsync(): Promise<boolean> {
  if (!Notifications) return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') {
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    return status === 'granted';
  } catch (err) {
    console.warn('[Notifications] Error requesting notification permissions:', err);
    return false;
  }
}

/**
 * Registers device for remote push notifications (Supabase / Expo push server).
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Notifications || Constants.appOwnership === 'expo') {
    if (__DEV__) {
      console.log('[Notifications] Remote push notifications are skipped in Expo Go environment.');
    }
    return undefined;
  }

  // Always ensure local notification channels are initialized
  await initNotificationChannelsAsync();

  let token: string | undefined;

  if (Device.isDevice) {
    const granted = await requestNotificationPermissionsAsync();
    if (!granted) {
      if (__DEV__) console.log('[Notifications] Push notification permissions not granted.');
      return undefined;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      if (!projectId) {
        if (__DEV__) console.log('[Notifications] Project ID not found. Ensure eas.projectId is configured in app.json.');
        return undefined;
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
 * Dispatches an immediate or delayed native phone notification.
 * Appears in the system status bar, lock screen, and notification drawer outside the app.
 */
export async function sendPhoneNotificationAsync({
  title,
  body,
  data = {},
  channelId = NOTIFICATION_CHANNELS.DEFAULT,
  delaySeconds = 0,
}: {
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
  delaySeconds?: number;
}): Promise<string | null> {
  if (!Notifications) return null;

  try {
    // Check master user preference
    const prefs = getPreferencesState();
    if (!prefs.notificationsEnabled) {
      if (__DEV__) console.log('[Notifications] Notification suppressed because notificationsEnabled is false.');
      return null;
    }

    // Ensure permissions
    const hasPermission = await checkNotificationPermissionsAsync();
    if (!hasPermission) {
      const granted = await requestNotificationPermissionsAsync();
      if (!granted) return null;
    }

    // Ensure channels exist
    await initNotificationChannelsAsync();

    let trigger: any = null;
    if (delaySeconds > 0) {
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(delaySeconds)),
        channelId,
      };
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority?.MAX ?? 'max',
        data,
      },
      trigger,
    });

    if (__DEV__) {
      console.log(`[Notifications] Dispatched native phone notification (${notificationId}): ${title}`);
    }

    return notificationId;
  } catch (error) {
    console.warn('[Notifications] Failed to send phone notification:', error);
    return null;
  }
}

/**
 * Schedules a daily reminder at 8:00 PM to log expenses and protect the user's streak.
 * Fires via Android AlarmManager / iOS APNS outside the app when locked or closed.
 */
export async function scheduleStreakReminderAsync(hour = 20, minute = 0): Promise<string | null> {
  if (!Notifications) return null;

  try {
    await initNotificationChannelsAsync();
    await cancelNotificationAsync(NOTIFICATION_IDS.STREAK_REMINDER);

    const triggerType = Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily';

    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDS.STREAK_REMINDER,
      content: {
        title: getTranslation('streak_notification_title'),
        body: getTranslation('streak_notification_body'),
        sound: true,
        priority: Notifications.AndroidNotificationPriority?.MAX ?? 'max',
        data: { screen: '/(tabs)/budget' },
      },
      trigger: {
        type: triggerType,
        hour,
        minute,
        channelId: NOTIFICATION_CHANNELS.REMINDERS,
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
 * Fires outside the app on the phone lock screen and notification tray.
 */
export async function scheduleWeeklyReportAsync(weekday = 1, hour = 18, minute = 0): Promise<string | null> {
  if (!Notifications) return null;

  try {
    await initNotificationChannelsAsync();
    await cancelNotificationAsync(NOTIFICATION_IDS.WEEKLY_REPORT);

    const triggerType = Notifications.SchedulableTriggerInputTypes?.WEEKLY ?? 'weekly';

    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDS.WEEKLY_REPORT,
      content: {
        title: getTranslation('weekly_notification_title'),
        body: getTranslation('weekly_notification_body'),
        sound: true,
        priority: Notifications.AndroidNotificationPriority?.MAX ?? 'max',
        data: { screen: '/(tabs)/profile' },
      },
      trigger: {
        type: triggerType,
        weekday, // 1 = Sunday
        hour,
        minute,
        channelId: NOTIFICATION_CHANNELS.REMINDERS,
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

  // Ensure channels and permissions are up to date
  await initNotificationChannelsAsync();

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
