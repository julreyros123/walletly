import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Button, Text, Theme } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';
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
                      circular
                      width={36}
                      height={36}
                      pressStyle={{ opacity: 0.7 }}
                      onPress={handleBack}
                      alignItems="center"
                      justifyContent="center"
                      marginLeft={-8}
                      backgroundColor="rgba(255,255,255,0.06)"
                    >
                      <SymbolView
                        name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' } as const}
                        size={18}
                        tintColor="#FFFFFF"
                      />
                    </Button>
                  )}
                </XStack>

                {/* Hero: Logo + Title + Subtitle */}
                <HeroGraphic title={title} subtitle={subtitle} />

                {/* Card container for form */}
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
    backgroundColor: '#020F1E',
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
    opacity: 0.08,
    ...Platform.select({
      ios: {
        shadowColor: '#0052FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
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
    opacity: 0.05,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 4,
  },
});
