import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';

import { useAuthStore } from '@/store/authStore';
import { useGamificationStore, getLocalDateString, getCycleMetrics } from '@/store/gamificationStore';
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
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const { symbol: currencySymbol } = useCurrency();

  useFocusEffect(
    React.useCallback(() => {
      setStatusBarStyle(theme.mode === 'dark' ? 'light' : 'dark');
    }, [theme.mode])
  );

  const [showDailyReward, setShowDailyReward] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [showQuickExpense, setShowQuickExpense] = useState(false);

  const hasAutoPromptedReward = useRef(false);
  const lastPromptedUserId = useRef<string | null>(null);
  const currentUserId = user?.id || 'guest';

  useEffect(() => {
    store.checkAndUpdateStreak();
  }, []);

  // Reset auto-prompt when user changes (e.g. login, logout, switch account)
  useEffect(() => {
    if (lastPromptedUserId.current !== currentUserId) {
      hasAutoPromptedReward.current = false;
      lastPromptedUserId.current = currentUserId;
    }
  }, [currentUserId]);

  // Automatically pop up Daily Sign-In Reward if not yet claimed today
  useEffect(() => {
    if (isAuthLoading) return;
    const today = getLocalDateString();
    if (!hasAutoPromptedReward.current && store.lastClaimedRewardDate !== today) {
      hasAutoPromptedReward.current = true;
      const timer = setTimeout(() => {
        setShowDailyReward(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isAuthLoading, store.lastClaimedRewardDate]);

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

  const currentCycle = store.budgetType || 'monthly';
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const todayISO = getLocalDateString();
  const isClaimedToday = store.lastClaimedRewardDate === todayISO;

  const cycleMetrics = useMemo(
    () => getCycleMetrics(store),
    [store.totalBudget, store.budgetType, store.loggedExpenses]
  );
  const displayLimit = cycleMetrics.limit;
  const displaySpent = cycleMetrics.spent;
  const displayBalance = cycleMetrics.balance;

  const totalSpent = useMemo(
    () =>
      store.loggedExpenses
        .filter((item) => item.type !== 'income')
        .reduce((sum, item) => sum + item.amount, 0),
    [store.loggedExpenses]
  );

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

  const firstName = user?.name ? user.name.split(' ')[0] : 'Explorer';

  // Compute initials fallback from user name
  const getInitials = (name: string) => {
    if (!name) return 'EX';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <BackgroundSystem mode="tabs" />

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* ==================== 1. CLEAN TRANSPARENT TOP HEADER ==================== */}
        <View style={[styles.cleanHeader, { paddingTop: Math.max(insets.top, 16) + 10, paddingBottom: 6 }]}>
          <View style={styles.headerRow}>
            {/* Avatar & Greetings */}
            <View style={styles.profileSection}>
              <InteractivePressable
                onPress={() => router.push('/(tabs)/profile' as Href)}
                style={[
                  styles.headerAvatarContainer,
                  {
                    backgroundColor: user?.avatarColor || theme.primary,
                    borderColor: theme.mode === 'dark' ? theme.border : '#FFFFFF',
                  },
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {user?.avatarEmoji ? (
                  <Text style={styles.avatarEmoji}>{user.avatarEmoji}</Text>
                ) : (
                  <Text style={styles.avatarInitials}>
                    {getInitials(user?.name || '')}
                  </Text>
                )}
              </InteractivePressable>

              <View style={styles.greetingCol}>
                <Text style={[styles.greetingText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                  Hey {firstName} 👋
                </Text>

                <View style={styles.xpRow}>
                  <View style={styles.headerLevelBadge}>
                    <Text style={styles.headerLevelText} numberOfLines={1}>
                      LVL {store.level}
                    </Text>
                  </View>
                  <View style={[styles.headerXpTrack, { backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)' }]}>
                    <View style={[styles.xpFill, { width: `${xpProgressRatio * 100}%` }]} />
                  </View>
                  <Text style={[styles.xpText, { color: theme.textSecondary }]} numberOfLines={1}>
                    {store.xp}/{nextLevelThreshold} XP
                  </Text>
                </View>
              </View>
            </View>

            {/* Notification Bell */}
            <InteractivePressable
              onPress={() => toast.info('Notifications', 'You are all caught up! ✨')}
              style={[
                styles.headerNotificationBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MotionIcon name="bell" size={19} autoPlay={true} loop={true} color={theme.text} />
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
            <MotionIcon
              name="flame"
              size={17}
              autoPlay={true}
              loop={true}
              color={isClaimedToday ? '#34D399' : '#FB923C'}
            />
            <Text style={[styles.streakText, isClaimedToday && styles.streakTextChecked]}>
              {store.streakDays}d Streak
            </Text>
            {isClaimedToday && (
              <View style={styles.streakCheckedTag}>
                <PhosphorIcon name="Check" size={11} color="#34D399" weight="bold" />
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
          onPressAddSavings={() =>
            router.push({
              pathname: '/(tabs)/budget',
              params: { action: 'savings', t: Date.now().toString() },
            } as any)
          }
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
            onPressViewGoals={() =>
              router.push({
                pathname: '/(tabs)/budget',
                params: { tab: 'savings', t: Date.now().toString() },
              } as any)
            }
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
                          {exp.category}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 1 }}>
                      <Text style={[styles.expenseAmount, { color: exp.type === 'income' ? '#10B981' : '#EF4444' }]}>
                        {exp.type === 'income' ? '+' : '-'}{currencySymbol}{exp.amount.toLocaleString()}
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary, fontFamily: Fonts.medium }}>
                        {exp.date}
                      </Text>
                      {exp.time ? (
                        <Text style={{ fontSize: 9.5, color: theme.textSecondary, opacity: 0.8, fontFamily: Fonts.regular }}>
                          {exp.time}
                        </Text>
                      ) : null}
                    </View>
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
  cleanHeader: {
    width: '100%',
    paddingHorizontal: 18,
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  headerAvatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
      } as any,
    }),
  },
  avatarEmoji: {
    fontSize: 21,
    lineHeight: 25,
    textAlign: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
    letterSpacing: 0.2,
  },
  greetingCol: {
    gap: 3,
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    letterSpacing: -0.5,
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
    borderRadius: 2.5,
    overflow: 'hidden',
    width: 65,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2.5,
  },
  xpText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  headerNotificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
      } as any,
    }),
  },
  mascotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 6,
    zIndex: 30,
  },
  streakBadge: {
    backgroundColor: '#F97316',
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 0,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 14px rgba(234, 88, 12, 0.45)',
      } as any,
    }),
  },
  streakText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: Fonts.bold,
    letterSpacing: -0.2,
  },
  streakBadgeChecked: {
    backgroundColor: '#059669',
    ...Platform.select({
      ios: {
        shadowColor: '#047857',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 14px rgba(4, 120, 87, 0.45)',
      } as any,
    }),
  },
  streakTextChecked: {
    color: '#FFFFFF',
  },
  streakCheckedTag: {
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 1,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakCheckedText: {
    color: '#34D399',
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  streakClaimTag: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 6px rgba(234, 88, 12, 0.5)' } as any,
    }),
  },
  streakClaimText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Fonts.bold,
    letterSpacing: 0.4,
  },
  bodyContent: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  spareChangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spareChangeLeft: {
    flex: 1,
    gap: 2,
    marginRight: 8,
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
    flexShrink: 0,
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
    flex: 1,
    marginRight: 8,
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
    flexShrink: 0,
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
