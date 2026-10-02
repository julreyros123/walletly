import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, YStack, XStack } from 'tamagui';
import { Href, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useAuthStore } from '@/store/authStore';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { GoogleIcon, FacebookIcon } from '@/components/ui/SocialIcons';
import { Fonts, Spacing } from '@/constants/theme';

// Module-level flag so returning from register/login does not re-play the initial splash delay
let hasLoadedSplashOnce = false;

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const { loginWithGoogle, loginWithFacebook, loginAsGuest } = useAuthStore();

  const [loadingType, setLoadingType] = useState<'google' | 'facebook' | 'guest' | null>(null);
  const [faqVisible, setFaqVisible] = useState(false);

  // Height allocated for the white bottom modal (~54% of screen height)
  const modalHeight = Math.min(Math.max(screenHeight * 0.54, 420), 470);

  // Mathematically accurate centering:
  // In the top blue half (flex: 1), the visual center is (screenHeight - modalHeight) / 2.
  // Shifting by +(modalHeight / 2) places the logo EXACTLY in the center of the full phone screen on startup!
  // When the modal appears, it transitions to 0 (the true vertical center of the top blue half).
  const initialLogoY = hasLoadedSplashOnce ? 0 : modalHeight / 2;
  const initialModalY = hasLoadedSplashOnce ? 0 : modalHeight + 60;
  const initialFade = hasLoadedSplashOnce ? 1 : 0;

  const logoTranslateY = useSharedValue(initialLogoY);
  const modalTranslateY = useSharedValue(initialModalY);
  const brandTextFade = useSharedValue(initialFade);
  const modalContentFade = useSharedValue(initialFade);

  useEffect(() => {
    if (hasLoadedSplashOnce) return;

    // Splash presentation delay before smoothly transitioning
    const timer = setTimeout(() => {
      // 1. Move logo smoothly from whole-screen center into the center of the top blue half
      logoTranslateY.value = withTiming(0, {
        duration: 750,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });

      // 2. Fade in brand title and tagline
      brandTextFade.value = withDelay(
        220,
        withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) })
      );

      // 3. Smoothly pop up the white modal from bottom
      modalTranslateY.value = withSpring(0, {
        damping: 22,
        stiffness: 135,
        mass: 0.9,
      });

      // 4. Staggered fade for inner modal options
      modalContentFade.value = withDelay(
        250,
        withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) })
      );

      hasLoadedSplashOnce = true;
    }, 1500);

    return () => clearTimeout(timer);
  }, [modalHeight]);

  const animatedBrandStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const animatedBrandTextStyle = useAnimatedStyle(() => ({
    opacity: brandTextFade.value,
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const animatedModalContentStyle = useAnimatedStyle(() => ({
    opacity: modalContentFade.value,
  }));

  // Handlers
  const handleEmailRegister = () => {
    router.push('/(auth)/register' as Href);
  };

  const handleGoogleLogin = async () => {
    if (loadingType) return;
    setLoadingType('google');
    try {
      await loginWithGoogle();
      const currentUser = useAuthStore.getState().user;
      const isNewAccount = !currentUser?.isOnboarded || !currentUser?.name || currentUser.name === 'User' || !currentUser?.age;
      if (isNewAccount && currentUser?.id !== 'guest') {
        router.replace('/(onboarding)' as Href);
      } else {
        router.replace('/(tabs)' as Href);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in could not be completed.';
      console.warn('[WelcomeScreen] Google sign-in failed:', message);
      Alert.alert('Google Sign-In', message);
    } finally {
      setLoadingType(null);
    }
  };

  const handleFacebookLogin = async () => {
    if (loadingType) return;
    setLoadingType('facebook');
    try {
      await loginWithFacebook();
      const currentUser = useAuthStore.getState().user;
      const isNewAccount = !currentUser?.isOnboarded || !currentUser?.name || currentUser.name === 'User' || !currentUser?.age;
      if (isNewAccount && currentUser?.id !== 'guest') {
        router.replace('/(onboarding)' as Href);
      } else {
        router.replace('/(tabs)' as Href);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Facebook sign-in could not be completed.';
      console.warn('[WelcomeScreen] Facebook sign-in failed:', message);
      Alert.alert('Facebook Sign-In', message);
    } finally {
      setLoadingType(null);
    }
  };

  const handleGuestLogin = async () => {
    if (loadingType) return;
    setLoadingType('guest');
    try {
      await loginAsGuest();
      router.replace('/(tabs)' as Href);
    } catch (err: unknown) {
      console.warn('[WelcomeScreen] Guest mode error:', err);
      Alert.alert('Guest Mode Error', 'Unable to start a guest session at this time.');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="light" />

      {/* Top Blue Half: Fills the entire space above the white modal */}
      <View style={[styles.topBlueHalf, { paddingTop: insets.top }]}>
        <Animated.View style={[styles.brandCenterWrapper, animatedBrandStyle]}>
          <Image
            source={require('@/assets/animations/walletly_splash.webp')}
            style={styles.logoImage}
            contentFit="contain"
            priority="high"
          />

          <Animated.View style={[styles.brandTextWrapper, animatedBrandTextStyle]}>
            <Text style={styles.brandTitle}>cbudget</Text>
            <Text style={styles.brandTagline}>Master Your Money • Build Your Future</Text>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Bottom Half: White Modal Container */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            height: modalHeight,
            paddingBottom: Math.max(insets.bottom + 12, 24),
          },
          animatedModalStyle,
        ]}
      >
        {/* Grabber Bar */}
        <View style={styles.modalGrabber} />

        <Animated.View style={[{ flex: 1 }, animatedModalContentStyle]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Modal Heading */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Get Started</Text>
              <Text style={styles.modalSubtitle}>
                Choose how you would like to access your account
              </Text>
            </View>

            {/* Buttons Group (Strict Order) */}
            <View style={styles.buttonsGroup}>
              {/* 1. Email Button -> Redirects to manual registry */}
              <Pressable
                onPress={handleEmailRegister}
                style={({ pressed }) => [
                  styles.buttonBase,
                  styles.emailButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Continue with Email"
              >
                <XStack alignItems="center" justifyContent="center" gap={10}>
                  <PhosphorIcon name="Envelope" size={20} color="#FFFFFF" weight="bold" />
                  <Text style={styles.emailButtonText}>Continue with Email</Text>
                </XStack>
              </Pressable>

              {/* 2. Google Button */}
              <Pressable
                onPress={handleGoogleLogin}
                disabled={loadingType !== null}
                style={({ pressed }) => [
                  styles.buttonBase,
                  styles.googleButton,
                  pressed && styles.buttonPressed,
                  loadingType === 'google' && styles.buttonLoading,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
              >
                {loadingType === 'google' ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <XStack alignItems="center" justifyContent="center" gap={10}>
                    <GoogleIcon size={20} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </XStack>
                )}
              </Pressable>

              {/* 3. Facebook Button */}
              <Pressable
                onPress={handleFacebookLogin}
                disabled={loadingType !== null}
                style={({ pressed }) => [
                  styles.buttonBase,
                  styles.facebookButton,
                  pressed && styles.buttonPressed,
                  loadingType === 'facebook' && styles.buttonLoading,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Continue with Facebook"
              >
                {loadingType === 'facebook' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <XStack alignItems="center" justifyContent="center" gap={10}>
                    <FacebookIcon size={20} />
                    <Text style={styles.facebookButtonText}>Continue with Facebook</Text>
                  </XStack>
                )}
              </Pressable>

              {/* 4. Quick Access as Guest */}
              <Pressable
                onPress={handleGuestLogin}
                disabled={loadingType !== null}
                style={({ pressed }) => [
                  styles.buttonBase,
                  styles.guestButton,
                  pressed && styles.buttonPressed,
                  loadingType === 'guest' && styles.buttonLoading,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Quick access as guest"
              >
                {loadingType === 'guest' ? (
                  <ActivityIndicator size="small" color="#475569" />
                ) : (
                  <XStack alignItems="center" justifyContent="center" gap={10}>
                    <PhosphorIcon name="Sparkle" size={19} color="#475569" weight="fill" />
                    <Text style={styles.guestButtonText}>Quick access as guest</Text>
                  </XStack>
                )}
              </Pressable>
            </View>

            {/* Footer Options: Existing Account Sign In & Help */}
            <View style={styles.footerContainer}>
              <XStack alignItems="center" justifyContent="center" gap={4}>
                <Text style={styles.footerNotice}>Already have an account?</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/login' as Href)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.footerSignInLink}>Sign In</Text>
                </TouchableOpacity>
              </XStack>

              {/* Need help? trigger */}
              <TouchableOpacity
                onPress={() => setFaqVisible(true)}
                activeOpacity={0.7}
                style={styles.helpButton}
              >
                <XStack alignItems="center" gap={6}>
                  <PhosphorIcon name="Question" size={14} color="#64748B" />
                  <Text style={styles.helpText}>Need help?</Text>
                </XStack>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>

      {/* FAQ Bottom Sheet Modal */}
      <Modal
        visible={faqVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => setFaqVisible(false)}
      >
        <View style={styles.faqModalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setFaqVisible(false)}
          />
          <View style={styles.faqModalContent}>
            {/* Header */}
            <XStack justifyContent="space-between" alignItems="center" marginBottom={12}>
              <Text style={styles.faqHeaderTitle}>Frequently Asked Questions</Text>
              <TouchableOpacity onPress={() => setFaqVisible(false)} style={{ padding: 4 }}>
                <Text style={styles.faqCloseIcon}>✕</Text>
              </TouchableOpacity>
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              <YStack gap={16} paddingVertical={8}>
                <YStack gap={4}>
                  <Text style={styles.faqQuestion}>What is Cbudget?</Text>
                  <Text style={styles.faqAnswer}>
                    Cbudget is a personal finance education app designed to teach you budgeting,
                    saving, and investing through gamified practice.
                  </Text>
                </YStack>

                <YStack gap={4}>
                  <Text style={styles.faqQuestion}>Is this real money or real trading?</Text>
                  <Text style={styles.faqAnswer}>
                    No. Cbudget provides virtual funds ($10,000 granted on start). It is a risk-free
                    learning simulator to practice budget allocations and portfolio management safely.
                  </Text>
                </YStack>

                <YStack gap={4}>
                  <Text style={styles.faqQuestion}>What does Quick Access as Guest do?</Text>
                  <Text style={styles.faqAnswer}>
                    Guest mode lets you immediately explore all features, simulators, and lessons
                    without having to register your email right away.
                  </Text>
                </YStack>
              </YStack>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setFaqVisible(false)}
              style={styles.faqGotItButton}
              activeOpacity={0.8}
            >
              <Text style={styles.faqGotItButtonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#121E3F',
  },
  topBlueHalf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  brandCenterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  brandTextWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    letterSpacing: -0.5,
  },
  brandTagline: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Fonts.medium,
    marginTop: 4,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing[24],
    paddingTop: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 20,
  },
  modalGrabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 13,
    fontFamily: Fonts.medium,
    marginTop: 4,
    textAlign: 'center',
  },
  buttonsGroup: {
    gap: 11,
    width: '100%',
  },
  buttonBase: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  buttonLoading: {
    opacity: 0.7,
  },
  // 1. Email Button
  emailButton: {
    backgroundColor: '#121E3F',
    shadowColor: '#121E3F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    letterSpacing: -0.2,
  },
  // 2. Google Button
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  googleButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    letterSpacing: -0.2,
  },
  // 3. Facebook Button
  facebookButton: {
    backgroundColor: '#1877F2',
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  facebookButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    letterSpacing: -0.2,
  },
  // 4. Guest Button
  guestButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guestButtonText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Fonts.medium,
    letterSpacing: -0.2,
  },
  // Footer
  footerContainer: {
    marginTop: 18,
    alignItems: 'center',
    gap: 8,
  },
  footerNotice: {
    color: '#64748B',
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  footerSignInLink: {
    color: '#121E3F',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  helpButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  helpText: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  // FAQ Modal
  faqModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  faqModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingHorizontal: Spacing[24],
    paddingTop: Spacing[24],
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  faqHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  faqCloseIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  faqAnswer: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#475569',
    lineHeight: 18,
  },
  faqGotItButton: {
    backgroundColor: '#121E3F',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  faqGotItButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
});
