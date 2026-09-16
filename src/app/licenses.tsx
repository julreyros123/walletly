import React from 'react';
import { ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, View } from 'tamagui';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { Fonts, Spacing } from '@/constants/theme';
import { CbudgetCard } from '@/components/ui/CbudgetCard';

/**
 * Open source library entries.
 *
 * Each entry lists the package name, its license, and the author / copyright holder.
 * Entries are derived from package.json dependencies.
 */
interface LicenseEntry {
  name: string;
  license: string;
  author: string;
}

const LICENSES: LicenseEntry[] = [
  { name: '@supabase/supabase-js', license: 'MIT', author: 'Supabase Inc.' },
  { name: '@react-native-google-signin/google-signin', license: 'MIT', author: 'React Native Google Signin Contributors' },
  { name: 'react', license: 'MIT', author: 'Meta Platforms, Inc.' },
  { name: 'react-native', license: 'MIT', author: 'Meta Platforms, Inc.' },
  { name: 'expo', license: 'MIT', author: '650 Industries, Inc. (Expo)' },
  { name: 'expo-router', license: 'MIT', author: '650 Industries, Inc. (Expo)' },
  { name: 'expo-secure-store', license: 'MIT', author: '650 Industries, Inc. (Expo)' },
  { name: 'expo-image', license: 'MIT', author: '650 Industries, Inc. (Expo)' },
  { name: 'expo-notifications', license: 'MIT', author: '650 Industries, Inc. (Expo)' },
  { name: 'expo-haptics', license: 'MIT', author: '650 Industries, Inc. (Expo)' },
  { name: 'expo-audio', license: 'MIT', author: '650 Industries, Inc. (Expo)' },
  { name: 'expo-localization', license: 'MIT', author: '650 Industries, Inc. (Expo)' },
  { name: 'expo-image-picker', license: 'MIT', author: '650 Industries, Inc. (Expo)' },
  { name: 'expo-splash-screen', license: 'MIT', author: '650 Industries, Inc. (Expo)' },
  { name: 'tamagui', license: 'MIT', author: 'Tamagui LLC' },
  { name: '@tamagui/core', license: 'MIT', author: 'Tamagui LLC' },
  { name: '@tamagui/config', license: 'MIT', author: 'Tamagui LLC' },
  { name: 'zustand', license: 'MIT', author: 'Paul Henschel (Poimandres)' },
  { name: 'react-hook-form', license: 'MIT', author: 'Bill Luo' },
  { name: 'zod', license: 'MIT', author: 'Colin McDonnell' },
  { name: 'axios', license: 'MIT', author: 'Matt Zabriskie' },
  { name: 'react-native-reanimated', license: 'MIT', author: 'Software Mansion' },
  { name: 'react-native-gesture-handler', license: 'MIT', author: 'Software Mansion' },
  { name: 'react-native-screens', license: 'MIT', author: 'Software Mansion' },
  { name: 'react-native-safe-area-context', license: 'MIT', author: 'Th3rd Wave' },
  { name: 'react-native-svg', license: 'MIT', author: 'react-native-svg Contributors' },
  { name: 'lottie-react-native', license: 'Apache-2.0', author: 'Airbnb' },
  { name: 'phosphor-react-native', license: 'MIT', author: 'Phosphor Icons' },
  { name: '@react-native-async-storage/async-storage', license: 'MIT', author: 'React Native Community' },
  { name: '@hookform/resolvers', license: 'MIT', author: 'react-hook-form' },
  { name: '@expo-google-fonts/plus-jakarta-sans', license: 'MIT', author: 'Expo' },
  { name: 'react-native-url-polyfill', license: 'MIT', author: 'Chris Olszewski' },
];

export default function LicensesScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <YStack
      flex={1}
      backgroundColor={theme.background}
      minHeight={Platform.OS === 'web' ? '100vh' : '100%'}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <XStack
          alignItems="center"
          paddingHorizontal={Spacing[24]}
          paddingVertical={16}
          gap={12}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <PhosphorIcon
              name="ArrowLeft"
              size={22}
              color={theme.text}
            />
          </TouchableOpacity>
          <YStack flex={1}>
            <Text
              color={theme.text}
              fontSize={18}
              style={{ fontFamily: Fonts.bold }}
            >
              Open Source Licenses
            </Text>
            <Text
              color={theme.textSecondary}
              fontSize={12}
              style={{ fontFamily: Fonts.medium }}
            >
              {LICENSES.length} libraries used in Cbudget
            </Text>
          </YStack>
          <PhosphorIcon
            name="Code"
            size={24}
            color={theme.primary}
            weight="bold"
          />
        </XStack>

        {/* License List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Spacing[24],
            paddingBottom: 40,
          }}
        >
          {/* Attribution Notice */}
          <CbudgetCard padding={14} marginBottom={16}>
            <XStack alignItems="flex-start" gap={10}>
              <PhosphorIcon
                name="Heart"
                size={18}
                color="#EF4444"
                weight="fill"
              />
              <Text
                color={theme.textSecondary}
                fontSize={12}
                style={{ fontFamily: Fonts.medium }}
                lineHeight={17}
                flex={1}
              >
                Cbudget is built with the help of these amazing open source
                projects. We are grateful to their authors and communities.
              </Text>
            </XStack>
          </CbudgetCard>

          {/* License Entries */}
          <CbudgetCard padding={0} overflow="hidden">
            {LICENSES.map((lib, index) => (
              <XStack
                key={lib.name}
                alignItems="center"
                paddingHorizontal={14}
                paddingVertical={12}
                gap={10}
                style={
                  index > 0
                    ? { borderTopWidth: 1, borderTopColor: theme.border }
                    : undefined
                }
              >
                <View
                  style={[
                    styles.licenseDot,
                    {
                      backgroundColor:
                        lib.license === 'MIT'
                          ? '#10B981'
                          : lib.license === 'Apache-2.0'
                          ? '#3B82F6'
                          : '#F59E0B',
                    },
                  ]}
                />
                <YStack flex={1} gap={1}>
                  <Text
                    color={theme.text}
                    fontSize={13}
                    style={{ fontFamily: Fonts.bold }}
                    numberOfLines={1}
                  >
                    {lib.name}
                  </Text>
                  <Text
                    color={theme.textSecondary}
                    fontSize={10.5}
                    style={{ fontFamily: Fonts.medium }}
                    numberOfLines={1}
                  >
                    {lib.author}
                  </Text>
                </YStack>
                <View
                  style={[
                    styles.licenseBadge,
                    {
                      backgroundColor:
                        lib.license === 'MIT'
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(59, 130, 246, 0.1)',
                    },
                  ]}
                >
                  <Text
                    fontSize={9}
                    style={{
                      fontFamily: Fonts.bold,
                      color:
                        lib.license === 'MIT' ? '#10B981' : '#3B82F6',
                    }}
                    letterSpacing={0.3}
                  >
                    {lib.license}
                  </Text>
                </View>
              </XStack>
            ))}
          </CbudgetCard>
        </ScrollView>
      </SafeAreaView>
    </YStack>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  licenseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  licenseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
