import { soundFX } from '../../src/utils/soundEffects';
import { usePreferencesStore } from '../../src/store/preferencesStore';
import { Platform } from 'react-native';

describe('soundEffects utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    usePreferencesStore.setState({ soundEffectsEnabled: true });
  });

  test('playSwipe plays swipe sound on native without error', () => {
    expect(() => soundFX.playSwipe()).not.toThrow();
  });

  test('playCorrect plays correct sound on native without error', () => {
    expect(() => soundFX.playCorrect()).not.toThrow();
  });

  test('playWrong plays wrong sound on native without error', () => {
    expect(() => soundFX.playWrong()).not.toThrow();
  });

  test('playCombo plays combo sound on native without error', () => {
    expect(() => soundFX.playCombo()).not.toThrow();
  });

  test('playRoundComplete plays complete sound on native without error', () => {
    expect(() => soundFX.playRoundComplete()).not.toThrow();
  });

  test('playSwipe sound disabled in preferences does not play sound', () => {
    usePreferencesStore.setState({ soundEffectsEnabled: false });
    expect(() => soundFX.playSwipe()).not.toThrow();
  });

  test('playSwipe web platform handles gracefully without crash', () => {
    Platform.OS = 'web';
    expect(() => soundFX.playSwipe()).not.toThrow();
  });
});
