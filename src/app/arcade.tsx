import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text as TamaguiText } from 'tamagui';
import { useRouter } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { MotionIcon } from '@/components/ui/MotionIcon';
import { useGamificationStore } from '@/store/gamificationStore';
import { safeHaptic } from '@/utils/haptics';
import { ArcadeGameList } from '@/features/arcade/components/ArcadeGameList';

const Text = (props: any) => <TamaguiText {...props} />;

export default function ArcadeScreen() {
  const router = useRouter();
  const store = useGamificationStore();

  const hasAlphaGuru = store.achievements.some((a) => a.id === 'alpha_guru');
  const hasMoonShot = store.achievements.some((a) => a.id === 'moon_shot_master');
  const hasStreakChamp = store.achievements.some((a) => a.id === 'streak_champion');

  return (
    <View style={styles.container}>
      <BackgroundSystem />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top Navigation Header */}
        <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={18} paddingTop={10} paddingBottom={14}>
          <TouchableOpacity
            onPress={() => {
              safeHaptic('light');
              router.back();
            }}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <PhosphorIcon name="ArrowLeft" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <YStack alignItems="center">
            <Text color="#FFFFFF" fontSize={17} fontFamily={Fonts.bold}>
              Arcade & Mini-Games
            </Text>
            <Text color="#94A3B8" fontSize={11} fontFamily={Fonts.medium}>
              Choose a Game & Level Up
            </Text>
          </YStack>

          {/* User XP Badge */}
          <XStack alignItems="center" gap={4} style={styles.xpPill}>
            <MotionIcon name="flame" size={14} autoPlay={true} loop={true} color="#FFB703" />
            <Text color="#FFB703" fontSize={12} fontFamily={Fonts.bold}>
              {store.xp} XP
            </Text>
          </XStack>
        </XStack>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Featured Mini-Games List */}
          <ArcadeGameList />

          {/* Section: Arcade Trophies & Milestones */}
          <YStack gap={12} marginTop={26}>
            <XStack justifyContent="space-between" alignItems="center">
              <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.bold} letterSpacing={0.6} textTransform="uppercase">
                🏆 ARCADE TROPHIES & MILESTONES
              </Text>
              <Text color="#FBBF24" fontSize={11.5} fontFamily={Fonts.bold}>
                Gamified Badges
              </Text>
            </XStack>

            {/* Trophy 1 */}
            <View style={[styles.trophyCard, hasAlphaGuru && { borderColor: '#10B981' }]}>
              <XStack alignItems="center" gap={12}>
                <View style={[styles.trophyIconBox, hasAlphaGuru && { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text fontSize={22}>🏆</Text>
                </View>
                <YStack flex={1} gap={2}>
                  <Text color="#FFFFFF" fontSize={14.5} fontFamily={Fonts.bold}>
                    Alpha Guru
                  </Text>
                  <Text color="#94A3B8" fontSize={11.5} fontFamily={Fonts.medium}>
                    Predict 5/5 headlines in Headline Trader
                  </Text>
                </YStack>
                <View style={[styles.unlockedPill, !hasAlphaGuru && styles.lockedPill]}>
                  <Text color={hasAlphaGuru ? '#10B981' : '#94A3B8'} fontSize={10} fontFamily={Fonts.bold}>
                    {hasAlphaGuru ? 'UNLOCKED 🏆' : '+100 XP'}
                  </Text>
                </View>
              </XStack>
            </View>

            {/* Trophy 2 */}
            <View style={[styles.trophyCard, hasMoonShot && { borderColor: '#10B981' }]}>
              <XStack alignItems="center" gap={12}>
                <View style={[styles.trophyIconBox, hasMoonShot && { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text fontSize={22}>🚀</Text>
                </View>
                <YStack flex={1} gap={2}>
                  <Text color="#FFFFFF" fontSize={14.5} fontFamily={Fonts.bold}>
                    Moon Shot Master
                  </Text>
                  <Text color="#94A3B8" fontSize={11.5} fontFamily={Fonts.medium}>
                    Cash out Crypto Rocket at 3.00x or higher
                  </Text>
                </YStack>
                <View style={[styles.unlockedPill, !hasMoonShot && styles.lockedPill]}>
                  <Text color={hasMoonShot ? '#10B981' : '#94A3B8'} fontSize={10} fontFamily={Fonts.bold}>
                    {hasMoonShot ? 'UNLOCKED 🏆' : '+150 XP'}
                  </Text>
                </View>
              </XStack>
            </View>

            {/* Trophy 3 */}
            <View style={[styles.trophyCard, hasStreakChamp && { borderColor: '#10B981' }]}>
              <XStack alignItems="center" gap={12}>
                <View style={[styles.trophyIconBox, hasStreakChamp && { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text fontSize={22}>⚡</Text>
                </View>
                <YStack flex={1} gap={2}>
                  <Text color="#FFFFFF" fontSize={14.5} fontFamily={Fonts.bold}>
                    Streak Champion
                  </Text>
                  <Text color="#94A3B8" fontSize={11.5} fontFamily={Fonts.medium}>
                    Activate 2x Fire Streak in any mini-game
                  </Text>
                </YStack>
                <View style={[styles.unlockedPill, !hasStreakChamp && styles.lockedPill]}>
                  <Text color={hasStreakChamp ? '#10B981' : '#94A3B8'} fontSize={10} fontFamily={Fonts.bold}>
                    {hasStreakChamp ? 'UNLOCKED 🏆' : '+80 XP'}
                  </Text>
                </View>
              </XStack>
            </View>
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  safeArea: {
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#131D31',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  xpPill: {
    backgroundColor: 'rgba(255, 183, 3, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.25)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  trophyCard: {
    backgroundColor: '#131D31',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#1E293B',
  },
  trophyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 183, 3, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockedPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  lockedPill: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
});
