import { Conf } from '../../tamagui.config';

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
