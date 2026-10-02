import React, { useState, useRef, useEffect } from 'react';
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

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const loginWithFacebook = useAuthStore((state) => state.loginWithFacebook);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const lastSubmitRef = useRef(0);

  // Navigate immediately when authentication succeeds
  useEffect(() => {
    if (isAuthenticated) {
      const currentUser = useAuthStore.getState().user;
      const isNewAccount = !currentUser?.isOnboarded || !currentUser?.name || currentUser.name === 'User' || !currentUser?.age;
      if (isNewAccount && currentUser?.id !== 'guest') {
        router.replace('/(onboarding)' as Href);
      } else {
        router.replace('/(tabs)' as Href);
      }
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
    const now = Date.now();
    if (now - lastSubmitRef.current < 1500) {
      return; // Debounce rapid spam
    }
    lastSubmitRef.current = now;

    setLoading(true);
    try {
      await login(data.email, data.password);
      // Navigation is handled reactively by useEffect on isAuthenticated
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Please check your credentials and try again.';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const now = Date.now();
    if (now - lastSubmitRef.current < 2000) return;
    lastSubmitRef.current = now;

    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google Sign-In was cancelled or failed.';
      Alert.alert('Sign-In Failed', message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    const now = Date.now();
    if (now - lastSubmitRef.current < 2000) return;
    lastSubmitRef.current = now;

    setFacebookLoading(true);
    try {
      await loginWithFacebook();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Facebook Sign-In was cancelled or failed.';
      Alert.alert('Facebook Sign-In', message);
    } finally {
      setFacebookLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to track your expenses and earn rewards"
      backgroundMode="tabs"
    >
      <YStack gap={16}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Email"
              placeholder="alex@cbudget.com"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              accessibilityLabel="Email input"
            />
          )}
        />

        <YStack gap={4}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
                secureTextEntry
                autoComplete="password"
                accessibilityLabel="Password input"
              />
            )}
          />

          <XStack justifyContent="flex-end" marginTop={4}>
            <Link href={'/(auth)/forgot-password' as Href} asChild>
              <Text
                color={theme.primary as any}
                fontSize={13}
                fontFamily={Fonts.medium as any}
                letterSpacing={-0.1}
                pressStyle={{ opacity: 0.7 }}
                accessibilityRole="link"
                accessibilityLabel="Forgot password?"
              >
                Forgot password?
              </Text>
            </Link>
          </XStack>
        </YStack>

        <FormButton
          variant="primary"
          height={48}
          borderRadius={999}
          loading={loading}
          onPress={handleSubmit(onSubmit)}
          marginTop={8}
          accessibilityLabel="Sign In"
          accessibilityRole="button"
        >
          Sign In
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
            OR CONTINUE WITH
          </Text>
          <View flex={1} height={1} backgroundColor={theme.border} />
        </XStack>

        {/* Side-by-side social authentication buttons */}
        <XStack justifyContent="center" gap={16} width="100%">
          <SocialIconButton
            icon={<GoogleIcon size={22} />}
            onPress={handleGoogleSignIn}
            loading={googleLoading}
            accessibilityLabel="Sign in with Google"
            theme={theme}
          />
          <SocialIconButton
            icon={<FacebookIcon size={22} />}
            onPress={handleFacebookSignIn}
            loading={facebookLoading}
            accessibilityLabel="Sign in with Facebook"
            theme={theme}
          />
        </XStack>

        {/* Footer link */}
        <XStack justifyContent="center" gap={6} marginTop={10}>
          <Text
            color={theme.textSecondary as any}
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
});
