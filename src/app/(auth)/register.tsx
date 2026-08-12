import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { YStack, Text, XStack, Button } from 'tamagui';
import { Link, useRouter, Href } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { registerSchema, RegisterFormData } from '@/validation/auth.schema';
import { AuthLayout } from '@/components/ui/AuthLayout';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { FormCheckbox } from '@/components/ui/FormCheckbox';
import { useTheme } from '@/hooks/use-theme';
import { Alert, ActivityIndicator } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { View } from 'tamagui';

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const isAnyLoading = loading || guestLoading;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Successful mock registration and auto-login
      await login('mock-jwt-token-12345', {
        id: '1',
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
      });

      // Redirect to onboarding
      router.replace('/(onboarding)' as Href);
    } catch (err) {
      Alert.alert('Registration Failed', 'Please check your inputs and try again.');
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
      title="Create Account"
      subtitle="Start building smarter financial habits today."
      showBackButton
    >
      <YStack gap={8}>
        {/* Name Fields side-by-side */}
        <XStack gap={12}>
          <View flex={1}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="First Name"
                  placeholder="John"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.firstName?.message}
                />
              )}
            />
          </View>
          <View flex={1}>
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Last Name"
                  placeholder="Doe"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.lastName?.message}
                />
              )}
            />
          </View>
        </XStack>

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

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <YStack gap={4}>
              <FormInput
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
              {value.length > 0 && (
                <YStack gap={4} paddingHorizontal={4} marginTop={-2} marginBottom={4}>
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize={11} color={theme.textSecondary as any} fontWeight="600">
                      Password Strength:
                    </Text>
                    <Text fontSize={11} color={strength.color as any} fontWeight="700">
                      {strength.label}
                    </Text>
                  </XStack>
                  <XStack gap={4} width="100%" height={4}>
                    <View
                      flex={1}
                      height="100%"
                      borderRadius={2}
                      backgroundColor={(strength.score >= 1 ? strength.color : theme.border) as any}
                    />
                    <View
                      flex={1}
                      height="100%"
                      borderRadius={2}
                      backgroundColor={(strength.score >= 3 ? strength.color : theme.border) as any}
                    />
                    <View
                      flex={1}
                      height="100%"
                      borderRadius={2}
                      backgroundColor={(strength.score >= 5 ? strength.color : theme.border) as any}
                    />
                  </XStack>
                </YStack>
              )}
            </YStack>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Confirm Password"
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="acceptTerms"
          render={({ field: { onChange, value } }) => (
            <FormCheckbox
              checked={value}
              onCheckedChange={onChange}
              label={
                <XStack flexWrap="wrap" alignItems="center" gap={3}>
                  <Text color={theme.textSecondary} fontSize={13}>I agree to the </Text>
                  <Text color={theme.primary as any} fontSize={13} fontWeight="600" pressStyle={{ opacity: 0.7 }} onPress={() => Alert.alert('Terms & Conditions', 'By using Cbudget, you agree that all funds, holdings, and budgets are 100% simulated and virtual. Cbudget does not handle real currency or trade real assets.')}>Terms & Conditions</Text>
                  <Text color={theme.textSecondary} fontSize={13}> and </Text>
                  <Text color={theme.primary as any} fontSize={13} fontWeight="600" pressStyle={{ opacity: 0.7 }} onPress={() => Alert.alert('Privacy Policy', 'We value your privacy. All your simulated budget logs, lessons, and portfolios are stored locally on your device via secure key-value encryption. We do not transmit your data to third parties.')}>Privacy Policy</Text>
                </XStack>
              }
              error={errors.acceptTerms?.message}
            />
          )}
        />

        <FormButton
          loading={loading}
          disabled={isAnyLoading}
          onPress={handleSubmit(onSubmit)}
          marginTop={8}
        >
          Sign Up
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
            Or register with
          </Text>
          <View flex={1} height={1} backgroundColor={theme.border} />
        </XStack>

        {/* Social Logins */}
        <XStack justifyContent="center" gap={12} width="100%">
          {/* Apple */}
          <Button
            flex={1}
            height={44}
            backgroundColor={theme.backgroundElement}
            borderRadius={12}
            pressStyle={{ opacity: 0.7, scale: 0.98 }}
            alignItems="center"
            justifyContent="center"
            borderWidth={0}
            onPress={() => Alert.alert('Simulated Registration', 'Apple Sign Up completed.')}
          >
            <SymbolView
              name={{ ios: 'apple.logo', android: 'apple', web: 'apple' } as any}
              size={18}
              tintColor={theme.text}
            />
          </Button>

          {/* Google */}
          <Button
            flex={1}
            height={44}
            backgroundColor={theme.backgroundElement}
            borderRadius={12}
            pressStyle={{ opacity: 0.7, scale: 0.98 }}
            alignItems="center"
            justifyContent="center"
            borderWidth={0}
            onPress={() => Alert.alert('Simulated Registration', 'Google Sign Up completed.')}
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
            Already have an account?
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