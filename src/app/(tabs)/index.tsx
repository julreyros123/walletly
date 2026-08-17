import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Alert, Modal, TouchableOpacity, Image as RNImage } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Button, Progress, View, Text as TamaguiText } from 'tamagui';

const Text = (props: any) => <TamaguiText {...props} />;
import { useAuthStore } from '@/store/authStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';
import { useRouter, Href } from 'expo-router';
import { Spacing } from '@/constants/theme';
import { DailyRewardModal } from '@/components/ui/DailyRewardModal';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { CbudgetCard } from '@/components/ui/CbudgetCard';

export const getMasteryAvatarDetails = (title: string) => {
  switch (title) {
    case 'Smart Saver':
      return {
        initials: 'SS',
        color: '#10B981', // Emerald green
        borderColor: '#10B981',
        borderStyle: 'dashed' as const,
        bg: 'rgba(16, 185, 129, 0.1)',
      };
    case 'Investment Explorer':
      return {
        initials: 'IE',
        color: '#3B82F6', // Royal blue
        borderColor: '#3B82F6',
        borderStyle: 'solid' as const,
        bg: 'rgba(59, 130, 246, 0.1)',
      };
    case 'Financial Strategist':
      return {
        initials: 'FS',
        color: '#F59E0B', // Amber
        borderColor: '#F59E0B',
        borderStyle: 'solid' as const,
        bg: 'rgba(245, 158, 11, 0.1)',
      };
    case 'Budget Beginner':
    default:
      return {
        initials: 'BB',
        color: '#64748B', // Slate
        borderColor: '#64748B',
        borderStyle: 'solid' as const,
        bg: 'rgba(100, 116, 139, 0.1)',
      };
  }
};

const SpriteIcon = ({ name, size = 44 }: { name: 'achievements' | 'learning' | 'avatar' | 'investing'; size?: number }) => {
  let top = 0;
  let left = 0;

  const baseWidth = 250;
  const baseHeight = 167;

  const scale = size / 45;
  const imgW = baseWidth * scale;
  const imgH = baseHeight * scale;

  if (name === 'achievements') {
    left = -19.2 * scale;
    top = -25.5 * scale;
  } else if (name === 'learning') {
    left = -47.5 * scale;
    top = -87 * scale;
  } else if (name === 'avatar') {
    left = -134.2 * scale;
    top = -25.5 * scale;
  } else if (name === 'investing') {
    left = -191.7 * scale;
    top = -25.5 * scale;
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        position: 'relative',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <RNImage
        source={require('../../../assets/images/icons.png')}
        style={{
          width: imgW,
          height: imgH,
          position: 'absolute',
          top: top,
          left: left,
        }}
        resizeMode="stretch"
      />
    </View>
  );
};

