import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { YStack, Text, XStack, View } from 'tamagui';
import { Link, useRouter, Href } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { registerSchema, RegisterFormData } from '@/validation/auth.schema';
import { supabase } from '@/utils/supabase';
import { AuthLayout } from '@/components/ui/AuthLayout';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { useTheme } from '@/hooks/use-theme';
import { Fonts } from '@/constants/theme';
import { Alert, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { GoogleIcon, FacebookIcon } from '@/components/ui/SocialIcons';
import { LegalPolicyModal } from '@/features/profile/components/LegalPolicyModal';
import { CONSENT_TEXT, POLICY_METADATA } from '@/constants/legalPolicies';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function SocialIconButton({
  icon,
  onPress,
  loading = false,
  accessibilityLabel,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  loading?: boolean;
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[aStyle, styles.socialBtn, loading && { opacity: 0.7 }]}>
      <Pressable
        disabled={loading}
        onPressIn={() => {
          if (!loading) scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          if (!loading) scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={onPress}
        style={styles.socialBtnInner}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: loading }}
      >
        {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : icon}
      </Pressable>
    </Animated.View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const signUp = useAuthStore((state) => state.signUp);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);

  const canSubmit = termsAccepted && ageConfirmed;

  // Navigate to onboarding funnel when registration succeeds
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(onboarding)' as Href);
    }
  }, [isAuthenticated, router]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const password = watch('password', '');

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    if (score <= 2) return { score, label: 'Weak', color: theme.error };
    if (score <= 4) return { score, label: 'Medium', color: theme.warning };
    return { score, label: 'Strong', color: theme.success };
  };

  const strength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      await signUp(data.email, data.password);
      
      // Check if user is logged in (email verification disabled)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(onboarding)' as Href);
      } else {
        Alert.alert(
          'Verification Required',
          'Please check your inbox and verify your email address to continue.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login' as Href) }]
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Please check your inputs and try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!canSubmit) {
      Alert.alert(
        'Consent Required',
        'Please accept the Terms of Service and confirm your age before signing up.',
      );
      return;
    }
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Navigation is handled reactively by the useEffect on isAuthenticated
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign up failed. Please try again.';
      Alert.alert('Google Sign Up', message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start your financial journey"
      showBackButton
    >
      <YStack gap={16} width="100%">
        {/* Email */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Email address"
              leftIcon="Envelope"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="Enter your email"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.email?.message}
            />
          )}
        />

        {/* Password */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <YStack gap={6}>
              <FormInput
                label="Password"
                leftIcon="Lock"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                placeholder="Enter your password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
              {value.length > 0 && (
                <YStack gap={4} paddingHorizontal={2} marginTop={2}>
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text
                      fontSize={11}
                      color="#94A3B8"
                      fontFamily={Fonts.medium as any}
                    >
                      Password strength
                    </Text>
                    <Text
                      fontSize={11}
                      color={strength.color as any}
                      fontFamily={Fonts.bold as any}
                    >
                      {strength.label}
                    </Text>
                  </XStack>
                  <XStack gap={4} width="100%" height={3}>
                    <View
                      flex={1}
                      height="100%"
                      borderRadius={2}
                      backgroundColor={(strength.score >= 1 ? strength.color : '#1E334D') as any}
                    />
                    <View
                      flex={1}
                      height="100%"
                      borderRadius={2}
                      backgroundColor={(strength.score >= 3 ? strength.color : '#1E334D') as any}
                    />
                    <View
                      flex={1}
                      height="100%"
                      borderRadius={2}
                      backgroundColor={(strength.score >= 5 ? strength.color : '#1E334D') as any}
                    />
                  </XStack>
                </YStack>
              )}
            </YStack>
          )}
        />

        {/* Legal Consent Checkboxes */}
        <YStack gap={12} marginTop={4}>
          {/* Terms & Privacy Policy Checkbox */}
          <Pressable
            onPress={() => setTermsAccepted(!termsAccepted)}
            style={styles.checkboxRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAccepted }}
            accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
          >
            <View
              style={[
                styles.checkbox,
                termsAccepted && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
            >
              {termsAccepted && (
                <Text color="#FFFFFF" fontSize={12} fontWeight="700">✓</Text>
              )}
            </View>
            <Text
              color="#94A3B8"
              fontSize={12}
              fontFamily={Fonts.medium as any}
              flex={1}
              lineHeight={16}
            >
              I agree to the{' '}
              <Text
                color={theme.primary as any}
                fontSize={12}
                fontFamily={Fonts.bold as any}
                onPress={() => setLegalModalVisible(true)}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                color={theme.primary as any}
                fontSize={12}
                fontFamily={Fonts.bold as any}
                onPress={() => setLegalModalVisible(true)}
              >
                Privacy Policy
              </Text>
            </Text>
          </Pressable>

          {/* Age Confirmation Checkbox */}
          <Pressable
            onPress={() => setAgeConfirmed(!ageConfirmed)}
            style={styles.checkboxRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: ageConfirmed }}
            accessibilityLabel={CONSENT_TEXT.AGE_CONFIRM}
          >
            <View
              style={[
                styles.checkbox,
                ageConfirmed && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
            >
              {ageConfirmed && (
                <Text color="#FFFFFF" fontSize={12} fontWeight="700">✓</Text>
              )}
            </View>
            <Text
              color="#94A3B8"
              fontSize={12}
              fontFamily={Fonts.medium as any}
              flex={1}
              lineHeight={16}
            >
              {CONSENT_TEXT.AGE_CONFIRM}
            </Text>
          </Pressable>
        </YStack>

        {/* Create Account CTA Button */}
        <FormButton
          variant="primary"
          height={48}
          borderRadius={999}
          loading={loading}
          disabled={loading || !canSubmit}
          glow
          onPress={handleSubmit(onSubmit)}
          marginTop={4}
        >
          Create Account
        </FormButton>

        {/* Divider */}
        <XStack alignItems="center" width="100%" marginVertical={6}>
          <View flex={1} height={1} backgroundColor="#1E334D" />
          <Text
            color="#94A3B8"
            fontSize={12}
            fontFamily={Fonts.semiBold as any}
            letterSpacing={0.4}
            marginHorizontal={12}
          >
            OR SIGN UP WITH
          </Text>
          <View flex={1} height={1} backgroundColor="#1E334D" />
        </XStack>

        {/* Logo-only side-by-side social buttons */}
        <XStack justifyContent="center" gap={16} width="100%">
          <SocialIconButton
            icon={<GoogleIcon size={22} />}
            onPress={handleGoogleSignUp}
            loading={googleLoading}
            accessibilityLabel="Sign up with Google"
          />
          <SocialIconButton
            icon={<FacebookIcon size={22} />}
            onPress={() => Alert.alert('Facebook', 'Facebook Sign Up is coming soon.')}
            accessibilityLabel="Sign up with Facebook"
          />
        </XStack>

        {/* Footer Link */}
        <XStack justifyContent="center" gap={6} marginTop={10}>
          <Text
            color="#94A3B8"
            fontSize={14}
            fontFamily={Fonts.regular as any}
            letterSpacing={-0.1}
          >
            Already have an account?
          </Text>
          <Link href={'/(auth)/login' as Href} asChild>
            <Text
              color={theme.primary as any}
              fontSize={14}
              fontFamily={Fonts.bold as any}
              letterSpacing={-0.1}
              pressStyle={{ opacity: 0.7 }}
              accessibilityRole="link"
            >
              Sign In
            </Text>
          </Link>
        </XStack>
      </YStack>

      {/* Legal Policy Modal — viewable from registration */}
      <LegalPolicyModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        theme={theme}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  socialBtn: {
    width: 64,
    height: 46,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0C1829',
    borderWidth: 1,
    borderColor: '#1E334D',
  },
  socialBtnInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: '#0C1829',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
});