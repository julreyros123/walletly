import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; access_token?: string; refresh_token?: string }>();
  const incomingUrl = Linking.useURL();
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      try {
        const url = incomingUrl || (await Linking.getInitialURL());

        // 1. If PKCE code parameter exists
        if (params.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) {
            console.warn('[AuthCallback] Exchange code error:', error.message);
          }
        } else if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionError) {
            console.warn('[AuthCallback] Set direct session error:', sessionError.message);
          }
        } else if (url && (url.includes('#') || url.includes('?'))) {
          // 2. If access_token fragment or query params exist in URL
          let extractedParams: Record<string, string> = {};
          if (url.includes('#')) {
            const fragment = url.split('#')[1];
            extractedParams = Object.fromEntries(new URLSearchParams(fragment));
          } else if (url.includes('?')) {
            const query = url.split('?')[1];
            extractedParams = Object.fromEntries(new URLSearchParams(query));
          }

          if (extractedParams.code) {
            await supabase.auth.exchangeCodeForSession(extractedParams.code);
          } else if (extractedParams.access_token && extractedParams.refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: extractedParams.access_token,
              refresh_token: extractedParams.refresh_token,
            });
            if (sessionError) {
              console.warn('[AuthCallback] Set session error:', sessionError.message);
            }
          }
        }

        // Re-hydrate local auth state
        await hydrate();

        if (isMounted) {
          router.replace('/(tabs)' as Href);
        }
      } catch (err: unknown) {
        console.warn('[AuthCallback] Callback handling error:', err);
        if (isMounted) {
          router.replace('/(auth)/login' as Href);
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [params, incomingUrl, hydrate, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3EB47D" />
      <Text style={styles.text}>
        Completing sign in...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020C18',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    color: '#94A3B8',
    fontSize: 15,
  },
});
