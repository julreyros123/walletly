import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Alert, Modal, TouchableOpacity, TextInput, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, XStack, Text as TamaguiText, Button, Progress, View } from 'tamagui';
const Text = (props: any) => <TamaguiText {...props} />;
import { useTheme } from '@/hooks/use-theme';
import { PhosphorIcon, PhosphorIconName } from '@/components/ui/PhosphorIcon';
import { useGamificationStore } from '@/store/gamificationStore';
import type { Expense, SavingsGoal } from '@/store/gamificationStore';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { Spacing, Fonts } from '@/constants/theme';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { AnimatedSegmentSwitch } from '@/components/ui/AnimatedSegmentSwitch';
import { useAuthStore } from '@/store/authStore';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import Svg, { Circle, G, Defs, LinearGradient, Stop, Path, Rect } from 'react-native-svg';
import { safeHaptic } from '@/utils/haptics';
import { PhosphorCategoryIcon } from '@/components/ui/PhosphorCategoryIcon';
import { useCurrency } from '@/utils/currency';

// Map categories to Phosphor Icon Names
const CATEGORY_ICONS: Record<string, PhosphorIconName> = {
  Food: 'ForkKnife',
  Transportation: 'Car',
  School: 'GraduationCap',
  Bills: 'Receipt',
  Shopping: 'ShoppingBag',
  Entertainment: 'GameController',
  Savings: 'PiggyBank',
  'Emergency Fund': 'ShieldCheck',
  Custom: 'Question',
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#F59E0B', // Amber
  Transportation: '#3B82F6', // Blue
  School: '#8B5CF6', // Purple
  Bills: '#EF4444', // Red
  Shopping: '#EC4899', // Pink
  Entertainment: '#10B981', // Emerald
  Savings: '#06B6D4', // Cyan
  'Emergency Fund': '#6366F1', // Indigo
  Custom: '#64748B', // Slate
};

const SAVINGS_CATEGORY_ICONS: Record<string, PhosphorIconName> = {
  'Emergency Fund': 'ShieldCheck',
  'New Laptop': 'Laptop',
  'School Tuition': 'GraduationCap',
  'Travel Fund': 'AirplaneTilt',
  'Phone Upgrade': 'DeviceMobile',
  'Business Capital': 'Briefcase',
  Custom: 'Star',
};

