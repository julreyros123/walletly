import React, { useState } from 'react';
import { StyleSheet, Platform, View, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack } from 'tamagui';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Fonts } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { safeHaptic } from '@/utils/haptics';

const QUICK_AGES = [14, 16, 18, 21, 25];

export default function NicknameScreen() {
  const theme = useTheme();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const initialNickname = user?.name && user.name !== 'User' ? user.name : '';
  const initialAge = user?.age ? String(user.age) : '';

  const [nickname, setNickname] = useState(initialNickname);
  const [age, setAge] = useState(initialAge);
  const [nicknameError, setNicknameError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [saving, setSaving] = useState(false);

  const parsedAge = parseInt(age.trim(), 10);

  const getAgeCohort = (a: number) => {
    if (isNaN(a) || a <= 0) return null;
    if (a < 7) return { text: 'Age must be at least 7', color: '#EF4444' };
    if (a <= 12) return { text: '🎒 Junior Saver (Elementary)', color: '#3B82F6' };
    if (a <= 17) return { text: '🎓 Teen Learner (High School)', color: '#10B981' };
    if (a <= 24) return { text: '🏛️ Young Adult (College / Early Career)', color: '#F59E0B' };
    if (a <= 100) return { text: '💼 Independent Pro', color: '#8B5CF6' };
    return { text: 'Please enter a valid age', color: '#EF4444' };
  };

  const cohort = getAgeCohort(parsedAge);

  const handleSubmit = async () => {
    let valid = true;
    if (nickname.trim().length < 2) {
      setNicknameError('Nickname must be at least 2 characters');
      valid = false;
    } else {
      setNicknameError('');
    }

    if (isNaN(parsedAge) || parsedAge < 7 || parsedAge > 100) {
      setAgeError('Please enter a valid age between 7 and 100');
      valid = false;
    } else {
      setAgeError('');
    }

    if (!valid) {
      safeHaptic('error');
      return;
    }

    safeHaptic('success');
    setSaving(true);
    try {
      await updateProfile(
        nickname.trim(),
        user?.email || '',
        user?.avatarColor,
        user?.avatarEmoji,
        user?.phone,
        user?.city,
        user?.schoolGrade,
        parsedAge,
        true
      );
      router.push('/(onboarding)/funding' as Href);
    } catch (err) {
      Alert.alert('Error', 'Unable to save profile details.');
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
          maxWidth={460}
          alignSelf="center"
          width="100%"
        >
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <YStack gap={10} alignItems="center" marginBottom={24}>
              <View style={styles.iconWrap}>
                <PhosphorIcon
                  name="Sparkle"
                  size={30}
                  color={theme.primary}
                  weight="duotone"
                />
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 26, fontFamily: Fonts.bold, letterSpacing: -0.5, textAlign: 'center' }}>
                Let's Set Up Your Profile
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 13.5, textAlign: 'center', paddingHorizontal: 12 }}>
                Set your nickname and age so we can customize your financial journey and learning quests.
              </Text>
            </YStack>
          </Animated.View>

          {/* Form Card */}
          <Animated.View entering={FadeInDown.delay(250).duration(600)}>
            <View style={styles.formCard}>
              <YStack gap={18}>
                {/* 1. Nickname Field */}
                <FormInput
                  label="Nickname / Preferred Name"
                  placeholder="e.g. Alex, SaverSam"
                  value={nickname}
                  onChangeText={(text) => {
                    setNickname(text);
                    if (text.trim().length >= 2) setNicknameError('');
                  }}
                  error={nicknameError}
                  autoFocus
                  maxLength={24}
                  leftIcon="User"
                />

                {/* 2. Age Field */}
                <YStack gap={6}>
                  <FormInput
                    label="Your Age"
                    placeholder="e.g. 16"
                    value={age}
                    onChangeText={(text) => {
                      const digitsOnly = text.replace(/[^0-9]/g, '');
                      setAge(digitsOnly);
                      if (digitsOnly.length > 0) setAgeError('');
                    }}
                    error={ageError}
                    keyboardType="number-pad"
                    maxLength={3}
                    leftIcon="Clock"
                  />

                  {/* Age Cohort Badge */}
                  {cohort && (
                    <View style={[styles.cohortBadge, { borderColor: `${cohort.color}40`, backgroundColor: `${cohort.color}15` }]}>
                      <Text style={[styles.cohortText, { color: cohort.color }]}>
                        {cohort.text}
                      </Text>
                    </View>
                  )}

                  {/* Quick Select Age Pills */}
                  <XStack gap={8} alignItems="center" marginTop={4}>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 11, fontFamily: Fonts.medium }}>
                      Quick select:
                    </Text>
                    {QUICK_AGES.map((preset) => {
                      const isSelected = parsedAge === preset;
                      return (
                        <TouchableOpacity
                          key={preset}
                          onPress={() => {
                            safeHaptic('light');
                            setAge(String(preset));
                            setAgeError('');
                          }}
                          style={[
                            styles.agePill,
                            isSelected && styles.agePillActive,
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={{
                              fontSize: 11.5,
                              fontFamily: isSelected ? Fonts.bold : Fonts.medium,
                              color: isSelected ? '#10B981' : 'rgba(255, 255, 255, 0.7)',
                            }}
                          >
                            {preset}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </XStack>
                </YStack>

                <FormButton
                  variant="primary"
                  height={50}
                  loading={saving}
                  disabled={saving}
                  glow
                  onPress={handleSubmit}
                  marginTop={8}
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 82, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 82, 255, 0.2)',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  cohortBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  cohortText: {
    fontSize: 11.5,
    fontFamily: Fonts.medium,
  },
  agePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  agePillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
});
