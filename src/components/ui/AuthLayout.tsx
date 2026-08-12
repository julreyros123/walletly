import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Button, Text } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { HeroGraphic } from '@/components/ui/HeroGraphic';
import { TrustIndicators } from './TrustIndicators';
import { Spacing, Typography } from '@/constants/theme';

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
    <YStack flex={1} backgroundColor={theme.background} minHeight={Platform.OS === 'web' ? '100vh' : '100%'}>
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
            <BackgroundSystem mode={backgroundMode} />
            <YStack
              width="100%"
              maxWidth={440}
              alignSelf="center"
              paddingHorizontal={Spacing[24]}
              paddingVertical={Spacing[16]}
              gap={Spacing[12]}
            >
              {/* Top Row for Back Button */}
              <XStack alignItems="center" width="100%" height={32}>
                {showBackButton && (
                  <Button
                    chromeless
                    circular
                    width={32}
                    height={32}
                    pressStyle={{ opacity: 0.7 }}
                    onPress={handleBack}
                    alignItems="center"
                    justifyContent="center"
                    marginLeft={-12}
                  >
                    <SymbolView
                      name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' } as const}
                      size={20}
                      tintColor={theme.text}
                    />
                  </Button>
                )}
              </XStack>

              {/* Main Content Area */}
              <YStack flex={1} paddingTop={0} paddingBottom={Spacing[8]}>
                
                {/* Premium Hero Graphic with Title & Subtitle inside */}
                <HeroGraphic title={title} subtitle={subtitle} />

                {/* Content Wrapper */}
                <YStack width="100%" gap={Spacing[12]}>
                  {children}
                </YStack>

                {/* Security Trust Indicators */}
                <TrustIndicators />
              </YStack>
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </YStack>
  );
}

const styles = StyleSheet.create({
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
});
