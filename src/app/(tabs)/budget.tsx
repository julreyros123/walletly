import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Alert, Modal, TouchableOpacity, TextInput, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, XStack, Text as TamaguiText, Button, Progress, View } from 'tamagui';
const Text = (props: any) => <TamaguiText {...props} />;
import { useTheme } from '@/hooks/use-theme';
import { PhosphorIcon, PhosphorIconName } from '@/components/ui/PhosphorIcon';
import { useGamificationStore, getCycleMetrics } from '@/store/gamificationStore';
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
import { useCurrency, formatNumberMask, parseMaskedNumber } from '@/utils/currency';
import { SetBudgetModal } from '@/features/budget/components/SetBudgetModal';

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
  const isDark = theme.mode === 'dark';
  const insets = useSafeAreaInsets();
  const store = useGamificationStore();
  const { user } = useAuthStore();

  // Tab State
  const [activeTab, setActiveTab] = useState<'budget' | 'calendar' | 'savings' | 'goals'>('budget');
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

  const params = useLocalSearchParams<{ action?: string; tab?: string; t?: string }>();
  const { currency: currencyCode, symbol: currencySymbol } = useCurrency();

  const lastHandledKeyRef = React.useRef<string | null>(null);

  const handleRouteParams = React.useCallback(() => {
    const key = `${params.action || ''}_${params.tab || ''}_${params.t || ''}`;
    if (!params.action && !params.tab) return;
    if (lastHandledKeyRef.current === key) return;
    lastHandledKeyRef.current = key;

    if (params.action === 'savings') {
      setActiveTab('savings');
    } else if (params.action === 'goals') {
      setActiveTab('goals');
      setShowAddGoalModal(true);
    } else if (params.action === 'log') {
      setShowExpenseForm(true);
    } else if (params.tab === 'savings' || params.action === 'savings_tab') {
      setActiveTab('savings');
    } else if (params.tab === 'goals') {
      setActiveTab('goals');
    }
  }, [params.action, params.tab, params.t]);

  useFocusEffect(
    React.useCallback(() => {
      setStatusBarStyle(theme.mode === 'dark' ? 'light' : 'dark');
      handleRouteParams();
    }, [theme.mode, handleRouteParams])
  );

  useEffect(() => {
    handleRouteParams();
  }, [handleRouteParams]);

  // Contribute & Edit Savings Modal states
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  const [editGoalName, setEditGoalName] = useState('');
  const [editGoalTargetAmount, setEditGoalTargetAmount] = useState('');
  const [selectedCategoryBreakdown, setSelectedCategoryBreakdown] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [analyticsView, setAnalyticsView] = useState<'category' | 'trend'>('category');
  const [selectedDayBarIndex, setSelectedDayBarIndex] = useState<number | null>(null);

  // Allowance Cycle & Edit Modal states
  const currentCycle = store.budgetType || 'monthly';
  const [showEditAllowanceModal, setShowEditAllowanceModal] = useState(false);
  const [allowanceAmountInput, setAllowanceAmountInput] = useState('');

  // Accounts Balance expansion
  const [isAccountsExpanded, setIsAccountsExpanded] = useState(false);

  // Derived calculations
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const todayISO = new Date().toISOString().split('T')[0];

  // Dynamic budget metrics based on current cycle (daily, weekly, or monthly)
  const cycleMetrics = useMemo(
    () => getCycleMetrics(store),
    [store.totalBudget, store.budgetType, store.loggedExpenses]
  );
  const effectiveBudget = cycleMetrics.limit;
  const effectiveSpent = cycleMetrics.spent;
  const effectiveRemaining = cycleMetrics.balance;
  const budgetLeftover = cycleMetrics.balance; // Available balance for savings goals and investing
  const spendRatio = effectiveBudget > 0 ? Math.min(1, effectiveSpent / effectiveBudget) : 0;
  const spendPercentage = Math.round(spendRatio * 100);

  // Spending Analytics Breakdown for Donut/Pie Chart
  const categoryAnalytics = useMemo(() => {
    const relevantExpenses = store.loggedExpenses.filter((e) => {
      if (e.type === 'income') return false;
      if (currentCycle === 'daily') {
        return e.date === todayStr || e.date === todayISO;
      }
      return true;
    });

    const categoryMap: Record<string, number> = {};
    relevantExpenses.forEach((e) => {
      const cat = e.category || 'Custom';
      categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
    });

    const total = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);

    const slices = Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: CATEGORY_COLORS[category] || '#64748B',
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      total,
      slices,
    };
  }, [store.loggedExpenses, currentCycle, todayStr, todayISO]);

  // 7-Day Spending Analytics Breakdown for Weekly Bar Chart
  const weeklyAnalytics = useMemo(() => {
    const days: { label: string; dateISO: string; dateStr: string; dayName: string; amount: number; isToday: boolean }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const str = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const isToday = i === 0;

      const daySpent = store.loggedExpenses
        .filter((e) => e.type !== 'income' && (e.date === iso || e.date === str))
        .reduce((sum, e) => sum + e.amount, 0);

      days.push({
        label: dayName,
        dateISO: iso,
        dateStr: str,
        dayName,
        amount: daySpent,
        isToday,
      });
    }

    const totalWeeklySpent = days.reduce((sum, d) => sum + d.amount, 0);
    const dailyLimit = effectiveBudget > 0
      ? (currentCycle === 'daily' ? effectiveBudget : currentCycle === 'weekly' ? Math.round(effectiveBudget / 7) : Math.round(effectiveBudget / 30))
      : 200;

    const maxDaySpent = Math.max(...days.map((d) => d.amount), dailyLimit * 1.25, 100);

    return {
      days,
      maxDaySpent,
      totalWeeklySpent,
      dailyLimit,
      dailyAverage: Math.round(totalWeeklySpent / 7),
    };
  }, [store.loggedExpenses, effectiveBudget, currentCycle]);

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
      Alert.alert('Expense Logged!', `Simulated purchase of ${currencySymbol}${amt.toLocaleString()} recorded. (+10 XP)`);
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
    const target = parseMaskedNumber(goalTargetAmount);
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
    const amt = parseMaskedNumber(contributeAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid contribution amount.');
      return;
    }
    if (amt > cycleMetrics.balance) {
      Alert.alert(
        'Insufficient Balance',
        `You only have ${currencySymbol}${cycleMetrics.balance.toLocaleString()} available in your ${cycleMetrics.cycleName.toLowerCase()}.`
      );
      return;
    }
    if (contributeGoalId) {
      const ok = store.contributeToSavingsGoal(contributeGoalId, amt);
      if (ok) {
        setContributeGoalId(null);
        setContributeAmount('');
        Alert.alert('Contributed!', `${currencySymbol}${amt.toLocaleString()} added to savings goal.`);
      } else {
        Alert.alert('Unable to Contribute', 'Could not contribute to this savings goal.');
      }
    }
  };

  const handleSaveEditGoal = () => {
    safeHaptic('medium');
    const target = parseMaskedNumber(editGoalTargetAmount);
    if (!editGoalName.trim()) {
      Alert.alert('Missing Field', 'Please enter a goal name.');
      return;
    }
    if (isNaN(target) || target <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid target amount.');
      return;
    }

    if (editGoalId) {
      store.updateSavingsGoal(editGoalId, {
        name: editGoalName.trim(),
        targetAmount: target,
      });
      setEditGoalId(null);
      setEditGoalName('');
      setEditGoalTargetAmount('');
      Alert.alert('Goal Updated!', `Savings goal "${editGoalName.trim()}" updated successfully.`);
    }
  };

  // Smart Auto-Categorize Logic
  const handleExpenseNameChange = (text: string) => {
    setExpenseName(text);
    if (transactionType === 'income') return;
    
    const lower = text.toLowerCase();
    
    const keywordMap: Record<string, string> = {
      // Food
      food: 'Food', mcdonald: 'Food', mcdonalds: 'Food', burger: 'Food', 
      jollibee: 'Food', pizza: 'Food', lunch: 'Food', dinner: 'Food', 
      breakfast: 'Food', coffee: 'Food', starbucks: 'Food', kfc: 'Food',
      chowking: 'Food', manginasal: 'Food', snacks: 'Food', groceries: 'Food',
      
      // Transportation
      gas: 'Transportation', uber: 'Transportation', taxi: 'Transportation', 
      bus: 'Transportation', train: 'Transportation', jeep: 'Transportation', 
      jeepney: 'Transportation', car: 'Transportation', grab: 'Transportation',
      angkas: 'Transportation', joyride: 'Transportation', toll: 'Transportation',
      fuel: 'Transportation',
      
      // School
      school: 'School', tuition: 'School', books: 'School', supplies: 'School',
      project: 'School', uniform: 'School', printing: 'School', photocopy: 'School',
      
      // Shopping
      shopping: 'Shopping', mall: 'Shopping', clothes: 'Shopping', 
      shoes: 'Shopping', lazada: 'Shopping', shopee: 'Shopping', 
      shirt: 'Shopping', pants: 'Shopping',
      
      // Bills
      bill: 'Bills', electricity: 'Bills', water: 'Bills', 
      internet: 'Bills', phone: 'Bills', load: 'Bills', rent: 'Bills',
      
      // Entertainment
      movie: 'Entertainment', netflix: 'Entertainment', game: 'Entertainment', 
      spotify: 'Entertainment', cinema: 'Entertainment', arcade: 'Entertainment',
      concert: 'Entertainment', ticket: 'Entertainment'
    };

    // Find the first matching keyword
    for (const [key, categoryName] of Object.entries(keywordMap)) {
      // Use word boundaries or simple includes. Includes is safer for partial matches like "mcdonalds"
      if (lower.includes(key)) {
        if (expenseCategory !== categoryName) {
          setExpenseCategory(categoryName);
          safeHaptic('success'); // gentle feedback that it auto-selected
        }
        break;
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
          <AnimatedSegmentSwitch<'budget' | 'calendar' | 'savings' | 'goals'>
            options={[
              { id: 'budget', label: 'Budget' },
              { id: 'calendar', label: 'Calendar' },
              { id: 'savings', label: 'Savings' },
              { id: 'goals', label: 'Goals' },
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
                    { id: 'daily', label: 'Daily' },
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

              {/* ==================== SPENDING ANALYTICS HERO CARD ==================== */}
              <View style={[styles.analyticsHeroCard, isDark && styles.analyticsHeroCardDark]}>
                {/* Header Row: Overline + Title + Set Limit Pill */}
                <XStack justifyContent="space-between" alignItems="center" gap={8}>
                  <YStack gap={2} flex={1} marginRight={6}>
                    <Text
                      color="#10B981"
                      fontSize={10.5}
                      fontFamily={Fonts.bold}
                      letterSpacing={0.6}
                      textTransform="uppercase"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {currentCycle === 'daily'
                        ? 'DAILY ANALYTICS'
                        : currentCycle === 'weekly'
                        ? 'WEEKLY ANALYTICS'
                        : 'MONTHLY ANALYTICS'}
                    </Text>
                    <Text
                      color={theme.text}
                      fontSize={16.5}
                      fontFamily={Fonts.bold}
                      letterSpacing={-0.3}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {analyticsView === 'category' ? 'Category Breakdown' : '7-Day Spending Trend'}
                    </Text>
                  </YStack>

                  <TouchableOpacity
                    onPress={() => {
                      safeHaptic('light');
                      setAllowanceAmountInput(effectiveBudget.toString());
                      setShowEditAllowanceModal(true);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}
                    activeOpacity={0.7}
                  >
                    <Text color="#10B981" fontSize={12} fontFamily={Fonts.bold} numberOfLines={1}>
                      Limit {currencySymbol}{effectiveBudget.toLocaleString()}
                    </Text>
                    <PhosphorIcon name="Pencil" size={12} color="#10B981" weight="bold" />
                  </TouchableOpacity>
                </XStack>

                {/* Segment Switch: Categories vs 7-Day Trend */}
                <XStack
                  backgroundColor={isDark ? '#1E293B' : '#F1F5F9'}
                  borderRadius={12}
                  padding={3}
                  gap={4}
                  marginTop={2}
                >
                  <TouchableOpacity
                    onPress={() => {
                      safeHaptic('light');
                      setAnalyticsView('category');
                    }}
                    style={[
                      styles.analyticsSegmentBtn,
                      analyticsView === 'category' && [
                        styles.analyticsSegmentBtnActive,
                        isDark && styles.analyticsSegmentBtnActiveDark,
                      ],
                    ]}
                    activeOpacity={0.7}
                  >
                    <PhosphorIcon
                      name="ChartPie"
                      size={14}
                      color={analyticsView === 'category' ? '#10B981' : theme.textSecondary}
                      weight="bold"
                    />
                    <Text
                      color={analyticsView === 'category' ? theme.text : theme.textSecondary}
                      fontSize={11.5}
                      fontFamily={Fonts.bold}
                    >
                      Categories
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      safeHaptic('light');
                      setAnalyticsView('trend');
                    }}
                    style={[
                      styles.analyticsSegmentBtn,
                      analyticsView === 'trend' && [
                        styles.analyticsSegmentBtnActive,
                        isDark && styles.analyticsSegmentBtnActiveDark,
                      ],
                    ]}
                    activeOpacity={0.7}
                  >
                    <PhosphorIcon
                      name="ChartBar"
                      size={14}
                      color={analyticsView === 'trend' ? '#10B981' : theme.textSecondary}
                      weight="bold"
                    />
                    <Text
                      color={analyticsView === 'trend' ? theme.text : theme.textSecondary}
                      fontSize={11.5}
                      fontFamily={Fonts.bold}
                    >
                      7-Day Trend
                    </Text>
                  </TouchableOpacity>
                </XStack>

                {/* VIEW 1: Donut Chart Visual + Category Slices Legend */}
                {analyticsView === 'category' && (
                  categoryAnalytics.total === 0 ? (
                    <YStack alignItems="center" justifyContent="center" paddingVertical={28} gap={10}>
                      <View
                        style={[
                          styles.catAnalyticIconCircle,
                          {
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                          },
                        ]}
                      >
                        <PhosphorIcon name="PiggyBank" size={28} color="#10B981" weight="duotone" />
                      </View>
                      <Text color={theme.text} fontSize={15} fontFamily={Fonts.bold} textAlign="center">
                        No purchases logged yet
                      </Text>
                      <Text
                        color={theme.textSecondary}
                        fontSize={12.5}
                        fontFamily={Fonts.medium}
                        lineHeight={18}
                        textAlign="center"
                        maxWidth={280}
                      >
                        All {currencySymbol}{effectiveBudget.toLocaleString()} is intact. Log an expense below to see your spending analytics!
                      </Text>
                    </YStack>
                  ) : (
                    <YStack gap={16} paddingVertical={4}>
                      {/* Enlarged 190px Hero Donut Chart */}
                      <View style={styles.donutWrapper}>
                        <Svg width={190} height={190} viewBox="0 0 190 190">
                          {/* Background Inactive Ring */}
                          <Circle
                            cx={95}
                            cy={95}
                            r={72}
                            stroke={isDark ? '#1E293B' : '#F1F5F9'}
                            strokeWidth={18}
                            fill="none"
                          />

                          {/* Render Colored Slices */}
                          {(() => {
                            const C = 2 * Math.PI * 72; // ~452.39
                            let accAngle = -90; // Start at 12 o'clock

                            return categoryAnalytics.slices.map((slice, sIdx) => {
                              const sliceFraction = slice.amount / categoryAnalytics.total;
                              const sliceAngle = sliceFraction * 360;
                              const strokeLen = Math.max(0, sliceFraction * C - (categoryAnalytics.slices.length > 1 ? 3 : 0));
                              const rot = accAngle;
                              accAngle += sliceAngle;
                              const isSelected = selectedCategoryBreakdown === slice.category;

                              return (
                                <Circle
                                  key={slice.category + sIdx}
                                  cx={95}
                                  cy={95}
                                  r={72}
                                  stroke={slice.color}
                                  strokeWidth={isSelected ? 22 : 18}
                                  fill="none"
                                  strokeDasharray={`${strokeLen} ${C}`}
                                  transform={`rotate(${rot} 95 95)`}
                                  strokeLinecap="round"
                                  opacity={selectedCategoryBreakdown ? (isSelected ? 1 : 0.35) : 1}
                                />
                              );
                            });
                          })()}
                        </Svg>

                        {/* Interactive Center Metric Text inside Donut Hole */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            if (selectedCategoryBreakdown) {
                              safeHaptic('light');
                              setSelectedCategoryBreakdown(null);
                            }
                          }}
                          style={styles.donutCenterTextWrapper}
                        >
                          {(() => {
                            const activeSlice = selectedCategoryBreakdown
                              ? categoryAnalytics.slices.find((s) => s.category === selectedCategoryBreakdown)
                              : null;

                            if (activeSlice) {
                              return (
                                <YStack alignItems="center" gap={2}>
                                  <Text
                                    color={activeSlice.color}
                                    fontSize={10}
                                    fontFamily={Fonts.bold}
                                    letterSpacing={0.8}
                                    textTransform="uppercase"
                                    numberOfLines={1}
                                  >
                                    {activeSlice.category}
                                  </Text>
                                  <Text
                                    color={theme.text}
                                    fontSize={21}
                                    fontFamily={Fonts.extraBold}
                                    numberOfLines={1}
                                    textAlign="center"
                                  >
                                    {currencySymbol}{Math.round(activeSlice.amount).toLocaleString()}
                                  </Text>
                                  <View
                                    style={[
                                      styles.statusCapsule,
                                      { backgroundColor: `${activeSlice.color}20` },
                                    ]}
                                  >
                                    <Text
                                      color={activeSlice.color}
                                      fontSize={10.5}
                                      fontFamily={Fonts.bold}
                                      numberOfLines={1}
                                    >
                                      {Math.round(activeSlice.percentage)}% of spent
                                    </Text>
                                  </View>
                                </YStack>
                              );
                            }

                            return (
                              <YStack alignItems="center" gap={2}>
                                <Text
                                  color={theme.textSecondary}
                                  fontSize={10}
                                  fontFamily={Fonts.bold}
                                  letterSpacing={0.8}
                                  textTransform="uppercase"
                                  numberOfLines={1}
                                >
                                  TOTAL SPENT
                                </Text>
                                <Text
                                  color={theme.text}
                                  fontSize={21}
                                  fontFamily={Fonts.extraBold}
                                  numberOfLines={1}
                                  textAlign="center"
                                >
                                  {currencySymbol}{Math.round(categoryAnalytics.total).toLocaleString()}
                                </Text>
                                <View
                                  style={[
                                    styles.statusCapsule,
                                    {
                                      backgroundColor:
                                        effectiveSpent > effectiveBudget
                                          ? 'rgba(239, 68, 68, 0.12)'
                                          : 'rgba(16, 185, 129, 0.12)',
                                    },
                                  ]}
                                >
                                  <Text
                                    color={effectiveSpent > effectiveBudget ? '#EF4444' : '#10B981'}
                                    fontSize={10.5}
                                    fontFamily={Fonts.bold}
                                    numberOfLines={1}
                                  >
                                    {spendPercentage}% of limit
                                  </Text>
                                </View>
                              </YStack>
                            );
                          })()}
                        </TouchableOpacity>
                      </View>

                      {/* Category Breakdown Full-Width Rows */}
                      <YStack gap={8} width="100%">
                        <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={2}>
                          <Text
                            color={theme.textSecondary}
                            fontSize={11.5}
                            fontFamily={Fonts.bold}
                            textTransform="uppercase"
                            letterSpacing={0.6}
                          >
                            Spending by Category
                          </Text>
                          {selectedCategoryBreakdown && (
                            <TouchableOpacity
                              onPress={() => {
                                safeHaptic('light');
                                setSelectedCategoryBreakdown(null);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text color="#10B981" fontSize={11.5} fontFamily={Fonts.bold}>
                                Show All
                              </Text>
                            </TouchableOpacity>
                          )}
                        </XStack>

                        {/* Display items: 4 by default or all if expanded */}
                        {(showAllCategories
                          ? categoryAnalytics.slices
                          : categoryAnalytics.slices.slice(0, 4)
                        ).map((slice) => {
                          const isSelected = selectedCategoryBreakdown === slice.category;
                          return (
                            <TouchableOpacity
                              key={slice.category}
                              onPress={() => {
                                safeHaptic('light');
                                setSelectedCategoryBreakdown(
                                  isSelected ? null : slice.category
                                );
                              }}
                              activeOpacity={0.7}
                              style={[
                                styles.categoryAnalyticItem,
                                isDark && styles.categoryAnalyticItemDark,
                                isSelected && {
                                  borderColor: slice.color,
                                  borderWidth: 1.5,
                                  backgroundColor: isDark ? `${slice.color}18` : `${slice.color}0D`,
                                },
                              ]}
                            >
                              <XStack alignItems="center" justifyContent="space-between" gap={10}>
                                {/* Icon + Category Name */}
                                <XStack alignItems="center" gap={10} flex={1}>
                                  <View
                                    style={[
                                      styles.catAnalyticIconCircle,
                                      { backgroundColor: `${slice.color}20` },
                                    ]}
                                  >
                                    <PhosphorIcon
                                      name={CATEGORY_ICONS[slice.category] || 'Question'}
                                      size={17}
                                      color={slice.color}
                                      weight="bold"
                                    />
                                  </View>
                                  <YStack flex={1} gap={3}>
                                    <Text
                                      color={theme.text}
                                      fontSize={13}
                                      fontFamily={Fonts.bold}
                                      numberOfLines={1}
                                      ellipsizeMode="tail"
                                    >
                                      {slice.category}
                                    </Text>
                                    {/* Visual Mini Progress Bar */}
                                    <View style={styles.miniCategoryTrack}>
                                      <View
                                        style={[
                                          styles.miniCategoryFill,
                                          {
                                            width: `${Math.min(100, Math.max(5, slice.percentage))}%`,
                                            backgroundColor: slice.color,
                                          },
                                        ]}
                                      />
                                    </View>
                                  </YStack>
                                </XStack>

                                {/* Amount & Percentage */}
                                <YStack alignItems="flex-end" gap={2} flexShrink={0}>
                                  <Text color={theme.text} fontSize={13} fontFamily={Fonts.bold}>
                                    {currencySymbol}{slice.amount.toLocaleString()}
                                  </Text>
                                  <View
                                    style={[
                                      styles.categoryPercentBadge,
                                      {
                                        backgroundColor: isDark
                                          ? 'rgba(255, 255, 255, 0.08)'
                                          : '#F1F5F9',
                                      },
                                    ]}
                                  >
                                    <Text
                                      color={theme.textSecondary}
                                      fontSize={10}
                                      fontFamily={Fonts.bold}
                                    >
                                      {Math.round(slice.percentage)}%
                                    </Text>
                                  </View>
                                </YStack>
                              </XStack>
                            </TouchableOpacity>
                          );
                        })}

                        {/* Expand / Collapse Button if more than 4 categories */}
                        {categoryAnalytics.slices.length > 4 && (
                          <TouchableOpacity
                            onPress={() => {
                              safeHaptic('light');
                              setShowAllCategories(!showAllCategories);
                            }}
                            style={{
                              alignItems: 'center',
                              paddingVertical: 6,
                              marginTop: 2,
                            }}
                            activeOpacity={0.7}
                          >
                            <Text color="#10B981" fontSize={12} fontFamily={Fonts.bold}>
                              {showAllCategories
                                ? 'Show Less'
                                : `+${categoryAnalytics.slices.length - 4} more categories`}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </YStack>
                    </YStack>
                  )
                )}

                {/* VIEW 2: 7-Day Spending Bar Chart */}
                {analyticsView === 'trend' && (
                  <YStack gap={14} paddingVertical={8}>
                    {/* Top Stat Summary Pills */}
                    <XStack justifyContent="space-between" alignItems="center" gap={6}>
                      <YStack
                        flex={1}
                        backgroundColor={isDark ? '#1E293B' : '#F8FAFC'}
                        paddingVertical={8}
                        paddingHorizontal={8}
                        borderRadius={12}
                        borderWidth={1}
                        borderColor={isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}
                        alignItems="center"
                      >
                        <Text color={theme.textSecondary} fontSize={9} fontFamily={Fonts.bold} textTransform="uppercase">
                          7-Day Total
                        </Text>
                        <Text color={theme.text} fontSize={13.5} fontFamily={Fonts.extraBold} numberOfLines={1}>
                          {currencySymbol}{Math.round(weeklyAnalytics.totalWeeklySpent).toLocaleString()}
                        </Text>
                      </YStack>

                      <YStack
                        flex={1}
                        backgroundColor={isDark ? '#1E293B' : '#F8FAFC'}
                        paddingVertical={8}
                        paddingHorizontal={8}
                        borderRadius={12}
                        borderWidth={1}
                        borderColor={isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}
                        alignItems="center"
                      >
                        <Text color={theme.textSecondary} fontSize={9} fontFamily={Fonts.bold} textTransform="uppercase">
                          Daily Average
                        </Text>
                        <Text color={theme.text} fontSize={13.5} fontFamily={Fonts.extraBold} numberOfLines={1}>
                          {currencySymbol}{weeklyAnalytics.dailyAverage.toLocaleString()}
                        </Text>
                      </YStack>

                      <YStack
                        flex={1}
                        backgroundColor={isDark ? '#1E293B' : '#F8FAFC'}
                        paddingVertical={8}
                        paddingHorizontal={8}
                        borderRadius={12}
                        borderWidth={1}
                        borderColor={isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}
                        alignItems="center"
                      >
                        <Text color={theme.textSecondary} fontSize={9} fontFamily={Fonts.bold} textTransform="uppercase">
                          Daily Target
                        </Text>
                        <Text color="#10B981" fontSize={13.5} fontFamily={Fonts.extraBold} numberOfLines={1}>
                          {currencySymbol}{weeklyAnalytics.dailyLimit.toLocaleString()}
                        </Text>
                      </YStack>
                    </XStack>

                    {/* The 7-Day Vertical Bars Container */}
                    <View style={styles.weeklyBarChartContainer}>
                      {/* Target Limit Dotted Guide Line */}
                      {(() => {
                        const targetYRatio = Math.min(0.85, weeklyAnalytics.dailyLimit / weeklyAnalytics.maxDaySpent);
                        const targetBottom = targetYRatio * 110;
                        return (
                          <View
                            style={[
                              styles.targetGuideLine,
                              { bottom: targetBottom + 28 },
                            ]}
                          >
                            <View style={styles.targetGuideLineDash} />
                            <Text color="#F59E0B" fontSize={8.5} fontFamily={Fonts.bold} style={styles.targetGuideLabel}>
                              Target {currencySymbol}{weeklyAnalytics.dailyLimit.toLocaleString()}
                            </Text>
                          </View>
                        );
                      })()}

                      {/* 7 Columns */}
                      <XStack justifyContent="space-between" alignItems="flex-end" height={150} width="100%" paddingHorizontal={4}>
                        {weeklyAnalytics.days.map((day, idx) => {
                          const isSelected = selectedDayBarIndex === idx;
                          const heightRatio = weeklyAnalytics.maxDaySpent > 0 ? day.amount / weeklyAnalytics.maxDaySpent : 0;
                          const barHeight = Math.max(day.amount > 0 ? 10 : 4, heightRatio * 110);
                          const isOver = day.amount > weeklyAnalytics.dailyLimit;
                          const barColor = isOver ? '#EF4444' : day.amount > 0 ? '#10B981' : isDark ? '#334155' : '#CBD5E1';

                          return (
                            <TouchableOpacity
                              key={day.dateISO}
                              onPress={() => {
                                safeHaptic('light');
                                setSelectedDayBarIndex(isSelected ? null : idx);
                              }}
                              style={styles.dayBarCol}
                              activeOpacity={0.7}
                            >
                              {/* Floating Amount Tag */}
                              <Text
                                color={isOver ? '#EF4444' : isSelected ? '#10B981' : theme.textSecondary}
                                fontSize={8.5}
                                fontFamily={Fonts.bold}
                                numberOfLines={1}
                                style={styles.barTopAmountText}
                              >
                                {day.amount > 0 ? `${Math.round(day.amount)}` : ''}
                              </Text>

                              {/* Bar Pillar Track */}
                              <View
                                style={[
                                  styles.barPillarTrack,
                                  isDark && styles.barPillarTrackDark,
                                  isSelected && { borderColor: barColor, borderWidth: 1.5 },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.barPillarFill,
                                    {
                                      height: barHeight,
                                      backgroundColor: barColor,
                                      opacity: day.amount === 0 ? 0.35 : 1,
                                    },
                                  ]}
                                />
                              </View>

                              {/* Day Label underneath */}
                              <YStack alignItems="center" gap={2} marginTop={6}>
                                <Text
                                  color={day.isToday ? '#10B981' : isSelected ? theme.text : theme.textSecondary}
                                  fontSize={11}
                                  fontFamily={day.isToday || isSelected ? Fonts.bold : Fonts.medium}
                                >
                                  {day.dayName}
                                </Text>
                                {day.isToday && (
                                  <View width={4} height={4} borderRadius={2} backgroundColor="#10B981" />
                                )}
                              </YStack>
                            </TouchableOpacity>
                          );
                        })}
                      </XStack>
                    </View>

                    {/* Selected Day Feedback or Hint */}
                    {selectedDayBarIndex !== null && weeklyAnalytics.days[selectedDayBarIndex] ? (
                      <View
                        style={[
                          styles.selectedDayFeedbackPill,
                          isDark && styles.selectedDayFeedbackPillDark,
                        ]}
                      >
                        <XStack justifyContent="space-between" alignItems="center">
                          <XStack alignItems="center" gap={6}>
                            <View
                              width={8}
                              height={8}
                              borderRadius={4}
                              backgroundColor={
                                weeklyAnalytics.days[selectedDayBarIndex].amount > weeklyAnalytics.dailyLimit
                                  ? '#EF4444'
                                  : '#10B981'
                              }
                            />
                            <Text color={theme.text} fontSize={12} fontFamily={Fonts.bold}>
                              {weeklyAnalytics.days[selectedDayBarIndex].dayName} ({weeklyAnalytics.days[selectedDayBarIndex].dateStr})
                            </Text>
                          </XStack>
                          <Text
                            color={
                              weeklyAnalytics.days[selectedDayBarIndex].amount > weeklyAnalytics.dailyLimit
                                ? '#EF4444'
                                : '#10B981'
                            }
                            fontSize={12}
                            fontFamily={Fonts.bold}
                          >
                            {currencySymbol}{weeklyAnalytics.days[selectedDayBarIndex].amount.toLocaleString()}
                            {weeklyAnalytics.days[selectedDayBarIndex].amount > weeklyAnalytics.dailyLimit
                              ? ` (+${currencySymbol}${(weeklyAnalytics.days[selectedDayBarIndex].amount - weeklyAnalytics.dailyLimit).toLocaleString()} over)`
                              : ' (In Budget)'}
                          </Text>
                        </XStack>
                      </View>
                    ) : (
                      <Text
                        color={theme.textSecondary}
                        fontSize={11}
                        fontFamily={Fonts.medium}
                        textAlign="center"
                        opacity={0.7}
                      >
                        💡 Tap any day bar to inspect your spending habit
                      </Text>
                    )}
                  </YStack>
                )}

                {/* Bottom Financial Health Summary Bar */}
                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  paddingTop={12}
                  borderTopWidth={1}
                  borderTopColor={isDark ? '#334155' : '#E5E7EB'}
                  gap={8}
                >
                  <XStack alignItems="center" gap={6} flex={1} marginRight={6}>
                    <View
                      width={6}
                      height={6}
                      borderRadius={3}
                      backgroundColor={effectiveSpent > effectiveBudget ? '#EF4444' : '#10B981'}
                      flexShrink={0}
                    />
                    <Text
                      color={theme.textSecondary}
                      fontSize={11.5}
                      fontFamily={Fonts.medium}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      Remaining: <Text color={effectiveSpent > effectiveBudget ? '#EF4444' : '#10B981'} fontFamily={Fonts.bold}>{currencySymbol}{effectiveRemaining.toLocaleString()}</Text>
                    </Text>
                  </XStack>

                  <Text
                    color={effectiveSpent > effectiveBudget ? '#EF4444' : '#10B981'}
                    fontSize={11.5}
                    fontFamily={Fonts.bold}
                    numberOfLines={1}
                    flexShrink={0}
                  >
                    {effectiveSpent > effectiveBudget
                      ? `Over by ${currencySymbol}${(effectiveSpent - effectiveBudget).toLocaleString()}`
                      : 'On Track'}
                  </Text>
                </XStack>
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
                          <XStack justifyContent="space-between" alignItems="center" gap={8}>
                            <XStack alignItems="center" gap={12} flex={1} marginRight={6}>
                              <PhosphorCategoryIcon
                                name={cat}
                                size={26}
                                primaryColor={theme.mode === 'dark' ? '#1E293B' : '#0F172A'}
                                accentColor="#10B981"
                              />
                              <YStack gap={2} flex={1}>
                                <Text color={theme.text} fontSize={14.5} fontFamily={Fonts.bold} numberOfLines={1} ellipsizeMode="tail">
                                  {cat}
                                </Text>
                                <Text color={theme.textSecondary} fontSize={11} fontFamily={Fonts.medium} numberOfLines={1} ellipsizeMode="tail">
                                  {currencySymbol}{spent.toLocaleString()} / {currencySymbol}{limit.toLocaleString()}
                                </Text>
                              </YStack>
                            </XStack>

                            <Text
                              color={isOver ? '#EF4444' : '#10B981'}
                              fontSize={12.5}
                              fontFamily={Fonts.bold}
                              numberOfLines={1}
                              flexShrink={0}
                            >
                              {isOver ? 'OVER' : `${Math.round(ratio * 100)}%`}
                            </Text>
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
                <TouchableOpacity onPress={handlePrevMonth} style={[styles.monthArrowBtn, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#F5F5F5' : '#1E293B' }]} activeOpacity={0.7}>
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

                <TouchableOpacity onPress={handleNextMonth} style={[styles.monthArrowBtn, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#F5F5F5' : '#1E293B' }]} activeOpacity={0.7}>
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
                      <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={16} paddingVertical={12} borderBottomWidth={1} borderBottomColor={theme.mode === 'hybrid' || theme.mode === 'light' ? '#F5F5F5' : '#1E293B'}>
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
                                <YStack alignItems="flex-end" gap={1}>
                                  <Text
                                    color={exp.type === 'income' ? '#10B981' : '#EF4444'}
                                    fontSize={14.5}
                                    fontFamily={Fonts.bold}
                                  >
                                    {exp.type === 'income' ? '+' : '-'}{currencySymbol}{exp.amount.toLocaleString()}
                                  </Text>
                                  <Text color={theme.textSecondary} fontSize={10} fontFamily={Fonts.medium}>
                                    {exp.date}
                                  </Text>
                                  {exp.time ? (
                                    <Text color={theme.textSecondary} fontSize={9.5} opacity={0.8} fontFamily={Fonts.regular}>
                                      {exp.time}
                                    </Text>
                                  ) : null}
                                </YStack>
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
          {/* TAB 3: SAVINGS POT (UNSPENT TRACKER)                                      */}
          {/* ========================================================================= */}
          {activeTab === 'savings' && (
            <YStack gap={16}>
              {/* Savings Vault Hero Card */}
              <View style={[styles.analyticsHeroCard, isDark && styles.analyticsHeroCardDark]}>
                <YStack alignItems="center" gap={4} paddingVertical={12}>
                  <Text color="#10B981" fontSize={11} fontFamily={Fonts.bold} letterSpacing={0.8} textTransform="uppercase">
                    Total Unspent Savings
                  </Text>
                  <Text color={theme.text} fontSize={36} fontFamily={Fonts.extraBold}>
                    {currencySymbol}{store.unspentSavingsVault.toLocaleString()}
                  </Text>
                  <Text color={theme.textSecondary} fontSize={12} fontFamily={Fonts.medium} textAlign="center" marginTop={4}>
                    Money you successfully saved by staying under budget across cycles.
                  </Text>
                </YStack>
              </View>

              {/* Transactions / Savings Records */}
              <View style={[styles.categoryCard, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#FFFFFF' : '#131D31' }]}>
                <Text color={theme.text} fontSize={16} fontFamily={Fonts.bold} marginBottom={12}>
                  Savings History
                </Text>
                {store.savingsRecords && store.savingsRecords.length > 0 ? (
                  <YStack>
                    {store.savingsRecords.map((record, i) => (
                      <XStack
                        key={record.id}
                        justifyContent="space-between"
                        alignItems="center"
                        paddingVertical={12}
                        borderBottomWidth={i === store.savingsRecords.length - 1 ? 0 : 1}
                        borderBottomColor={theme.border}
                      >
                        <XStack alignItems="center" gap={12}>
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                            <PhosphorIcon name="PiggyBank" size={20} color="#10B981" weight="duotone" />
                          </View>
                          <YStack>
                            <Text color={theme.text} fontSize={14} fontFamily={Fonts.bold}>
                              {record.cycle.charAt(0).toUpperCase() + record.cycle.slice(1)} Savings
                            </Text>
                            <Text color={theme.textSecondary} fontSize={11} fontFamily={Fonts.medium}>
                              {record.date} • {record.time}
                            </Text>
                          </YStack>
                        </XStack>
                        <Text color="#10B981" fontSize={15} fontFamily={Fonts.bold}>
                          +{currencySymbol}{record.amount.toLocaleString()}
                        </Text>
                      </XStack>
                    ))}
                  </YStack>
                ) : (
                  <YStack alignItems="center" paddingVertical={24} gap={8}>
                    <View style={{ opacity: 0.5 }}>
                      <PhosphorIcon name="Receipt" size={32} color={theme.textSecondary} />
                    </View>
                    <Text color={theme.textSecondary} fontSize={13} fontFamily={Fonts.medium} textAlign="center">
                      No savings history yet.{'\n'}Unspent money is added here at the end of your cycle!
                    </Text>
                  </YStack>
                )}
              </View>
            </YStack>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: SAVINGS GOALS                                                      */}
          {/* ========================================================================= */}
          {activeTab === 'goals' && (
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
                          <TouchableOpacity
                            onPress={() => {
                              setEditGoalId(g.id);
                              setEditGoalName(g.name);
                              setEditGoalTargetAmount(formatNumberMask(g.targetAmount.toString()));
                            }}
                            style={[
                              styles.contributeBtn,
                              {
                                flex: 1,
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.04)',
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)',
                              },
                            ]}
                            activeOpacity={0.8}
                          >
                            <XStack alignItems="center" justifyContent="center" gap={6}>
                              <PhosphorIcon name="Pencil" size={13} color={theme.text} />
                              <Text color={theme.text} fontSize={12} fontFamily={Fonts.bold}>
                                Edit Goal
                              </Text>
                            </XStack>
                          </TouchableOpacity>
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
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }]}>
            <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor={isDark ? '#334155' : '#E2E8F0'} paddingBottom={12}>
              <XStack alignItems="center" gap={8}>
                <PhosphorCategoryIcon name={transactionType === 'income' ? 'Bills' : 'Shopping'} size={22} primaryColor={isDark ? '#0F172A' : '#FFFFFF'} accentColor="#10B981" style={{ width: 32, height: 32, borderRadius: 8 }} />
                <Text color={isDark ? '#FFFFFF' : '#0F172A'} fontSize={16} fontFamily={Fonts.bold}>
                  {transactionType === 'income' ? 'Log Income' : 'Log Expense'}
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setShowExpenseForm(false)}>
                <PhosphorIcon name="XCircle" size={20} color={isDark ? '#94A3B8' : '#64748B'} weight="fill" />
              </TouchableOpacity>
            </XStack>

            <ScrollView contentContainerStyle={{ gap: 14, paddingTop: 12 }}>
              {/* Type Switcher */}
              <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#0F172A' : '#F5F5F5', borderRadius: 8, padding: 3 }}>
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
                  <Text color={transactionType === 'expense' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'} fontSize={12} fontFamily={Fonts.bold}>
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
                  <Text color={transactionType === 'income' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'} fontSize={12} fontFamily={Fonts.bold}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Category selector */}
              <YStack gap={6}>
                <Text color={isDark ? '#94A3B8' : '#64748B'} fontSize={11} fontFamily={Fonts.bold}>SELECT CATEGORY</Text>
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
                        style={[styles.catSelectPill, { backgroundColor: isDark ? '#0F172A' : '#F5F5F5', borderColor: isDark ? '#334155' : '#E2E8F0' }, isSel && styles.catSelectPillActive]}
                        activeOpacity={0.8}
                      >
                        <XStack alignItems="center" gap={6}>
                          <PhosphorCategoryIcon
                            name={cat}
                            size={16}
                            primaryColor={isSel ? '#FFFFFF' : isDark ? '#0F172A' : '#FFFFFF'}
                            accentColor={isSel ? '#FFFFFF' : '#10B981'}
                            backgroundColor="transparent"
                            style={{ width: 18, height: 18 }}
                          />
                          <Text color={isSel ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'} fontSize={12} fontFamily={Fonts.bold}>
                            {cat}
                          </Text>
                        </XStack>
                      </TouchableOpacity>
                    );
                  })}
                </XStack>
              </YStack>

              <FormInput
                variant="default"
                label={transactionType === 'income' ? 'Income Source' : 'Item Name / Merchant'}
                placeholder={transactionType === 'income' ? 'e.g. Allowance, Freelance, Gift' : 'e.g. Jollibee, Jeepney'}
                value={expenseName}
                onChangeText={handleExpenseNameChange}
              />
              <FormInput
                variant="default"
                label={`Amount (${currencySymbol})`}
                placeholder="e.g. 150"
                keyboardType="numeric"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
              />
              <FormInput
                variant="default"
                label="Notes (Optional)"
                placeholder="e.g. Lunch with friends"
                value={expenseNotes}
                onChangeText={setExpenseNotes}
              />

              <XStack gap={10} marginTop={8}>
                <TouchableOpacity onPress={() => setShowExpenseForm(false)} style={[styles.modalCancelBtn, { backgroundColor: isDark ? '#0F172A' : '#F5F5F5' }]}>
                  <Text color={isDark ? '#94A3B8' : '#64748B'} fontSize={13} fontFamily={Fonts.bold}>Cancel</Text>
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
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }]}>
            <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor={isDark ? '#334155' : '#E2E8F0'} paddingBottom={12}>
              <XStack alignItems="center" gap={8}>
                <PhosphorCategoryIcon name={editExpenseCategory} size={20} primaryColor={isDark ? '#0F172A' : '#FFFFFF'} accentColor="#10B981" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <Text color={isDark ? '#FFFFFF' : '#0F172A'} fontSize={16} fontFamily={Fonts.bold}>
                  Edit Transaction
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setShowEditExpenseModal(false)}>
                <PhosphorIcon name="XCircle" size={20} color={isDark ? '#94A3B8' : '#64748B'} weight="fill" />
              </TouchableOpacity>
            </XStack>

            <ScrollView contentContainerStyle={{ gap: 14, paddingTop: 12 }}>
              <YStack gap={6}>
                <Text color={isDark ? '#94A3B8' : '#64748B'} fontSize={11} fontFamily={Fonts.bold}>CATEGORY</Text>
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
                        style={[styles.catSelectPill, { backgroundColor: isDark ? '#0F172A' : '#F5F5F5', borderColor: isDark ? '#334155' : '#E2E8F0' }, isSel && styles.catSelectPillActive]}
                        activeOpacity={0.8}
                      >
                        <Text color={isSel ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'} fontSize={12} fontFamily={Fonts.bold}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </XStack>
              </YStack>

              <FormInput variant="default" label="Name" placeholder="e.g. Jollibee" value={editExpenseName} onChangeText={setEditExpenseName} />
              <FormInput variant="default" label={`Amount (${currencySymbol})`} placeholder="e.g. 150" keyboardType="numeric" value={editExpenseAmount} onChangeText={setEditExpenseAmount} />
              <FormInput variant="default" label="Notes" placeholder="e.g. With friends" value={editExpenseNotes} onChangeText={setEditExpenseNotes} />

              <XStack gap={10} marginTop={8}>
                <TouchableOpacity onPress={() => setShowEditExpenseModal(false)} style={[styles.modalCancelBtn, { backgroundColor: isDark ? '#0F172A' : '#F5F5F5' }]}>
                  <Text color={isDark ? '#94A3B8' : '#64748B'} fontSize={13} fontFamily={Fonts.bold}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEditExpense} style={styles.modalSubmitBtn}>
                  <Text color="#FFFFFF" fontSize={13} fontFamily={Fonts.bold}>Save Changes</Text>
                </TouchableOpacity>
              </XStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL: EDIT SAVINGS GOAL ==================== */}
      <Modal visible={editGoalId !== null} transparent animationType="slide" onRequestClose={() => setEditGoalId(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }]}>
            <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor={isDark ? '#334155' : '#E2E8F0'} paddingBottom={12}>
              <XStack alignItems="center" gap={8}>
                <PhosphorCategoryIcon name="savings" size={20} primaryColor={isDark ? '#0F172A' : '#FFFFFF'} accentColor="#10B981" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <Text color={isDark ? '#FFFFFF' : '#0F172A'} fontSize={16} fontFamily={Fonts.bold}>
                  Edit Savings Goal
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setEditGoalId(null)}>
                <PhosphorIcon name="XCircle" size={20} color={isDark ? '#94A3B8' : '#64748B'} weight="fill" />
              </TouchableOpacity>
            </XStack>

            <YStack gap={14} paddingTop={12}>
              {(() => {
                const goal = store.savingsGoals.find((g) => g.id === editGoalId);
                return (
                  <Text color={isDark ? '#94A3B8' : '#64748B'} fontSize={12} fontFamily={Fonts.medium}>
                    Currently saved: <Text color="#10B981" fontFamily={Fonts.bold}>{currencySymbol}{(goal?.currentSavings || 0).toLocaleString()}</Text>
                  </Text>
                );
              })()}
              <FormInput
                variant="default"
                label="Goal Name"
                placeholder="e.g. Laptop"
                value={editGoalName}
                onChangeText={setEditGoalName}
              />
              <FormInput
                variant="default"
                label={`Target Amount (${currencySymbol})`}
                placeholder="e.g. 25,000"
                keyboardType="numeric"
                value={editGoalTargetAmount}
                onChangeText={(val) => setEditGoalTargetAmount(formatNumberMask(val))}
              />
              <XStack gap={10} marginTop={8}>
                <TouchableOpacity onPress={() => setEditGoalId(null)} style={[styles.modalCancelBtn, { backgroundColor: isDark ? '#0F172A' : '#F5F5F5' }]}>
                  <Text color={isDark ? '#94A3B8' : '#64748B'} fontSize={13} fontFamily={Fonts.bold}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEditGoal} style={styles.modalSubmitBtn}>
                  <Text color="#FFFFFF" fontSize={13} fontFamily={Fonts.bold}>Save Changes</Text>
                </TouchableOpacity>
              </XStack>
            </YStack>
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL: ADD SAVINGS GOAL ==================== */}
      <Modal visible={showAddGoalModal} transparent animationType="slide" onRequestClose={() => setShowAddGoalModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }]}>
            <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor={isDark ? '#334155' : '#E2E8F0'} paddingBottom={12}>
              <XStack alignItems="center" gap={8}>
                <PhosphorCategoryIcon name="emergency" size={20} primaryColor={isDark ? '#0F172A' : '#FFFFFF'} accentColor="#10B981" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <Text color={isDark ? '#FFFFFF' : '#0F172A'} fontSize={16} fontFamily={Fonts.bold}>
                  Create Savings Goal
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setShowAddGoalModal(false)}>
                <PhosphorIcon name="XCircle" size={20} color={isDark ? '#94A3B8' : '#64748B'} weight="fill" />
              </TouchableOpacity>
            </XStack>

            <ScrollView contentContainerStyle={{ gap: 14, paddingTop: 12 }}>
              <FormInput variant="default" label="Goal Name" placeholder="e.g. Emergency Fund" value={goalName} onChangeText={setGoalName} />
              <FormInput
                variant="default"
                label={`Target Amount (${currencySymbol})`}
                placeholder="e.g. 5,000"
                keyboardType="numeric"
                value={goalTargetAmount}
                onChangeText={(val) => setGoalTargetAmount(formatNumberMask(val))}
              />

              <XStack gap={10} marginTop={8}>
                <TouchableOpacity onPress={() => setShowAddGoalModal(false)} style={[styles.modalCancelBtn, { backgroundColor: isDark ? '#0F172A' : '#F5F5F5' }]}>
                  <Text color={isDark ? '#94A3B8' : '#64748B'} fontSize={13} fontFamily={Fonts.bold}>Cancel</Text>
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
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }]}>
            <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor={isDark ? '#334155' : '#E2E8F0'} paddingBottom={12}>
              <XStack alignItems="center" gap={8}>
                <PhosphorCategoryIcon name="savings" size={20} primaryColor={isDark ? '#0F172A' : '#FFFFFF'} accentColor="#10B981" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <Text color={isDark ? '#FFFFFF' : '#0F172A'} fontSize={16} fontFamily={Fonts.bold}>
                  Contribute Savings
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setContributeGoalId(null)}>
                <PhosphorIcon name="XCircle" size={20} color={isDark ? '#94A3B8' : '#64748B'} weight="fill" />
              </TouchableOpacity>
            </XStack>

            <YStack gap={14} paddingTop={12}>
              <Text color={isDark ? '#94A3B8' : '#64748B'} fontSize={12} fontFamily={Fonts.medium}>
                Available {cycleMetrics.cycleName.toLowerCase()} balance: <Text color="#10B981" fontFamily={Fonts.bold}>{currencySymbol}{cycleMetrics.balance.toLocaleString()}</Text>
              </Text>
              <FormInput
                variant="default"
                label={`Contribution Amount (${currencySymbol})`}
                placeholder="e.g. 500"
                keyboardType="numeric"
                value={contributeAmount}
                onChangeText={(val) => setContributeAmount(formatNumberMask(val))}
              />

              <XStack gap={10} marginTop={8}>
                <TouchableOpacity onPress={() => setContributeGoalId(null)} style={[styles.modalCancelBtn, { backgroundColor: isDark ? '#0F172A' : '#F5F5F5' }]}>
                  <Text color={isDark ? '#94A3B8' : '#64748B'} fontSize={13} fontFamily={Fonts.bold}>Cancel</Text>
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
              <View style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }]}>
                <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor={isDark ? '#334155' : '#E2E8F0'} paddingBottom={12}>
                  <XStack alignItems="center" gap={8}>
                    <PhosphorCategoryIcon name={cat} size={20} primaryColor={isDark ? '#0F172A' : '#FFFFFF'} accentColor={catColor} style={{ width: 28, height: 28, borderRadius: 6 }} />
                    <Text color={isDark ? '#FFFFFF' : '#0F172A'} fontSize={16} fontFamily={Fonts.bold}>
                      {cat} Logs
                    </Text>
                  </XStack>
                  <TouchableOpacity onPress={() => setSelectedCategoryBreakdown(null)}>
                    <PhosphorIcon name="XCircle" size={20} color={isDark ? '#94A3B8' : '#64748B'} weight="fill" />
                  </TouchableOpacity>
                </XStack>

                <YStack gap={10} marginVertical={12}>
                  <XStack justifyContent="space-between">
                    <Text color={isDark ? '#94A3B8' : '#64748B'} fontSize={12} fontFamily={Fonts.medium}>Total Limit</Text>
                    <Text color={isDark ? '#FFFFFF' : '#0F172A'} fontSize={14} fontFamily={Fonts.bold}>{currencySymbol}{limitInCat.toLocaleString()}</Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text color={isDark ? '#94A3B8' : '#64748B'} fontSize={12} fontFamily={Fonts.medium}>Total Spent</Text>
                    <Text color={spentInCat > limitInCat ? '#EF4444' : '#10B981'} fontSize={14} fontFamily={Fonts.bold}>
                      {currencySymbol}{spentInCat.toLocaleString()}
                    </Text>
                  </XStack>
                </YStack>

                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  {catExpenses.length === 0 ? (
                    <Text color={isDark ? '#94A3B8' : '#64748B'} fontSize={12} textAlign="center" padding={16}>
                      No purchases logged under {cat} yet.
                    </Text>
                  ) : (
                    catExpenses.map((exp) => (
                      <XStack key={exp.id} justifyContent="space-between" alignItems="center" padding={10} backgroundColor={isDark ? '#0F172A' : '#F8FAFC'} borderRadius={8} marginBottom={6}>
                        <YStack gap={1}>
                          <Text color={isDark ? '#FFFFFF' : '#0F172A'} fontSize={13} fontFamily={Fonts.bold}>{exp.name}</Text>
                          <Text color={isDark ? '#94A3B8' : '#64748B'} fontSize={10}>{exp.date}</Text>
                          {exp.time ? (
                            <Text color={isDark ? '#64748B' : '#94A3B8'} fontSize={9.5}>{exp.time}</Text>
                          ) : null}
                        </YStack>
                        <Text color={isDark ? '#FFFFFF' : '#0F172A'} fontSize={13} fontFamily={Fonts.bold}>{currencySymbol}{exp.amount.toLocaleString()}</Text>
                      </XStack>
                    ))
                  )}
                </ScrollView>
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* ==================== MODAL: SET BUDGET / ALLOWANCE ==================== */}
      <SetBudgetModal
        visible={showEditAllowanceModal}
        onClose={() => setShowEditAllowanceModal(false)}
        currentCycle={(store.budgetType || 'monthly') as any}
        initialAmount={store.totalBudget > 0 ? store.totalBudget : effectiveBudget}
        currencySymbol={currencySymbol}
        onSave={(cycle, amt) => {
          const categories = store.selectedCategories && store.selectedCategories.length > 0
            ? store.selectedCategories
            : ['Food', 'Transportation', 'School', 'Bills', 'Shopping', 'Entertainment'];

          const defaultPercentages: Record<string, number> = {
            Food: 0.35,
            Transportation: 0.20,
            School: 0.15,
            Bills: 0.15,
            Shopping: 0.08,
            Entertainment: 0.07,
          };

          const newLimits: Record<string, number> = {};
          categories.forEach((cat) => {
            const pct = defaultPercentages[cat] || (1 / categories.length);
            newLimits[cat] = Math.round(amt * pct);
          });

          store.setupBudget(cycle as any, amt, categories, newLimits);
          Alert.alert(
            'Budget Updated!',
            `${cycle === 'daily' ? 'Daily baon' : cycle === 'weekly' ? 'Weekly allowance' : 'Monthly budget'} set to ${currencySymbol}${amt.toLocaleString()}.`
          );
        }}
      />
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
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  analyticsHeroCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
      } as any,
    }),
  },
  analyticsHeroCardDark: {
    backgroundColor: '#131D31',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  donutWrapper: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
    marginVertical: 10,
  },
  donutCenterTextWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  categoryAnalyticItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryAnalyticItemDark: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  catAnalyticIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCategoryTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
    width: '100%',
    overflow: 'hidden',
  },
  miniCategoryFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryPercentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusCapsule: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 3,
  },
  analyticsSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 9,
  },
  analyticsSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
      } as any,
    }),
  },
  analyticsSegmentBtnActiveDark: {
    backgroundColor: '#334155',
  },
  weeklyBarChartContainer: {
    position: 'relative',
    paddingTop: 14,
    paddingBottom: 4,
    width: '100%',
  },
  targetGuideLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    pointerEvents: 'none',
  },
  targetGuideLineDash: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    opacity: 0.45,
  },
  targetGuideLabel: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 2,
  },
  dayBarCol: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  barTopAmountText: {
    height: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  barPillarTrack: {
    width: 22,
    height: 110,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 11,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    alignItems: 'center',
  },
  barPillarTrackDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  barPillarFill: {
    width: '100%',
    borderRadius: 11,
  },
  selectedDayFeedbackPill: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedDayFeedbackPillDark: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  analyticsLimitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  analyticsStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
    backgroundColor: '#F5F5F5',
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
    backgroundColor: '#F5F5F5',
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
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
