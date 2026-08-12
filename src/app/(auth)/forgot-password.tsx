import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { YStack, Text, XStack } from 'tamagui';
import { Link, useRouter, Href } from 'expo-router';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/validation/auth.schema';
import { AuthLayout } from '@/components/ui/AuthLayout';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setResetEmail(data.email);
      setSubmitted(true);
    } catch (err) {
      // error handling
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
        <YStack gap={24} alignItems="center">
          <YStack
            width={64}
            height={64}
            borderRadius={32}
            backgroundColor={`${theme.success}15` as any}
            alignItems="center"
            justifyContent="center"
            marginTop={16}
          >
            <SymbolView
              name={{ ios: 'paperplane.fill', android: 'send', web: 'send' } as const}
              size={28}
              tintColor={theme.success}
            />
          </YStack>

          <YStack gap={4} alignItems="center">
            <Text color={theme.textSecondary} fontSize={14} textAlign="center">
              Reset link sent to
            </Text>
            <Text
              color={theme.text}
              fontSize={18}
              fontWeight="700"
              textAlign="center"
            >
              {resetEmail}
            </Text>
          </YStack>

          <Text color={theme.textSecondary} fontSize={14} textAlign="center" lineHeight={22}>
            If you don't receive an email within a few minutes, please check your spam folder.
          </Text>

          <FormButton
            variant="primary"
            onPress={() => router.replace('/(auth)/login' as Href)}
            width="100%"
            marginTop={12}
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
      <YStack gap={8}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Email Address"
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
          height={52}
          loading={loading}
          onPress={handleSubmit(onSubmit)}
        >
          Send Reset Link
        </FormButton>

        <XStack justifyContent="center" gap={8}>
          <Text color={theme.textSecondary} fontSize={14}>
            Remembered your password?
          </Text>
          <Link href={'/(auth)/login' as Href} asChild>
            <Text
              color={theme.primary as any}
              fontSize={14}
              fontWeight="600"
              pressStyle={{ opacity: 0.7 }}
            >
              Sign In
            </Text>
          </Link>
        </XStack>
      </YStack>
    </AuthLayout>
  );
}
