import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { Colors, Fonts } from '@/constants/theme';
import { Alert, StyleSheet, Pressable } from 'react-native';
import { LegalPolicyModal } from '@/features/profile/components/LegalPolicyModal';

export default function RegisterScreen() {
  const router = useRouter();
  const appTheme = useTheme();
  // AuthLayout always renders on a dark navy background, so use the dark palette
  // regardless of the user's app-wide theme mode (light mode made controls white-on-white).
  const theme = useMemo(() => ({ ...Colors.dark, primary: appTheme.primary }), [appTheme.primary]);

  const signUp = useAuthStore((state) => state.signUp);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const lastSubmitRef = useRef(0);

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
    if (!termsAccepted) {
      Alert.alert(
        'Consent Required',
        'Please accept the Terms of Service and Privacy Policy to create an account.',
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
                alignSelf="flex-end"
                style={{ color: strength.color, fontFamily: Fonts.medium }}
              >
                {strength.label}
              </Text>
            </YStack>
          )}
        </YStack>

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
                backgroundColor: termsAccepted ? theme.primary : 'transparent',
              },
            ]}
          >
            {termsAccepted && (
              <Text color="#FFFFFF" fontSize={12} fontWeight="700">✓</Text>
            )}
          </View>
          <Text
            fontSize={13}
            flex={1}
            lineHeight={18}
            style={{ color: theme.textSecondary, fontFamily: Fonts.medium }}
          >
            I agree to the{' '}
            <Text
              fontSize={13}
              style={{ color: theme.primary, fontFamily: Fonts.bold }}
              onPress={() => setLegalModalVisible(true)}
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text
              fontSize={13}
              style={{ color: theme.primary, fontFamily: Fonts.bold }}
              onPress={() => setLegalModalVisible(true)}
            >
              Privacy Policy
            </Text>
          </Text>
        </Pressable>

        {/* Create Account CTA Button */}
        <FormButton
          variant="primary"
          height={48}
          borderRadius={999}
          loading={loading}
          disabled={loading || !termsAccepted}
          glow={termsAccepted}
          onPress={handleSubmit(onSubmit)}
          marginTop={4}
          accessibilityRole="button"
          accessibilityLabel="Create Account"
        >
          Create Account
        </FormButton>

        {/* Footer Link */}
        <XStack justifyContent="center" gap={6} marginTop={10}>
          <Text
            fontSize={14}
            letterSpacing={-0.1}
            style={{ color: theme.textSecondary, fontFamily: Fonts.regular }}
          >
            Already have an account?
          </Text>
          <Link href={'/(auth)/login' as Href} asChild>
            <Text
              fontSize={14}
              letterSpacing={-0.1}
              pressStyle={{ opacity: 0.7 }}
              accessibilityRole="link"
              style={{ color: theme.primary, fontFamily: Fonts.bold }}
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
        theme={appTheme}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 2,
    marginTop: 4,
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