import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';

import { useAuthStore } from '@/store/authStore';
import { useGamificationStore, getLocalDateString } from '@/store/gamificationStore';
import { useTheme } from '@/hooks/use-theme';
import { Fonts } from '@/constants/theme';
import { toast } from '@/store/toastStore';
import { safeHaptic as triggerHaptic } from '@/utils/haptics';

import { DailyRewardModal } from '@/components/ui/DailyRewardModal';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { MotionIcon } from '@/components/ui/MotionIcon';
import { PhosphorCategoryIcon } from '@/components/ui/PhosphorCategoryIcon';
import { DashboardMascot } from '@/components/ui/DashboardMascot';
import { EducationalPromoCard } from '@/components/ui/EducationalPromoCard';
import { InteractivePressable } from '@/components/ui/InteractivePressable';

import { BalanceHeroCard } from '@/features/dashboard/components/BalanceHeroCard';
import { QuickActionsGrid } from '@/features/dashboard/components/QuickActionsGrid';
import { BentoGoalsAndPortfolio } from '@/features/dashboard/components/BentoGoalsAndPortfolio';
import { QuickExpenseModal } from '@/features/dashboard/components/QuickExpenseModal';
import { ASSET_DATA } from '@/constants/assets';
import { useCurrency } from '@/utils/currency';

