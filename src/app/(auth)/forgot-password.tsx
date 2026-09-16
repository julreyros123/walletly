import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { YStack, Text, XStack } from 'tamagui';
import { Link, useRouter, Href } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/validation/auth.schema';
import { AuthLayout } from '@/components/ui/AuthLayout';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { useTheme } from '@/hooks/use-theme';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';

import { Fonts } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const sendPasswordReset = useAuthStore((state) => state.sendPasswordReset);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      await sendPasswordReset(data.email);
      setResetEmail(data.email);
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert('Reset Failed', err.message || 'Unable to send password recovery link.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We've sent password recovery instructions to your email."
        backgroundMode="tabs"
      >
        <YStack gap={20} alignItems="center">
          <YStack
            width={56}
            height={56}
            borderRadius={8}
            backgroundColor={`${theme.success}18` as any}
            borderWidth={1}
            borderColor={`${theme.success}40` as any}
            alignItems="center"
            justifyContent="center"
            marginTop={8}
          >
            <PhosphorIcon
              name="PaperPlaneTilt"
              size={24}
              color={theme.success}
              weight="fill"
            />
          </YStack>

          <YStack gap={4} alignItems="center">
            <Text color="#94A3B8" fontSize={14} fontFamily={Fonts.regular as any} textAlign="center">
              Reset link sent to
            </Text>
            <Text
              color="#FFFFFF"
              fontSize={17}
              fontFamily={Fonts.bold as any}
              textAlign="center"
            >
              {resetEmail}
            </Text>
          </YStack>

          <Text color="#94A3B8" fontSize={14} fontFamily={Fonts.regular as any} textAlign="center" lineHeight={22}>
            If you don't receive an email within a few minutes, please check your spam folder.
          </Text>

          <FormButton
            variant="primary"
            height={48}
            onPress={() => router.replace('/(auth)/login' as Href)}
            width="100%"
            marginTop={8}
          >
            Back to Sign In
          </FormButton>
        </YStack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address to receive a recovery link."
      showBackButton
      backgroundMode="tabs"
    >
      <YStack gap={12}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Email Address"
              leftIcon="Envelope"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.email?.message}
              variant="auth"
            />
          )}
        />

        <FormButton
          variant="primary"
          height={48}
          loading={loading}
          onPress={handleSubmit(onSubmit)}
          marginTop={4}
        >
          Send Reset Link
        </FormButton>

        <XStack justifyContent="center" gap={8} marginTop={8}>
          <Text color="#94A3B8" fontSize={14} fontFamily={Fonts.regular as any}>
            Remembered your password?
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
    </AuthLayout>
  );
}
