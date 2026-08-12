import React from 'react';
import { SafeAreaView, StyleSheet, Platform, View } from 'react-native';
import { YStack, Text } from 'tamagui';
import { useRouter, Href } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeInDown, BounceIn } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Typography } from '@/constants/theme';
import { useGamificationStore } from '@/store/gamificationStore';
import { FormButton } from '@/components/ui/FormButton';

export default function OnboardingWelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const addXP = useGamificationStore((state) => state.addXP);

  const handleContinue = () => {
    // Reward user for starting
    addXP(50);
    router.push('/(onboarding)/nickname' as Href);
  };

  return (
    <YStack flex={1} backgroundColor="#020F1E" minHeight={Platform.OS === 'web' ? '100vh' : '100%'}>
      {/* Subtle radial accent top glow */}
      <View style={styles.glowTop} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <YStack flex={1} paddingHorizontal={Spacing[24]} paddingBottom={Spacing[48]}>
          
          <YStack flex={1} justifyContent="center" alignItems="center" gap={Spacing[32]}>
            {/* Logo without blue circle background, much larger, and beautiful blue glow */}
            <Animated.View 
              entering={BounceIn.delay(100).duration(800)}
              style={styles.logoContainer}
            >
              <Image
                source={require('../../../assets/images/walletly-logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(600)}>
              <YStack alignItems="center" gap={Spacing[16]}>
                <Text color="#FFFFFF" fontSize={30} fontWeight="700" letterSpacing={-0.6} textAlign="center">
                  Welcome to Cbudget!
                </Text>
                <Text color="rgba(255, 255, 255, 0.6)" fontSize={15} fontWeight="400" textAlign="center" lineHeight={22} paddingHorizontal={12}>
                  You're about to start your journey to financial mastery. Let's set up your profile and get you funded.
                </Text>
              </YStack>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(600)}>
              <YStack backgroundColor="rgba(255, 255, 255, 0.035)" padding={Spacing[16]} borderRadius={16} borderWidth={1} borderColor="rgba(255, 255, 255, 0.08)" alignItems="center" gap={Spacing[8]}>
                <Text color={theme.primary as any} fontSize={22} fontWeight="700">+50 XP</Text>
                <Text color="rgba(255, 255, 255, 0.5)" fontSize={12}>Reward for taking the first step</Text>
              </YStack>
            </Animated.View>
          </YStack>

          <Animated.View entering={FadeInDown.delay(700).duration(600)}>
            <FormButton
              variant="primary"
              height={52}
              glow
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
  logoContainer: {
    shadowColor: '#0052FF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 32,
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
    opacity: 0.07,
  },
});
