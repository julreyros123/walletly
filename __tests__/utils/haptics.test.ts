import * as Haptics from 'expo-haptics';
import { safeHaptic } from '../../src/utils/haptics';
import { usePreferencesStore } from '../../src/store/preferencesStore';
import { Platform } from 'react-native';

describe('haptics utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePreferencesStore.setState({ hapticsEnabled: true });
    Platform.OS = 'android';
  });

  test('safeHaptic disabled preference does not trigger any haptic call', () => {
    usePreferencesStore.setState({ hapticsEnabled: false });
    safeHaptic('light');
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  test('safeHaptic default parameter triggers light impact', () => {
    safeHaptic();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  test('safeHaptic light feedback triggers light impact', () => {
    safeHaptic('light');
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  test('safeHaptic medium feedback triggers medium impact', () => {
    safeHaptic('medium');
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  test('safeHaptic heavy feedback triggers heavy impact', () => {
    safeHaptic('heavy');
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
  });

  test('safeHaptic success feedback triggers success notification', () => {
    safeHaptic('success');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
  });

  test('safeHaptic warning feedback triggers warning notification', () => {
    safeHaptic('warning');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
  });

  test('safeHaptic error feedback triggers error notification', () => {
    safeHaptic('error');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
  });

  test('safeHaptic web platform does not trigger native haptics', () => {
    Platform.OS = 'web';
    safeHaptic('medium');
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  test('safeHaptic handles throw without crashing caller', () => {
    (Haptics.impactAsync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Haptic device error');
    });
    expect(() => safeHaptic('light')).not.toThrow();
  });
});
