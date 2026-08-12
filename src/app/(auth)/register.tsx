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
import { Alert, StyleSheet, Pressable } from 'react-native';
import { GoogleIcon, FacebookIcon } from '@/components/ui/SocialIcons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function SocialIconButton({
  icon,
  onPress,
}: {
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[aStyle, styles.socialBtn]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={onPress}
        style={styles.socialBtnInner}
      >
        {icon}
      </Pressable>
    </Animated.View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const signUp = useAuthStore((state) => state.signUp);
  const [loading, setLoading] = useState(false);

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
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Please check your inputs and try again.');
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
                    <Text fontSize={11} color="rgba(255,255,255,0.45)" fontWeight="500">
                      Password strength
                    </Text>
                    <Text fontSize={11} color={strength.color as any} fontWeight="700">
                      {strength.label}
                    </Text>
                  </XStack>
                  <XStack gap={4} width="100%" height={3}>
                    <View flex={1} height="100%" borderRadius={2}
                      backgroundColor={(strength.score >= 1 ? strength.color : 'rgba(255,255,255,0.1)') as any} />
                    <View flex={1} height="100%" borderRadius={2}
                      backgroundColor={(strength.score >= 3 ? strength.color : 'rgba(255,255,255,0.1)') as any} />
                    <View flex={1} height="100%" borderRadius={2}
                      backgroundColor={(strength.score >= 5 ? strength.color : 'rgba(255,255,255,0.1)') as any} />
                  </XStack>
                </YStack>
              )}
            </YStack>
          )}
        />

        {/* Create Account CTA Button */}
        <FormButton
          variant="primary"
          height={50}
          loading={loading}
          disabled={loading}
          glow
          onPress={handleSubmit(onSubmit)}
          marginTop={4}
        >
          Create Account
        </FormButton>

        {/* Divider */}
        <XStack alignItems="center" width="100%" marginVertical={6}>
          <View flex={1} height={1} backgroundColor="rgba(255, 255, 255, 0.1)" />
          <Text color="rgba(255, 255, 255, 0.45)" fontSize={12} fontWeight="600" marginHorizontal={12}>
            or sign up with
          </Text>
          <View flex={1} height={1} backgroundColor="rgba(255, 255, 255, 0.1)" />
        </XStack>

        {/* Logo-only side-by-side social buttons */}
        <XStack justifyContent="center" gap={16} width="100%">
          <SocialIconButton
            icon={<GoogleIcon size={24} />}
            onPress={() => Alert.alert('Google', 'Google Sign Up')}
          />
          <SocialIconButton
            icon={<FacebookIcon size={24} />}
            onPress={() => Alert.alert('Facebook', 'Facebook Sign Up')}
          />
        </XStack>

        {/* Footer Link */}
        <XStack justifyContent="center" gap={6} marginTop={10}>
          <Text color="rgba(255, 255, 255, 0.55)" fontSize={14} fontWeight="400">
            Already have an account?
          </Text>
          <Link href={'/(auth)/login' as Href} asChild>
            <Text
              color={theme.primary as any}
              fontSize={14}
              fontWeight="700"
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

const styles = StyleSheet.create({
  socialBtn: {
    width: 60,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  socialBtnInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});