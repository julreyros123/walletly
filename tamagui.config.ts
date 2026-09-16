import { defaultConfig } from '@tamagui/config/v5'
import { createFont, createTamagui } from 'tamagui'

const jakartaFont = createFont({
  family: 'PlusJakartaSans_400Regular',
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 15,
    6: 16,
    7: 18,
    8: 20,
    9: 24,
    10: 28,
    11: 34,
    12: 40,
    true: 15,
  },
  lineHeight: {
    1: 15,
    2: 16,
    3: 18,
    4: 20,
    5: 22,
    6: 24,
    7: 26,
    8: 28,
    9: 32,
    10: 36,
    11: 42,
    12: 48,
    true: 22,
  },
  weight: {
    4: '400',
    5: '500',
    6: '600',
    7: '700',
    8: '800',
    true: '500',
  },
  letterSpacing: {
    1: 0.5,
    2: 0.1,
    3: 0,
    4: -0.05,
    5: -0.1,
    6: -0.2,
    7: -0.3,
    8: -0.4,
    9: -0.6,
    10: -0.8,
    11: -1.2,
    true: -0.1,
  },
  face: {
    400: { normal: 'PlusJakartaSans_400Regular' },
    500: { normal: 'PlusJakartaSans_500Medium' },
    600: { normal: 'PlusJakartaSans_600SemiBold' },
    700: { normal: 'PlusJakartaSans_700Bold' },
    800: { normal: 'PlusJakartaSans_800ExtraBold' },
    bold: { normal: 'PlusJakartaSans_700Bold' },
  },
})

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  fonts: {
    ...defaultConfig.fonts,
    heading: jakartaFont,
    body: jakartaFont,
  },
  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: false,
  },
})

export default tamaguiConfig

export type Conf = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
  interface ExtendBaseStackProps {
    space?: any
  }
}

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
  interface ExtendBaseStackProps {
    space?: any
  }
}

declare module '@tamagui/web' {
  interface TamaguiCustomConfig extends Conf {}
  interface ExtendBaseStackProps {
    space?: any
  }
}

