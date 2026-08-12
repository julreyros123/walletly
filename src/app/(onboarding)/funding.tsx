import React from 'react';
import { SafeAreaView, StyleSheet, Platform } from 'react-native';
import { YStack, Text, Button } from 'tamagui';
import { useRouter, Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInDown, BounceIn } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Typography } from '@/constants/theme';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { FormButton } from '@/components/ui/FormButton';

export default function OnboardingFundingScreen() {
  const theme = useTheme();
  const router = useRouter();

  const handleFinish = () => {
    // Usually we would update an 'isFirstTime' flag here
    router.replace('/(tabs)' as Href);
  };

  return (
    <YStack flex={1} backgroundColor={theme.background} minHeight={Platform.OS === 'web' ? '100vh' : '100%'}>
      <BackgroundSystem mode="tabs" />
      <SafeAreaView style={styles.safeArea}>
        <YStack flex={1} paddingHorizontal={Spacing[24]} paddingBottom={Spacing[48]}>
          
          <YStack flex={1} justifyContent="center" alignItems="center" gap={Spacing[32]}>
            <Animated.View entering={BounceIn.delay(200).duration(800)}>
              <YStack
                width={120}
                height={120}
                borderRadius={60}
                backgroundColor={`${theme.primary}1A` as any} // Dynamic accent tint
                alignItems="center"
                justifyContent="center"
              >
                <SymbolView
                  name={{ ios: 'banknote.fill', android: 'payments', web: 'payments' } as const}
                  size={56}
                  tintColor={theme.primary as any}
                />
              </YStack>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(600)}>
              <YStack alignItems="center" gap={Spacing[16]}>
                <Text color={theme.text} fontSize={Typography.h1.fontSize} fontWeight={Typography.h1.fontWeight} textAlign="center">
                  $10,000 Granted!
                </Text>
                <Text color={theme.textSecondary} fontSize={Typography.body.fontSize} fontWeight={Typography.body.fontWeight} textAlign="center" lineHeight={24}>
                  We've deposited $10,000 in your virtual portfolio. Use this to practice investing in real stocks, risk-free.
                </Text>
              </YStack>
            </Animated.View>
          </YStack>

          <Animated.View entering={FadeInDown.delay(700).duration(600)}>
            <FormButton
              variant="primary"
              onPress={handleFinish}
            >
              Start Dashboard
            </FormButton>
          </Animated.View>

        </YStack>
      </SafeAreaView>
    </YStack>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
});
