/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#3EB47D',     // Brand Logo Green — used for interactive/accent only
    teal: '#14B8A6',
    mint: '#5EEAD4',
    success: '#16A34A',     // Darker green — clearly distinct from brand primary
    warning: '#D97706',     // Amber — darkened for contrast on white backgrounds
    error: '#DC2626',       // Red — high contrast on light
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',        // Near-black — max readability
    textSecondary: '#475569', // Slate-600 — darker than before for better contrast
    border: '#CBD5E1',      // Slightly darker border for definition
    backgroundElement: '#F8FAFC', // Near-white — clean on white surfaces
    backgroundSelected: '#E2E8F0',
  },
  dark: {
    primary: '#3EB47D',     // Brand Logo Green
    teal: '#14B8A6',
    mint: '#5EEAD4',
    success: '#4ADE80',     // Brighter green on dark bg — distinct from brand primary
    warning: '#FBBF24',     // Amber — readable on dark
    error: '#F87171',       // Red — softer on dark
    background: '#0F172A',  // Deep navy
    surface: '#1E293B',     // Card surfaces
    text: '#F1F5F9',        // Near-white — high contrast on dark
    textSecondary: '#94A3B8', // Slate-400 — clear secondary on dark bg
    border: '#334155',
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Inter font family — loaded via @expo-google-fonts/inter in _layout.tsx
export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
  // Fallback for system mono (code blocks only)
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
} as const;

export const Spacing = {
  8: 8,
  12: 12,
  16: 16,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  eight: 32,
} as const;

// Premium typography scale — mirrors Revolut / Wise hierarchy
export const Typography = {
  // Display — hero numbers (budget remaining, big stats)
  display: { fontSize: 34, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1 },
  // Headings
  h1:      { fontSize: 24, fontFamily: 'Inter_700Bold',      letterSpacing: -0.5 },
  h2:      { fontSize: 20, fontFamily: 'Inter_700Bold',      letterSpacing: -0.3 },
  h3:      { fontSize: 17, fontFamily: 'Inter_600SemiBold',  letterSpacing: -0.2 },
  // Body
  body:    { fontSize: 15, fontFamily: 'Inter_400Regular',   lineHeight: 22 },
  bodyMed: { fontSize: 15, fontFamily: 'Inter_500Medium',    lineHeight: 22 },
  // Labels & captions
  label:   { fontSize: 13, fontFamily: 'Inter_600SemiBold',  letterSpacing: 0.1 },
  caption: { fontSize: 12, fontFamily: 'Inter_400Regular',   lineHeight: 17 },
  // Overline — ALL CAPS section headers
  overline: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 },
  // Numbers — monospaced-feel for financial values
  number:  { fontSize: 15, fontFamily: 'Inter_700Bold',      letterSpacing: -0.3 },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
export const BorderRadius = {
  sm: 8,
  md: 14,   // Default card radius
  lg: 20,
  pill: 999,
} as const;
