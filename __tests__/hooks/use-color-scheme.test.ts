import { useColorScheme } from '../../src/hooks/use-color-scheme';

describe('use-color-scheme hook', () => {
  test('useColorScheme returns light scheme', () => {
    expect(useColorScheme()).toBe('light');
  });
});
