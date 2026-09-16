import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Button, Text, Theme } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { useRouter } from 'expo-router';
import { HeroGraphic } from '@/components/ui/HeroGraphic';
import { Spacing } from '@/constants/theme';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backgroundMode?: 'auth' | 'tabs';
}

export function AuthLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
  backgroundMode = 'auth',
}: AuthLayoutProps) {
  const theme = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)');
    }
  };

  return (
    <Theme name="dark">
      {/* Deep navy gradient background */}
      <View style={styles.root}>
        {/* Subtle radial accent - top glow */}
        <View style={styles.glowTop} pointerEvents="none" />
        {/* Bottom glow */}
        <View style={styles.glowBottom} pointerEvents="none" />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <YStack
                width="100%"
                maxWidth={440}
                alignSelf="center"
                paddingHorizontal={Spacing[24]}
                paddingVertical={Spacing[16]}
                gap={0}
              >
                {/* Top Row for Back Button */}
                <XStack alignItems="center" width="100%" height={36} marginBottom={4}>
                  {showBackButton && (
                    <Button
                      chromeless
                      width={36}
                      height={36}
                      borderRadius={6}
                      pressStyle={{ opacity: 0.7 }}
                      onPress={handleBack}
                      alignItems="center"
                      justifyContent="center"
                      marginLeft={-8}
                      backgroundColor="rgba(255,255,255,0.06)"
                      borderWidth={1}
                      borderColor="rgba(255,255,255,0.1)"
                      accessibilityRole="button"
                      accessibilityLabel="Go back"
                    >
                      <PhosphorIcon name="CaretLeft" size={18} color="#FFFFFF" weight="bold" />
                    </Button>
                  )}
                </XStack>

                {/* Hero: Logo + Title + Subtitle */}
                <HeroGraphic title={title} subtitle={subtitle} />

                {/* Flat Floating card container for form */}
                <View style={styles.formCard}>
                  <YStack width="100%" gap={14}>
                    {children}
                  </YStack>
                </View>
              </YStack>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Theme>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020C18',
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: '50%',
    marginLeft: -180,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#0052FF',
    opacity: 0.05,
    ...Platform.select({
      ios: {
        shadowColor: '#0052FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 80,
      },
    }),
  },
  glowBottom: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#0052FF',
    opacity: 0.03,
  },
  formCard: {
    backgroundColor: '#091525',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#16273C',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
});
