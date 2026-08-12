import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { YStack } from 'tamagui';
import { useRouter, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/use-theme';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const theme = useTheme();

  if (isLoading) {
    return (
      <YStack flex={1} backgroundColor={theme.background} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={theme.primary} />
      </YStack>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)" />;
}
