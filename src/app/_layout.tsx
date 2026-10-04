import { DefaultTheme, DarkTheme, ThemeProvider } from 'expo-router';
import { TamaguiProvider, Theme } from 'tamagui';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { useEffect, useMemo, useRef } from 'react';
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
import { registerForPushNotificationsAsync } from '@/utils/notifications';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import * as Notifications from 'expo-notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isAuthInitially = useRef(useAuthStore.getState().isAuthenticated).current;
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const hydrateGamification = useGamificationStore((state) => state.hydrate);
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const mode = useThemeStore((state) => state.mode);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Hydrate auth, theme, and user preferences on app mount
  useEffect(() => {
    hydrateAuth();
    hydrateTheme();
    hydratePreferences();
  }, [hydrateAuth, hydrateTheme, hydratePreferences]);

  // Scoped gamification hydration once auth state resolves
  useEffect(() => {
    if (!isAuthLoading) {
      hydrateGamification(user?.id || 'guest');
    }
  }, [isAuthLoading, user?.id, hydrateGamification]);

  const setExpoPushToken = usePreferencesStore((state) => state.setExpoPushToken);
  const expoPushToken = usePreferencesStore((state) => state.expoPushToken);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [setExpoPushToken]);

  // Sync push token to Supabase profile whenever user logs in or token is registered
  useEffect(() => {
    if (expoPushToken && user?.id && user.id !== 'guest' && isSupabaseConfigured) {
      (async () => {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ push_token: expoPushToken, updated_at: new Date().toISOString() })
            .eq('id', user.id);
          if (error) {
            console.warn('[Notifications] Failed to sync push token to server profile:', error.message);
          }
        } catch (e: unknown) {
          console.warn('[Notifications] Push token profile sync error:', e);
        }
      })();
    }
  }, [expoPushToken, user?.id]);

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
        background: isDark ? '#0F172A' : '#F5F5F5',
        card: isDark ? '#0F172A' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#0F172A',
        border: isDark ? '#1E293B' : '#E2E8F0',
        notification: '#EF4444',
      },
    };
  }, [isDark]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <Theme name={isDark ? 'dark' : 'light'}>
          <ThemeProvider value={navTheme}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            {isAuthInitially && <CbudgetSplashScreen />}
            <CustomAlertProvider />
            <ToastProvider />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: navTheme.colors.background } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
              <Stack.Screen name="reset-password" options={{ presentation: 'card', headerShown: false }} />
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
              <Stack.Screen name="settings" options={{ presentation: 'card', headerShown: false }} />
            </Stack>
          </ThemeProvider>
        </Theme>
      </TamaguiProvider>
    </ErrorBoundary>
  );
}

