import React from 'react';
import { SafeAreaView, StyleSheet, Platform } from 'react-native';
import { YStack, XStack, Text, Button } from 'tamagui';
import { useRouter, Href } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeInDown, BounceIn } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Typography } from '@/constants/theme';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { useGamificationStore } from '@/store/gamificationStore';
import { FormButton } from '@/components/ui/FormButton';

export default function OnboardingWelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const addXP = useGamificationStore((state) => state.addXP);

  const handleContinue = () => {
    // Reward user for starting
    addXP(50);
    router.push('/(onboarding)/funding' as Href);
  };

  return (
    <YStack flex={1} backgroundColor={theme.background} minHeight={Platform.OS === 'web' ? '100vh' : '100%'}>
      <BackgroundSystem mode="tabs" />
      <SafeAreaView style={styles.safeArea}>
        <YStack flex={1} paddingHorizontal={Spacing[24]} paddingBottom={Spacing[48]}>
          
          <YStack flex={1} justifyContent="center" alignItems="center" gap={Spacing[32]}>
            <Animated.View entering={BounceIn.delay(100).duration(800)}>
              <YStack
                width={120}
                height={120}
                borderRadius={60}
                backgroundColor={`${theme.primary}1A` as any} // Dynamic accent tint
                alignItems="center"
                justifyContent="center"
              >
                <Image
                  source={require('../../../assets/images/walletly-logo.png')}
                  style={{ width: 64, height: 64 }}
                  contentFit="contain"
                />
              </YStack>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(600)}>
              <YStack alignItems="center" gap={Spacing[16]}>
                <Text color={theme.text} fontSize={Typography.h1.fontSize} fontWeight={Typography.h1.fontWeight} textAlign="center">
                  Welcome to Cbudget!
                </Text>
                <Text color={theme.textSecondary} fontSize={Typography.body.fontSize} fontWeight={Typography.body.fontWeight} textAlign="center" lineHeight={24}>
                  You're about to start your journey to financial mastery. Let's set up your profile and get you funded.
                </Text>
              </YStack>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(600)}>
              <YStack backgroundColor={theme.surface} padding={Spacing[16]} borderRadius={16} borderWidth={1} borderColor={theme.border} alignItems="center" gap={Spacing[8]}>
                <Text color={theme.primary} fontSize={Typography.h2.fontSize} fontWeight="700">+50 XP</Text>
                <Text color={theme.textSecondary} fontSize={Typography.caption.fontSize}>Reward for taking the first step</Text>
              </YStack>
            </Animated.View>
          </YStack>

          <Animated.View entering={FadeInDown.delay(700).duration(600)}>
            <FormButton
              variant="primary"
              onPress={handleContinue}
            >
              Let's Go
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
