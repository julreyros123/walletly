import { defaultConfig } from '@tamagui/config/v5'
import { createTamagui } from 'tamagui'

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
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

