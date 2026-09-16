/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  hybrid: {
    primary: '#10B981',     // Vibrant Brand Emerald — used for interactive/accent only
    teal: '#14B8A6',
    mint: '#5EEAD4',
    success: '#16A34A',     // Green for positive amounts
    warning: '#D97706',     // Amber
    error: '#DC2626',       // Red
    background: '#F1F5F9',  // Soft slate background — eliminates glare and elevates white cards
    surface: '#FFFFFF',     // Clean elevated white cards
    surfaceDark: '#0F172A', // Midnight card surface for hero balance card
    text: '#0F172A',        // Near-black — max readability
    textSecondary: '#64748B', // Slate-500 — readable secondary text
    border: '#E2E8F0',      // Soft, clean border
    backgroundElement: '#F1F5F9', // Elevated surface background
    backgroundSelected: '#E2E8F0',
  },
  light: {
    primary: '#10B981',     // Vibrant Brand Emerald — used for interactive/accent only
    teal: '#14B8A6',
    mint: '#5EEAD4',
    success: '#16A34A',     // Darker green — clearly distinct from brand primary
    warning: '#D97706',     // Amber — darkened for contrast on white backgrounds
    error: '#DC2626',       // Red — high contrast on light
    background: '#F1F5F9',  // Soft slate background — eliminates glare
    surface: '#FFFFFF',
    surfaceDark: '#0F172A',
    text: '#0F172A',        // Near-black — max readability
    textSecondary: '#475569', // Slate-600 — darker than before for better contrast
    border: '#E2E8F0',      // Soft, clean border
    backgroundElement: '#F1F5F9', // Near-white — clean on white surfaces
    backgroundSelected: '#E2E8F0',
  },
  dark: {
    primary: '#10B981',     // Vibrant Brand Emerald
    teal: '#14B8A6',
    mint: '#5EEAD4',
    success: '#4ADE80',     // Brighter green on dark bg — distinct from brand primary
    warning: '#FBBF24',     // Amber — readable on dark
    error: '#F87171',       // Red — softer on dark
    background: '#0F172A',  // Deep navy
    surface: '#1E293B',     // Card surfaces
    surfaceDark: '#0F172A',
    text: '#F1F5F9',        // Near-white — high contrast on dark
    textSecondary: '#94A3B8', // Slate-400 — clear secondary on dark bg
    border: '#334155',
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
  },
} as const;

export type ThemeMode = 'hybrid' | 'dark' | 'light';
export type ThemeColor = keyof typeof Colors.hybrid;

// Plus Jakarta Sans font family — loaded via @expo-google-fonts/plus-jakarta-sans in _layout.tsx
export const Fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
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

// Premium typography scale — modern fintech hierarchy (Apple / Revolut / Linear)
export const Typography = {
  // Display — hero numbers (budget remaining, large balance stats)
  display: { fontSize: 36, fontFamily: Fonts.extraBold, letterSpacing: -1.2, lineHeight: 42 },
  displaySm: { fontSize: 28, fontFamily: Fonts.bold, letterSpacing: -0.8, lineHeight: 34 },
  // Headings
  h1:      { fontSize: 24, fontFamily: Fonts.bold,      letterSpacing: -0.6, lineHeight: 30 },
  h2:      { fontSize: 20, fontFamily: Fonts.bold,      letterSpacing: -0.4, lineHeight: 26 },
  h3:      { fontSize: 17, fontFamily: Fonts.semiBold,  letterSpacing: -0.3, lineHeight: 22 },
  h4:      { fontSize: 15, fontFamily: Fonts.semiBold,  letterSpacing: -0.2, lineHeight: 20 },
  // Body
  body:    { fontSize: 15, fontFamily: Fonts.regular,   lineHeight: 22, letterSpacing: -0.1 },
  bodyMed: { fontSize: 15, fontFamily: Fonts.medium,    lineHeight: 22, letterSpacing: -0.1 },
  bodySm:  { fontSize: 13, fontFamily: Fonts.regular,   lineHeight: 18, letterSpacing: -0.05 },
  // Labels & captions
  label:   { fontSize: 13, fontFamily: Fonts.semiBold,  letterSpacing: 0, lineHeight: 18 },
  caption: { fontSize: 12, fontFamily: Fonts.medium,    lineHeight: 16, letterSpacing: 0.1 },
  // Overline — uppercase section headers
  overline: { fontSize: 11, fontFamily: Fonts.bold,     letterSpacing: 0.8, textTransform: 'uppercase' as const },
  // Financial numbers — clean tabular tracking
  numberLg: { fontSize: 24, fontFamily: Fonts.bold,     letterSpacing: -0.5 },
  number:   { fontSize: 16, fontFamily: Fonts.bold,     letterSpacing: -0.3 },
  numberSm: { fontSize: 13, fontFamily: Fonts.semiBold, letterSpacing: -0.2 },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
export const BorderRadius = {
  sm: 8,
  md: 14,   // Default card radius
  lg: 20,
  pill: 999,
} as const;
