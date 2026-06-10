import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { TamaguiProvider, Theme } from 'tamagui';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import tamaguiConfig from '../../tamagui.config';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tamaguiTheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={tamaguiTheme}>
      <Theme name={tamaguiTheme}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <AppTabs />
        </ThemeProvider>
      </Theme>
    </TamaguiProvider>
  );
}
