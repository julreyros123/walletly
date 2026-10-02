import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { CbudgetSplashScreen } from '@/components/CbudgetSplashScreen';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      const isNewAccount = !user?.isOnboarded || !user?.name || user.name === 'User' || !user?.age;
      if (isNewAccount && user?.id !== 'guest') {
        router.replace('/(onboarding)');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      router.replace('/(auth)');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return <CbudgetSplashScreen />;
}
