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

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);

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
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
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
                fontWeight="600"
                pressStyle={{ opacity: 0.7 }}
              >
                Forgot password?
              </Text>
            </Link>
          </XStack>
        </YStack>

        {/* Sign In CTA */}
        <FormButton
          variant="primary"
          height={50}
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
          <View flex={1} height={1} backgroundColor="rgba(255, 255, 255, 0.1)" />
          <Text color="rgba(255, 255, 255, 0.45)" fontSize={12} fontWeight="600" marginHorizontal={12}>
            or continue with
          </Text>
          <View flex={1} height={1} backgroundColor="rgba(255, 255, 255, 0.1)" />
        </XStack>

        {/* Logo-only side-by-side social buttons */}
        <XStack justifyContent="center" gap={16} width="100%">
          <SocialIconButton
            icon={<GoogleIcon size={24} />}
            onPress={() => Alert.alert('Google', 'Google Sign In')}
          />
          <SocialIconButton
            icon={<FacebookIcon size={24} />}
            onPress={() => Alert.alert('Facebook', 'Facebook Sign In')}
          />
        </XStack>

        {/* Footer link */}
        <XStack justifyContent="center" gap={6} marginTop={10}>
          <Text color="rgba(255, 255, 255, 0.55)" fontSize={14} fontWeight="400">
            Don't have an account?
          </Text>
          <Link href={'/(auth)/register' as Href} asChild>
            <Text
              color={theme.primary as any}
              fontSize={14}
              fontWeight="700"
              pressStyle={{ opacity: 0.7 }}
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
