import React, { useState, useRef, useEffect } from 'react';
import { Modal, StyleSheet, TouchableOpacity, Platform, View, Animated, Easing } from 'react-native';
import { YStack, XStack, Text as TamaguiText } from 'tamagui';
const Text = (props: any) => <TamaguiText {...props} />;
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { safeHaptic } from '@/utils/haptics';
import { useGamificationStore, getLocalDateString } from '@/store/gamificationStore';
import { useCurrency } from '@/utils/currency';
import { Fonts } from '@/constants/theme';

interface DailyRewardModalProps {
  visible: boolean;
  onClose: () => void;
}

// 7-Day Life-Cycle Custom Reward Config
interface DayRewardInfo {
  day: number;
  xp: number;
  cash: number;
  title: string;
  tag: string;
}

const REWARD_SCHEDULE: DayRewardInfo[] = [
  { day: 1, xp: 10, cash: 0, title: 'Starter XP', tag: 'DAY 1' },
  { day: 2, xp: 20, cash: 0, title: 'Double XP', tag: 'DAY 2' },
  { day: 3, xp: 30, cash: 500, title: 'Sim Cash', tag: 'DAY 3' },
  { day: 4, xp: 40, cash: 0, title: 'Gem Boost', tag: 'DAY 4' },
  { day: 5, xp: 50, cash: 0, title: 'Streak Flame', tag: 'DAY 5' },
  { day: 6, xp: 60, cash: 0, title: 'Crown XP', tag: 'DAY 6' },
  { day: 7, xp: 70, cash: 2000, title: 'Bonus', tag: 'DAY 7' },
];

