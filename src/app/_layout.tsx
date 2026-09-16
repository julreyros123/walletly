import { DefaultTheme, DarkTheme, ThemeProvider } from 'expo-router';
import { TamaguiProvider, Theme } from 'tamagui';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { useEffect, useMemo } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { CbudgetSplashScreen } from '@/components/CbudgetSplashScreen';
import tamaguiConfig from '../../tamagui.config';
import { CustomAlertProvider } from '@/components/ui/CustomAlert';
import { ToastProvider } from '@/components/ui/Toast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const hydrateGamification = useGamificationStore((state) => state.hydrate);
  const mode = useThemeStore((state) => state.mode);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Hydrate authentication token, theme, user preferences, and gamification data on app mount
  useEffect(() => {
    hydrateAuth();
    hydrateTheme();
    hydratePreferences();
    hydrateGamification();
  }, [hydrateAuth, hydrateTheme, hydratePreferences, hydrateGamification]);

  // Ensure transparent status bar on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      RNStatusBar.setTranslucent(true);
      RNStatusBar.setBackgroundColor('transparent');
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const isDark = mode === 'dark';
  const navTheme = useMemo(() => {
    const baseTheme = isDark ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      dark: isDark,
      colors: {
        ...baseTheme.colors,
        primary: '#10B981',
        background: isDark ? '#0F172A' : '#F1F5F9',
        card: isDark ? '#0F172A' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#0F172A',
        border: isDark ? '#1E293B' : '#E2E8F0',
        notification: '#EF4444',
      },
    };
  }, [isDark]);

  if (!fontsLoaded) return null;

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <Theme name={isDark ? 'dark' : 'light'}>
        <ThemeProvider value={navTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <CbudgetSplashScreen />
          <CustomAlertProvider />
          <ToastProvider />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: navTheme.colors.background } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="invest-details" options={{ presentation: 'modal' }} />
            <Stack.Screen name="arcade" options={{ headerShown: false }} />
            <Stack.Screen name="headline-trader" options={{ presentation: 'fullScreenModal', headerShown: false }} />
            <Stack.Screen name="crypto-rocket" options={{ presentation: 'fullScreenModal', headerShown: false }} />
            <Stack.Screen name="portfolio-balancer" options={{ presentation: 'fullScreenModal', headerShown: false }} />
            <Stack.Screen name="dividend-snowball" options={{ presentation: 'fullScreenModal', headerShown: false }} />
            <Stack.Screen name="licenses" options={{ presentation: 'modal', headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </Theme>
    </TamaguiProvider>
  );
}

