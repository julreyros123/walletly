import React, { useState, useRef, useEffect } from 'react';
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
import { CONSENT_TEXT } from '@/constants/legalPolicies';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function SocialIconButton({
  icon,
  onPress,
  loading = false,
  accessibilityLabel,
  theme,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  loading?: boolean;
  accessibilityLabel: string;
  theme: any;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[aStyle, styles.socialBtn]}>
      <Pressable
        disabled={loading}
        onPressIn={() => {
          if (!loading) scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          if (!loading) scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.socialBtnInner,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: pressed || loading ? 0.75 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: loading }}
      >
        {loading ? <ActivityIndicator size="small" color={theme.text} /> : icon}
      </Pressable>
    </Animated.View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const signUp = useAuthStore((state) => state.signUp);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const loginWithFacebook = useAuthStore((state) => state.loginWithFacebook);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const lastSubmitRef = useRef(0);

  const canSubmit = termsAccepted && ageConfirmed;

  // Navigate to onboarding funnel when registration succeeds
  useEffect(() => {
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

    if (score <= 1) return { score: 1, label: 'Weak', color: theme.error };
    if (score <= 3) return { score: 2, label: 'Fair', color: theme.warning };
    return { score: 3, label: 'Strong', color: theme.success };
  };

  const strength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    if (!canSubmit) {
      Alert.alert(
        'Consent Required',
        'Please accept the Terms of Service and confirm your age to create an account.',
      );
      return;
    }

    const now = Date.now();
    if (now - lastSubmitRef.current < 2000) return;
    lastSubmitRef.current = now;

    setLoading(true);
    try {
      await signUp(data.email, data.password);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
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

    const now = Date.now();
    if (now - lastSubmitRef.current < 2000) return;
    lastSubmitRef.current = now;

    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign up failed. Please try again.';
      Alert.alert('Google Sign Up', message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookSignUp = async () => {
    if (!canSubmit) {
      Alert.alert(
        'Consent Required',
        'Please accept the Terms of Service and confirm your age before signing up.',
      );
      return;
    }

    const now = Date.now();
    if (now - lastSubmitRef.current < 2000) return;
    lastSubmitRef.current = now;

    setFacebookLoading(true);
    try {
      await loginWithFacebook();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Facebook sign up was cancelled or failed.';
      Alert.alert('Facebook Sign Up', message);
    } finally {
      setFacebookLoading(false);
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
              placeholder="alex@cbudget.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              accessibilityLabel="Email address"
            />
          )}
        />

        {/* Password */}
        <YStack gap={6}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Password"
                leftIcon="Lock"
                secureTextEntry
                autoComplete="password-new"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                accessibilityLabel="Password"
              />
            )}
          />

          {/* Password strength indicator */}
          {password.length > 0 && (
            <YStack gap={4} marginTop={2}>
              <XStack gap={4} width="100%">
                {[1, 2, 3].map((level) => (
                  <View
                    key={level}
                    flex={1}
                    height={3}
                    borderRadius={2}
                    style={{
                      backgroundColor:
                        strength.score >= level ? strength.color : theme.border,
                    }}
                  />
                ))}
              </XStack>
              <Text
                fontSize={11}
                color={strength.color as any}
                fontFamily={Fonts.medium as any}
                alignSelf="flex-end"
              >
                {strength.label}
              </Text>
            </YStack>
          )}
        </YStack>

        {/* Legal Consent Checkboxes with Focus & Touch feedback */}
        <YStack gap={12} marginTop={4}>
          {/* Terms & Privacy Policy Checkbox */}
          <Pressable
            onPress={() => setTermsAccepted(!termsAccepted)}
            style={({ pressed }) => [
              styles.checkboxRow,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAccepted }}
            accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: termsAccepted ? theme.primary : theme.border,
                  backgroundColor: termsAccepted ? theme.primary : theme.surface,
                },
              ]}
            >
              {termsAccepted && (
                <Text color="#FFFFFF" fontSize={12} fontWeight="700">✓</Text>
              )}
            </View>
            <Text
              color={theme.textSecondary as any}
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
            style={({ pressed }) => [
              styles.checkboxRow,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: ageConfirmed }}
            accessibilityLabel={CONSENT_TEXT.AGE_CONFIRM}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: ageConfirmed ? theme.primary : theme.border,
                  backgroundColor: ageConfirmed ? theme.primary : theme.surface,
                },
              ]}
            >
              {ageConfirmed && (
                <Text color="#FFFFFF" fontSize={12} fontWeight="700">✓</Text>
              )}
            </View>
            <Text
              color={theme.textSecondary as any}
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
          glow={canSubmit}
          onPress={handleSubmit(onSubmit)}
          marginTop={4}
          accessibilityRole="button"
          accessibilityLabel="Create Account"
        >
          Create Account
        </FormButton>

        {/* Divider */}
        <XStack alignItems="center" width="100%" marginVertical={6}>
          <View flex={1} height={1} backgroundColor={theme.border} />
          <Text
            color={theme.textSecondary as any}
            fontSize={12}
            fontFamily={Fonts.semiBold as any}
            letterSpacing={0.4}
            marginHorizontal={12}
          >
            OR SIGN UP WITH
          </Text>
          <View flex={1} height={1} backgroundColor={theme.border} />
        </XStack>

        {/* Social authentication buttons (Google & Facebook) */}
        <XStack justifyContent="center" gap={16} width="100%">
          <SocialIconButton
            icon={<GoogleIcon size={22} />}
            onPress={handleGoogleSignUp}
            loading={googleLoading}
            accessibilityLabel="Sign up with Google"
            theme={theme}
          />
          <SocialIconButton
            icon={<FacebookIcon size={22} />}
            onPress={handleFacebookSignUp}
            loading={facebookLoading}
            accessibilityLabel="Sign up with Facebook"
            theme={theme}
          />
        </XStack>

        {/* Footer Link */}
        <XStack justifyContent="center" gap={6} marginTop={10}>
          <Text
            color={theme.textSecondary as any}
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
    width: 68,
    height: 48,
    borderRadius: 12,
  },
  socialBtnInner: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
});