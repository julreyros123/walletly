import { useThemeStore } from '../../src/store/themeStore';
import { storage } from '../../src/utils/storage';

describe('themeStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useThemeStore.setState({ mode: 'hybrid', primaryColor: 'green' });
  });

  test('setMode updates mode and persists to storage', async () => {
    const setItemSpy = jest.spyOn(storage, 'setItem');
    await useThemeStore.getState().setMode('dark');

    expect(useThemeStore.getState().mode).toBe('dark');
    expect(setItemSpy).toHaveBeenCalledWith('cbudget_theme_mode', 'dark');
  });

  test('setPrimaryColor updates color and persists to storage', async () => {
    const setItemSpy = jest.spyOn(storage, 'setItem');
    await useThemeStore.getState().setPrimaryColor('purple');

    expect(useThemeStore.getState().primaryColor).toBe('purple');
    expect(setItemSpy).toHaveBeenCalledWith('cbudget_primary_color', 'purple');
  });

  test('hydrate restores saved theme preferences from storage', async () => {
    jest.spyOn(storage, 'getItem').mockImplementation(async (key: string) => {
      if (key === 'cbudget_theme_mode') return 'light';
      if (key === 'cbudget_primary_color') return 'teal';
      return null;
    });

    await useThemeStore.getState().hydrate();
    expect(useThemeStore.getState().mode).toBe('light');
    expect(useThemeStore.getState().primaryColor).toBe('teal');
  });

  test('hydrate with null values in storage falls back to defaults hybrid and green', async () => {
    jest.spyOn(storage, 'getItem').mockResolvedValue(null);

    await useThemeStore.getState().hydrate();
    expect(useThemeStore.getState().mode).toBe('hybrid');
    expect(useThemeStore.getState().primaryColor).toBe('green');
  });
});
