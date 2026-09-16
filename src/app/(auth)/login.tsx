import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { YStack, Text, XStack, View } from 'tamagui';
import { Link, useRouter, Href } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { loginSchema, LoginFormData } from '@/validation/auth.schema';
import { AuthLayout } from '@/components/ui/AuthLayout';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { useTheme } from '@/hooks/use-theme';
import { Fonts } from '@/constants/theme';
import { Alert, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { GoogleIcon, FacebookIcon } from '@/components/ui/SocialIcons';
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

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Navigate immediately when authentication succeeds
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)' as Href);
    }
  }, [isAuthenticated, router]);

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
      await login(data.email, data.password);
      router.replace('/(tabs)' as Href);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Please check your credentials and try again.';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Navigation is handled reactively by the useEffect on isAuthenticated
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign in failed. Please try again.';
      Alert.alert('Google Sign In', message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue"
      showBackButton
    >
      <YStack gap={16} width="100%">
        {/* Email */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Email Address"
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
        <YStack gap={6}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Password"
                leftIcon="Lock"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                placeholder="Enter your password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />
          <XStack justifyContent="flex-end" marginTop={4}>
            <Link href={'/(auth)/forgot-password' as Href} asChild>
              <Text
                color={theme.primary as any}
                fontSize={13}
                fontFamily={Fonts.semiBold as any}
                letterSpacing={-0.1}
                pressStyle={{ opacity: 0.7 }}
                accessibilityRole="link"
              >
                Forgot password?
              </Text>
            </Link>
          </XStack>
        </YStack>

        {/* Sign In CTA */}
        <FormButton
          variant="primary"
          height={48}
          borderRadius={999}
          loading={loading}
          disabled={loading}
          glow
          onPress={handleSubmit(onSubmit)}
          marginTop={4}
        >
          Sign In
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
            OR CONTINUE WITH
          </Text>
          <View flex={1} height={1} backgroundColor="#1E334D" />
        </XStack>

        {/* Logo-only side-by-side social buttons */}
        <XStack justifyContent="center" gap={16} width="100%">
          <SocialIconButton
            icon={<GoogleIcon size={22} />}
            onPress={handleGoogleSignIn}
            loading={googleLoading}
            accessibilityLabel="Sign in with Google"
          />
          <SocialIconButton
            icon={<FacebookIcon size={22} />}
            onPress={() => Alert.alert('Facebook', 'Facebook Sign In is coming soon.')}
            accessibilityLabel="Sign in with Facebook"
          />
        </XStack>

        {/* Footer link */}
        <XStack justifyContent="center" gap={6} marginTop={10}>
          <Text
            color="#94A3B8"
            fontSize={14}
            fontFamily={Fonts.regular as any}
            letterSpacing={-0.1}
          >
            Don't have an account?
          </Text>
          <Link href={'/(auth)/register' as Href} asChild>
            <Text
              color={theme.primary as any}
              fontSize={14}
              fontFamily={Fonts.bold as any}
              letterSpacing={-0.1}
              pressStyle={{ opacity: 0.7 }}
              accessibilityRole="link"
            >
              Sign Up
            </Text>
          </Link>
        </XStack>
      </YStack>
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
});
