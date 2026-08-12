import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, Platform, Modal, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { YStack, XStack, Text, Button, View } from 'tamagui';
import { Link, Href, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeIn, BounceIn } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Typography } from '@/constants/theme';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { FormButton } from '@/components/ui/FormButton';
import { useAuthStore } from '@/store/authStore';
import { SymbolView } from 'expo-symbols';

export default function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [faqVisible, setFaqVisible] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      await login('mock-guest-token-56789', {
        id: 'guest',
        name: 'Guest Explorer',
        email: 'guest@cbudget.com',
      });
      router.replace('/(tabs)' as Href);
    } catch (err) {
      Alert.alert('Guest Mode Error', 'Unable to start guest session.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor={theme.background} minHeight={Platform.OS === 'web' ? '100vh' : '100%'}>
      <BackgroundSystem />
      <SafeAreaView style={styles.safeArea}>
        <YStack flex={1} paddingHorizontal={Spacing[24]} paddingBottom={80}>
          
          {/* Main Content Area: Centered Vertically */}
          <YStack flex={1} justifyContent="center" alignItems="center">
            
            {/* Logo Row with Sub-text */}
            <Animated.View entering={BounceIn.delay(100).duration(800)}>
              <YStack alignItems="center" justifyContent="center">
                <XStack alignItems="center" justifyContent="center" gap={0}>
                  <Image
                    source={require('../../../assets/images/walletly-logo.png')}
                    style={{ width: 100, height: 100, transform: [{ translateY: 5.5 }] }}
                    contentFit="contain"
                  />
                  <Text
                    color={theme.text}
                    fontSize={54}
                    fontWeight="900"
                    letterSpacing={-2}
                    marginLeft={-12}
                  >
                    budget
                  </Text>
                </XStack>

                <Text
                  color={theme.text}
                  fontSize={12}
                  fontWeight="900"
                  letterSpacing={4}
                  textTransform="uppercase"
                  marginTop={-6}
                  textAlign="center"
                  style={{ transform: [{ translateX: 10 }] }} // Center-aligned under text portion
                >
                  BUDGET & INVESTMENT
                </Text>
              </YStack>
            </Animated.View>
            
          </YStack>

          {/* Bottom Actions */}
          <Animated.View entering={FadeInDown.delay(700).duration(600).springify()} style={{ width: '100%' }}>
            <YStack gap={Spacing[16]} width="100%">
              <Link href={'/(auth)/register' as Href} asChild>
                <FormButton variant="primary">
                  Create Account
                </FormButton>
              </Link>

            <Link href={'/(auth)/login' as Href} asChild>
              <FormButton variant="secondary">
                Sign In
              </FormButton>
            </Link>

            <Button
              width="100%"
              height={56}
              backgroundColor={`${theme.primary}12` as any}
              borderColor={`${theme.primary}4D` as any}
              borderWidth={1.5}
              borderRadius={16}
              pressStyle={{ opacity: 0.8, scale: 0.98, backgroundColor: `${theme.primary}26` as any }}
              disabled={guestLoading}
              onPress={handleGuestLogin}
            >
              <XStack gap={10} alignItems="center" justifyContent="center">
                {guestLoading ? (
                  <ActivityIndicator color={theme.primary as any} size="small" />
                ) : (
                  <>
                    <SymbolView
                      name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' } as any}
                      size={20}
                      tintColor={theme.primary as any}
                    />
                    <Text color={theme.primary as any} fontSize={16} fontWeight="700" letterSpacing={0.2}>
                      Explore as Guest
                    </Text>
                  </>
                )}
              </XStack>
            </Button>
            
            {/* FAQ Access Button */}
            <XStack justifyContent="center" marginTop={8}>
              <TouchableOpacity onPress={() => setFaqVisible(true)} activeOpacity={0.7} style={{ padding: 8 }}>
                <Text color={theme.textSecondary} fontSize={13} fontWeight="600" letterSpacing={0.5}>
                  Need Help? Read FAQ
                </Text>
              </TouchableOpacity>
            </XStack>
            </YStack>
          </Animated.View>

        </YStack>
      </SafeAreaView>

      {/* FAQ Bottom Sheet Modal */}
      <Modal
        visible={faqVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => setFaqVisible(false)}
      >
        <YStack flex={1} backgroundColor="rgba(15, 23, 42, 0.4)" justifyContent="flex-end">
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setFaqVisible(false)} 
          />
          <YStack
            backgroundColor={theme.surface}
            borderTopLeftRadius={24}
            borderTopRightRadius={24}
            maxHeight="75%"
            paddingHorizontal={Spacing[24]}
            paddingTop={Spacing[24]}
            paddingBottom={Platform.OS === 'ios' ? 44 : 24}
            shadowColor="#0F172A"
            shadowOffset={{ width: 0, height: -8 }}
            shadowOpacity={0.1}
            shadowRadius={24}
            elevation={10}
            gap={16}
          >
            {/* Header */}
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={18} fontWeight="800" color={theme.text} letterSpacing={-0.3}>
                Frequently Asked Questions
              </Text>
              <TouchableOpacity onPress={() => setFaqVisible(false)} style={{ padding: 4 }}>
                <Text fontSize={24} fontWeight="600" color={theme.textSecondary}>×</Text>
              </TouchableOpacity>
            </XStack>

            {/* Scrollable Q&A */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <YStack gap={18} marginTop={8}>
                
                {/* Question 1 */}
                <YStack gap={4}>
                  <Text fontSize={14} fontWeight="700" color={theme.text}>
                    What is Cbudget?
                  </Text>
                  <Text fontSize={13} color={theme.textSecondary} lineHeight={18}>
                    Cbudget is a personal finance education app designed to teach you budgeting, saving, and investing. It features a budget planner, a learning academy, and a virtual investment simulator.
                  </Text>
                </YStack>

                {/* Question 2 */}
                <YStack gap={4}>
                  <Text fontSize={14} fontWeight="700" color={theme.text}>
                    Is this real money or real trading?
                  </Text>
                  <Text fontSize={13} color={theme.textSecondary} lineHeight={18}>
                    No. Cbudget uses 100% virtual funds ($10,000 granted on start). It is a risk-free learning laboratory designed to let you practice budget allocations and stock market simulation safely.
                  </Text>
                </YStack>

                {/* Question 3 */}
                <YStack gap={4}>
                  <Text fontSize={14} fontWeight="700" color={theme.text}>
                    What is the Financial Health Score?
                  </Text>
                  <Text fontSize={13} color={theme.textSecondary} lineHeight={18}>
                    It is a metric that scores your budgeting consistency, savings ratios, academy lesson progress, and simulator activity. Keep it high to level up your Financial Mastery titles!
                  </Text>
                </YStack>

                {/* Question 4 */}
                <YStack gap={4}>
                  <Text fontSize={14} fontWeight="700" color={theme.text}>
                    How does the Budget Tracker work?
                  </Text>
                  <Text fontSize={13} color={theme.textSecondary} lineHeight={18}>
                    You can set up custom spending limits, log simulated expenses, and review your savings performance. Building consistent budget habits directly increases your experience points (XP).
                  </Text>
                </YStack>

              </YStack>
            </ScrollView>

            {/* Bottom Close Button */}
            <Button
              height={50}
              backgroundColor={theme.primary}
              borderRadius={12}
              color="#FFFFFF"
              fontWeight="700"
              fontSize={15}
              pressStyle={{ opacity: 0.85 }}
              onPress={() => setFaqVisible(false)}
              marginTop={8}
            >
              Got It
            </Button>
          </YStack>
        </YStack>
      </Modal>
    </YStack>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
