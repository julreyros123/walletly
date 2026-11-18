import * as Notifications from 'expo-notifications';
import {
  initNotificationChannelsAsync,
  checkNotificationPermissionsAsync,
  requestNotificationPermissionsAsync,
  sendPhoneNotificationAsync,
  scheduleStreakReminderAsync,
  scheduleWeeklyReportAsync,
  cancelNotificationAsync,
  cancelAllNotificationsAsync,
  syncScheduledNotificationsAsync,
  NOTIFICATION_IDS,
  NOTIFICATION_CHANNELS,
} from '../../src/utils/notifications';
import { usePreferencesStore } from '../../src/store/preferencesStore';
import { Platform } from 'react-native';

describe('notifications utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    usePreferencesStore.setState({
      notificationsEnabled: true,
      streakRemindersEnabled: true,
      weeklyReportEnabled: true,
    });
  });

  describe('initNotificationChannelsAsync', () => {
    test('initNotificationChannelsAsync android creates 3 notification channels', async () => {
      await initNotificationChannelsAsync();
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        NOTIFICATION_CHANNELS.DEFAULT,
        expect.any(Object)
      );
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        NOTIFICATION_CHANNELS.REMINDERS,
        expect.any(Object)
      );
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        NOTIFICATION_CHANNELS.BUDGET_GUARD,
        expect.any(Object)
      );
    });

    test('initNotificationChannelsAsync non-android skips channel creation', async () => {
      Platform.OS = 'ios';
      await initNotificationChannelsAsync();
      expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    });
  });

  describe('checkNotificationPermissionsAsync', () => {
    test('checkNotificationPermissionsAsync granted status returns true', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
      const result = await checkNotificationPermissionsAsync();
      expect(result).toBe(true);
    });

    test('checkNotificationPermissionsAsync denied status returns false', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
      const result = await checkNotificationPermissionsAsync();
      expect(result).toBe(false);
    });

    test('checkNotificationPermissionsAsync error in API returns false', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValueOnce(new Error('Permission error'));
      const result = await checkNotificationPermissionsAsync();
      expect(result).toBe(false);
    });
  });

  describe('requestNotificationPermissionsAsync', () => {
    test('requestNotificationPermissionsAsync existing granted returns true without prompt', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
      const result = await requestNotificationPermissionsAsync();
      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    test('requestNotificationPermissionsAsync prompts and returns true if user grants', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
      const result = await requestNotificationPermissionsAsync();
      expect(result).toBe(true);
    });

    test('requestNotificationPermissionsAsync returns false if user denies prompt', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
      const result = await requestNotificationPermissionsAsync();
      expect(result).toBe(false);
    });
  });

  describe('sendPhoneNotificationAsync', () => {
    test('sendPhoneNotificationAsync disabled in preferences returns null', async () => {
      usePreferencesStore.setState({ notificationsEnabled: false });
      const result = await sendPhoneNotificationAsync({
        title: 'Test Notification',
        body: 'Testing body',
      });
      expect(result).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    test('sendPhoneNotificationAsync enabled and permitted schedules immediate notification', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValueOnce('id-1234');

      const result = await sendPhoneNotificationAsync({
        title: 'Budget Alert',
        body: 'You are close to your limit',
      });
      expect(result).toBe('id-1234');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Budget Alert',
            body: 'You are close to your limit',
          }),
          trigger: null,
        })
      );
    });

    test('sendPhoneNotificationAsync with delaySeconds schedules with time interval trigger', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValueOnce('id-delay');

      const result = await sendPhoneNotificationAsync({
        title: 'Delayed Alert',
        body: 'Delay test',
        delaySeconds: 10,
      });
      expect(result).toBe('id-delay');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({
            seconds: 10,
          }),
        })
      );
    });
  });

  describe('scheduleStreakReminderAsync', () => {
    test('scheduleStreakReminderAsync schedules daily reminder with given hour and minute', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValueOnce('streak-id');

      const result = await scheduleStreakReminderAsync(20, 30);
      expect(result).toBe('streak-id');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: NOTIFICATION_IDS.STREAK_REMINDER,
          trigger: expect.objectContaining({
            hour: 20,
            minute: 30,
          }),
        })
      );
    });
  });

  describe('scheduleWeeklyReportAsync', () => {
    test('scheduleWeeklyReportAsync schedules weekly reminder with given day and time', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValueOnce('weekly-id');

      const result = await scheduleWeeklyReportAsync(1, 18, 0);
      expect(result).toBe('weekly-id');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: NOTIFICATION_IDS.WEEKLY_REPORT,
          trigger: expect.objectContaining({
            weekday: 1,
            hour: 18,
            minute: 0,
          }),
        })
      );
    });
  });

  describe('cancelNotificationAsync and cancelAllNotificationsAsync', () => {
    test('cancelNotificationAsync calls cancelScheduledNotificationAsync with identifier', async () => {
      await cancelNotificationAsync('test-id');
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('test-id');
    });

    test('cancelAllNotificationsAsync calls cancelAllScheduledNotificationsAsync', async () => {
      await cancelAllNotificationsAsync();
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('syncScheduledNotificationsAsync', () => {
    test('syncScheduledNotificationsAsync notifications disabled cancels all', async () => {
      await syncScheduledNotificationsAsync({
        notificationsEnabled: false,
      });
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    test('syncScheduledNotificationsAsync all toggles enabled schedules streak and weekly reminders', async () => {
      await syncScheduledNotificationsAsync({
        notificationsEnabled: true,
        streakRemindersEnabled: true,
        weeklyReportEnabled: true,
      });
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    });

    test('syncScheduledNotificationsAsync streak disabled cancels streak notification', async () => {
      await syncScheduledNotificationsAsync({
        notificationsEnabled: true,
        streakRemindersEnabled: false,
        weeklyReportEnabled: true,
      });
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        NOTIFICATION_IDS.STREAK_REMINDER
      );
    });
  });
});