export default function BudgetScreen() {
  const theme = useTheme() as any;
  const insets = useSafeAreaInsets();
  const store = useGamificationStore();
  const { user } = useAuthStore();
  const isGuest = user?.id === 'guest';

  useFocusEffect(
    React.useCallback(() => {
      setStatusBarStyle(theme.mode === 'dark' ? 'light' : 'dark');
    }, [theme.mode])
  );

  const params = useLocalSearchParams<{ action?: string }>();
  const { currency: currencyCode, symbol: currencySymbol } = useCurrency();

  useEffect(() => {
    if (params.action === 'log') {
      setShowExpenseForm(true);
    } else if (params.action === 'savings') {
      setActiveTab('savings');
      setShowAddGoalModal(true);
    }
  }, [params.action]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'budget' | 'calendar' | 'savings'>('budget');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'overspent' | 'inbudget'>('all');
  const [activityFilter, setActivityFilter] = useState<'all' | 'expenses' | 'income'>('all');

  // Calendar & Date Explorer State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeSelectedDay, setActiveSelectedDay] = useState<string | null>(null); // YYYY-MM-DD or null for all month

  // Add Expense/Income Form local states
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Edit Expense Modal states
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseName, setEditExpenseName] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editExpenseCategory, setEditExpenseCategory] = useState('Food');
  const [editExpenseNotes, setEditExpenseNotes] = useState('');

  // Add Savings Goal Modal states
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCategory, setGoalCategory] = useState('Emergency Fund');
  const [goalTargetDate, setGoalTargetDate] = useState('120');

  // Contribute & Withdraw Savings Modal states
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [withdrawGoalId, setWithdrawGoalId] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedCategoryBreakdown, setSelectedCategoryBreakdown] = useState<string | null>(null);

  // Allowance Cycle & Edit Modal states
  const currentCycle = store.budgetType || 'monthly';
  const [showEditAllowanceModal, setShowEditAllowanceModal] = useState(false);
  const [allowanceAmountInput, setAllowanceAmountInput] = useState('');

  // Accounts Balance expansion
  const [isAccountsExpanded, setIsAccountsExpanded] = useState(false);

  // Derived calculations
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const todayISO = new Date().toISOString().split('T')[0];
  const todaySpent = store.loggedExpenses
    .filter((e) => e.type !== 'income' && (e.date === todayStr || e.date === todayISO))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSpent = store.loggedExpenses
    .filter((e) => e.type !== 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalSavingsContribution = store.savingsGoals.reduce((sum, g) => sum + g.currentSavings, 0);
  const budgetRemaining = Math.max(0, store.totalBudget - totalSpent);
  const budgetLeftover = Math.max(0, budgetRemaining - totalSavingsContribution - store.virtualBalance);
  const totalNetWorth = budgetRemaining + store.virtualBalance + totalSavingsContribution;

  // Dynamic budget metrics based on cycle
  const effectiveBudget = store.totalBudget > 0 ? store.totalBudget : (currentCycle === 'daily' ? 150 : currentCycle === 'weekly' ? 1000 : 4000);
  const effectiveSpent = currentCycle === 'daily' ? todaySpent : totalSpent;
  const effectiveRemaining = Math.max(0, effectiveBudget - effectiveSpent);
  const spendRatio = effectiveBudget > 0 ? Math.min(1, effectiveSpent / effectiveBudget) : 0;
  const spendPercentage = Math.round(spendRatio * 100);

  // Month navigation helpers
  const currentMonthName = selectedDate.toLocaleDateString('en-US', { month: 'long' });
  const currentYear = selectedDate.getFullYear();

  const handlePrevMonth = () => {
    safeHaptic('light');
    const newD = new Date(selectedDate);
    newD.setMonth(newD.getMonth() - 1);
    setSelectedDate(newD);
    setActiveSelectedDay(null);
  };

  const handleNextMonth = () => {
    safeHaptic('light');
    const newD = new Date(selectedDate);
    newD.setMonth(newD.getMonth() + 1);
    setSelectedDate(newD);
    setActiveSelectedDay(null);
  };

  // Generate days in month for the interactive Calendar Strip
  const daysInCurrentMonth = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysCount = new Date(year, month + 1, 0).getDate();
    const daysArr: { dateStr: string; dayNum: number; dayName: string; hasPurchases: boolean }[] = [];

    for (let d = 1; d <= daysCount; d++) {
      const dateObj = new Date(year, month, d);
      const yyyy = year;
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      // Check if there are expenses on this date
      const shortStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const hasPurchases = store.loggedExpenses.some((e) => e.date === dateStr || e.date === shortStr);

      daysArr.push({ dateStr, dayNum: d, dayName, hasPurchases });
    }
    return daysArr;
  }, [selectedDate, store.loggedExpenses]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { dateLabel: string; dateSub: string; expenses: Expense[]; total: number }[] = [];

    // Filter by category or activeSelectedDay
    let filtered = [...store.loggedExpenses];
    if (activeSelectedDay) {
      const targetObj = new Date(activeSelectedDay);
      const shortStr = targetObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      filtered = filtered.filter((e) => e.date === activeSelectedDay || e.date === shortStr);
    }

    // Filter by activity type
    if (activityFilter === 'expenses') {
      filtered = filtered.filter((e) => e.type !== 'income');
    } else if (activityFilter === 'income') {
      filtered = filtered.filter((e) => e.type === 'income');
    }

    // Sort by id / date descending
    filtered.reverse();

    filtered.forEach((exp) => {
      const dateKey = exp.date || 'Today';
      let existing = groups.find((g) => g.dateLabel === dateKey || g.dateSub === dateKey);

      if (!existing) {
        // Parse date for clean header like "Tuesday, Jun 10"
        let label = 'Tuesday';
        let sub = exp.date;
        try {
          const parsed = new Date(exp.date);
          if (!isNaN(parsed.getTime())) {
            label = parsed.toLocaleDateString('en-US', { weekday: 'long' });
            sub = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } else {
            label = exp.date;
          }
        } catch (e) {}

        existing = { dateLabel: label, dateSub: sub, expenses: [], total: 0 };
        groups.push(existing);
      }

      existing.expenses.push(exp);
      existing.total += exp.amount;
    });

    return groups;
  }, [store.loggedExpenses, activeSelectedDay, activityFilter]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return store.selectedCategories.filter((cat) => {
      const spent = store.loggedExpenses
        .filter((e) => e.type !== 'income' && e.category === cat)
        .reduce((s, e) => s + e.amount, 0);
      const limit = store.categoryLimits?.[cat] || store.totalBudget / (store.selectedCategories.length || 1);
      if (categoryFilter === 'overspent') return spent > limit;
      if (categoryFilter === 'inbudget') return spent <= limit;
      return true;
    });
  }, [store.selectedCategories, store.loggedExpenses, store.categoryLimits, categoryFilter]);

  // Handlers
  const handleLogExpense = () => {
    safeHaptic('medium');
    const amt = parseFloat(expenseAmount);
    if (!expenseCategory) {
      Alert.alert('Missing Field', 'Please select a category.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (transactionType === 'income') {
      const finalIncomeName = expenseName.trim() || `${expenseCategory} Income`;
      store.addIncome(finalIncomeName, expenseCategory, amt, todayStr, expenseNotes.trim());
      Alert.alert('Income Logged!', `Simulated income of ${currencySymbol}${amt.toLocaleString()} recorded.`);
    } else {
      const finalExpenseName = expenseName.trim() || `${expenseCategory} Purchase`;
      store.addExpense(finalExpenseName, expenseCategory, amt, todayStr, expenseNotes.trim());
      Alert.alert('Expense Logged!', `Simulated purchase of ${currencySymbol}${amt.toLocaleString()} recorded.${isGuest ? '' : ' (+10 XP)'}`);
    }

    setExpenseName('');
    setExpenseAmount('');
    setExpenseNotes('');
    setShowExpenseForm(false);
  };

  const handleOpenEditExpense = (exp: Expense) => {
    safeHaptic('light');
    setEditingExpenseId(exp.id);
    setEditExpenseName(exp.name);
    setEditExpenseAmount(exp.amount.toString());
    setEditExpenseCategory(exp.category);
    setEditExpenseNotes(exp.notes || '');
    setShowEditExpenseModal(true);
  };

  const handleSaveEditExpense = () => {
    safeHaptic('medium');
    const amt = parseFloat(editExpenseAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (editingExpenseId) {
      store.editExpense(editingExpenseId, {
        name: editExpenseName.trim() || 'Updated Transaction',
        amount: amt,
        category: editExpenseCategory,
        notes: editExpenseNotes.trim(),
      });
      setShowEditExpenseModal(false);
      setEditingExpenseId(null);
      Alert.alert('Updated', 'Transaction updated successfully.');
    }
  };

  const handleAddGoal = () => {
    safeHaptic('medium');
    const target = parseFloat(goalTargetAmount);
    if (!goalName.trim()) {
      Alert.alert('Missing Field', 'Please enter a goal name.');
      return;
    }
    if (isNaN(target) || target <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid target amount.');
      return;
    }

    store.addSavingsGoal(goalName.trim(), target, goalTargetDate, goalCategory);
    setGoalName('');
    setGoalTargetAmount('');
    setGoalCategory('Emergency Fund');
    setShowAddGoalModal(false);
    Alert.alert('Goal Created!', `Savings goal "${goalName.trim()}" created.`);
  };

  const handleContributeSavings = () => {
    safeHaptic('success');
    const amt = parseFloat(contributeAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid contribution amount.');
      return;
    }
    if (amt > budgetLeftover) {
      Alert.alert('Insufficient Balance', `You only have ${currencySymbol}${budgetLeftover.toLocaleString()} available.`);
      return;
    }
    if (contributeGoalId) {
      store.contributeToSavingsGoal(contributeGoalId, amt);
      setContributeGoalId(null);
      setContributeAmount('');
      Alert.alert('Contributed!', `${currencySymbol}${amt.toLocaleString()} added to savings goal.`);
    }
  };

  const handleWithdrawSavings = () => {
    safeHaptic('medium');
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }
    if (withdrawGoalId) {
      const success = store.withdrawSavingsGoal(withdrawGoalId, amt);
      if (success) {
        setWithdrawGoalId(null);
        setWithdrawAmount('');
        Alert.alert('Withdrawn', `${currencySymbol}${amt.toLocaleString()} withdrawn from savings goal.`);
      } else {
        Alert.alert('Error', 'Insufficient savings in this goal to withdraw that amount.');
      }
    }
  };

  // Radial Ring Dimensions
  const radius = 56;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - spendRatio * circumference;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <BackgroundSystem />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* ==================== EXECUTIVE TOP SCREEN HEADER ==================== */}
        <View style={styles.topHeaderBar}>
          <YStack gap={2}>
            <Text color={theme.text} fontSize={22} fontFamily={Fonts.bold} letterSpacing={-0.4}>
              Budget & Baon
            </Text>
            <Text color={theme.textSecondary} fontSize={11.5} fontFamily={Fonts.medium}>
              {currencyCode} ({currencySymbol}) • Smart Guard
            </Text>
          </YStack>

          {/* Month / Status Pill */}
          <View style={[styles.topStatusPill, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#FFFFFF' : '#131D31' }]}>
            <View width={7} height={7} borderRadius={3.5} backgroundColor="#10B981" />
            <Text color={theme.text} fontSize={12} fontFamily={Fonts.bold}>
              {currentMonthName} {currentYear}
            </Text>
          </View>
        </View>

        {/* ==================== SEGMENTED TOP SWITCHER (SINGLE CAPSULE TRACK) ==================== */}
        <View style={styles.capsuleTrackWrapper}>
          <AnimatedSegmentSwitch<'budget' | 'calendar' | 'savings'>
            options={[
              { id: 'budget', label: 'Budget' },
              { id: 'calendar', label: 'Calendar' },
              { id: 'savings', label: 'Goals' },
            ]}
            activeId={activeTab}
            onChange={(tab) => setActiveTab(tab)}
            height={40}
          />
        </View>

        {/* ==================== ALLOWANCE CYCLE SELECTOR (SINGLE CAPSULE ROW) ==================== */}
        {activeTab === 'budget' && (
          <View style={styles.allowanceTrackWrapper}>
            <XStack gap={8} alignItems="center">
              <View flex={1}>
                <AnimatedSegmentSwitch<'daily' | 'weekly' | 'monthly'>
                  options={[
                    { id: 'daily', label: 'Daily Baon' },
                    { id: 'weekly', label: 'Weekly' },
                    { id: 'monthly', label: 'Monthly' },
                  ]}
                  activeId={currentCycle}
                  onChange={(cycle) => store.setBudgetType(cycle as any)}
                  height={36}
                  fontSize={12}
                />
              </View>
              <TouchableOpacity
                onPress={() => {
                  safeHaptic('light');
                  setAllowanceAmountInput(effectiveBudget.toString());
                  setShowEditAllowanceModal(true);
                }}
                style={styles.allowanceEditBtn}
                activeOpacity={0.8}
              >
                <Text color="#10B981" fontSize={11.5} fontFamily={Fonts.bold}>
                  Set {currencySymbol}
                </Text>
              </TouchableOpacity>
            </XStack>
          </View>
        )}

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ========================================================================= */}
          {/* TAB 1: BUDGET OVERVIEW (Radial Gauge Hero Dashboard)                      */}
          {/* ========================================================================= */}
          {activeTab === 'budget' && (
            <YStack gap={16}>

              {/* Modern Fintech Hero Budget Card */}
              <View style={styles.premiumHeroCard}>
                <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                  <Defs>
                    <LinearGradient id="budgetHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#042F24" stopOpacity={1} />
                      <Stop offset="50%" stopColor="#064E3B" stopOpacity={1} />
                      <Stop offset="100%" stopColor="#0B1E28" stopOpacity={1} />
                    </LinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" rx={20} fill="url(#budgetHeroGrad)" />
                </Svg>

                <YStack padding={20} gap={16} zIndex={2}>
                  {/* Top Header Row: Cycle Overline + Edit Allowance Pill */}
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack gap={3}>
                      <Text color="#A7F3D0" fontSize={11} fontFamily={Fonts.bold} letterSpacing={0.8} textTransform="uppercase">
                        {currentCycle === 'daily'
                          ? "TODAY'S BAON REMAINING"
                          : currentCycle === 'weekly'
                          ? 'WEEKLY ALLOWANCE REMAINING'
                          : 'MONTHLY BUDGET REMAINING'}
                      </Text>
                      <XStack alignItems="baseline" gap={4}>
                        <Text color="#D1FAE5" fontSize={22} fontFamily={Fonts.bold}>{currencySymbol}</Text>
                        <Text color="#FFFFFF" fontSize={32} fontFamily={Fonts.extraBold} letterSpacing={-0.8}>
                          {effectiveRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </XStack>
                    </YStack>

                    <TouchableOpacity
                      onPress={() => {
                        safeHaptic('light');
                        setAllowanceAmountInput(effectiveBudget.toString());
                        setShowEditAllowanceModal(true);
                      }}
                      style={styles.heroEditBtn}
                      activeOpacity={0.8}
                    >
                      <PhosphorIcon
                        name="Pencil"
                        size={12}
                        color="#FFFFFF"
                      />
                      <Text color="#FFFFFF" fontSize={11} fontFamily={Fonts.bold}>
                        Set Limit
                      </Text>
                    </TouchableOpacity>
                  </XStack>

                  {/* Horizontal Spend Progress Meter */}
                  <YStack gap={6}>
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text color="rgba(255, 255, 255, 0.85)" fontSize={11} fontFamily={Fonts.medium}>
                        Spent {currencySymbol}{effectiveSpent.toLocaleString()} of {currencySymbol}{effectiveBudget.toLocaleString()}
                      </Text>
                      <Text color={effectiveSpent > effectiveBudget ? '#EF4444' : '#A7F3D0'} fontSize={11} fontFamily={Fonts.bold}>
                        {effectiveSpent > effectiveBudget ? 'OVER LIMIT' : `${100 - spendPercentage}% remaining`}
                      </Text>
                    </XStack>
                    <View style={styles.budgetHeroProgressTrack}>
                      <View
                        style={[
                          styles.budgetHeroProgressFill,
                          {
                            width: `${Math.min(100, spendPercentage)}%`,
                            backgroundColor: effectiveSpent > effectiveBudget ? '#EF4444' : '#34D399',
                          },
                        ]}
                      />
                    </View>
                  </YStack>

                  {/* 3 Balanced Bottom Metric Stats with Native Symbols */}
                  <XStack justifyContent="space-between" alignItems="center" paddingTop={6} borderTopWidth={1} borderTopColor="rgba(255, 255, 255, 0.1)">
                    {/* Limit */}
                    <XStack alignItems="center" gap={8} flex={1}>
                      <View style={styles.metricCircleBadge}>
                        <PhosphorIcon
                          name="Banknote"
                          size={15}
                          color="#34D399"
                        />
                      </View>
                      <YStack gap={1}>
                        <Text color="rgba(255, 255, 255, 0.65)" fontSize={9.5} fontFamily={Fonts.bold} letterSpacing={0.5}>
                          LIMIT
                        </Text>
                        <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                          {currencySymbol}{effectiveBudget.toLocaleString()}
                        </Text>
                      </YStack>
                    </XStack>

                    {/* Spent */}
                    <XStack alignItems="center" gap={8} flex={1} justifyContent="center">
                      <View style={styles.metricCircleBadge}>
                        <PhosphorIcon
                          name="CreditCard"
                          size={15}
                          color="#FB7185"
                        />
                      </View>
                      <YStack gap={1}>
                        <Text color="rgba(255, 255, 255, 0.65)" fontSize={9.5} fontFamily={Fonts.bold} letterSpacing={0.5}>
                          SPENT
                        </Text>
                        <Text color="#FB7185" fontSize={13.5} fontFamily={Fonts.bold}>
                          {currencySymbol}{effectiveSpent.toLocaleString()}
                        </Text>
                      </YStack>
                    </XStack>

                    {/* Buffer / Saved */}
                    <XStack alignItems="center" gap={8} flex={1} justifyContent="flex-end">
                      <View style={styles.metricCircleBadge}>
                        <PhosphorIcon
                          name="ShieldCheck"
                          size={15}
                          color="#FBBF24"
                        />
                      </View>
                      <YStack gap={1}>
                        <Text color="rgba(255, 255, 255, 0.65)" fontSize={9.5} fontFamily={Fonts.bold} letterSpacing={0.5}>
                          {currentCycle === 'daily' ? 'BUFFER' : 'LEFT'}
                        </Text>
                        <Text color="#FBBF24" fontSize={13.5} fontFamily={Fonts.bold}>
                          {currencySymbol}{effectiveRemaining.toLocaleString()}
                        </Text>
                      </YStack>
                    </XStack>
                  </XStack>
                </YStack>
              </View>

              {/* 3. Category Budgets Section with Filter Chips */}
              <YStack gap={12}>
                <Text color={theme.text} fontSize={18} fontFamily={Fonts.bold} letterSpacing={-0.3}>
                  Budgets
                </Text>

                {/* Filter Chips: All, Overspent, In budget */}
                <XStack gap={8}>
                  {(['all', 'overspent', 'inbudget'] as const).map((mode) => {
                    const isActive = categoryFilter === mode;
                    const labels = { all: 'All', overspent: 'Overspent', inbudget: 'In budget' };
                    return (
                      <TouchableOpacity
                        key={mode}
                        onPress={() => {
                          safeHaptic('light');
                          setCategoryFilter(mode);
                        }}
                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                        activeOpacity={0.7}
                      >
                        <Text color={isActive ? '#FFFFFF' : theme.textSecondary} fontSize={12} fontFamily={Fonts.bold}>
                          {labels[mode]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </XStack>

                {/* Category Item Cards */}
                <YStack gap={10}>
                  {filteredCategories.map((cat) => {
                    const spent = store.loggedExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
                    const limit = store.categoryLimits?.[cat] || store.totalBudget / (store.selectedCategories.length || 1);
                    const ratio = limit > 0 ? spent / limit : 0;
                    const isOver = spent > limit;
                    const catColor = CATEGORY_COLORS[cat] || '#64748B';
                    
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setSelectedCategoryBreakdown(cat)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.categoryCard, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#FFFFFF' : '#131D31' }, isOver && styles.categoryCardOver]}>
                          <XStack justifyContent="space-between" alignItems="center">
                            <XStack alignItems="center" gap={12}>
                              <PhosphorCategoryIcon
                                name={cat}
                                size={26}
                                primaryColor={theme.mode === 'dark' ? '#1E293B' : '#0F172A'}
                                accentColor="#10B981"
                              />
                              <YStack gap={2}>
                                <Text color={theme.text} fontSize={14.5} fontFamily={Fonts.bold}>
                                  {cat}
                                </Text>
                                <Text color={theme.textSecondary} fontSize={11} fontFamily={Fonts.medium}>
                                  {currencySymbol}{spent.toLocaleString()} / {currencySymbol}{limit.toLocaleString()}
                                </Text>
                              </YStack>
                            </XStack>

                            <View style={[styles.badgePill, isOver ? styles.badgePillOver : styles.badgePillOk]}>
                              <Text color={isOver ? '#EF4444' : '#10B981'} fontSize={11} fontFamily={Fonts.bold}>
                                {isOver ? 'OVER' : `${Math.round(ratio * 100)}%`}
                              </Text>
                            </View>
                          </XStack>

                          {/* Progress Meter Bar */}
                          <View style={[styles.catProgressBg, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#E2E8F0' : '#1E293B' }]}>
                            <View
                              style={[
                                styles.catProgressBar,
                                {
                                  width: `${Math.min(100, ratio * 100)}%`,
                                  backgroundColor: isOver ? '#EF4444' : catColor,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </YStack>

                {/* Primary Main Emerald Log Purchase Button */}
                <TouchableOpacity
                  onPress={() => {
                    safeHaptic('medium');
                    setShowExpenseForm(true);
                  }}
                  style={styles.mainLogPurchaseBtn}
                  activeOpacity={0.85}
                >
                  <XStack alignItems="center" justifyContent="center" gap={8}>
                    <PhosphorIcon
                      name="Plus"
                      size={18}
                      color="#FFFFFF"
                      weight="bold"
                    />
                    <Text color="#FFFFFF" fontSize={15} fontFamily={Fonts.bold}>
                      Log Purchase
                    </Text>
                  </XStack>
                </TouchableOpacity>
              </YStack>
            </YStack>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CALENDAR & ACTIVITY (Matching Right Screen of Reference)           */}
          {/* ========================================================================= */}
          {activeTab === 'calendar' && (
            <YStack gap={16}>
              {/* 1. Month Selector Bar */}
              <View style={[styles.monthSelectorBar, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#FFFFFF' : '#131D31' }]}>
                <TouchableOpacity onPress={handlePrevMonth} style={[styles.monthArrowBtn, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#F1F5F9' : '#1E293B' }]} activeOpacity={0.7}>
                  <PhosphorIcon name="CaretLeft" size={16} color={theme.text} />
                </TouchableOpacity>

                <YStack alignItems="center" gap={2}>
                  <Text color={theme.text} fontSize={17} fontFamily={Fonts.bold}>
                    {currentMonthName}
                  </Text>
                  <Text color={theme.textSecondary} fontSize={11} fontFamily={Fonts.medium}>
                    {currentYear}
                  </Text>
                </YStack>

                <TouchableOpacity onPress={handleNextMonth} style={[styles.monthArrowBtn, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#F1F5F9' : '#1E293B' }]} activeOpacity={0.7}>
                  <PhosphorIcon name="CaretRight" size={16} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* 2. Interactive Horizontal Calendar Day Strip */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarStrip}>
                {/* "All Days" pill button */}
                <TouchableOpacity
                  onPress={() => {
                    safeHaptic('light');
                    setActiveSelectedDay(null);
                  }}
                  style={[styles.dayStripItem, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#FFFFFF' : '#131D31' }, activeSelectedDay === null && styles.dayStripItemActive]}
                  activeOpacity={0.75}
                >
                  <Text color={activeSelectedDay === null ? '#FFFFFF' : theme.textSecondary} fontSize={10} fontFamily={Fonts.bold}>
                    ALL
                  </Text>
                  <Text color={activeSelectedDay === null ? '#FFFFFF' : theme.text} fontSize={14} fontFamily={Fonts.bold}>
                    Mo
                  </Text>
                </TouchableOpacity>

                {daysInCurrentMonth.map((d) => {
                  const isSelected = activeSelectedDay === d.dateStr;
                  return (
                    <TouchableOpacity
                      key={d.dateStr}
                      onPress={() => {
                        safeHaptic('light');
                        setActiveSelectedDay(isSelected ? null : d.dateStr);
                      }}
                      style={[styles.dayStripItem, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#FFFFFF' : '#131D31' }, isSelected && styles.dayStripItemActive]}
                      activeOpacity={0.75}
                    >
                      <Text color={isSelected ? '#FFFFFF' : theme.textSecondary} fontSize={10} fontFamily={Fonts.medium}>
                        {d.dayName}
                      </Text>
                      <Text color={isSelected ? '#FFFFFF' : theme.text} fontSize={14} fontFamily={Fonts.bold}>
                        {d.dayNum}
                      </Text>
                      {d.hasPurchases && (
                        <View style={[styles.dayDot, isSelected && { backgroundColor: '#FFFFFF' }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 3. Transaction Filter Chips */}
              <XStack gap={8}>
                {(['all', 'expenses', 'income'] as const).map((filter) => {
                  const isActive = activityFilter === filter;
                  const labels = { all: 'All', expenses: 'Expenses', income: 'Income' };
                  return (
                    <TouchableOpacity
                      key={filter}
                      onPress={() => {
                        safeHaptic('light');
                        setActivityFilter(filter);
                      }}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      activeOpacity={0.7}
                    >
                      <Text color={isActive ? '#FFFFFF' : theme.textSecondary} fontSize={12} fontFamily={Fonts.bold}>
                        {labels[filter]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </XStack>

              {/* 4. Grouped Daily Purchase History Cards */}
              <YStack gap={14}>
                {groupedTransactions.length === 0 ? (
                  <View style={[styles.emptyStateBox, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#FFFFFF' : '#131D31' }]}>
                    <PhosphorIcon
                      name="CalendarX"
                      size={32}
                      color={theme.textSecondary}
                    />
                    <Text color={theme.text} fontSize={15} fontFamily={Fonts.bold} marginTop={6}>
                      No purchases on this date
                    </Text>
                    <Text color={theme.textSecondary} fontSize={12} fontFamily={Fonts.medium} textAlign="center">
                      Tap "+ Log Expense" to record a simulated purchase
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowExpenseForm(true)}
                      style={styles.emptyActionBtn}
                      activeOpacity={0.8}
                    >
                      <Text color="#FFFFFF" fontSize={12.5} fontFamily={Fonts.bold}>
                        + Log Purchase
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  groupedTransactions.map((group, gIdx) => (
                    <View key={gIdx} style={[styles.dailyGroupCard, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#FFFFFF' : '#131D31' }]}>
                      {/* Daily Group Header */}
                      <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={16} paddingVertical={12} borderBottomWidth={1} borderBottomColor={theme.mode === 'hybrid' || theme.mode === 'light' ? '#F1F5F9' : '#1E293B'}>
                        <Text color={theme.text} fontSize={14.5} fontFamily={Fonts.bold}>
                          {group.dateLabel}
                        </Text>
                        <Text color={theme.textSecondary} fontSize={12} fontFamily={Fonts.medium}>
                          {group.dateSub}
                        </Text>
                      </XStack>

                      {/* List of items on this day */}
                      <YStack>
                        {group.expenses.map((exp, eIdx) => {
                          const catColor = CATEGORY_COLORS[exp.category] || '#64748B';
                          const isLast = eIdx === group.expenses.length - 1;

                          return (
                            <XStack
                              key={exp.id}
                              justifyContent="space-between"
                              alignItems="center"
                              paddingHorizontal={16}
                              paddingVertical={12}
                              borderBottomWidth={isLast ? 0 : 1}
                              borderBottomColor={theme.mode === 'hybrid' || theme.mode === 'light' ? theme.border : 'rgba(255, 255, 255, 0.04)'}
                            >
                              <XStack alignItems="center" gap={12} flex={1}>
                                <PhosphorCategoryIcon
                                  name={exp.category}
                                  size={22}
                                  primaryColor={theme.mode === 'dark' ? '#1E293B' : '#0F172A'}
                                  accentColor="#10B981"
                                />
                                <YStack gap={2} flex={1}>
                                  <Text color={theme.text} fontSize={14} fontFamily={Fonts.bold} numberOfLines={1}>
                                    {exp.name}
                                  </Text>
                                  <Text color={theme.textSecondary} fontSize={11} fontFamily={Fonts.medium}>
                                    {exp.category}
                                    {exp.notes ? ` • ${exp.notes}` : ''}
                                  </Text>
                                </YStack>
                              </XStack>

                              <XStack alignItems="center" gap={10}>
                                <Text
                                  color={exp.type === 'income' ? '#10B981' : '#EF4444'}
                                  fontSize={14.5}
                                  fontFamily={Fonts.bold}
                                >
                                  {exp.type === 'income' ? '+' : '-'}{currencySymbol}{exp.amount.toLocaleString()}
                                </Text>
                                <TouchableOpacity
                                  onPress={() => handleOpenEditExpense(exp)}
                                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                  <PhosphorIcon name="Pencil" size={15} color={theme.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => {
                                    Alert.alert(
                                      exp.type === 'income' ? 'Delete Income' : 'Delete Expense',
                                      `Delete "${exp.name}"?`,
                                      [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Delete', style: 'destructive', onPress: () => store.deleteExpense(exp.id) },
                                      ]
                                    );
                                  }}
                                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                  <PhosphorIcon name="Trash" size={14} color={theme.textSecondary} />
                                </TouchableOpacity>
                              </XStack>
                            </XStack>
                          );
                        })}
                      </YStack>
                    </View>
                  ))
                )}
              </YStack>
            </YStack>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SAVINGS GOALS                                                      */}
          {/* ========================================================================= */}
          {activeTab === 'savings' && (
            <YStack gap={16}>
              {/* Smart Savings Coach Insights */}
              <View style={[styles.darkMetricCard, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#FFFFFF' : '#131D31' }]}>
                <YStack padding={16} gap={10}>
                  <XStack alignItems="center" gap={8}>
                    <PhosphorIcon name="Lightbulb" size={16} color="#FBBF24" weight="fill" />
                    <Text color="#D97706" fontSize={12} fontFamily={Fonts.bold} letterSpacing={0.5}>
                      SAVINGS COACH INSIGHTS
                    </Text>
                  </XStack>
                  <Text color={theme.textSecondary} fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                    Allocate surplus budget into goals like Emergency Funds or Business Capital to simulate wealth compounding.
                  </Text>
                </YStack>
              </View>

              <TouchableOpacity
                onPress={() => setShowAddGoalModal(true)}
                style={styles.primaryActionButton}
                activeOpacity={0.85}
              >
                <Text color="#FFFFFF" fontSize={14} fontFamily={Fonts.bold}>
                  + Create Savings Goal
                </Text>
              </TouchableOpacity>

              {/* Goals list */}
              <YStack gap={10}>
                {store.savingsGoals.length === 0 ? (
                  <View style={[styles.emptyStateBox, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#FFFFFF' : '#131D31' }]}>
                    <Text color={theme.textSecondary} fontSize={12} fontFamily={Fonts.medium} textAlign="center">
                      No savings goals set yet. Tap above to create your first goal.
                    </Text>
                  </View>
                ) : (
                  store.savingsGoals.map((g) => {
                    const ratio = g.targetAmount > 0 ? g.currentSavings / g.targetAmount : 0;
                    const progress = Math.min(100, Math.round(ratio * 100));

                    return (
                      <View key={g.id} style={[styles.categoryCard, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#FFFFFF' : '#131D31' }]}>
                        <XStack justifyContent="space-between" alignItems="center">
                          <XStack alignItems="center" gap={12}>
                            <PhosphorCategoryIcon
                              name={g.category || g.name}
                              size={24}
                              primaryColor={theme.mode === 'dark' ? '#1E293B' : '#0F172A'}
                              accentColor="#10B981"
                            />
                            <YStack gap={2}>
                              <Text color={theme.text} fontSize={15} fontFamily={Fonts.bold}>
                                {g.name}
                              </Text>
                              <Text color={theme.textSecondary} fontSize={11} fontFamily={Fonts.medium}>
                                {currencySymbol}{g.currentSavings.toLocaleString()} of {currencySymbol}{g.targetAmount.toLocaleString()}
                              </Text>
                            </YStack>
                          </XStack>
                          <XStack alignItems="center" gap={10}>
                            <Text color="#10B981" fontSize={14} fontFamily={Fonts.bold}>
                              {progress}%
                            </Text>
                            <TouchableOpacity
                              onPress={() => {
                                Alert.alert(
                                  'Delete Savings Goal',
                                  `Delete "${g.name}"? Saved funds will return to your budget.`,
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Delete', style: 'destructive', onPress: () => store.deleteSavingsGoal(g.id) },
                                  ]
                                );
                              }}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <PhosphorIcon name="Trash" size={14} color={theme.textSecondary} />
                            </TouchableOpacity>
                          </XStack>
                        </XStack>

                        <View style={[styles.catProgressBg, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#E2E8F0' : '#1E293B' }]}>
                          <View style={[styles.catProgressBar, { width: `${progress}%`, backgroundColor: '#10B981' }]} />
                        </View>

                        <XStack gap={8} marginTop={4}>
                          {g.currentSavings < g.targetAmount && (
                            <TouchableOpacity
                              onPress={() => {
                                setContributeGoalId(g.id);
                                setContributeAmount('');
                              }}
                              style={[styles.contributeBtn, { flex: 1 }]}
                              activeOpacity={0.8}
                            >
                              <Text color="#10B981" fontSize={12} fontFamily={Fonts.bold}>
                                Contribute
                              </Text>
                            </TouchableOpacity>
                          )}
                          {g.currentSavings > 0 && (
                            <TouchableOpacity
                              onPress={() => {
                                setWithdrawGoalId(g.id);
                                setWithdrawAmount('');
                              }}
                              style={[styles.contributeBtn, { flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
                              activeOpacity={0.8}
                            >
                              <Text color="#EF4444" fontSize={12} fontFamily={Fonts.bold}>
                                Withdraw
                              </Text>
                            </TouchableOpacity>
                          )}
                        </XStack>
                      </View>
                    );
                  })
                )}
              </YStack>
            </YStack>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ==================== MODAL: LOG EXPENSE / INCOME ==================== */}
      <Modal visible={showExpenseForm} transparent animationType="slide" onRequestClose={() => setShowExpenseForm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor="#334155" paddingBottom={12}>
              <XStack alignItems="center" gap={8}>
                <PhosphorCategoryIcon name={transactionType === 'income' ? 'Bills' : 'Shopping'} size={22} primaryColor="#0F172A" accentColor="#10B981" style={{ width: 32, height: 32, borderRadius: 8 }} />
                <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>
                  {transactionType === 'income' ? 'Log Income' : 'Log Expense'}
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setShowExpenseForm(false)}>
                <PhosphorIcon name="XCircle" size={20} color="#94A3B8" weight="fill" />
              </TouchableOpacity>
            </XStack>

            <ScrollView contentContainerStyle={{ gap: 14, paddingTop: 12 }}>
              {/* Type Switcher */}
              <View style={{ flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 8, padding: 3 }}>
                <TouchableOpacity
                  onPress={() => {
                    safeHaptic('light');
                    setTransactionType('expense');
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 6,
                    borderRadius: 6,
                    alignItems: 'center',
                    backgroundColor: transactionType === 'expense' ? '#EF4444' : 'transparent',
                  }}
                >
                  <Text color={transactionType === 'expense' ? '#FFFFFF' : '#94A3B8'} fontSize={12} fontFamily={Fonts.bold}>
                    Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    safeHaptic('light');
                    setTransactionType('income');
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 6,
                    borderRadius: 6,
                    alignItems: 'center',
                    backgroundColor: transactionType === 'income' ? '#10B981' : 'transparent',
                  }}
                >
                  <Text color={transactionType === 'income' ? '#FFFFFF' : '#94A3B8'} fontSize={12} fontFamily={Fonts.bold}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Category selector */}
              <YStack gap={6}>
                <Text color="#94A3B8" fontSize={11} fontFamily={Fonts.bold}>SELECT CATEGORY</Text>
                <XStack flexWrap="wrap" gap={8}>
                  {Object.keys(CATEGORY_ICONS).filter(c => c !== 'Custom').map((cat) => {
                    const isSel = expenseCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => {
                          safeHaptic('light');
                          setExpenseCategory(cat);
                        }}
                        style={[styles.catSelectPill, isSel && styles.catSelectPillActive]}
                        activeOpacity={0.8}
                      >
                        <XStack alignItems="center" gap={6}>
                          <PhosphorCategoryIcon
                            name={cat}
                            size={16}
                            primaryColor={isSel ? '#FFFFFF' : '#0F172A'}
                            accentColor={isSel ? '#FFFFFF' : '#10B981'}
                            backgroundColor="transparent"
                            style={{ width: 18, height: 18 }}
                          />
                          <Text color={isSel ? '#FFFFFF' : '#94A3B8'} fontSize={12} fontFamily={Fonts.bold}>
                            {cat}
                          </Text>
                        </XStack>
                      </TouchableOpacity>
                    );
                  })}
                </XStack>
              </YStack>

              <FormInput
                label={transactionType === 'income' ? 'Income Source' : 'Item Name / Merchant'}
                placeholder={transactionType === 'income' ? 'e.g. Allowance, Freelance, Gift' : 'e.g. Jollibee, Jeepney'}
                value={expenseName}
                onChangeText={setExpenseName}
              />
              <FormInput
                label={`Amount (${currencySymbol})`}
                placeholder="e.g. 150"
                keyboardType="numeric"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
              />
              <FormInput
                label="Notes (Optional)"
                placeholder="e.g. Lunch with friends"
                value={expenseNotes}
                onChangeText={setExpenseNotes}
              />

              <XStack gap={10} marginTop={8}>
                <TouchableOpacity onPress={() => setShowExpenseForm(false)} style={styles.modalCancelBtn}>
                  <Text color="#94A3B8" fontSize={13} fontFamily={Fonts.bold}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogExpense} style={styles.modalSubmitBtn}>
                  <Text color="#FFFFFF" fontSize={13} fontFamily={Fonts.bold}>
                    {transactionType === 'income' ? 'Log Income' : 'Log Purchase'}
                  </Text>
                </TouchableOpacity>
              </XStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL: EDIT TRANSACTION ==================== */}
      <Modal visible={showEditExpenseModal} transparent animationType="slide" onRequestClose={() => setShowEditExpenseModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor="#334155" paddingBottom={12}>
              <XStack alignItems="center" gap={8}>
                <PhosphorCategoryIcon name={editExpenseCategory} size={20} primaryColor="#0F172A" accentColor="#10B981" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>
                  Edit Transaction
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setShowEditExpenseModal(false)}>
                <PhosphorIcon name="XCircle" size={20} color="#94A3B8" weight="fill" />
              </TouchableOpacity>
            </XStack>

            <ScrollView contentContainerStyle={{ gap: 14, paddingTop: 12 }}>
              <YStack gap={6}>
                <Text color="#94A3B8" fontSize={11} fontFamily={Fonts.bold}>CATEGORY</Text>
                <XStack flexWrap="wrap" gap={8}>
                  {Object.keys(CATEGORY_ICONS).filter(c => c !== 'Custom').map((cat) => {
                    const isSel = editExpenseCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => {
                          safeHaptic('light');
                          setEditExpenseCategory(cat);
                        }}
                        style={[styles.catSelectPill, isSel && styles.catSelectPillActive]}
                        activeOpacity={0.8}
                      >
                        <Text color={isSel ? '#FFFFFF' : '#94A3B8'} fontSize={12} fontFamily={Fonts.bold}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </XStack>
              </YStack>

              <FormInput label="Name" placeholder="e.g. Jollibee" value={editExpenseName} onChangeText={setEditExpenseName} />
              <FormInput label={`Amount (${currencySymbol})`} placeholder="e.g. 150" keyboardType="numeric" value={editExpenseAmount} onChangeText={setEditExpenseAmount} />
              <FormInput label="Notes" placeholder="e.g. With friends" value={editExpenseNotes} onChangeText={setEditExpenseNotes} />

              <XStack gap={10} marginTop={8}>
                <TouchableOpacity onPress={() => setShowEditExpenseModal(false)} style={styles.modalCancelBtn}>
                  <Text color="#94A3B8" fontSize={13} fontFamily={Fonts.bold}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEditExpense} style={styles.modalSubmitBtn}>
                  <Text color="#FFFFFF" fontSize={13} fontFamily={Fonts.bold}>Save Changes</Text>
                </TouchableOpacity>
              </XStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL: WITHDRAW SAVINGS ==================== */}
      <Modal visible={withdrawGoalId !== null} transparent animationType="slide" onRequestClose={() => setWithdrawGoalId(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor="#334155" paddingBottom={12}>
              <XStack alignItems="center" gap={8}>
                <PhosphorCategoryIcon name="emergency" size={20} primaryColor="#0F172A" accentColor="#EF4444" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>
                  Withdraw from Goal
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setWithdrawGoalId(null)}>
                <PhosphorIcon name="XCircle" size={20} color="#94A3B8" weight="fill" />
              </TouchableOpacity>
            </XStack>

            <YStack gap={14} paddingTop={12}>
              {(() => {
                const goal = store.savingsGoals.find((g) => g.id === withdrawGoalId);
                return (
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium}>
                    Currently saved: <Text color="#10B981" fontFamily={Fonts.bold}>{currencySymbol}{(goal?.currentSavings || 0).toLocaleString()}</Text>
                  </Text>
                );
              })()}
              <FormInput
                label={`Withdraw Amount (${currencySymbol})`}
                placeholder="e.g. 500"
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
              />
              <XStack gap={10} marginTop={8}>
                <TouchableOpacity onPress={() => setWithdrawGoalId(null)} style={styles.modalCancelBtn}>
                  <Text color="#94A3B8" fontSize={13} fontFamily={Fonts.bold}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleWithdrawSavings} style={[styles.modalSubmitBtn, { backgroundColor: '#EF4444' }]}>
                  <Text color="#FFFFFF" fontSize={13} fontFamily={Fonts.bold}>Withdraw</Text>
                </TouchableOpacity>
              </XStack>
            </YStack>
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL: ADD SAVINGS GOAL ==================== */}
      <Modal visible={showAddGoalModal} transparent animationType="slide" onRequestClose={() => setShowAddGoalModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor="#334155" paddingBottom={12}>
              <XStack alignItems="center" gap={8}>
                <PhosphorCategoryIcon name="emergency" size={20} primaryColor="#0F172A" accentColor="#10B981" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>
                  Create Savings Goal
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setShowAddGoalModal(false)}>
                <PhosphorIcon name="XCircle" size={20} color="#94A3B8" weight="fill" />
              </TouchableOpacity>
            </XStack>

            <ScrollView contentContainerStyle={{ gap: 14, paddingTop: 12 }}>
              <FormInput label="Goal Name" placeholder="e.g. Emergency Fund" value={goalName} onChangeText={setGoalName} />
              <FormInput label={`Target Amount (${currencySymbol})`} placeholder="e.g. 5000" keyboardType="numeric" value={goalTargetAmount} onChangeText={setGoalTargetAmount} />

              <XStack gap={10} marginTop={8}>
                <TouchableOpacity onPress={() => setShowAddGoalModal(false)} style={styles.modalCancelBtn}>
                  <Text color="#94A3B8" fontSize={13} fontFamily={Fonts.bold}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddGoal} style={styles.modalSubmitBtn}>
                  <Text color="#FFFFFF" fontSize={13} fontFamily={Fonts.bold}>Save Goal</Text>
                </TouchableOpacity>
              </XStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL: CONTRIBUTE SAVINGS ==================== */}
      <Modal visible={contributeGoalId !== null} transparent animationType="slide" onRequestClose={() => setContributeGoalId(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor="#334155" paddingBottom={12}>
              <XStack alignItems="center" gap={8}>
                <PhosphorCategoryIcon name="savings" size={20} primaryColor="#0F172A" accentColor="#10B981" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>
                  Contribute Savings
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setContributeGoalId(null)}>
                <PhosphorIcon name="XCircle" size={20} color="#94A3B8" weight="fill" />
              </TouchableOpacity>
            </XStack>

            <YStack gap={14} paddingTop={12}>
              <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium}>
                Available budget buffer: <Text color="#10B981" fontFamily={Fonts.bold}>{currencySymbol}{budgetLeftover.toLocaleString()}</Text>
              </Text>
              <FormInput label={`Contribution Amount (${currencySymbol})`} placeholder="e.g. 500" keyboardType="numeric" value={contributeAmount} onChangeText={setContributeAmount} />

              <XStack gap={10} marginTop={8}>
                <TouchableOpacity onPress={() => setContributeGoalId(null)} style={styles.modalCancelBtn}>
                  <Text color="#94A3B8" fontSize={13} fontFamily={Fonts.bold}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleContributeSavings} style={styles.modalSubmitBtn}>
                  <Text color="#FFFFFF" fontSize={13} fontFamily={Fonts.bold}>Contribute</Text>
                </TouchableOpacity>
              </XStack>
            </YStack>
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL: CATEGORY BREAKDOWN ==================== */}
      <Modal visible={!!selectedCategoryBreakdown} transparent animationType="slide" onRequestClose={() => setSelectedCategoryBreakdown(null)}>
        <View style={styles.modalOverlay}>
          {(() => {
            if (!selectedCategoryBreakdown) return null;
            const cat = selectedCategoryBreakdown;
            const catColor = CATEGORY_COLORS[cat] || '#64748B';
            const spentInCat = store.loggedExpenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
            const limitInCat = store.categoryLimits?.[cat] || store.totalBudget / (store.selectedCategories.length || 1);
            const catExpenses = store.loggedExpenses.filter((e) => e.category === cat);

            return (
              <View style={styles.modalCard}>
                <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor="#334155" paddingBottom={12}>
                  <XStack alignItems="center" gap={8}>
                    <PhosphorCategoryIcon name={cat} size={20} primaryColor="#0F172A" accentColor={catColor} style={{ width: 28, height: 28, borderRadius: 6 }} />
                    <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>
                      {cat} Logs
                    </Text>
                  </XStack>
                  <TouchableOpacity onPress={() => setSelectedCategoryBreakdown(null)}>
                    <PhosphorIcon name="XCircle" size={20} color="#94A3B8" weight="fill" />
                  </TouchableOpacity>
                </XStack>

                <YStack gap={10} marginVertical={12}>
                  <XStack justifyContent="space-between">
                    <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium}>Total Limit</Text>
                    <Text color="#FFFFFF" fontSize={14} fontFamily={Fonts.bold}>{currencySymbol}{limitInCat.toLocaleString()}</Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium}>Total Spent</Text>
                    <Text color={spentInCat > limitInCat ? '#EF4444' : '#10B981'} fontSize={14} fontFamily={Fonts.bold}>
                      {currencySymbol}{spentInCat.toLocaleString()}
                    </Text>
                  </XStack>
                </YStack>

                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  {catExpenses.length === 0 ? (
                    <Text color="#94A3B8" fontSize={12} textAlign="center" padding={16}>
                      No purchases logged under {cat} yet.
                    </Text>
                  ) : (
                    catExpenses.map((exp) => (
                      <XStack key={exp.id} justifyContent="space-between" alignItems="center" padding={10} backgroundColor="#0F172A" borderRadius={8} marginBottom={6}>
                        <YStack gap={2}>
                          <Text color="#FFFFFF" fontSize={13} fontFamily={Fonts.bold}>{exp.name}</Text>
                          <Text color="#94A3B8" fontSize={10}>{exp.date}</Text>
                        </YStack>
                        <Text color="#FFFFFF" fontSize={13} fontFamily={Fonts.bold}>{currencySymbol}{exp.amount.toLocaleString()}</Text>
                      </XStack>
                    ))
                  )}
                </ScrollView>
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* ==================== MODAL: SET ALLOWANCE AMOUNT ==================== */}
      <Modal visible={showEditAllowanceModal} transparent animationType="slide" onRequestClose={() => setShowEditAllowanceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor="#334155" paddingBottom={12}>
              <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>
                Set {currentCycle === 'daily' ? 'Daily Baon' : currentCycle === 'weekly' ? 'Weekly Allowance' : 'Monthly Budget'}
              </Text>
              <TouchableOpacity onPress={() => setShowEditAllowanceModal(false)}>
                <PhosphorIcon name="XCircle" size={20} color="#94A3B8" weight="fill" />
              </TouchableOpacity>
            </XStack>

            <YStack gap={14} paddingTop={12}>
              <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium}>
                {currentCycle === 'daily'
                  ? 'How much baon do you receive per day?'
                  : currentCycle === 'weekly'
                  ? 'How much allowance do you receive per week?'
                  : 'What is your total target budget for the month?'}
              </Text>

              <FormInput
                label={`Allowance Amount (${currencySymbol})`}
                placeholder={currentCycle === 'daily' ? 'e.g. 150' : currentCycle === 'weekly' ? 'e.g. 1000' : 'e.g. 4000'}
                keyboardType="numeric"
                value={allowanceAmountInput}
                onChangeText={setAllowanceAmountInput}
              />

              <XStack gap={10} marginTop={8}>
                <TouchableOpacity onPress={() => setShowEditAllowanceModal(false)} style={styles.modalCancelBtn}>
                  <Text color="#94A3B8" fontSize={13} fontFamily={Fonts.bold}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const amt = parseFloat(allowanceAmountInput);
                    if (isNaN(amt) || amt <= 0) {
                      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
                      return;
                    }
                    if (!store.isBudgetSetupComplete) {
                      store.setupBudget(
                        currentCycle as any,
                        amt,
                        ['Food', 'Transportation', 'School', 'Bills', 'Shopping', 'Entertainment'],
                        {
                          Food: Math.round(amt * 0.35),
                          Transportation: Math.round(amt * 0.20),
                          School: Math.round(amt * 0.15),
                          Bills: Math.round(amt * 0.15),
                          Shopping: Math.round(amt * 0.08),
                          Entertainment: Math.round(amt * 0.07),
                        }
                      );
                    } else {
                      store.setBudgetType(currentCycle as any, amt);
                    }
                    setShowEditAllowanceModal(false);
                    Alert.alert('Allowance Updated!', `${currentCycle === 'daily' ? 'Daily baon' : currentCycle === 'weekly' ? 'Weekly allowance' : 'Monthly budget'} set to ${currencySymbol}${amt.toLocaleString()}.`);
                  }}
                  style={styles.modalSubmitBtn}
                >
                  <Text color="#FFFFFF" fontSize={13} fontFamily={Fonts.bold}>Save Allowance</Text>
                </TouchableOpacity>
              </XStack>
            </YStack>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 4,
  },
  topStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
      } as any,
    }),
  },
  capsuleTrackWrapper: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
  },
  capsuleTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 3,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
      } as any,
    }),
  },
  capsuleTab: {
    flex: 1,
    height: 38,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleTabActive: {
    backgroundColor: '#10B981',
  },
  allowanceTrackWrapper: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  allowanceTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 3,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
      } as any,
    }),
  },
  allowanceItem: {
    flex: 1,
    height: 36,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowanceItemActive: {
    backgroundColor: '#10B981',
  },
  allowanceEditBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  currentBalanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  addAccountPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  accountDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  premiumHeroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#064E3B',
    ...Platform.select({
      ios: {
        shadowColor: '#064E3B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 8px 24px rgba(6, 78, 59, 0.28)',
      } as any,
    }),
  },
  heroEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  budgetHeroProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  budgetHeroProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricCircleBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumMetricIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkMetricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
      } as any,
    }),
  },
  gaugeContainer: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#10B981',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 0,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 3px 10px rgba(15, 23, 42, 0.05)',
      } as any,
    }),
  },
  categoryCardOver: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  catIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgePillOver: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  catProgressBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  catProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  monthSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
      } as any,
    }),
  },
  monthArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarStrip: {
    gap: 8,
    paddingVertical: 4,
  },
  dayStripItem: {
    width: 48,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
      } as any,
    }),
  },
  dayStripItemActive: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34D399',
    marginTop: 2,
  },
  dailyGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 3px 10px rgba(15, 23, 42, 0.05)',
      } as any,
    }),
  },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 3px 10px rgba(15, 23, 42, 0.05)',
      } as any,
    }),
  },
  mainLogPurchaseBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyActionBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  primaryActionButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contributeBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  catSelectPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  catSelectPillActive: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSubmitBtn: {
    flex: 1.5,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