export const getMasteryAvatarDetails = (title: string) => {
  switch (title) {
    case 'Smart Saver':
      return {
        initials: 'SS',
        color: '#10B981',
        borderColor: '#10B981',
        borderStyle: 'dashed' as const,
        bg: '#0F261D',
      };
    case 'Wealth Builder':
    case 'Investment Explorer':
      return {
        initials: 'WB',
        color: '#3B82F6',
        borderColor: '#3B82F6',
        borderStyle: 'solid' as const,
        bg: '#0F1E36',
      };
    case 'Financial Sage':
    case 'Financial Strategist':
      return {
        initials: 'FS',
        color: '#F59E0B',
        borderColor: '#F59E0B',
        borderStyle: 'solid' as const,
        bg: '#261C0D',
      };
    case 'Budget Beginner':
    default:
      return {
        initials: 'BB',
        color: '#64748B',
        borderColor: '#64748B',
        borderStyle: 'solid' as const,
        bg: '#1E293B',
      };
  }
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const store = useGamificationStore();
  const user = useAuthStore((state) => state.user);
  const { symbol: currencySymbol } = useCurrency();

  useFocusEffect(
    React.useCallback(() => {
      setStatusBarStyle('light');
    }, [])
  );

  const [showDailyReward, setShowDailyReward] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [showQuickExpense, setShowQuickExpense] = useState(false);

  useEffect(() => {
    store.checkAndUpdateStreak();
  }, []);

  const handleSaveQuickExpense = (num: number, name: string, category: string) => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    store.addExpense(name, category, num, today);
    toast.success('Expense Logged! ✨', `Logged ${currencySymbol}${num.toLocaleString()} for ${name} (+15 XP)`);
  };

  // Investment calculation using verified ASSET_DATA
  const holdingsValue = Object.entries(store.portfolioAllocations).reduce(
    (acc, [ticker, qty]) => acc + (qty || 0) * (ASSET_DATA[ticker]?.price || 0),
    0
  );
  const totalSimValue = store.virtualBalance + holdingsValue;

  const totalSpent = store.loggedExpenses
    .filter((item) => item.type !== 'income')
    .reduce((sum, item) => sum + item.amount, 0);
  const currentCycle = store.budgetType || 'monthly';
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const todayISO = getLocalDateString();
  const isClaimedToday = store.lastClaimedRewardDate === todayISO;
  const todaySpent = store.loggedExpenses
    .filter((e) => e.type !== 'income' && (e.date === todayStr || e.date === todayISO))
    .reduce((sum, e) => sum + e.amount, 0);

  const displayLimit =
    store.totalBudget > 0
      ? store.totalBudget
      : currentCycle === 'daily'
      ? 150
      : currentCycle === 'weekly'
      ? 1000
      : 4000;
  const displaySpent = currentCycle === 'daily' ? todaySpent : totalSpent;
  const displayBalance = Math.max(0, displayLimit - displaySpent);

  const cardTitle =
    currentCycle === 'daily'
      ? "TODAY'S BAON"
      : currentCycle === 'weekly'
      ? "THIS WEEK'S ALLOWANCE"
      : 'CURRENT BALANCE';

  const currentLevelXP = (store.level - 1) * 100;
  const nextLevelThreshold = store.level * 100;
  const xpInCurrentLevel = Math.max(0, store.xp - currentLevelXP);
  const xpProgressRatio = Math.min(1, Math.max(0, xpInCurrentLevel / 100));

  const avatarDetails = getMasteryAvatarDetails(store.customAvatar);
  const firstName = user?.name ? user.name.split(' ')[0] : 'Explorer';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <BackgroundSystem mode="tabs" />

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* ==================== 1. FULL-BLEED TOP HEADER ==================== */}
        <View style={[styles.fullBleedHeader, { paddingTop: Math.max(insets.top, 42) + 20, paddingBottom: 28 }]}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="headerMeshGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#080C16" stopOpacity={1} />
                <Stop offset="55%" stopColor="#0F172A" stopOpacity={1} />
                <Stop offset="100%" stopColor="#111B2E" stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#headerMeshGrad)" />
            {/* Subtle atmospheric ambient glows */}
            <Circle cx="12%" cy="20%" r={100} fill="#10B981" fillOpacity={0.06} />
            <Circle cx="88%" cy="35%" r={120} fill="#3B82F6" fillOpacity={0.05} />
          </Svg>

          <View style={styles.headerRow}>
            {/* Avatar & Greetings */}
            <View style={styles.profileSection}>
              <InteractivePressable
                onPress={() => router.push('/(tabs)/profile' as Href)}
                style={styles.headerAvatarContainer}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.avatarInitials}>
                  {avatarDetails.initials}
                </Text>
              </InteractivePressable>

              <View style={styles.greetingCol}>
                <Text style={styles.greetingText}>
                  Hey {firstName} 👋
                </Text>

                <View style={styles.xpRow}>
                  <View style={styles.headerLevelBadge}>
                    <Text style={styles.headerLevelText}>
                      LVL {store.level}
                    </Text>
                  </View>
                  <View style={styles.headerXpTrack}>
                    <View style={[styles.xpFill, { width: `${xpProgressRatio * 100}%` }]} />
                  </View>
                  <Text style={styles.xpText}>
                    {store.xp}/{nextLevelThreshold} XP
                  </Text>
                </View>
              </View>
            </View>

            {/* Notification Bell */}
            <InteractivePressable
              onPress={() => toast.info('Notifications', 'You are all caught up! ✨')}
              style={styles.headerNotificationBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MotionIcon name="bell" size={19} autoPlay={true} loop={true} color="#FFFFFF" />
            </InteractivePressable>
          </View>
        </View>

        {/* ==================== 2. MASCOT & STREAK BADGE ==================== */}
        <View style={styles.mascotRow}>
          <InteractivePressable
            onPress={() => setShowDailyReward(true)}
            style={[styles.streakBadge, isClaimedToday && styles.streakBadgeChecked]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MotionIcon name="flame" size={15} autoPlay={true} loop={true} color="#F59E0B" />
            <Text style={[styles.streakText, isClaimedToday && styles.streakTextChecked]}>
              {store.streakDays}d Streak
            </Text>
            {isClaimedToday ? (
              <View style={styles.streakCheckedTag}>
                <Text style={styles.streakCheckedText}>✓</Text>
              </View>
            ) : (
              <View style={styles.streakClaimTag}>
                <Text style={styles.streakClaimText}>Claim</Text>
              </View>
            )}
          </InteractivePressable>

          <DashboardMascot onPress={() => triggerHaptic('light')} />
        </View>

        {/* ==================== 3. MODULAR CASH BALANCE HERO CARD ==================== */}
        <BalanceHeroCard
          cardTitle={cardTitle}
          isBalanceHidden={isBalanceHidden}
          onToggleBalanceHidden={() => setIsBalanceHidden(!isBalanceHidden)}
          displayBalance={displayBalance}
          displaySpent={displaySpent}
          displayLimit={displayLimit}
          onPressBudgetDetails={() => router.push('/(tabs)/budget' as Href)}
        />

        {/* ==================== 4. BALANCED QUICK ACTIONS BAR ==================== */}
        <QuickActionsGrid
          onPressLogExpense={() => setShowQuickExpense(true)}
          onPressAddSavings={() => router.push('/(tabs)/budget' as Href)}
          onPressMiniGames={() => router.push('/arcade' as any)}
          onPressLearn={() => router.push('/(tabs)/learn' as Href)}
        />

        {/* Main Body Content Sections */}
        <View style={styles.bodyContent}>
          {/* ==================== 5. BENTO GOALS & INVESTMENTS ==================== */}
          <BentoGoalsAndPortfolio
            savingsGoals={store.savingsGoals}
            totalSimValue={totalSimValue}
            virtualBalance={store.virtualBalance}
            holdingsValue={holdingsValue}
            onPressViewGoals={() => router.push('/(tabs)/budget' as Href)}
            onPressInvestArena={() => router.push('/(tabs)/invest' as Href)}
          />

          {/* ==================== 6. PROMOTIONAL / LEARNING CARD ==================== */}
          <EducationalPromoCard />

          {/* ==================== 7. SPARE CHANGE CARD ==================== */}
          {store.spareChangeAccumulated > 0 && (
            <CbudgetCard padding={16} gap={12} marginBottom={14}>
              <View style={styles.spareChangeRow}>
                <View style={styles.spareChangeLeft}>
                  <View style={styles.spareChangeTitleRow}>
                    <PhosphorIcon
                      name="Coins"
                      size={16}
                      color="#10B981"
                      weight="duotone"
                    />
                    <Text style={styles.spareChangeTitle}>
                      ACORNS SPARE CHANGE
                    </Text>
                  </View>
                  <Text style={[styles.spareChangeDesc, { color: theme.text }]}>
                    You saved <Text style={styles.boldGreen}>{currencySymbol}{store.spareChangeAccumulated}</Text> in round-ups!
                  </Text>
                </View>

                <InteractivePressable
                  onPress={() => {
                    const amount = store.spareChangeAccumulated;
                    store.sweepSpareChange();
                    toast.success(
                      '💰 Spare Change Swept!',
                      `${currencySymbol}${amount} transferred to Sandbox Cash! (+10 XP)`
                    );
                  }}
                  style={styles.sweepBtn}
                >
                  <Text style={styles.sweepBtnText}>SWEEP</Text>
                </InteractivePressable>
              </View>
            </CbudgetCard>
          )}

          {/* ==================== 8. RECENT ACTIVITY CARD ==================== */}
          <CbudgetCard marginBottom={16} padding={16} gap={12}>
            <View style={styles.activityHeader}>
              <View style={styles.activityTitleCol}>
                <Text style={[styles.activityTitle, { color: theme.text }]}>
                  Recent Activity
                </Text>
                <Text style={[styles.activitySubtitle, { color: theme.textSecondary }]}>
                  This month: <Text style={{ color: theme.text, fontFamily: Fonts.bold }}>-{currencySymbol}{totalSpent.toLocaleString()}</Text>
                </Text>
              </View>

              <InteractivePressable
                onPress={() => router.push('/(tabs)/budget' as Href)}
                style={styles.seeAllBtn}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </InteractivePressable>
            </View>

            {store.loggedExpenses.length === 0 ? (
              <View style={styles.emptyActivity}>
                <PhosphorIcon
                  name="CreditCard"
                  size={20}
                  color={theme.textSecondary}
                  weight="duotone"
                />
                <Text style={[styles.emptyActivityText, { color: theme.textSecondary }]}>
                  No transactions recorded yet.
                </Text>
              </View>
            ) : (
              <View style={styles.expenseList}>
                {store.loggedExpenses.slice(0, 4).map((exp) => (
                  <View key={exp.id} style={styles.expenseRow}>
                    <View style={styles.expenseLeft}>
                      <PhosphorCategoryIcon
                        name={exp.category}
                        size={20}
                        primaryColor={theme.mode === 'dark' ? '#1E293B' : '#0F172A'}
                        accentColor="#10B981"
                      />
                      <View style={styles.expenseMeta}>
                        <Text style={[styles.expenseName, { color: theme.text }]} numberOfLines={1}>
                          {exp.name}
                        </Text>
                        <Text style={[styles.expenseSub, { color: theme.textSecondary }]}>
                          {exp.category} • {exp.date}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.expenseAmount}>
                      -{currencySymbol}{exp.amount.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </CbudgetCard>

          <View style={{ height: 28 }} />
        </View>
      </ScrollView>

      {/* Daily Reward Modal */}
      <DailyRewardModal
        visible={showDailyReward}
        onClose={() => setShowDailyReward(false)}
      />

      {/* Modular Quick Log Expense Modal */}
      <QuickExpenseModal
        visible={showQuickExpense}
        onClose={() => setShowQuickExpense(false)}
        onSave={handleSaveQuickExpense}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  fullBleedHeader: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#080C16',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
      } as any,
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    zIndex: 2,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerAvatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.8,
    borderColor: '#34D399',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  greetingCol: {
    gap: 3,
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: Fonts.bold,
    letterSpacing: -0.3,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLevelBadge: {
    backgroundColor: '#10B981',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  headerLevelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: Fonts.bold,
    letterSpacing: 0.2,
  },
  headerXpTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2.5,
    overflow: 'hidden',
    width: 65,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 2.5,
  },
  xpText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  headerNotificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  mascotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 8,
    zIndex: 30,
  },
  streakBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)',
      } as any,
    }),
  },
  streakText: {
    color: '#F59E0B',
    fontSize: 11.5,
    fontFamily: Fonts.bold,
  },
  streakBadgeChecked: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  streakTextChecked: {
    color: '#34D399',
  },
  streakCheckedTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginLeft: 2,
  },
  streakCheckedText: {
    color: '#34D399',
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  streakClaimTag: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginLeft: 2,
  },
  streakClaimText: {
    color: '#0B132B',
    fontSize: 9.5,
    fontFamily: Fonts.bold,
    letterSpacing: 0.3,
  },
  bodyContent: {
    paddingTop: 16,
  },
  spareChangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spareChangeLeft: {
    flex: 1,
    gap: 2,
  },
  spareChangeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spareChangeTitle: {
    color: '#10B981',
    fontSize: 11,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  spareChangeDesc: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    marginTop: 4,
  },
  boldGreen: {
    color: '#10B981',
    fontFamily: Fonts.bold,
  },
  sweepBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  sweepBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitleCol: {
    gap: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    letterSpacing: -0.2,
  },
  activitySubtitle: {
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  seeAllBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  seeAllText: {
    color: '#10B981',
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  emptyActivityText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  expenseList: {
    gap: 10,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  expenseLeft: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flex: 1,
  },
  expenseMeta: {
    gap: 1,
    flex: 1,
  },
  expenseName: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  expenseSub: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  expenseAmount: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
});
