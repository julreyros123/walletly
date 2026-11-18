import { sendGuardianReport } from '../../src/utils/guardianReport';
import { usePreferencesStore } from '../../src/store/preferencesStore';
import { useAuthStore } from '../../src/store/authStore';
import { useGamificationStore } from '../../src/store/gamificationStore';
import { Alert, Linking } from 'react-native';

describe('guardianReport utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePreferencesStore.setState({ guardianEmail: 'parent@home.com' });
    useAuthStore.setState({
      user: { id: 'test-user-id', name: 'Student Tim', email: 'tim@school.edu' },
      isAuthenticated: true,
    });
    useGamificationStore.setState({
      streakDays: 5,
      achievements: [
        { id: 'a1', title: 'A1', description: '', icon: '', points: 10, unlocked: true },
        { id: 'a2', title: 'A2', description: '', icon: '', points: 10, unlocked: false },
      ],
    });
  });

  test('sendGuardianReport empty or invalid email returns error result and shows alert', async () => {
    usePreferencesStore.setState({ guardianEmail: '' });
    const result = await sendGuardianReport('');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid email');
    expect(Alert.alert).toHaveBeenCalledWith(
      'No Guardian Email',
      expect.stringContaining('Please provide a valid parent')
    );
  });

  test('sendGuardianReport email without @ returns error result', async () => {
    const result = await sendGuardianReport('invalid-email-without-at');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid email');
  });

  test('sendGuardianReport canOpenURL true opens mailto client and returns success', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValueOnce(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValueOnce(true as any);

    const result = await sendGuardianReport('parent@home.com');
    expect(result.success).toBe(true);
    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining('mailto:parent@home.com?subject=')
    );
  });

  test('sendGuardianReport canOpenURL false logs report and alerts user that mail app is missing', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValueOnce(false);

    const result = await sendGuardianReport('parent@home.com');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Logged but mail app unavailable');
    expect(Alert.alert).toHaveBeenCalledWith(
      'Email App Not Found',
      expect.any(String)
    );
  });

  test('sendGuardianReport Linking throws error catches gracefully and alerts report saved', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockRejectedValueOnce(new Error('Device link failure'));

    const result = await sendGuardianReport('parent@home.com');
    expect(result.success).toBe(true);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Report Saved',
      expect.stringContaining('parent@home.com')
    );
  });
});