// ==================== DEDICATED CHECKED-IN SHINING CELEBRATION MODAL ====================
function CheckedInCelebrationModal({
  visible,
  xp,
  cash,
  day,
  onDismiss,
}: {
  visible: boolean;
  xp: number;
  cash: number;
  day: number;
  onDismiss: () => void;
}) {
  const rotateSunburst = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      rotateSunburst.setValue(0);
      checkScale.setValue(0);
      contentFade.setValue(0);

      // 1. Continuous spinning shining rays in background
      Animated.loop(
        Animated.timing(rotateSunburst, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // 2. Punchy spring scale-in for the center Checkmark badge
      Animated.sequence([
        Animated.timing(checkScale, {
          toValue: 1.25,
          duration: 320,
          easing: Easing.out(Easing.back(2.2)),
          useNativeDriver: true,
        }),
        Animated.timing(checkScale, {
          toValue: 1,
          duration: 180,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]).start();

      // 3. Fade in text and rewards
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 400,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const spinInterpolation = rotateSunburst.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.celebrationCardWrapper}>
          <View style={styles.celebrationCard}>
            {/* Top Glowing Header Accent */}
            <Svg width="100%" height={90} viewBox="0 0 320 90" fill="none" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="celebGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                  <Stop offset="50%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <Stop offset="100%" stopColor="#0F172A" stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect width="320" height="90" fill="url(#celebGrad)" />
            </Svg>

            {/* Close Button */}
            <TouchableOpacity
              onPress={onDismiss}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <PhosphorIcon name="X" size={14} color="#94A3B8" />
            </TouchableOpacity>

            <YStack padding={22} gap={14} alignItems="center" width="100%">
              {/* 1. Centered Sunburst + Centered Checkmark Hero Box */}
              <View style={styles.sunburstHeroBox}>
                {/* Background Rotating Shining Sunburst Rays */}
                <View style={styles.sunburstContainer} pointerEvents="none">
                  <Animated.View style={{ transform: [{ rotate: spinInterpolation }] }}>
                    <Svg width={140} height={140} viewBox="0 0 140 140" fill="none">
                      <Defs>
                        <LinearGradient id="beamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <Stop offset="0%" stopColor="#FBBF24" stopOpacity={0.7} />
                          <Stop offset="60%" stopColor="#10B981" stopOpacity={0.25} />
                          <Stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                        </LinearGradient>
                      </Defs>

                      {/* 12 Radiant Shining Beams */}
                      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
                        <G key={angle} transform={`rotate(${angle} 70 70)`}>
                          <Path d="M70 70 L64 6 L76 6 Z" fill="url(#beamGrad)" />
                        </G>
                      ))}

                      {/* Soft Central Radial Glow */}
                      <Circle cx={70} cy={70} r={38} fill="#10B981" opacity={0.2} />
                    </Svg>
                  </Animated.View>
                </View>

                {/* Center Animated Checkmark Badge (Dead Center) */}
                <Animated.View style={[styles.checkCircleBadge, { transform: [{ scale: checkScale }] }]}>
                  <Svg width={56} height={56} viewBox="0 0 56 56" fill="none">
                    {/* Glowing Outer Ring */}
                    <Circle cx={28} cy={28} r={26} fill="#10B981" stroke="#34D399" strokeWidth={2.5} />
                    <Circle cx={28} cy={28} r={22} fill="#059669" />
                    {/* Crisp White Checkmark ✓ */}
                    <Path
                      d="M18 29L25 36L39 21"
                      stroke="#FFFFFF"
                      strokeWidth={4.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </Animated.View>
              </View>

              {/* 2. Text & Earned Badges (Positioned Cleanly Below Shiny Graphic) */}
              <Animated.View style={[styles.contentFadeBox, { opacity: contentFade }]}>
                <YStack alignItems="center" gap={4}>
                  <Text color="#FFFFFF" fontSize={20} fontFamily={Fonts.bold} letterSpacing={-0.3}>
                    You're Checked In! ✨
                  </Text>

                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} textAlign="center">
                    Day {day} reward successfully added to your wallet
                  </Text>
                </YStack>

                {/* Earned Reward Badges */}
                <XStack alignItems="center" gap={8} marginTop={12}>
                  <View style={styles.earnedPillXp}>
                    <Text color="#FBBF24" fontSize={13} fontFamily={Fonts.bold}>
                      +{xp} XP
                    </Text>
                  </View>
                  {cash > 0 && (
                    <View style={styles.earnedPillCash}>
                      <Text color="#34D399" fontSize={13} fontFamily={Fonts.bold}>
                        +₱{cash} Sim Cash
                      </Text>
                    </View>
                  )}
                </XStack>

                {/* Awesome Button */}
                <TouchableOpacity
                  onPress={onDismiss}
                  style={styles.awesomeBtn}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Awesome, dismiss celebration"
                >
                  <Text color="#FFFFFF" fontSize={14} fontFamily={Fonts.bold}>
                    Awesome! ✨
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </YStack>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function DailyRewardModal({ visible, onClose }: DailyRewardModalProps) {
  const store = useGamificationStore();
  const { symbol: currencySymbol } = useCurrency();
  const [claimedReward, setClaimedReward] = useState<{ xp: number; cash: number; day: number } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Guarantee it begins at Day 1 (1 to 7 cycle)
  const currentStreak = Math.max(1, store.streakDays || 1);
  const currentDayInCycle = ((currentStreak - 1) % 7) + 1;

  const today = getLocalDateString();
  const isAlreadyClaimedToday = store.lastClaimedRewardDate === today;

  const handleClaim = () => {
    if (isAlreadyClaimedToday) return;
    safeHaptic('success');

    const res = store.claimDailyReward();
    if (!res.success) return;

    setClaimedReward({ xp: res.xp, cash: res.cash, day: currentDayInCycle });
    // 1. Automatically close the 7-day grid modal
    onClose();
    // 2. Open the dedicated "You're Checked In" shining celebration modal
    setShowCelebration(true);
  };

  const handleDismissCelebration = () => {
    safeHaptic('light');
    setShowCelebration(false);
    setClaimedReward(null);
  };

  // Polished vector icon renderer: XP Star for XP-only days, Realistic Cash Bundle for Cash days
  const renderRewardIcon = (item: DayRewardInfo, isPast: boolean, isCurrent: boolean) => {
    if (isPast) {
      return (
        <View style={styles.iconCircleClaimed}>
          <PhosphorIcon
            name="CheckCircle"
            size={24}
            color="#10B981"
            weight="fill"
          />
        </View>
      );
    }

    // 1. CASH REWARDS (Days 3 & 7) -> Realistic Stacked Cash Bundle with Currency Strap
    if (item.cash > 0) {
      if (item.day === 7) {
        return (
          <Svg width={34} height={34} viewBox="0 0 28 28" fill="none">
            {/* Bottom Bill */}
            <Rect x="2" y="11" width="22" height="12" rx="2" fill="#047857" stroke="#065F46" strokeWidth={0.8} />
            {/* Middle Bill */}
            <Rect x="4" y="8" width="22" height="12" rx="2" fill="#059669" stroke="#047857" strokeWidth={0.8} />
            {/* Top Main Bill */}
            <Rect x="3" y="5" width="22" height="12" rx="2" fill="#10B981" stroke="#059669" strokeWidth={1} />
            {/* Inner Border */}
            <Rect x="4.5" y="6.5" width="19" height="9" rx="1.5" stroke="#34D399" strokeWidth={0.6} />
            {/* Currency Strap Wrapped Around Center */}
            <Rect x="11" y="5" width="6" height="12" fill="#FEF08A" stroke="#CA8A04" strokeWidth={0.8} />
            <Circle cx="14" cy="11" r="1.5" fill="#B45309" />
          </Svg>
        );
      }

      // Day 3 Single Cash Stack
      return (
        <Svg width={30} height={30} viewBox="0 0 26 26" fill="none">
          {/* Shadow Back Bill */}
          <Rect x="2" y="9" width="21" height="11" rx="2" fill="#047857" />
          {/* Top Green Banknote */}
          <Rect x="3" y="6" width="21" height="11" rx="2" fill="#10B981" stroke="#059669" strokeWidth={1} />
          <Rect x="4.5" y="7.5" width="18" height="8" rx="1.5" stroke="#34D399" strokeWidth={0.6} />
          {/* Gold Paper Wrap Band */}
          <Rect x="11" y="6" width="5" height="11" fill="#FEF08A" stroke="#D97706" strokeWidth={0.6} />
        </Svg>
      );
    }

    // 2. EXP ONLY REWARDS (Days 1, 2, 4, 5, 6) -> Golden XP Star Icon
    return (
      <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          fill={isCurrent ? '#FBBF24' : '#64748B'}
          stroke={isCurrent ? '#D97706' : '#475569'}
          strokeWidth={1.2}
        />
      </Svg>
    );
  };

  return (
    <>
      {/* 1. SEVEN-DAY DAILY REWARD GRID MODAL */}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={styles.modalCardWrapper}>
            <View style={styles.modalCard}>
              {/* Top Glowing Header Accent */}
              <Svg width="100%" height={80} viewBox="0 0 340 80" fill="none" style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="rewardHdrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                    <Stop offset="50%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <Stop offset="100%" stopColor="#0F172A" stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                <Rect width="340" height="80" fill="url(#rewardHdrGrad)" />
              </Svg>

              {/* Close Button Top Right */}
              <TouchableOpacity
                onPress={() => {
                  safeHaptic('light');
                  onClose();
                }}
                style={styles.closeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Close daily reward modal"
              >
                <PhosphorIcon name="X" size={14} color="#94A3B8" />
              </TouchableOpacity>

              <YStack padding={20} gap={16} alignItems="center">
                {/* Clean Header Title */}
                <YStack alignItems="center" gap={3} marginTop={4}>
                  <Text color="#FFFFFF" fontSize={20} fontFamily={Fonts.bold} letterSpacing={-0.3}>
                    Daily Check-In
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} textAlign="center">
                    Claim consecutive daily rewards to boost XP & Simulator Cash!
                  </Text>
                </YStack>

                {/* 7-Day Reward Grid */}
                <XStack flexWrap="wrap" justifyContent="space-between" width="100%" gap={8}>
                  {REWARD_SCHEDULE.map((item) => {
                    const isPast = item.day < currentDayInCycle;
                    const isCurrent = item.day === currentDayInCycle;
                    const isFuture = item.day > currentDayInCycle;
                    const isDay7 = item.day === 7;

                    // Day 7: Sleek Clean Bonus Banner
                    if (isDay7) {
                      return (
                        <View
                          key={item.day}
                          style={[
                            styles.day7Card,
                            isCurrent && styles.day7CardCurrent,
                            isPast && styles.dayCardPast,
                            isFuture && styles.dayCardFuture,
                          ]}
                        >
                          <XStack alignItems="center" gap={10} flex={1}>
                            <View style={styles.day7IconBox}>
                              {renderRewardIcon(item, isPast, isCurrent)}
                            </View>
                            <YStack gap={2}>
                              <View style={styles.day7Badge}>
                                <Text color="#34D399" fontSize={8.5} fontFamily={Fonts.bold} letterSpacing={0.5}>
                                  DAY 7 • BONUS REWARD
                                </Text>
                              </View>
                              <Text color="#FFFFFF" fontSize={12.5} fontFamily={Fonts.bold}>
                                +70 XP & <Text color="#34D399">+{currencySymbol}2,000 Cash</Text>
                              </Text>
                            </YStack>
                          </XStack>
                          {isPast && (
                            <View style={styles.claimedBadgeMini}>
                              <Text color="#10B981" fontSize={10} fontFamily={Fonts.bold}>
                                Claimed ✓
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    }

                    // Days 1 to 6 Standard 3-Column Cards
                    return (
                      <View
                        key={item.day}
                        style={[
                          styles.dayCard,
                          isCurrent && styles.dayCardCurrent,
                          isPast && styles.dayCardPast,
                          isFuture && styles.dayCardFuture,
                        ]}
                      >
                        {/* Day Pill Tag */}
                        <View
                          style={[
                            styles.dayTagPill,
                            isCurrent && styles.dayTagPillCurrent,
                            isPast && styles.dayTagPillPast,
                          ]}
                        >
                          <Text
                            color={isCurrent ? '#FFFFFF' : '#94A3B8'}
                            fontSize={8.5}
                            fontFamily={Fonts.bold}
                          >
                            {item.tag}
                          </Text>
                        </View>

                        {/* Custom Polished Vector Icon */}
                        <View style={styles.iconContainer}>
                          {renderRewardIcon(item, isPast, isCurrent)}
                        </View>

                        {/* Reward Details Text */}
                        <YStack alignItems="center" gap={1}>
                          <Text
                            color={isCurrent ? '#FFFFFF' : isPast ? '#64748B' : '#CBD5E1'}
                            fontSize={11}
                            fontFamily={Fonts.bold}
                          >
                            +{item.xp} XP
                          </Text>
                          {item.cash > 0 && (
                            <Text color="#34D399" fontSize={9.5} fontFamily={Fonts.bold}>
                              +{currencySymbol}{item.cash}
                            </Text>
                          )}
                        </YStack>
                      </View>
                    );
                  })}
                </XStack>

                {/* Claim Button */}
                <TouchableOpacity
                  onPress={handleClaim}
                  disabled={isAlreadyClaimedToday}
                  style={[styles.claimButton, isAlreadyClaimedToday && styles.claimButtonChecked]}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={isAlreadyClaimedToday ? `Checked in today, Day ${currentDayInCycle}` : `Claim Day ${currentDayInCycle} Reward`}
                  accessibilityState={{ disabled: isAlreadyClaimedToday }}
                >
                  <Text color="#FFFFFF" fontSize={15} fontFamily={Fonts.bold}>
                    {isAlreadyClaimedToday ? `Checked In Today ✓ (Day ${currentDayInCycle})` : `Claim Day ${currentDayInCycle} Reward ✨`}
                  </Text>
                </TouchableOpacity>
              </YStack>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. DEDICATED "YOU'RE CHECKED IN" SHINING CELEBRATION MODAL */}
      {claimedReward && (
        <CheckedInCelebrationModal
          visible={showCelebration}
          xp={claimedReward.xp}
          cash={claimedReward.cash}
          day={claimedReward.day}
          onDismiss={handleDismissCelebration}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCardWrapper: {
    width: '100%',
    maxWidth: 350,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  celebrationCardWrapper: {
    width: '100%',
    maxWidth: 320,
  },
  celebrationCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dayCard: {
    width: '31%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  day7Card: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  day7CardCurrent: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#FBBF24',
    borderWidth: 2,
  },
  day7IconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  day7Badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  claimedBadgeMini: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dayCardCurrent: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  dayCardPast: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: '#1E293B',
    opacity: 0.85,
  },
  dayCardFuture: {
    opacity: 0.6,
  },
  dayTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dayTagPillCurrent: {
    backgroundColor: '#10B981',
  },
  dayTagPillPast: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  iconContainer: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleClaimed: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimButton: {
    backgroundColor: '#1D8348',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  claimButtonChecked: {
    backgroundColor: '#059669',
  },
  sunburstHeroBox: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  sunburstContainer: {
    position: 'absolute',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  checkCircleBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  contentFadeBox: {
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  earnedPillXp: {
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  earnedPillCash: {
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  awesomeBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
});

export default DailyRewardModal;
