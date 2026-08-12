import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { YStack, Text, XStack, Button } from 'tamagui';
import { Link, useRouter, Href } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { loginSchema, LoginFormData } from '@/validation/auth.schema';
import { AuthLayout } from '@/components/ui/AuthLayout';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { useTheme } from '@/hooks/use-theme';
import { Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { View } from 'tamagui';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const isAnyLoading = loading || guestLoading;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Successful mock login
      await login('mock-jwt-token-12345', {
        id: '1',
        name: 'Demo User',
        email: data.email,
      });

      // Redirect user to the tabs (Dashboard)
      router.replace('/(tabs)' as Href);
    } catch (err) {
      Alert.alert('Login Failed', 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

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
    <AuthLayout
      title="Welcome Back"
      subtitle="Continue building smarter financial habits."
      showBackButton
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
            />
          )}
        />

        <YStack gap={4}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <XStack justifyContent="flex-end">
            <Link href={'/(auth)/forgot-password' as Href} asChild>
              <Text
                color={theme.primary}
                fontSize={13}
                fontWeight="500"
                pressStyle={{ opacity: 0.7 }}
              >
                Forgot Password?
              </Text>
            </Link>
          </XStack>
        </YStack>

        <FormButton
          loading={loading}
          disabled={isAnyLoading}
          onPress={handleSubmit(onSubmit)}
        >
          Sign In
        </FormButton>

        <Button
          height={52}
          backgroundColor={`${theme.primary}12` as any}
          borderColor={`${theme.primary}4D` as any}
          borderWidth={1.5}
          borderRadius={16}
          pressStyle={{ opacity: 0.8, scale: 0.98, backgroundColor: `${theme.primary}26` as any }}
          disabled={isAnyLoading}
          onPress={handleGuestLogin}
        >
          <XStack gap={8} alignItems="center" justifyContent="center">
            {guestLoading ? (
              <ActivityIndicator color={theme.primary as any} size="small" />
            ) : (
              <>
                <SymbolView
                  name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' } as any}
                  size={18}
                  tintColor={theme.primary as any}
                />
                <Text color={theme.primary as any} fontSize={14} fontWeight="700">
                  Explore as Guest
                </Text>
              </>
            )}
          </XStack>
        </Button>

        {/* Divider */}
        <XStack alignItems="center" width="100%" marginVertical={4}>
          <View flex={1} height={1} backgroundColor={theme.border} />
          <Text color={theme.textSecondary} fontSize={11} fontWeight="600" textTransform="uppercase" letterSpacing={0.8} marginHorizontal={12}>
            Or continue with
          </Text>
          <View flex={1} height={1} backgroundColor={theme.border} />
        </XStack>

        {/* Social Logins */}
        <XStack justifyContent="center" gap={12} width="100%">
          {/* Apple Login */}
          <Button
            flex={1}
            height={44}
            backgroundColor={theme.backgroundElement}
            borderRadius={12}
            pressStyle={{ opacity: 0.7, scale: 0.98 }}
            alignItems="center"
            justifyContent="center"
            borderWidth={0}
            onPress={() => Alert.alert('Simulated Login', 'Apple Sign In completed.')}
          >
            <SymbolView
              name={{ ios: 'apple.logo', android: 'apple', web: 'apple' } as any}
              size={18}
              tintColor={theme.text}
            />
          </Button>

          {/* Google Login */}
          <Button
            flex={1}
            height={44}
            backgroundColor={theme.backgroundElement}
            borderRadius={12}
            pressStyle={{ opacity: 0.7, scale: 0.98 }}
            alignItems="center"
            justifyContent="center"
            borderWidth={0}
            onPress={() => Alert.alert('Simulated Login', 'Google Sign In completed.')}
          >
            <SymbolView
              name={{ ios: 'g.circle.fill', android: 'google', web: 'google' } as any}
              size={18}
              tintColor={theme.text}
            />
          </Button>
        </XStack>

        <XStack justifyContent="center" gap={8} marginTop={4}>
          <Text color={theme.textSecondary} fontSize={14}>
            Don't have an account?
          </Text>
          <Link href={'/(auth)/register' as Href} asChild>
            <Text
              color={theme.primary}
              fontSize={14}
              fontWeight="600"
              pressStyle={{ opacity: 0.7 }}
            >
              Create Account
            </Text>
          </Link>
        </XStack>
      </YStack>
    </AuthLayout>
  );
}
