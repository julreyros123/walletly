import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { TamaguiProvider, Theme } from 'tamagui';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import tamaguiConfig from '../../tamagui.config';

export default function RootLayout() {
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const mode = useThemeStore((state) => state.mode);

  // Hydrate authentication token and theme settings on app mount
  useEffect(() => {
    hydrateAuth();
    hydrateTheme();
  }, [hydrateAuth, hydrateTheme]);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={mode}>
      <Theme name={mode}>
        <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          </Stack>
        </ThemeProvider>
      </Theme>
    </TamaguiProvider>
  );
}

