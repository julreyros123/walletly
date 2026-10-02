import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { YStack, Text, XStack } from 'tamagui';
import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';
import { AuthLayout } from '@/components/ui/AuthLayout';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { useTheme } from '@/hooks/use-theme';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { Fonts } from '@/constants/theme';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ code?: string; access_token?: string; refresh_token?: string }>();
  const incomingUrl = Linking.useURL();
  const updatePassword = useAuthStore((state) => state.updatePassword);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    async function establishSession() {
      try {
        const url = incomingUrl || (await Linking.getInitialURL());

        if (params.code) {
          await supabase.auth.exchangeCodeForSession(params.code);
        } else if (params.access_token && params.refresh_token) {
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
        } else if (url && (url.includes('#') || url.includes('?'))) {
          let extractedParams: Record<string, string> = {};
          if (url.includes('#')) {
            const fragment = url.split('#')[1];
            extractedParams = Object.fromEntries(new URLSearchParams(fragment));
          } else if (url.includes('?')) {
            const query = url.split('?')[1];
            extractedParams = Object.fromEntries(new URLSearchParams(query));
          }

          if (extractedParams.code) {
            await supabase.auth.exchangeCodeForSession(extractedParams.code);
          } else if (extractedParams.access_token && extractedParams.refresh_token) {
            await supabase.auth.setSession({
              access_token: extractedParams.access_token,
              refresh_token: extractedParams.refresh_token,
            });
          }
        }
      } catch (err) {
        console.warn('[ResetPassword] Session recovery error:', err);
      } finally {
        setSessionReady(true);
      }
    }

    establishSession();
  }, [params, incomingUrl]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    try {
      await updatePassword(data.password);
      setSuccess(true);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Unable to update password. Your reset link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Password Updated"
        subtitle="Your password has been reset successfully."
        backgroundMode="tabs"
      >
        <YStack gap={20} alignItems="center" marginTop={12}>
          <YStack
            width={64}
            height={64}
            borderRadius={32}
            backgroundColor={`${theme.success}18` as any}
            borderWidth={1}
            borderColor={`${theme.success}40` as any}
            alignItems="center"
            justifyContent="center"
          >
            <PhosphorIcon
              name="CheckCircle"
              size={32}
              color={theme.success}
              weight="fill"
            />
          </YStack>

          <Text color={theme.textSecondary as any} fontSize={14} fontFamily={Fonts.regular as any} textAlign="center" lineHeight={22}>
            You can now sign in to your CBudget account using your new password.
          </Text>

          <FormButton
            variant="primary"
            height={48}
            onPress={() => router.replace('/(auth)/login' as Href)}
            width="100%"
            marginTop={8}
            accessibilityLabel="Proceed to Sign In"
            accessibilityRole="button"
          >
            Continue to Sign In
          </FormButton>
        </YStack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Enter a strong password with at least 8 characters."
      backgroundMode="tabs"
    >
      <YStack gap={16}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="New Password"
              placeholder="••••••••"
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
              secureTextEntry
              autoComplete="password-new"
              accessibilityLabel="New Password"
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Confirm New Password"
              placeholder="••••••••"
              value={value}
              onChangeText={onChange}
              error={errors.confirmPassword?.message}
              secureTextEntry
              autoComplete="password-new"
              accessibilityLabel="Confirm New Password"
            />
          )}
        />

        <FormButton
          variant="primary"
          height={48}
          loading={loading || !sessionReady}
          onPress={handleSubmit(onSubmit)}
          marginTop={8}
          accessibilityLabel="Reset Password"
          accessibilityRole="button"
        >
          Update Password
        </FormButton>

        <XStack justifyContent="center" marginTop={8}>
          <Text
            color={theme.primary as any}
            fontSize={14}
            fontFamily={Fonts.bold as any}
            onPress={() => router.replace('/(auth)/login' as Href)}
            accessibilityRole="link"
          >
            Back to Sign In
          </Text>
        </XStack>
      </YStack>
    </AuthLayout>
  );
}
