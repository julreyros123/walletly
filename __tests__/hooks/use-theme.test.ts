import React from 'react';
import TestRenderer from 'react-test-renderer';
import { useTheme } from '../../src/hooks/use-theme';
import { useThemeStore } from '../../src/store/themeStore';

function getHookValue() {
  let value: any;
  function Component() {
    value = useTheme();
    return null;
  }
  TestRenderer.act(() => {
    TestRenderer.create(React.createElement(Component));
  });
  return value;
}

describe('use-theme hook', () => {
  test('useTheme returns hybrid theme by default with emerald primary', () => {
    TestRenderer.act(() => {
      useThemeStore.setState({ mode: 'hybrid', primaryColor: 'green' });
    });
    const theme = getHookValue();
    expect(theme.mode).toBe('hybrid');
    expect(theme.primary).toBe('#10B981');
  });

  test('useTheme returns teal hex when primaryColor is teal', () => {
    TestRenderer.act(() => {
      useThemeStore.setState({ mode: 'dark', primaryColor: 'teal' });
    });
    const theme = getHookValue();
    expect(theme.mode).toBe('dark');
    expect(theme.primary).toBe('#14B8A6');
  });

  test('useTheme returns purple hex when primaryColor is purple', () => {
    TestRenderer.act(() => {
      useThemeStore.setState({ mode: 'light', primaryColor: 'purple' });
    });
    const theme = getHookValue();
    expect(theme.primary).toBe('#8B5CF6');
  });

  test('useTheme returns rose hex when primaryColor is rose', () => {
    TestRenderer.act(() => {
      useThemeStore.setState({ primaryColor: 'rose' });
    });
    const theme = getHookValue();
    expect(theme.primary).toBe('#F43F5E');
  });

  test('useTheme returns orange hex when primaryColor is orange', () => {
    TestRenderer.act(() => {
      useThemeStore.setState({ primaryColor: 'orange' });
    });
    const theme = getHookValue();
    expect(theme.primary).toBe('#F97316');
  });

  test('useTheme returns sky hex when primaryColor is sky', () => {
    TestRenderer.act(() => {
      useThemeStore.setState({ primaryColor: 'sky' });
    });
    const theme = getHookValue();
    expect(theme.primary).toBe('#0EA5E9');
  });

  test('useTheme unknown color defaults to emerald hex', () => {
    TestRenderer.act(() => {
      useThemeStore.setState({ primaryColor: 'unknown' as any });
    });
    const theme = getHookValue();
    expect(theme.primary).toBe('#10B981');
  });
});
