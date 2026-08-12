import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Platform, View, Alert } from 'react-native';
import { YStack, Text, XStack } from 'tamagui';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { SymbolView } from 'expo-symbols';

export default function NicknameScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  // Initialize with capitalized email prefix as fallback
  const initialNickname = user?.name || '';
  const [nickname, setNickname] = useState(initialNickname);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (nickname.trim().length < 2) {
      setError('Nickname must be at least 2 characters');
      return;
    }
    setError('');
    setSaving(true);
    try {
      // Save updated nickname in the store
      await updateProfile(
        nickname.trim(),
        user?.email || '',
        user?.avatarColor,
        user?.avatarEmoji
      );
      router.push('/(onboarding)/funding' as Href);
    } catch (err) {
      Alert.alert('Error', 'Unable to save nickname.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor="#020F1E" minHeight={Platform.OS === 'web' ? '100vh' : '100%'}>
      {/* Radial accent glow */}
      <View style={styles.glowTop} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <YStack
          flex={1}
          paddingHorizontal={Spacing[24]}
          justifyContent="center"
          maxWidth={440}
          alignSelf="center"
          width="100%"
        >
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <YStack gap={10} alignItems="center" marginBottom={32}>
              <View style={styles.iconWrap}>
                <SymbolView
                  name={{ ios: 'person.crop.circle.badge.plus', android: 'person_add', web: 'person_add' } as any}
                  size={32}
                  tintColor={theme.primary}
                />
              </View>
              <Text color="#FFFFFF" fontSize={26} fontWeight="700" letterSpacing={-0.5} textAlign="center">
                What should we call you?
              </Text>
              <Text color="rgba(255, 255, 255, 0.55)" fontSize={14} fontWeight="400" textAlign="center" paddingHorizontal={12}>
                Choose a name or nickname to personalize your experience.
              </Text>
            </YStack>
          </Animated.View>

          {/* Form Card */}
          <Animated.View entering={FadeInDown.delay(250).duration(600)}>
            <View style={styles.formCard}>
              <YStack gap={20}>
                <FormInput
                  label="Nickname"
                  placeholder="Enter your nickname"
                  value={nickname}
                  onChangeText={(text) => {
                    setNickname(text);
                    if (text.trim().length >= 2) setError('');
                  }}
                  error={error}
                  autoFocus
                  maxLength={20}
                  leftIcon={{ ios: 'person', android: 'person', web: 'person' } as any}
                />

                <FormButton
                  variant="primary"
                  height={50}
                  loading={saving}
                  disabled={saving}
                  glow
                  onPress={handleSubmit}
                  marginTop={6}
                >
                  Continue
                </FormButton>
              </YStack>
            </View>
          </Animated.View>
        </YStack>
      </SafeAreaView>
    </YStack>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: '50%',
    marginLeft: -180,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#0052FF',
    opacity: 0.08,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 82, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 82, 255, 0.15)',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
});