const getCategoryIconDetails = (category: string) => {
  switch (category.toLowerCase()) {
    case 'food':
    case 'dining':
      return {
        icon: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' } as const,
        color: '#F97316', // orange
        bg: 'rgba(249, 115, 22, 0.1)',
      };
    case 'transport':
    case 'travel':
      return {
        icon: { ios: 'car.fill', android: 'directions_car', web: 'directions_car' } as const,
        color: '#0EA5E9', // sky blue
        bg: 'rgba(14, 165, 233, 0.1)',
      };
    case 'utilities':
    case 'bills':
      return {
        icon: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' } as const,
        color: '#10B981', // emerald green
        bg: 'rgba(16, 185, 129, 0.1)',
      };
    case 'entertainment':
    case 'leisure':
      return {
        icon: { ios: 'gamecontroller.fill', android: 'sports_esports', web: 'sports_esports' } as const,
        color: '#8B5CF6', // purple
        bg: 'rgba(139, 92, 246, 0.1)',
      };
    case 'shopping':
      return {
        icon: { ios: 'bag.fill', android: 'local_mall', web: 'local_mall' } as const,
        color: '#EC4899', // pink
        bg: 'rgba(236, 72, 153, 0.1)',
      };
    case 'education':
    case 'school':
      return {
        icon: { ios: 'book.fill', android: 'school', web: 'school' } as const,
        color: '#3B82F6', // royal blue
        bg: 'rgba(59, 130, 246, 0.1)',
      };
    default:
      return {
        icon: { ios: 'tag.fill', android: 'label', web: 'label' } as const,
        color: '#64748B', // slate
        bg: 'rgba(100, 116, 139, 0.1)',
      };
  }
};

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme() as any;
  const { user, isPremium, logout } = useAuthStore();
  const isGuest = user?.id === 'guest';
  const store = useGamificationStore();

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);

  const handleRestrictedAction = (action: () => void) => {
    if (isGuest) {
      setRegisterModalVisible(true);
    } else {
      action();
    }
  };

  useEffect(() => {
    if (isGuest) return;
    store.checkAndUpdateStreak();
    
    // Check if daily reward should pop up
    const today = new Date().toISOString().split('T')[0];
    if (store.lastClaimedRewardDate !== today) {
      setTimeout(() => setShowDailyReward(true), 500);
    }
  }, [isGuest]);

  // Derived Calculations
  const totalSpent = store.loggedExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const completedCount = Math.min(9, Math.floor(store.learningScore / 11));
  const currentLevelNum = Math.min(9, completedCount + 1);
  const isAllCompleted = store.learningScore >= 99;

  const levelTitles: Record<number, string> = {
    1: 'Budgeting Basics',
    2: 'Expense Tracking',
    3: 'Saving Strategies',
    4: 'Emergency Funds',
    5: 'Financial Planning',
    6: 'Investment Fundamentals',
    7: 'Risk Management',
    8: 'Diversification',
    9: 'Long-Term Wealth',
  };

  const levelDescriptions: Record<number, string> = {
    1: 'Master cash-flow principles and zero-based budgeting.',
    2: 'Learn to track daily expenses and spot leaks.',
    3: 'Discover the pay-yourself-first method.',
    4: 'Build a solid safety buffer for life emergencies.',
    5: 'Set S.M.A.R.T savings targets with timelines.',
    6: 'Unlock compound interest and growth concepts.',
    7: 'Understand risk tolerance and tradeoffs.',
    8: 'Spread risks across multiple asset classes.',
    9: 'Develop patience and long-term compounding.',
  };

  const currentLevelTitle = levelTitles[currentLevelNum] || 'Budgeting Basics';
  const currentLevelDesc = levelDescriptions[currentLevelNum] || 'Complete learning pathway modules.';

  const totalSavingsContribution = store.savingsGoals.reduce((sum, g) => sum + g.currentSavings, 0);
  const budgetRemaining = Math.max(0, store.totalBudget - totalSpent);

  // Asset price reference for holdings - synced with Invest Arena simulation tickers
  const assetPrices: Record<string, number> = {
    'NOVA': 512.80,
    'VOLT': 345.50,
    'BREW': 125.30,
    'APEX': 185.20,
    'SOLR': 95.60,
  };
  const holdingsValue = Object.keys(store.portfolioAllocations).reduce(
    (sum, ticker) => sum + (store.portfolioAllocations[ticker] || 0) * (assetPrices[ticker] || 0),
    0
  );
  const totalSimValue = holdingsValue + store.virtualBalance;

  // Gamification Level and XP progress variables
  const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000];
  const currentLevel = Math.max(1, Math.min(8, store.level));
  const currentLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel] || 10000;
  const xpInCurrentLevel = Math.max(0, store.xp - currentLevelThreshold);
  const xpNeededForNextLevel = Math.max(1, nextLevelThreshold - currentLevelThreshold);
  const xpProgressRatio = Math.max(0, Math.min(1, xpInCurrentLevel / xpNeededForNextLevel));

  const avatarDetails = getMasteryAvatarDetails(store.customAvatar);

  return (
    <YStack flex={1} backgroundColor="#0B132B" position="relative">
      
      <SafeAreaView style={[styles.safeArea, { zIndex: 1 }]} edges={['top', 'left', 'right']}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: 'transparent', flex: 1 }}
        >
          
          {/* ==================== GREETING & PROFILE HEADER ==================== */}
          <XStack justifyContent="space-between" alignItems="center" marginBottom={12}>
            <XStack gap={12} alignItems="center" flex={1}>
              {/* Mastery Profile Avatar */}
              <TouchableOpacity
                onPress={() => setShowAvatarPicker(true)}
                activeOpacity={0.85}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: avatarDetails.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: avatarDetails.borderColor,
                  borderStyle: avatarDetails.borderStyle,
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <SpriteIcon name="avatar" size={38} />
              </TouchableOpacity>

              {/* Greeting, Title, and XP Bar */}
              <YStack gap={2} flex={1}>
                <XStack alignItems="center" gap={6}>
                  <Text color="#FFFFFF" fontSize={18} fontFamily="Inter_700Bold" letterSpacing={-0.4}>
                    Hey {user?.name ? user.name.split(' ')[0] : 'Explorer'} 👋
                  </Text>
                </XStack>

                {/* Gamified XP Progress */}
                <XStack alignItems="center" gap={6} marginTop={2}>
                  <View backgroundColor="rgba(255, 255, 255, 0.18)" borderRadius={4} paddingHorizontal={5} paddingVertical={1.5}>
                    <Text color="#FFFFFF" fontSize={8} fontFamily="Inter_800ExtraBold" letterSpacing={0.2}>
                      LVL {store.level}
                    </Text>
                  </View>
                  <YStack gap={1}>
                    <View height={5} backgroundColor="rgba(255, 255, 255, 0.08)" borderRadius={4} overflow="hidden" width={110} marginTop={3} borderWidth={0.5} borderColor="rgba(255,255,255,0.1)">
                      <View width={`${xpProgressRatio * 100}%`} height="100%" backgroundColor="#3EB47D" borderRadius={4} />
                    </View>
                    <Text color="rgba(255, 255, 255, 0.5)" fontSize={8} fontFamily="Inter_600SemiBold">
                      {store.xp} / {nextLevelThreshold} XP
                    </Text>
                  </YStack>
                </XStack>
              </YStack>
            </XStack>

            {/* Streak Tracker Badge */}
            <TouchableOpacity
              onPress={() => handleRestrictedAction(() => setShowDailyReward(true))}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#FF7A00',
                borderRadius: 100,
                paddingHorizontal: 12,
                paddingVertical: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <SymbolView
                name={{ ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' } as const}
                size={14}
                tintColor="#0B132B"
              />
              <Text color="#0B132B" fontSize={11} fontFamily="Inter_700Bold">
                {store.streakDays}d Streak
              </Text>
            </TouchableOpacity>
          </XStack>

          {/* Mastery Avatar Title Pill */}
          <TouchableOpacity
            onPress={() => setShowAvatarPicker(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              borderWidth: 1,
              borderRadius: 100,
              paddingHorizontal: 14,
              paddingVertical: 8,
              gap: 6,
              alignSelf: 'flex-start',
              marginBottom: 20,
              minHeight: 38,
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View width={8} height={8} borderRadius={4} style={{ backgroundColor: avatarDetails.color }} />
            <Text color="#FFFFFF" fontSize={11} fontFamily="Inter_600SemiBold" letterSpacing={0.5}>
              {store.customAvatar}
            </Text>
            <SymbolView
              name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' } as const}
              size={10}
              tintColor="rgba(255, 255, 255, 0.6)"
            />
          </TouchableOpacity>

          {/* ==================== 1. PREMIUM BALANCE/BUDGET CARD ==================== */}
          <CbudgetCard 
            marginBottom={20} 
            padding={0}
            borderRadius={16}
            borderWidth={1}
            borderColor="rgba(255, 255, 255, 0.08)"
            backgroundColor="#1C2541"
            elevation={0}
            style={{
              overflow: 'hidden',
            } as any}
          >
            <YStack padding={20} gap={14}>
              <YStack gap={4}>
                <Text color="#8D99AE" fontSize={11} fontFamily="Inter_600SemiBold" letterSpacing={0.5}>
                  REMAINING BALANCE
                </Text>
                <XStack alignItems="baseline" gap={4} marginTop={2}>
                  <Text color="#3EB47D" fontSize={20} fontFamily="Inter_700Bold">₱</Text>
                  <Text color="#FFFFFF" fontSize={28} fontFamily="Inter_700Bold" letterSpacing={-0.5} lineHeight={34}>
                    {budgetRemaining.toLocaleString()}
                  </Text>
                </XStack>
              </YStack>

              {/* Spend Progress Tracker */}
              <YStack gap={6} marginTop={4}>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="#8D99AE" fontSize={11} fontFamily="Inter_500Medium">
                    Spent: ₱ {totalSpent.toLocaleString()}
                  </Text>
                  <XStack gap={6} alignItems="center">
                    {totalSpent > store.totalBudget && (
                      <View backgroundColor="rgba(239, 68, 68, 0.2)" paddingHorizontal={6} paddingVertical={2} borderRadius={4}>
                        <Text color="#EF4444" fontSize={9} fontFamily="Inter_700Bold">OVER BUDGET</Text>
                      </View>
                    )}
                    <Text color="#FFFFFF" fontSize={11} fontFamily="Inter_700Bold">
                      Limit: ₱ {store.totalBudget.toLocaleString()}
                    </Text>
                  </XStack>
                </XStack>
                
                {/* Custom Stable Progress Bar (no sluggish layout animations) */}
                <View 
                  height={8} 
                  backgroundColor="rgba(255,255,255,0.06)"
                  borderRadius={4}
                  overflow="hidden"
                  width="100%"
                >
                  <View 
                    width={`${Math.min(100, store.totalBudget > 0 ? (totalSpent / store.totalBudget) * 100 : 0)}%`}
                    height="100%"
                    backgroundColor={totalSpent > store.totalBudget ? '#EF4444' : '#3EB47D'}
                    borderRadius={4}
                  />
                </View>
              </YStack>
            </YStack>

            {/* Bottom Ledger Metrics */}
            <View height={1} backgroundColor="rgba(255, 255, 255, 0.06)" />
            <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={20} paddingVertical={14} backgroundColor="rgba(0, 0, 0, 0.15)">
              <YStack gap={2}>
                <Text color="#8D99AE" fontSize={9} fontFamily="Inter_600SemiBold" letterSpacing={0.5}>SANDBOX CASH</Text>
                <Text color="#FFFFFF" fontSize={13} fontFamily="Inter_700Bold">₱ {store.virtualBalance.toLocaleString()}</Text>
              </YStack>
              <View width={1} height={20} backgroundColor="rgba(255, 255, 255, 0.08)" />
              <YStack gap={2} alignItems="center">
                <Text color="#8D99AE" fontSize={9} fontFamily="Inter_600SemiBold" letterSpacing={0.5}>PORTFOLIO VALUE</Text>
                <Text color="#FFFFFF" fontSize={13} fontFamily="Inter_700Bold">₱ {holdingsValue.toLocaleString()}</Text>
              </YStack>
              <View width={1} height={20} backgroundColor="rgba(255, 255, 255, 0.08)" />
              <YStack gap={2} alignItems="flex-end">
                <Text color="#8D99AE" fontSize={9} fontFamily="Inter_600SemiBold" letterSpacing={0.5}>TOTAL SAVINGS</Text>
                <Text color="#3EB47D" fontSize={13} fontFamily="Inter_700Bold">₱ {totalSavingsContribution.toLocaleString()}</Text>
              </YStack>
            </XStack>
          </CbudgetCard>

          {/* Acorns-Inspired Spare Change Round-Ups Card */}
          {store.spareChangeAccumulated > 0 && (
            <CbudgetCard 
              padding={16} 
              gap={12} 
              marginBottom={16}
              backgroundColor="#1C2541"
              borderColor="rgba(62, 180, 125, 0.2)"
              borderWidth={1.5}
              borderRadius={16}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <YStack gap={2} flex={1}>
                  <XStack gap={6} alignItems="center">
                    <SymbolView
                      name={{ ios: 'coins.pile.fill', android: 'savings', web: 'savings' } as any}
                      size={16}
                      tintColor="#3EB47D"
                    />
                    <Text color="#3EB47D" fontSize={11} fontFamily="Inter_700Bold" letterSpacing={0.5}>
                      ACORNS SPARE CHANGE
                    </Text>
                  </XStack>
                  <Text color="#FFFFFF" fontSize={13} fontFamily="Inter_600SemiBold" marginTop={4}>
                    You saved <Text color="#3EB47D" fontFamily="Inter_700Bold">₱{store.spareChangeAccumulated}</Text> in round-ups from logged expenses!
                  </Text>
                </YStack>
                
                <TouchableOpacity
                  onPress={() => {
                    const amount = store.spareChangeAccumulated;
                    store.sweepSpareChange();
                    Alert.alert(
                      '💰 Spare Change Swept!',
                      `₱${amount} spare change has been transferred to your Investment Lab Sandbox Cash! (+10 XP)`
                    );
                  }}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#059669',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <SymbolView
                    name={{ ios: 'arrow.right.circle.fill', android: 'arrow_forward', web: 'arrow_forward' } as any}
                    size={14}
                    tintColor="#FFFFFF"
                  />
                  <Text color="#FFFFFF" fontSize={11} fontFamily="Inter_700Bold">SWEEP</Text>
                </TouchableOpacity>
              </XStack>
            </CbudgetCard>
          )}

          {/* ==================== 2. QUICK ACTIONS ROW ==================== */}
          <XStack justifyContent="space-between" gap={8} marginBottom={20}>
            {/* Action 1: Log Expense */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/budget' as Href)}
              activeOpacity={0.7}
              style={styles.quickActionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View style={styles.quickActionCircle}>
                <SymbolView
                  name={{ ios: 'plus', android: 'add', web: 'add' } as any}
                  size={24}
                  tintColor="#FFFFFF"
                />
              </View>
              <Text color={theme.text} fontSize={11} fontFamily="Inter_600SemiBold" textAlign="center">
                Log Expense
              </Text>
            </TouchableOpacity>

            {/* Action 2: Add Savings */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/budget' as Href)}
              activeOpacity={0.7}
              style={styles.quickActionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View style={styles.quickActionCircle}>
                <SymbolView
                  name={{ ios: 'banknote.fill', android: 'savings', web: 'savings' } as any}
                  size={22}
                  tintColor="#FFFFFF"
                />
              </View>
              <Text color={theme.text} fontSize={11} fontFamily="Inter_600SemiBold" textAlign="center">
                Add Savings
              </Text>
            </TouchableOpacity>

            {/* Action 3: Next Lesson */}
            <TouchableOpacity
              onPress={() => handleRestrictedAction(() => router.push('/(tabs)/learn' as Href))}
              activeOpacity={0.7}
              style={styles.quickActionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View style={styles.quickActionCircle}>
                <SymbolView
                  name={{ ios: 'book.fill', android: 'menu_book', web: 'menu_book' } as any}
                  size={20}
                  tintColor="#FFFFFF"
                />
              </View>
              <Text color={theme.text} fontSize={11} fontFamily="Inter_600SemiBold" textAlign="center">
                Next Lesson
              </Text>
            </TouchableOpacity>

            {/* Action 4: Claim Daily */}
            <TouchableOpacity
              onPress={() => handleRestrictedAction(() => setShowDailyReward(true))}
              activeOpacity={0.7}
              style={styles.quickActionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View style={styles.quickActionCircle}>
                <SymbolView
                  name={{ ios: 'gift.fill', android: 'card_giftcard', web: 'card_giftcard' } as any}
                  size={22}
                  tintColor="#FFFFFF"
                />
              </View>
              <Text color={theme.text} fontSize={11} fontFamily="Inter_600SemiBold" textAlign="center">
                Claim Daily
              </Text>
            </TouchableOpacity>
          </XStack>

          {/* ==================== 3. RECENT TRACKED EXPENSES ==================== */}
          <CbudgetCard 
            marginBottom={16} 
            padding={18} 
            gap={12}
            backgroundColor="#1C2541"
            borderColor="rgba(255, 255, 255, 0.08)"
            borderWidth={1}
            borderRadius={16}
            elevation={0}
          >
            <XStack justifyContent="space-between" alignItems="center">
              <Text color="#FFFFFF" fontSize={14} fontFamily="Inter_700Bold" letterSpacing={-0.2} lineHeight={20}>
                Recent Tracked Expenses
              </Text>
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/budget' as Href)}
                style={styles.cardHeaderLink}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text color="#3EB47D" fontSize={12} fontFamily="Inter_700Bold">
                  Manage
                </Text>
              </TouchableOpacity>
            </XStack>
            
            <View height={1} backgroundColor="rgba(255, 255, 255, 0.06)" marginBottom={4} />

            {store.loggedExpenses.length === 0 ? (
              <YStack alignItems="center" paddingVertical={16} gap={6}>
                <SymbolView
                  name={{ ios: 'creditcard', android: 'payment', web: 'payment' } as any}
                  size={28}
                  tintColor="#8D99AE"
                  style={{ opacity: 0.5 }}
                />
                <Text color="#8D99AE" fontSize={12} fontFamily="Inter_400Regular" fontStyle="italic" textAlign="center">
                  No simulated expenses logged yet. Tap 'Log Expense' above to start tracking!
                </Text>
              </YStack>
            ) : (
              <YStack gap={10}>
                {store.loggedExpenses.slice(0, 3).map((exp) => {
                  const details = getCategoryIconDetails(exp.category);
                  return (
                    <XStack key={exp.id} justifyContent="space-between" alignItems="center" paddingBottom={8} borderBottomWidth={1} borderBottomColor="rgba(255, 255, 255, 0.04)">
                      <XStack gap={12} alignItems="center" flex={1}>
                        <View width={36} height={36} borderRadius={10} backgroundColor="rgba(255, 255, 255, 0.04)" alignItems="center" justifyContent="center" borderWidth={1} borderColor="rgba(255, 255, 255, 0.06)">
                          <SymbolView name={details.icon} size={15} tintColor={details.color} />
                        </View>
                        <YStack gap={1} flex={1}>
                          <Text color="#FFFFFF" fontSize={13} fontFamily="Inter_600SemiBold" numberOfLines={1}>{exp.name}</Text>
                          <Text color="#8D99AE" fontSize={10} fontFamily="Inter_400Regular">{exp.category} • {exp.date}</Text>
                        </YStack>
                      </XStack>
                      <Text color="#FFFFFF" fontSize={14} fontFamily="Inter_700Bold" letterSpacing={-0.2}>
                        -₱ {exp.amount.toLocaleString()}
                      </Text>
                    </XStack>
                  );
                })}
              </YStack>
            )}
          </CbudgetCard>

          {/* ==================== 4. SAVINGS GOAL PROGRESS ==================== */}
          <CbudgetCard 
            marginBottom={16} 
            padding={18} 
            gap={12}
            backgroundColor="#1C2541"
            borderColor="rgba(255, 255, 255, 0.08)"
            borderWidth={1}
            borderRadius={16}
            elevation={0}
          >
            <XStack justifyContent="space-between" alignItems="center">
              <Text color="#FFFFFF" fontSize={14} fontFamily="Inter_700Bold" letterSpacing={-0.2} lineHeight={20}>
                Savings Goals
              </Text>
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/budget' as Href)}
                style={styles.cardHeaderLink}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text color="#3EB47D" fontSize={12} fontFamily="Inter_700Bold">
                  View Goals
                </Text>
              </TouchableOpacity>
            </XStack>

            <View height={1} backgroundColor="rgba(255, 255, 255, 0.06)" marginBottom={4} />

            {store.savingsGoals.length === 0 ? (
              <YStack alignItems="center" paddingVertical={16} gap={6}>
                <SymbolView
                  name={{ ios: 'shield.fill', android: 'shield', web: 'shield' } as any}
                  size={26}
                  tintColor="#8D99AE"
                  style={{ opacity: 0.5 }}
                />
                <Text color="#8D99AE" fontSize={12} fontFamily="Inter_400Regular" fontStyle="italic" textAlign="center">
                  No active savings goals. Set up an emergency fund to protect your cash!
                </Text>
              </YStack>
            ) : (
              <YStack gap={12}>
                {store.savingsGoals.slice(0, 2).map((goal) => {
                  const ratio = goal.targetAmount > 0 ? goal.currentSavings / goal.targetAmount : 0;
                  const percentage = Math.min(100, Math.round(ratio * 100));
                  return (
                    <YStack key={goal.id} gap={6}>
                      <XStack justifyContent="space-between" alignItems="center">
                        <XStack gap={8} alignItems="center" flex={1}>
                          <View width={28} height={28} borderRadius={8} backgroundColor="rgba(62, 180, 125, 0.15)" alignItems="center" justifyContent="center">
                            <SymbolView name={{ ios: 'banknote.fill', android: 'savings', web: 'savings' } as any} size={13} tintColor="#3EB47D" />
                          </View>
                          <YStack gap={1} flex={1}>
                            <Text color="#FFFFFF" fontSize={13} fontFamily="Inter_600SemiBold" numberOfLines={1}>{goal.name}</Text>
                            <Text color="#8D99AE" fontSize={10} fontFamily="Inter_500Medium">
                              ₱ {goal.currentSavings.toLocaleString()} / ₱ {goal.targetAmount.toLocaleString()}
                            </Text>
                          </YStack>
                        </XStack>
                        <View backgroundColor="rgba(62, 180, 125, 0.15)" borderRadius={6} paddingHorizontal={6} paddingVertical={2}>
                          <Text color="#3EB47D" fontSize={10} fontFamily="Inter_700Bold">{percentage}%</Text>
                        </View>
                      </XStack>
                      <Progress value={Math.min(100, ratio * 100)} height={6} backgroundColor="rgba(255, 255, 255, 0.06)" borderRadius={3}>
                        <Progress.Indicator backgroundColor="#3EB47D" borderRadius={3} />
                      </Progress>
                    </YStack>
                  );
                })}
              </YStack>
            )}
          </CbudgetCard>

          {/* ==================== 5. INVESTMENT SIMULATION SUMMARY ==================== */}
          <CbudgetCard 
            marginBottom={16} 
            padding={18} 
            gap={12}
            backgroundColor="#1C2541"
            borderColor="rgba(255, 255, 255, 0.08)"
            borderWidth={1}
            borderRadius={16}
            elevation={0}
          >
            <XStack justifyContent="space-between" alignItems="center">
              <YStack gap={2}>
                <Text color="#8D99AE" fontSize={10} fontFamily="Inter_600SemiBold" letterSpacing={1.2} textTransform="uppercase">
                  MY STOCK INVESTMENTS
                </Text>
                <Text color="#FFFFFF" fontSize={28} fontFamily="Inter_700Bold" letterSpacing={-0.5}>
                  ₱ {totalSimValue.toLocaleString()}
                </Text>
              </YStack>
              <TouchableOpacity
                onPress={() => handleRestrictedAction(() => router.push('/(tabs)/invest' as Href))}
                style={styles.cardHeaderActionBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text color="#FFFFFF" fontFamily="Inter_700Bold" fontSize={12}>Arena</Text>
              </TouchableOpacity>
            </XStack>

            <View height={1} backgroundColor="rgba(255, 255, 255, 0.06)" marginBottom={2} />

            <XStack justifyContent="space-between" backgroundColor="rgba(0, 0, 0, 0.15)" padding={12} borderRadius={12}>
              <YStack gap={3}>
                <Text color="#8D99AE" fontSize={9} fontFamily="Inter_600SemiBold" letterSpacing={0.5} textTransform="uppercase">Available Cash</Text>
                <Text color="#FFFFFF" fontSize={15} fontFamily="Inter_700Bold" letterSpacing={-0.3}>₱ {store.virtualBalance.toLocaleString()}</Text>
              </YStack>
              <YStack gap={3} alignItems="flex-end">
                <Text color="#8D99AE" fontSize={9} fontFamily="Inter_600SemiBold" letterSpacing={0.5} textTransform="uppercase">In Stocks</Text>
                <Text color="#FFFFFF" fontSize={15} fontFamily="Inter_700Bold" letterSpacing={-0.3}>₱ {holdingsValue.toLocaleString()}</Text>
              </YStack>
            </XStack>

            {/* Owned Holdings List */}
            {Object.keys(store.portfolioAllocations).filter(t => store.portfolioAllocations[t] > 0).length > 0 && (
              <YStack gap={8} marginTop={4}>
                <Text color="#8D99AE" fontSize={11} fontFamily="Inter_700Bold" letterSpacing={0.4}>ACTIVE HOLDINGS</Text>
                {Object.keys(store.portfolioAllocations)
                  .filter(ticker => store.portfolioAllocations[ticker] > 0)
                  .map((ticker) => {
                    const qty = store.portfolioAllocations[ticker] || 0;
                    const price = assetPrices[ticker] || 0;
                    const totalVal = qty * price;
                    const isPositive = ticker !== 'VOLT'; // Volt is currently down, others up
                    const changeText = ticker === 'NOVA' ? '+2.45%' : ticker === 'VOLT' ? '-1.85%' : ticker === 'BREW' ? '+0.35%' : ticker === 'APEX' ? '+0.12%' : '+0.78%';
                    
                    return (
                      <XStack key={ticker} justifyContent="space-between" alignItems="center" paddingVertical={6} borderBottomWidth={1} borderBottomColor="rgba(255, 255, 255, 0.04)">
                        <XStack gap={8} alignItems="center">
                          <View width={26} height={26} borderRadius={6} backgroundColor="rgba(62, 180, 125, 0.15)" alignItems="center" justifyContent="center">
                            <Text color="#3EB47D" fontSize={10} fontFamily="Inter_800ExtraBold">{ticker}</Text>
                          </View>
                          <YStack gap={1}>
                            <Text color="#FFFFFF" fontSize={12} fontFamily="Inter_600SemiBold">{qty.toFixed(2)} units</Text>
                            <Text color="#8D99AE" fontSize={10}>Price: ₱ {price.toFixed(2)}</Text>
                          </YStack>
                        </XStack>
                        <YStack alignItems="flex-end" gap={1}>
                          <Text color="#FFFFFF" fontSize={13} fontFamily="Inter_700Bold">₱ {totalVal.toLocaleString()}</Text>
                          <Text color={isPositive ? '#3EB47D' : '#EF4444'} fontSize={10} fontFamily="Inter_700Bold">{changeText}</Text>
                        </YStack>
                      </XStack>
                    );
                  })}
              </YStack>
            )}
          </CbudgetCard>

          {/* ==================== 6. ACADEMY LEARNING MODULE ==================== */}
          <CbudgetCard
            marginBottom={16}
            padding={0}
            borderRadius={16}
            borderWidth={1}
            borderColor="rgba(255, 255, 255, 0.08)"
            backgroundColor="#1C2541"
            elevation={0}
            overflow="hidden"
          >
            <TouchableOpacity
              onPress={() => handleRestrictedAction(() => router.push('/(tabs)/learn' as Href))}
              activeOpacity={0.7}
              style={{ minHeight: 84, justifyContent: 'center' }}
            >
              <XStack padding={16} gap={14} alignItems="center" justifyContent="space-between">
                {/* Left Side: SpriteIcon showing Learning Graphic */}
                <View width={50} height={50} borderRadius={12} backgroundColor="rgba(62, 180, 125, 0.15)" alignItems="center" justifyContent="center">
                  <SpriteIcon name="learning" size={44} />
                </View>

                {/* Center: Course Details */}
                <YStack flex={1} gap={2}>
                  <Text color="#3EB47D" fontSize={11} fontFamily="Inter_600SemiBold" letterSpacing={0.5} textTransform="uppercase">
                    ACADEMY PATHWAY
                  </Text>
                  <Text color="#FFFFFF" fontSize={14} fontFamily="Inter_700Bold" numberOfLines={1} lineHeight={18}>
                    {isAllCompleted ? 'Academy Curriculum Complete!' : `Lvl ${currentLevelNum}: ${currentLevelTitle}`}
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily="Inter_400Regular" numberOfLines={1} lineHeight={16}>
                    {isAllCompleted ? 'Congratulations on completing the curriculum.' : currentLevelDesc}
                  </Text>
                </YStack>

                {/* Right Side: Chevron */}
                <View width={28} height={28} borderRadius={14} backgroundColor={theme.backgroundElement} alignItems="center" justifyContent="center">
                  <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' } as const} size={11} tintColor={theme.textSecondary} />
                </View>
              </XStack>
              {/* Custom Stable Progress Bar (no sluggish layout animations) */}
              <View height={4} backgroundColor={`${theme.primary}15` as any} width="100%">
                <View 
                  width={`${Math.min(100, store.learningScore)}%`}
                  height="100%"
                  backgroundColor={theme.primary}
                />
              </View>
            </TouchableOpacity>
          </CbudgetCard>

          {/* ==================== 7. FINANCE ANALYTICS (HEALTH SCORE) ==================== */}
          <CbudgetCard marginBottom={24} padding={20} gap={16}>
            <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor={`${theme.border}35` as any} paddingBottom={14}>
              <YStack gap={2} flex={1}>
                <Text color={theme.text} fontSize={16} fontFamily="Inter_700Bold" letterSpacing={-0.3}>
                  Finance Analytics
                </Text>
                <Text color={theme.textSecondary} fontSize={12} fontFamily="Inter_400Regular">
                  Overall metric scoring your simulated activity.
                </Text>
              </YStack>
              <View
                width={56}
                height={56}
                borderRadius={28}
                backgroundColor={`${theme.primary}12` as any}
                alignItems="center"
                justifyContent="center"
                borderWidth={2}
                borderColor={theme.primary}
              >
                <Text color={theme.primary} fontSize={16} fontFamily="Inter_800ExtraBold">
                  {store.getFinancialHealthScore()}%
                </Text>
              </View>
            </XStack>

            <YStack gap={12}>
              {[
                { label: 'Budget Discipline', val: store.budgetingScore, color: theme.success, icon: 'chart.pie.fill', androidIcon: 'pie_chart' },
                { label: 'Savings Efficiency', val: store.savingScore, color: theme.primary, icon: 'banknote.fill', androidIcon: 'savings' },
                { label: 'Investment Efficiency', val: store.investingScore, color: '#F59E0B', icon: 'chart.line.uptrend.xyaxis', androidIcon: 'trending_up' },
                { label: 'Financial Literacy', val: store.learningScore, color: '#8B5CF6', icon: 'book.closed.fill', androidIcon: 'menu_book' },
              ].map((item) => (
                <YStack key={item.label} gap={6}>
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack gap={8} alignItems="center">
                      <SymbolView name={{ ios: item.icon, android: item.androidIcon, web: item.androidIcon } as any} size={14} tintColor={item.color as any} />
                      <Text color={theme.text} fontSize={13} fontFamily="Inter_600SemiBold">{item.label}</Text>
                    </XStack>
                    <Text color={theme.text} fontSize={13} fontFamily="Inter_700Bold">{item.val}%</Text>
                  </XStack>
                  <Progress value={item.val} height={6} backgroundColor={(`${item.color}15`) as any} borderRadius={3}>
                    <Progress.Indicator backgroundColor={item.color as any} borderRadius={3} />
                  </Progress>
                </YStack>
              ))}
            </YStack>
          </CbudgetCard>

        </ScrollView>
      </SafeAreaView>

      {/* ==================== MODALS ==================== */}
      
      {/* Daily Reward Modal */}
      <DailyRewardModal 
        visible={showDailyReward} 
        onClose={() => setShowDailyReward(false)} 
      />

      {/* Locked / Guest Account Modal */}
      <Modal
        visible={registerModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setRegisterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <YStack
            backgroundColor={theme.surface}
            borderColor={theme.border}
            borderWidth={1.5}
            borderRadius={24}
            padding={24}
            width="85%"
            maxWidth={340}
            alignItems="center"
            gap={16}
            elevation={10}
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.25}
            shadowRadius={10}
          >
            <View width={60} height={60} borderRadius={30} backgroundColor={`${theme.primary}12` as any} alignItems="center" justifyContent="center">
              <SymbolView
                name={{ ios: 'lock.fill', android: 'lock', web: 'lock' } as const}
                size={24}
                tintColor={theme.primary}
              />
            </View>

            <YStack alignItems="center" gap={6}>
              <Text color={theme.text} fontSize={17} fontFamily="Inter_700Bold" textAlign="center">
                Create a Free Account
              </Text>
              <Text color={theme.textSecondary} fontSize={12} fontFamily="Inter_400Regular" textAlign="center" lineHeight={18}>
                To unlock financial stats tracking, investment simulations, learning academy modules, and achievements, please create your profile today!
              </Text>
            </YStack>

            <YStack gap={10} width="100%" marginTop={6}>
              <Button
                backgroundColor={theme.primary}
                borderRadius={12}
                height={48}
                pressStyle={{ opacity: 0.85 }}
                onPress={async () => {
                  setRegisterModalVisible(false);
                  await logout();
                  router.replace('/(auth)/register' as Href);
                }}
              >
                <Text color="#FFFFFF" fontSize={14} fontFamily="Inter_700Bold">
                  Create Account
                </Text>
              </Button>

              <TouchableOpacity
                onPress={() => setRegisterModalVisible(false)}
                activeOpacity={0.7}
                style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text color={theme.textSecondary} fontSize={13} fontFamily="Inter_600SemiBold">
                  Continue as Guest
                </Text>
              </TouchableOpacity>
            </YStack>
          </YStack>
        </View>
      </Modal>

      {/* Avatar Picker Modal */}
      <Modal visible={showAvatarPicker} transparent={true} animationType="fade" onRequestClose={() => setShowAvatarPicker(false)}>
        <View style={styles.modalOverlay}>
          <CbudgetCard style={styles.avatarModalContainer} gap={Spacing[16]}>
            <XStack justifyContent="space-between" alignItems="center">
              <Text color={theme.text} fontSize={16} fontFamily="Inter_700Bold">
                Choose Mastery Avatar
              </Text>
              <TouchableOpacity 
                onPress={() => setShowAvatarPicker(false)}
                style={{ padding: 4 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <SymbolView
                  name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' } as const}
                  size={20}
                  tintColor={theme.textSecondary}
                />
              </TouchableOpacity>
            </XStack>

            <YStack gap={10} width="100%" marginVertical={4}>
              {['Budget Beginner', 'Smart Saver', 'Investment Explorer', 'Financial Strategist'].map((avatarName) => {
                const details = getMasteryAvatarDetails(avatarName);
                const isSelected = store.customAvatar === avatarName;
                return (
                  <TouchableOpacity
                    key={avatarName}
                    onPress={() => {
                      store.setCustomAvatar(avatarName);
                      setShowAvatarPicker(false);
                      Alert.alert('Avatar Style Saved!', `Mastery set to ${avatarName}. (+10 XP)`);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.backgroundElement,
                      borderWidth: 2,
                      borderColor: isSelected ? details.borderColor : theme.border,
                      borderStyle: details.borderStyle,
                      borderRadius: 14,
                      padding: 12,
                      gap: 12,
                      minHeight: 64,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: details.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: details.borderColor,
                        borderStyle: details.borderStyle
                      }}
                    >
                      <Text color={details.color as any} fontFamily="Inter_800ExtraBold" fontSize={13}>
                        {details.initials}
                      </Text>
                    </View>
                    
                    <YStack flex={1} gap={2}>
                      <Text color={theme.text} fontFamily="Inter_700Bold" fontSize={13}>
                        {avatarName}
                      </Text>
                      <Text color={theme.textSecondary} fontSize={10} fontFamily="Inter_400Regular" lineHeight={13}>
                        {avatarName === 'Budget Beginner' && 'Perfect path for learning cash-flow principles.'}
                        {avatarName === 'Smart Saver' && 'Optimized for high-yield savings & emergency plans.'}
                        {avatarName === 'Investment Explorer' && 'For testing asset allocations in the lab.'}
                        {avatarName === 'Financial Strategist' && 'Master of planning, compound yield, and risk control.'}
                      </Text>
                    </YStack>
                  </TouchableOpacity>
                );
              })}
            </YStack>
          </CbudgetCard>
        </View>
      </Modal>

    </YStack>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  avatarModalContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 20,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 88,
    minWidth: 70,
  },
  quickActionCircle: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#1C2541',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderLink: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderActionBtn: {
    backgroundColor: '#3EB47D',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 34,
  },
});
