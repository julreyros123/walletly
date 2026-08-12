import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, Platform, Modal, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { YStack, XStack, Text, Button, View, Theme } from 'tamagui';
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
  const loginAsGuest = useAuthStore((state) => state.loginAsGuest);
  const [faqVisible, setFaqVisible] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      await loginAsGuest();
      router.replace('/(tabs)' as Href);
    } catch (err) {
      Alert.alert('Guest Mode Error', 'Unable to start guest session.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <Theme name="dark">
      <YStack flex={1} backgroundColor="#001a36" minHeight={Platform.OS === 'web' ? '100vh' : '100%'}>
      <SafeAreaView style={styles.safeArea}>
        <YStack flex={1} paddingHorizontal={Spacing[24]} paddingBottom={80}>
          
          {/* Main Content Area: Centered Vertically */}
          <YStack flex={1} justifyContent="center" alignItems="center">
            
            {/* Logo */}
            <YStack alignItems="center" justifyContent="center">
              <Image
                source={require('../../../assets/images/walletly-logo.png')}
                style={{ width: 140, height: 140, borderRadius: 32, overflow: 'hidden' }}
                contentFit="contain"
              />
            </YStack>
            
          </YStack>

          {/* Bottom Actions */}
          <YStack gap={Spacing[12]} width="100%">
            <FormButton variant="primary" height={52} onPress={() => router.push('/(auth)/register' as Href)}>
              Create Account
            </FormButton>

            <FormButton variant="outline" height={52} onPress={() => router.push('/(auth)/login' as Href)}>
              Sign In
            </FormButton>

            <FormButton
              variant="ghost"
              height={52}
              loading={guestLoading}
              leftIcon={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' } as any}
              onPress={handleGuestLogin}
            >
              Explore as Guest
            </FormButton>
            
            {/* Help & FAQ Access Link */}
            <XStack justifyContent="center" marginTop={6}>
              <TouchableOpacity
                onPress={() => setFaqVisible(true)}
                activeOpacity={0.7}
                style={{ paddingVertical: 8, paddingHorizontal: 12 }}
              >
                <XStack alignItems="center" gap={6}>
                  <SymbolView
                    name={{ ios: 'questionmark.circle', android: 'help_outline', web: 'help_outline' } as any}
                    size={15}
                    tintColor="rgba(255, 255, 255, 0.75)"
                  />
                  <Text color="rgba(255, 255, 255, 0.85)" fontSize={13} fontWeight="500">
                    Need help?
                  </Text>
                </XStack>
              </TouchableOpacity>
            </XStack>
          </YStack>

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
            <FormButton
              variant="primary"
              height={50}
              onPress={() => setFaqVisible(false)}
              marginTop={8}
            >
              Got It
            </FormButton>
          </YStack>
        </YStack>
      </Modal>
    </YStack>
    </Theme>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
