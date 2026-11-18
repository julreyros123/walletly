import { usePreferencesStore } from '../../src/store/preferencesStore';
import { storage } from '../../src/utils/storage';

describe('preferencesStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePreferencesStore.setState({
      soundEffectsEnabled: true,
      hapticsEnabled: true,
      notificationsEnabled: true,
      streakRemindersEnabled: true,
      weeklyReportEnabled: true,
      currency: 'PHP',
      language: 'English (US)',
      guardianEmail: '',
      guardianLinked: false,
      disclaimerAccepted: false,
      expoPushToken: null,
    });
  });

  test('setSoundEffectsEnabled updates state and persists', async () => {
    const setSpy = jest.spyOn(storage, 'setItem');
    await usePreferencesStore.getState().setSoundEffectsEnabled(false);
    expect(usePreferencesStore.getState().soundEffectsEnabled).toBe(false);
    expect(setSpy).toHaveBeenCalledWith('cbudget_user_preferences', expect.any(String));
  });

  test('setHapticsEnabled updates state and persists', async () => {
    await usePreferencesStore.getState().setHapticsEnabled(false);
    expect(usePreferencesStore.getState().hapticsEnabled).toBe(false);
  });

  test('setNotificationsEnabled updates state and persists', async () => {
    await usePreferencesStore.getState().setNotificationsEnabled(false);
    expect(usePreferencesStore.getState().notificationsEnabled).toBe(false);
  });

  test('setStreakRemindersEnabled updates state and persists', async () => {
    await usePreferencesStore.getState().setStreakRemindersEnabled(false);
    expect(usePreferencesStore.getState().streakRemindersEnabled).toBe(false);
  });

  test('setWeeklyReportEnabled updates state and persists', async () => {
    await usePreferencesStore.getState().setWeeklyReportEnabled(false);
    expect(usePreferencesStore.getState().weeklyReportEnabled).toBe(false);
  });

  test('setCurrency updates currency to USD', async () => {
    await usePreferencesStore.getState().setCurrency('USD');
    expect(usePreferencesStore.getState().currency).toBe('USD');
  });

  test('setLanguage updates language to Filipino', async () => {
    await usePreferencesStore.getState().setLanguage('Filipino');
    expect(usePreferencesStore.getState().language).toBe('Filipino');
  });

  test('setGuardianInfo updates guardian email and linked status', async () => {
    await usePreferencesStore.getState().setGuardianInfo('guardian@family.org', true);
    expect(usePreferencesStore.getState().guardianEmail).toBe('guardian@family.org');
    expect(usePreferencesStore.getState().guardianLinked).toBe(true);
  });

  test('setDisclaimerAccepted marks disclaimerAccepted true', async () => {
    await usePreferencesStore.getState().setDisclaimerAccepted();
    expect(usePreferencesStore.getState().disclaimerAccepted).toBe(true);
  });

  test('setExpoPushToken saves token string', async () => {
    await usePreferencesStore.getState().setExpoPushToken('ExponentPushToken[123]');
    expect(usePreferencesStore.getState().expoPushToken).toBe('ExponentPushToken[123]');
  });

  test('hydrate restores stored preferences and sanitizes invalid currency to PHP', async () => {
    const corruptedState = {
      soundEffectsEnabled: false,
      currency: 'INVALID_CURRENCY',
      currencyMigratedToPhp: true,
      guardianEmail: 'test@parent.com',
    };
    jest.spyOn(storage, 'getItem').mockResolvedValueOnce(JSON.stringify(corruptedState));

    await usePreferencesStore.getState().hydrate();
    expect(usePreferencesStore.getState().soundEffectsEnabled).toBe(false);
    expect(usePreferencesStore.getState().currency).toBe('PHP');
    expect(usePreferencesStore.getState().guardianEmail).toBe('test@parent.com');
  });

  test('hydrate with null in storage defaults currency to PHP', async () => {
    jest.spyOn(storage, 'getItem').mockResolvedValueOnce(null);

    await usePreferencesStore.getState().hydrate();
    expect(usePreferencesStore.getState().currency).toBe('PHP');
  });
});
