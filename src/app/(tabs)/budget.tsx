import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert, Modal, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Button, Progress, View } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { useGamificationStore } from '@/store/gamificationStore';
import type { Expense, SavingsGoal } from '@/store/gamificationStore';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { Spacing } from '@/constants/theme';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { useAuthStore } from '@/store/authStore';
import { useLocalSearchParams } from 'expo-router';

// Map categories to Symbol Names
const CATEGORY_ICONS: Record<string, SymbolViewProps['name']> = {
  Food: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' } as const,
  Transportation: { ios: 'car.fill', android: 'directions_car', web: 'directions_car' } as const,
  School: { ios: 'book.fill', android: 'school', web: 'school' } as const,
  Bills: { ios: 'doc.text.fill', android: 'receipt_long', web: 'receipt_long' } as const,
  Shopping: { ios: 'bag.fill', android: 'local_mall', web: 'local_mall' } as const,
  Entertainment: { ios: 'gamecontroller.fill', android: 'sports_esports', web: 'sports_esports' } as const,
  Savings: { ios: 'banknote.fill', android: 'savings', web: 'savings' } as const,
  'Emergency Fund': { ios: 'shield.fill', android: 'shield', web: 'shield' } as const,
  Custom: { ios: 'questionmark.circle.fill', android: 'help', web: 'help' } as const,
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#F59E0B', // Amber
  Transportation: '#3B82F6', // Blue
  School: '#8B5CF6', // Purple
  Bills: '#EF4444', // Red
  Shopping: '#EC4899', // Pink
  Entertainment: '#84CC16', // Lime
  Savings: '#10B981', // Emerald
  'Emergency Fund': '#06B6D4', // Cyan
  Custom: '#64748B', // Slate
};

const SAVINGS_CATEGORY_ICONS: Record<string, SymbolViewProps['name']> = {
  'Emergency Fund': { ios: 'shield.fill', android: 'shield', web: 'shield' } as const,
  'New Laptop': { ios: 'laptopcomputer', android: 'laptop', web: 'laptop' } as const,
  'School Tuition': { ios: 'graduationcap.fill', android: 'school', web: 'school' } as const,
  'Travel Fund': { ios: 'airplane', android: 'flight', web: 'flight' } as const,
  'Phone Upgrade': { ios: 'iphone', android: 'smartphone', web: 'smartphone' } as const,
  'Business Capital': { ios: 'briefcase.fill', android: 'work', web: 'work' } as const,
  Custom: { ios: 'star.fill', android: 'star', web: 'star' } as const,
};

export default function BudgetScreen() {
  const theme = useTheme() as any;
  const store = useGamificationStore();
  const { user } = useAuthStore();
  const isGuest = user?.id === 'guest';

  const params = useLocalSearchParams<{ action?: string }>();

  useEffect(() => {
    if (params.action === 'log') {
      setShowExpenseForm(true);
    }
  }, [params.action]);

  // Onboarding Wizard local states
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [setupBudgetType, setSetupBudgetType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [setupAmount, setSetupAmount] = useState('');
  const [setupCategories, setSetupCategories] = useState<string[]>(['Food', 'Transportation', 'School']);
  const [setupCategoryLimits, setSetupCategoryLimits] = useState<Record<string, string>>({});
  const [setupBillsAmount, setSetupBillsAmount] = useState('');
  const [setupDailyAmount, setSetupDailyAmount] = useState('');
  const [selectedCategoryBreakdown, setSelectedCategoryBreakdown] = useState<string | null>(null);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'budget' | 'savings' | 'history'>('budget');

  // Add Expense Form local states
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Add Savings Goal Modal states
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCategory, setGoalCategory] = useState('Emergency Fund');
  const [goalTargetDate, setGoalTargetDate] = useState('120'); // days to achieve

  // Contribute Savings Modal states
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  // Derived Budget calculations
  const totalSpent = store.loggedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSavingsContribution = store.savingsGoals.reduce((sum, g) => sum + g.currentSavings, 0);
  const budgetRemaining = store.totalBudget - totalSpent;
  // Available budget leftover (excluding what's already saved and what's in invest simulator)
  const budgetLeftover = Math.max(0, budgetRemaining - totalSavingsContribution - store.virtualBalance);

  // Categories list options
  const defaultCategories = ['Food', 'Transportation', 'School', 'Bills', 'Shopping', 'Entertainment', 'Savings', 'Emergency Fund'];

  // Handle Onboarding Completion
  // Transition to Step 4 Limits Allocation
  const handleGoToStep4 = () => {
    if (setupCategories.length === 0) {
      Alert.alert('Categories Required', 'Please select at least one category to track.');
      return;
    }
    
    const totalAmt = parseFloat(setupAmount) || 0;
    const billsAmt = parseFloat(setupBillsAmount) || 0;
    // Daily spending = total minus fixed commitments
    const dailyAmt = Math.max(0, totalAmt - billsAmt);
    
    const otherCategories = setupCategories.filter(c => c !== 'Bills');
    const equalShare = otherCategories.length > 0
      ? Math.round(dailyAmt / otherCategories.length)
      : 0;
      
    const initialLimits: Record<string, string> = {};
    
    if (setupCategories.includes('Bills') && billsAmt > 0) {
      initialLimits['Bills'] = billsAmt.toString();
    }
    
    otherCategories.forEach((cat, idx) => {
      if (idx === otherCategories.length - 1) {
        const sumOfPrev = equalShare * (otherCategories.length - 1);
        initialLimits[cat] = Math.max(0, dailyAmt - sumOfPrev).toString();
      } else {
        initialLimits[cat] = equalShare.toString();
      }
    });
    
    setSetupCategoryLimits(initialLimits);
    setOnboardingStep(4);
  };

  const handleOnboardingComplete = () => {
    const amt = parseFloat(setupAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid budget limit.');
      return;
    }
    if (setupCategories.length === 0) {
      Alert.alert('Categories Required', 'Please select at least one category to track.');
      return;
    }

    const numericLimits: Record<string, number> = {};
    setupCategories.forEach((cat) => {
      numericLimits[cat] = parseFloat(setupCategoryLimits[cat]) || 0;
    });

    store.setupBudget(setupBudgetType, amt, setupCategories, numericLimits);
    Alert.alert('Onboarding Complete!', `Your ${setupBudgetType} budget of ₱${amt.toLocaleString()} has been set up!${isGuest ? '' : ' (+30 XP)'}`);
  };

  // Add Custom Category in Onboarding
  const handleAddCustomCategory = () => {
    const name = customCategoryName.trim();
    if (!name) return;
    if (setupCategories.includes(name)) {
      Alert.alert('Duplicate Category', 'This category is already added.');
      return;
    }
    setSetupCategories([...setupCategories, name]);
    setCustomCategoryName('');
    setShowCustomCatInput(false);
  };

  // Handle Log Simulated Expense
  const handleLogExpense = () => {
    const amt = parseFloat(expenseAmount);
    if (!expenseCategory) {
      Alert.alert('Missing Field', 'Please select a category.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid price amount.');
      return;
    }

    const finalExpenseName = expenseName.trim() || `${expenseCategory} Purchase`;
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    store.addExpense(finalExpenseName, expenseCategory, amt, todayStr, expenseNotes.trim());
    
    // Quick Reset
    setExpenseName('');
    setExpenseAmount('');
    setExpenseNotes('');
    setShowExpenseForm(false);
    
    // Check if limit exceeded in this category
    const catTotalSpent = store.loggedExpenses
      .filter((e) => e.category === expenseCategory)
      .reduce((sum, e) => sum + e.amount, 0) + amt;
    
    // Custom limit per category if set, fallback to equal share
    const categoryLimit = store.categoryLimits?.[expenseCategory] || (store.totalBudget / (store.selectedCategories.length || 1));

    if (catTotalSpent > categoryLimit) {
      Alert.alert('Budget Alert!', `You've exceeded your limit allocation for ${expenseCategory}! Be mindful of overspending.${isGuest ? '' : ' (+10 XP)'}`);
    } else {
      Alert.alert('Expense Logged!', `Simulated purchase of ₱${amt.toLocaleString()} recorded.${isGuest ? '' : ' (+10 XP)'}`);
    }
  };

  // Handle Add Savings Goal
  const handleAddGoal = () => {
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
    setGoalTargetDate('120');
    setShowAddGoalModal(false);

    Alert.alert('Savings Goal Set!', `Goal "${goalName.trim()}" created with target ₱${target.toLocaleString()}.${isGuest ? '' : ' (+15 XP)'}`);
  };

  // Handle Contribute Savings Goal
  const handleContributeSavings = () => {
    const amt = parseFloat(contributeAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid contribution amount.');
      return;
    }
    if (amt > budgetLeftover) {
      Alert.alert(
        'Insufficient Budget Leftover',
        `You only have ₱${budgetLeftover.toLocaleString()} remaining in your budget after bills, spending, and other savings.`
      );
      return;
    }

    if (contributeGoalId) {
      const success = store.contributeToSavingsGoal(contributeGoalId, amt);
      if (success) {
        Alert.alert('Contribution Logged!', `₱${amt.toLocaleString()} contributed to savings goal!${isGuest ? '' : ' (+15 XP)'}`);
        setContributeAmount('');
        setContributeGoalId(null);
      } else {
        Alert.alert('Error', 'Unable to complete savings goal contribution.');
      }
    }
  };


  // Render First-Time Setup
  if (!store.isBudgetSetupComplete) {
    return (
      <YStack flex={1} backgroundColor={theme.background}>
        <BackgroundSystem mode="tabs" height={380} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <YStack gap={Spacing[16]} paddingVertical={Spacing[16]} alignItems="center">
              <Text color={theme.primary as any} fontSize={14} fontWeight="700" letterSpacing={1} textTransform="uppercase">
                Step {onboardingStep} of 4
              </Text>
              <Text color="#FFFFFF" fontSize={22} fontWeight="700" textAlign="center" letterSpacing={-0.5}>
                Let's Create Your First Budget
              </Text>
              <Text color="rgba(255,255,255,0.7)" fontSize={14} textAlign="center" paddingHorizontal={10}>
                Cbudget helps you build healthy financial habits starting with structured budgeting rules.
              </Text>
            </YStack>


            {/* STEP 1: Budget Type */}
            {onboardingStep === 1 && (
              <View>
                <CbudgetCard gap={20} marginTop={Spacing[16]}>
                  <Text color={theme.text} fontSize={16} fontWeight="700">
                    What type of budget are you creating?
                  </Text>
                  
                  <YStack gap={10}>
                    {(['daily', 'weekly', 'monthly'] as const).map((type) => {
                      const isSelected = setupBudgetType === type;
                      return (
                        <Button
                          key={type}
                          backgroundColor={isSelected ? (`${theme.primary}12` as any) : theme.backgroundElement}
                          borderColor={isSelected ? theme.primary : 'transparent'}
                          borderWidth={1.5}
                          borderRadius={12}
                          height={54}
                          onPress={() => setSetupBudgetType(type)}
                          pressStyle={{ opacity: 0.9 }}
                        >
                          <XStack width="100%" alignItems="center" gap={12}>
                            <SymbolView
                              name={
                                type === 'daily' 
                                  ? ({ ios: 'calendar.day.timeline.left', android: 'calendar_today', web: 'calendar_today' } as const)
                                  : type === 'weekly'
                                  ? ({ ios: 'calendar.badge.clock', android: 'date_range', web: 'date_range' } as const)
                                  : ({ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' } as const)
                              }
                              size={18}
                              tintColor={isSelected ? theme.primary : theme.textSecondary}
                            />
                            <Text color={theme.text} fontSize={15} fontWeight={isSelected ? '700' : '400'} textTransform="capitalize">
                              {type} Budget
                            </Text>
                          </XStack>
                        </Button>
                      );
                    })}
                  </YStack>

                  <Button
                    backgroundColor={theme.primary as any}
                    borderRadius={6}
                    borderWidth={0}
                    height={46}
                    pressStyle={{ opacity: 0.85 }}
                    onPress={() => setOnboardingStep(2)}
                    marginTop={10}
                  >
                    <Text color="#FFFFFF" fontSize={13} fontWeight="700">Next Step</Text>
                  </Button>
                </CbudgetCard>
              </View>
            )}

            {/* STEP 2: Budget Amount — Single total + optional fixed commitments */}
            {onboardingStep === 2 && (
              <View>
                <CbudgetCard gap={18} marginTop={Spacing[16]}>
                  <YStack gap={4}>
                    <Text color={theme.text} fontSize={16} fontWeight="700">
                      How much is your {setupBudgetType} budget?
                    </Text>
                    <Text color={theme.textSecondary} fontSize={12}>
                      Enter your total spending limit first, then optionally set aside a fixed portion for recurring commitments.
                    </Text>
                  </YStack>

                  <YStack gap={14}>
                    {/* Total budget — primary input */}
                    <FormInput
                      label="Total Budget (₱)"
                      placeholder="e.g. 10000"
                      keyboardType="numeric"
                      value={setupAmount}
                      onChangeText={(val) => {
                        let cleanVal = val.replace(/[^0-9]/g, '');
                        if (cleanVal.length > 1 && cleanVal.startsWith('0')) cleanVal = cleanVal.replace(/^0+/, '');
                        setSetupAmount(cleanVal);
                      }}
                      leftIcon={{ ios: 'banknote', android: 'payments', web: 'payments' } as any}
                    />

                    {/* Optional fixed commitments divider */}
                    <YStack gap={6}>
                      <XStack alignItems="center" gap={8}>
                        <View height={1} flex={1} backgroundColor={theme.border} />
                        <Text color={theme.textSecondary} fontSize={11} fontWeight="600">OPTIONAL</Text>
                        <View height={1} flex={1} backgroundColor={theme.border} />
                      </XStack>
                      <Text color={theme.textSecondary} fontSize={12}>
                        Do you have recurring fixed commitments? (e.g. tuition installment, load plan, transportation pass)
                      </Text>
                    </YStack>

                    <FormInput
                      label="Fixed Commitments (₱)"
                      placeholder="e.g. 2000  —  leave blank if none"
                      keyboardType="numeric"
                      value={setupBillsAmount}
                      onChangeText={(val) => {
                        let cleanVal = val.replace(/[^0-9]/g, '');
                        if (cleanVal.length > 1 && cleanVal.startsWith('0')) cleanVal = cleanVal.replace(/^0+/, '');
                        setSetupBillsAmount(cleanVal);
                      }}
                      leftIcon={{ ios: 'doc.text.fill', android: 'receipt_long', web: 'receipt_long' } as any}
                    />

                    {/* Live breakdown banner — only shown if both have values */}
                    {(() => {
                      const total = parseFloat(setupAmount) || 0;
                      const fixed = parseFloat(setupBillsAmount) || 0;
                      const daily = Math.max(0, total - fixed);
                      if (total <= 0) return null;
                      return (
                        <YStack gap={6} backgroundColor={`${theme.primary}08` as any} padding={12} borderRadius={8} borderWidth={1} borderColor={`${theme.primary}20` as any}>
                          <XStack justifyContent="space-between">
                            <Text color={theme.textSecondary} fontSize={12}>Total Budget</Text>
                            <Text color={theme.text} fontSize={12} fontWeight="700">₱{total.toLocaleString()}</Text>
                          </XStack>
                          {fixed > 0 && (
                            <XStack justifyContent="space-between">
                              <XStack gap={4} alignItems="center">
                                <View width={8} height={8} borderRadius={4} backgroundColor={CATEGORY_COLORS['Bills'] as any} />
                                <Text color={theme.textSecondary} fontSize={12}>Fixed Commitments</Text>
                              </XStack>
                              <Text color={CATEGORY_COLORS['Bills'] as any} fontSize={12} fontWeight="700">₱{fixed.toLocaleString()}</Text>
                            </XStack>
                          )}
                          <XStack justifyContent="space-between">
                            <XStack gap={4} alignItems="center">
                              <View width={8} height={8} borderRadius={4} backgroundColor={theme.success} />
                              <Text color={theme.textSecondary} fontSize={12}>Daily Spending Left</Text>
                            </XStack>
                            <Text color={theme.success} fontSize={12} fontWeight="700">₱{daily.toLocaleString()}</Text>
                          </XStack>
                        </YStack>
                      );
                    })()}
                  </YStack>

                  <XStack gap={10} marginTop={6}>
                    <Button
                      flex={1}
                      backgroundColor={theme.backgroundElement}
                      borderRadius={6}
                      borderColor={theme.border}
                      borderWidth={1}
                      height={46}
                      pressStyle={{ opacity: 0.85 }}
                      onPress={() => setOnboardingStep(1)}
                    >
                      <Text color={theme.text} fontSize={13} fontWeight="700">Back</Text>
                    </Button>
                    <Button
                      flex={1.8}
                      backgroundColor={theme.primary as any}
                      borderRadius={6}
                      borderWidth={0}
                      height={46}
                      pressStyle={{ opacity: 0.85 }}
                      onPress={() => {
                        const total = parseFloat(setupAmount) || 0;
                        if (total <= 0) {
                          Alert.alert('Invalid Amount', 'Please enter a valid total budget amount.');
                          return;
                        }
                        const fixed = parseFloat(setupBillsAmount) || 0;
                        if (fixed > total) {
                          Alert.alert('Too High', 'Fixed commitments cannot exceed your total budget.');
                          return;
                        }
                        // Auto-add Bills category only if fixed commitments > 0
                        if (fixed > 0 && !setupCategories.includes('Bills')) {
                          setSetupCategories(prev => [...prev, 'Bills']);
                        }
                        // If fixed is 0, remove Bills from pre-selection gracefully
                        if (fixed === 0) {
                          setSetupCategories(prev => prev.filter(c => c !== 'Bills'));
                        }
                        setOnboardingStep(3);
                      }}
                    >
                      <Text color="#FFFFFF" fontSize={13} fontWeight="700">Next Step</Text>
                    </Button>
                  </XStack>
                </CbudgetCard>
              </View>
            )}

            {/* STEP 3: Categories Select */}
            {onboardingStep === 3 && (
              <View>
                <CbudgetCard gap={16} marginTop={Spacing[16]}>
                  <Text color={theme.text} fontSize={16} fontWeight="700">
                    Which categories would you like to track?
                  </Text>
                  
                  <XStack flexWrap="wrap" gap={8} marginVertical={8} justifyContent="space-between">
                    {defaultCategories.map((cat) => {
                      const isSelected = setupCategories.includes(cat);
                      const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Custom'];
                      const catIcon = CATEGORY_ICONS[cat] || CATEGORY_ICONS['Custom'];
                      
                      return (
                        <TouchableOpacity
                          key={cat}
                          activeOpacity={0.8}
                          onPress={() => {
                            if (isSelected) {
                              setSetupCategories(setupCategories.filter((c) => c !== cat));
                            } else {
                              setSetupCategories([...setupCategories, cat]);
                            }
                          }}
                          style={{
                            width: '48.5%',
                            marginBottom: 4,
                          }}
                        >
                          <XStack
                            backgroundColor={(isSelected ? `${catColor}12` : theme.backgroundElement) as any}
                            borderColor={(isSelected ? catColor : theme.border) as any}
                            borderWidth={1.5}
                            borderRadius={6}
                            padding={10}
                            alignItems="center"
                            gap={10}
                            height={48}
                          >
                            <View
                              width={28}
                              height={28}
                              borderRadius={6}
                              backgroundColor={(isSelected ? `${catColor}20` : `${theme.textSecondary}15`) as any}
                              alignItems="center"
                              justifyContent="center"
                            >
                              <SymbolView name={catIcon} size={13} tintColor={isSelected ? catColor : theme.textSecondary} />
                            </View>
                            <YStack flex={1} justifyContent="center">
                              <Text color={theme.text} fontSize={12} fontWeight="700" numberOfLines={1}>
                                {cat}
                              </Text>
                            </YStack>
                            {isSelected && (
                              <View
                                width={16}
                                height={16}
                                borderRadius={8}
                                backgroundColor={catColor as any}
                                alignItems="center"
                                justifyContent="center"
                              >
                                <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' } as any} size={10} tintColor="#FFFFFF" />
                              </View>
                            )}
                          </XStack>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Render custom categories user added */}
                    {setupCategories.filter(c => !defaultCategories.includes(c)).map((cat) => {
                      const catColor = CATEGORY_COLORS['Custom'];
                      const catIcon = CATEGORY_ICONS['Custom'];
                      return (
                        <TouchableOpacity
                          key={cat}
                          activeOpacity={0.8}
                          onPress={() => {
                            setSetupCategories(setupCategories.filter((c) => c !== cat));
                          }}
                          style={{
                            width: '48.5%',
                            marginBottom: 4,
                          }}
                        >
                          <XStack
                            backgroundColor={`${catColor}12` as any}
                            borderColor={catColor as any}
                            borderWidth={1.5}
                            borderRadius={6}
                            padding={10}
                            alignItems="center"
                            gap={10}
                            height={48}
                          >
                            <View
                              width={28}
                              height={28}
                              borderRadius={6}
                              backgroundColor={`${catColor}20` as any}
                              alignItems="center"
                              justifyContent="center"
                            >
                              <SymbolView name={catIcon} size={13} tintColor={catColor} />
                            </View>
                            <YStack flex={1} justifyContent="center">
                              <Text color={theme.text} fontSize={12} fontWeight="700" numberOfLines={1}>
                                {cat}
                              </Text>
                            </YStack>
                            <View
                              width={16}
                              height={16}
                              borderRadius={8}
                              backgroundColor={theme.error}
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text color="#FFFFFF" fontSize={9} fontWeight="900">✕</Text>
                            </View>
                          </XStack>
                        </TouchableOpacity>
                      );
                    })}
                  </XStack>

                  {showCustomCatInput ? (
                    <XStack gap={8} alignItems="center" marginTop={4}>
                      <TextInput
                        placeholder="Custom Category name"
                        placeholderTextColor={`${theme.text}45`}
                        value={customCategoryName}
                        onChangeText={setCustomCategoryName}
                        style={[styles.customInput, { color: theme.text, borderColor: theme.border, borderRadius: 6 }]}
                      />
                      <Button
                        backgroundColor={theme.primary as any}
                        height={38}
                        borderRadius={6}
                        borderWidth={0}
                        onPress={handleAddCustomCategory}
                      >
                        <Text color="#FFFFFF" fontSize={12} fontWeight="700">Add</Text>
                      </Button>
                    </XStack>
                  ) : (
                    <Button
                      chromeless
                      height={32}
                      alignSelf="flex-start"
                      onPress={() => setShowCustomCatInput(true)}
                    >
                      <Text color={theme.primary} fontSize={13} fontWeight="600">+ Add Custom Category</Text>
                    </Button>
                  )}

                  <XStack gap={10} marginTop={12}>
                    <Button
                      flex={1}
                      backgroundColor={theme.backgroundElement}
                      borderRadius={6}
                      borderColor={theme.border}
                      borderWidth={1}
                      height={46}
                      pressStyle={{ opacity: 0.85 }}
                      onPress={() => setOnboardingStep(2)}
                    >
                      <Text color={theme.text} fontSize={13} fontWeight="700">Back</Text>
                    </Button>
                    <Button
                      flex={1.8}
                      backgroundColor={theme.primary as any}
                      borderRadius={6}
                      borderWidth={0}
                      height={46}
                      pressStyle={{ opacity: 0.85 }}
                      onPress={handleGoToStep4}
                    >
                      <Text color="#FFFFFF" fontSize={13} fontWeight="700">Next Step</Text>
                    </Button>
                  </XStack>
                </CbudgetCard>
              </View>
            )}

            {/* STEP 4: Category Limits Allocation */}
            {onboardingStep === 4 && (
              <View>
                <CbudgetCard gap={16} marginTop={Spacing[16]}>
                  <YStack gap={4}>
                    <Text color={theme.text} fontSize={16} fontWeight="700">
                      Set Spending Limits
                    </Text>
                    <Text color={theme.textSecondary} fontSize={12}>
                      Divide your ₱{parseFloat(setupAmount).toLocaleString()} budget across your spending categories.
                    </Text>
                  </YStack>

                  <YStack gap={0} marginVertical={4}>
                    {setupCategories.map((cat, index) => {
                      const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Custom'];
                      const catIcon = CATEGORY_ICONS[cat] || CATEGORY_ICONS['Custom'];
                      const limitVal = setupCategoryLimits[cat] || '0';
                      const isFixed = cat === 'Bills';
                      const isLast = index === setupCategories.length - 1;

                      return (
                        <XStack
                          key={cat}
                          alignItems="center"
                          paddingVertical={12}
                          paddingHorizontal={4}
                          borderBottomWidth={isLast ? 0 : 1}
                          borderBottomColor={`${theme.border}60` as any}
                        >
                          {/* Icon */}
                          <View
                            width={34}
                            height={34}
                            borderRadius={8}
                            backgroundColor={`${catColor}15` as any}
                            alignItems="center"
                            justifyContent="center"
                            marginRight={10}
                          >
                            <SymbolView name={catIcon} size={15} tintColor={catColor} />
                          </View>

                          {/* Name + badge */}
                          <YStack flex={1} gap={3}>
                            <Text color={theme.text} fontSize={13} fontWeight="700" numberOfLines={1}>
                              {cat}
                            </Text>
                            {isFixed && (
                              <View
                                alignSelf="flex-start"
                                backgroundColor={`${CATEGORY_COLORS['Bills']}18` as any}
                                paddingHorizontal={6}
                                paddingVertical={2}
                                borderRadius={4}
                              >
                                <Text color={CATEGORY_COLORS['Bills'] as any} fontSize={9} fontWeight="800">
                                  FIXED
                                </Text>
                              </View>
                            )}
                          </YStack>

                          {/* Amount input — fixed right side */}
                          <XStack alignItems="center" gap={4} marginLeft={8}>
                            <Text color={theme.textSecondary} fontSize={14} fontWeight="500">₱</Text>
                            <TextInput
                              placeholder="0"
                              placeholderTextColor={`${theme.text}40`}
                              keyboardType="numeric"
                              value={limitVal}
                              onChangeText={(val) => {
                                let cleanVal = val.replace(/[^0-9]/g, '');
                                if (cleanVal.length > 1 && cleanVal.startsWith('0')) {
                                  cleanVal = cleanVal.replace(/^0+/, '');
                                }
                                setSetupCategoryLimits(prev => ({
                                  ...prev,
                                  [cat]: cleanVal
                                }));
                              }}
                              style={{
                                width: 90,
                                height: 38,
                                borderRadius: 8,
                                borderWidth: 1.5,
                                borderColor: isFixed ? CATEGORY_COLORS['Bills'] : theme.border,
                                paddingHorizontal: 10,
                                fontSize: 14,
                                fontWeight: '700',
                                textAlign: 'right',
                                color: theme.text,
                                backgroundColor: isFixed ? `${CATEGORY_COLORS['Bills']}08` : 'transparent',
                              }}
                            />
                          </XStack>
                        </XStack>
                      );
                    })}
                  </YStack>


                  {/* Allocation Status message */}
                  {(() => {
                    const totalLimitSum = Object.values(setupCategoryLimits).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
                    const budgetAmt = parseFloat(setupAmount) || 0;
                    const diff = budgetAmt - totalLimitSum;
                    
                    let statusText = '';
                    let statusColor = theme.text;
                    if (diff > 0) {
                      statusText = `₱${diff.toLocaleString()} remaining to allocate`;
                      statusColor = theme.warning;
                    } else if (diff < 0) {
                      statusText = `Overallocated by ₱${Math.abs(diff).toLocaleString()}! Please reduce limits.`;
                      statusColor = theme.error;
                    } else {
                      statusText = 'Budget fully allocated!';
                      statusColor = theme.success;
                    }

                    return (
                      <XStack justifyContent="space-between" alignItems="center" backgroundColor={`${statusColor}10` as any} padding={10} borderRadius={6} borderLeftWidth={3} borderLeftColor={statusColor as any}>
                        <Text color={statusColor} fontSize={12} fontWeight="700">
                          {statusText}
                        </Text>
                        <Text color={theme.textSecondary} fontSize={11}>
                          Total: ₱{totalLimitSum.toLocaleString()} / ₱{budgetAmt.toLocaleString()}
                        </Text>
                      </XStack>
                    );
                  })()}

                  <XStack gap={10} marginTop={12}>
                    <Button
                      flex={1}
                      backgroundColor={theme.backgroundElement}
                      borderRadius={6}
                      borderColor={theme.border}
                      borderWidth={1}
                      height={46}
                      pressStyle={{ opacity: 0.85 }}
                      onPress={() => setOnboardingStep(3)}
                    >
                      <Text color={theme.text} fontSize={13} fontWeight="700">Back</Text>
                    </Button>
                    {(() => {
                      const totalLimitSum = Object.values(setupCategoryLimits).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
                      const budgetAmt = parseFloat(setupAmount) || 0;
                      const isMatching = totalLimitSum === budgetAmt;
                      return (
                        <Button
                          flex={1.8}
                          backgroundColor={isMatching ? theme.primary as any : theme.backgroundElement}
                          borderRadius={6}
                          borderWidth={0}
                          height={46}
                          pressStyle={{ opacity: 0.85 }}
                          disabled={!isMatching}
                          onPress={handleOnboardingComplete}
                        >
                          <Text color={isMatching ? '#FFFFFF' : theme.textSecondary} fontSize={13} fontWeight="700">Create Budget</Text>
                        </Button>
                      );
                    })()}
                  </XStack>
                </CbudgetCard>
              </View>
            )}

          </ScrollView>
        </SafeAreaView>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor={theme.background}>
      <BackgroundSystem mode="tabs" height={380} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Custom Segmented Tab Controller */}
        <XStack paddingHorizontal={12} marginVertical={Spacing[8]} gap={6}>
          <Button
            flex={1}
            height={40}
            borderRadius={10}
            backgroundColor={activeTab === 'budget' ? theme.surface : theme.backgroundElement}
            borderWidth={activeTab === 'budget' ? 1 : 0}
            borderColor={theme.border}
            pressStyle={{ opacity: 0.85 }}
            onPress={() => setActiveTab('budget')}
          >
            <XStack gap={4} alignItems="center">
              <SymbolView
                name={{ ios: 'chart.pie.fill', android: 'pie_chart', web: 'pie_chart' } as const}
                size={13}
                tintColor={activeTab === 'budget' ? theme.primary : theme.textSecondary}
              />
              <Text color={activeTab === 'budget' ? theme.text : theme.textSecondary} fontSize={12} fontWeight="700">
                Budget
              </Text>
            </XStack>
          </Button>

          <Button
            flex={1}
            height={40}
            borderRadius={10}
            backgroundColor={activeTab === 'savings' ? theme.surface : theme.backgroundElement}
            borderWidth={activeTab === 'savings' ? 1 : 0}
            borderColor={theme.border}
            pressStyle={{ opacity: 0.85 }}
            onPress={() => setActiveTab('savings')}
          >
            <XStack gap={4} alignItems="center">
              <SymbolView
                name={{ ios: 'heart.circle.fill', android: 'favorite', web: 'favorite' } as const}
                size={13}
                tintColor={activeTab === 'savings' ? theme.primary : theme.textSecondary}
              />
              <Text color={activeTab === 'savings' ? theme.text : theme.textSecondary} fontSize={12} fontWeight="700">
                Savings
              </Text>
            </XStack>
          </Button>

          <Button
            flex={1}
            height={40}
            borderRadius={10}
            backgroundColor={activeTab === 'history' ? theme.surface : theme.backgroundElement}
            borderWidth={activeTab === 'history' ? 1 : 0}
            borderColor={theme.border}
            pressStyle={{ opacity: 0.85 }}
            onPress={() => setActiveTab('history')}
          >
            <XStack gap={4} alignItems="center">
              <SymbolView
                name={{ ios: 'clock.fill', android: 'history', web: 'history' } as const}
                size={13}
                tintColor={activeTab === 'history' ? theme.primary : theme.textSecondary}
              />
              <Text color={activeTab === 'history' ? theme.text : theme.textSecondary} fontSize={12} fontWeight="700">
                History
              </Text>
            </XStack>
          </Button>
        </XStack>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ==================== BUDGET TAB VIEW ==================== */}
          {activeTab === 'budget' && (
            <YStack gap={Spacing.five}>

              {/* Overall Analytics Card */}
              <View>
                <YStack 
                  marginBottom={Spacing[8]}
                  paddingHorizontal={8}
                  paddingVertical={12}
                  gap={16}
                >
                  <YStack alignItems="center" gap={4}>
                    <Text color="rgba(255,255,255,0.7)" fontSize={11} fontWeight="700" letterSpacing={1} textTransform="uppercase" marginBottom={4}>
                      {store.budgetType?.toUpperCase()} BUDGET REMAINING
                    </Text>
                    <XStack alignItems="baseline" gap={4}>
                      <Text color={theme.primary as any} fontSize={24} fontWeight="700">₱</Text>
                      <Text color={theme.primary as any} fontSize={42} fontWeight="900" letterSpacing={-1}>
                        {budgetLeftover.toLocaleString()}
                      </Text>
                    </XStack>
                    <Text color="rgba(255,255,255,0.7)" fontSize={13} textAlign="center">
                      leftover of ₱{store.totalBudget.toLocaleString()} total budget limit
                    </Text>
                  </YStack>

                  <Progress
                    value={(totalSpent / store.totalBudget) * 100}
                    height={8}
                    backgroundColor="rgba(255,255,255,0.05)"
                    borderRadius={4}
                  >
                    <Progress.Indicator 
                      backgroundColor={totalSpent > store.totalBudget ? theme.error : theme.success} 
                      borderRadius={4} 
                    />
                  </Progress>

                  {/* Summary Breakdown Row */}
                  <XStack justifyContent="space-between" width="100%" paddingTop={12}>
                    <YStack gap={2}>
                      <Text color="rgba(255,255,255,0.7)" fontSize={11}>Spent</Text>
                      <Text color="#FFFFFF" fontSize={13} fontWeight="700">₱{totalSpent.toLocaleString()}</Text>
                    </YStack>
                    <YStack gap={2} alignItems="center">
                      <Text color="rgba(255,255,255,0.7)" fontSize={11}>Sim Savings</Text>
                      <Text color={theme.primary as any} fontSize={13} fontWeight="700">₱{totalSavingsContribution.toLocaleString()}</Text>
                    </YStack>
                    <YStack gap={2} alignItems="flex-end">
                      <Text color="rgba(255,255,255,0.7)" fontSize={11}>Sim Cash</Text>
                      <Text color={theme.primary as any} fontSize={13} fontWeight="700">₱{store.virtualBalance.toLocaleString()}</Text>
                    </YStack>
                  </XStack>
                </YStack>
              </View>

              {/* Action Button: Log simulated expense */}
              {!showExpenseForm && (
                <View>
                  <XStack gap={10}>
                    <Button
                      flex={1}
                      height={46}
                      backgroundColor={theme.primary as any}
                      borderRadius={6}
                      borderWidth={0}
                      pressStyle={{ opacity: 0.85 }}
                      onPress={() => setShowExpenseForm(true)}
                    >
                      <Text color="#FFFFFF" fontSize={13} fontWeight="700">Log Purchase</Text>
                    </Button>
                    <Button
                      flex={1}
                      height={46}
                      backgroundColor={theme.backgroundElement}
                      borderRadius={6}
                      borderColor={theme.border}
                      borderWidth={1}
                      pressStyle={{ opacity: 0.85 }}
                      onPress={() => {
                        Alert.alert(
                          'Reset Budget?',
                          'This will wipe out all categories, expenses, and savings. Complete this only to restart the onboarding simulation.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Reset', style: 'destructive', onPress: () => store.resetBudget() }
                          ]
                        );
                      }}
                    >
                      <Text color={theme.error} fontSize={13} fontWeight="700">Reset Budget</Text>
                    </Button>
                  </XStack>
                </View>
              )}

              {/* Rapid Expense Logger Modal/Card */}
              {showExpenseForm && (
                <View>
                  <CbudgetCard borderColor={theme.primary} borderWidth={1.5} gap={14}>
                    <Text color={theme.text} fontSize={17} fontWeight="700">
                      Log an Expense
                    </Text>

                    {/* Category quick selectors */}
                    <YStack gap={6}>
                      <Text color={theme.textSecondary} fontSize={11} fontWeight="600" textTransform="uppercase">
                        Category
                      </Text>
                      <XStack gap={6} flexWrap="wrap">
                        {store.selectedCategories.map((cat) => {
                          const isSelected = expenseCategory === cat;
                          const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Custom'];
                          return (
                            <Button
                              key={cat}
                              backgroundColor={(isSelected ? `${catColor}15` : theme.backgroundElement) as any}
                              borderColor={(isSelected ? catColor : theme.border) as any}
                              borderWidth={1.5}
                              borderRadius={8}
                              height={34}
                              paddingHorizontal={12}
                              onPress={() => {
                                setExpenseCategory(cat);
                                setExpenseName(''); // reset name when category changes
                              }}
                            >
                              <Text color={isSelected ? catColor : theme.text} fontSize={11} fontWeight="600">
                                {cat}
                              </Text>
                            </Button>
                          );
                        })}
                      </XStack>
                    </YStack>

                    {/* Quick Name Suggestions — shown when a category is selected */}
                    {expenseCategory ? (() => {
                      const suggestions: Record<string, string[]> = {
                        Food: ['Lunch', 'Breakfast', 'Dinner', 'Snack', 'Merienda', 'Groceries', 'Coffee', 'Milk Tea'],
                        Transportation: ['Jeepney', 'Bus Fare', 'Grab', 'Tricycle', 'Train', 'Toll Fee', 'Gas'],
                        School: ['Photocopy', 'Supplies', 'Materials', 'Books', 'Printing', 'Project'],
                        Bills: ['Electric Bill', 'Water Bill', 'Internet', 'Load', 'Rent', 'Subscription'],
                        Shopping: ['Clothes', 'Online Order', 'Toiletries', 'Accessories', 'Shoes'],
                        Entertainment: ['Movie', 'Streaming', 'Game', 'Concert', 'Sports'],
                        Savings: ['Emergency Fund', 'Goal Deposit'],
                        'Emergency Fund': ['Medical', 'Repair', 'Emergency'],
                      };
                      const chips = suggestions[expenseCategory] || [];
                      if (chips.length === 0) return null;
                      return (
                        <YStack gap={6}>
                          <Text color={theme.textSecondary} fontSize={11} fontWeight="600" textTransform="uppercase">
                            Quick Name — what did you buy?
                          </Text>
                          <XStack gap={6} flexWrap="wrap">
                            {chips.map((chip) => {
                              const isActive = expenseName === chip;
                              return (
                                <TouchableOpacity
                                  key={chip}
                                  onPress={() => setExpenseName(isActive ? '' : chip)}
                                  style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 7,
                                    borderRadius: 20,
                                    borderWidth: 1.5,
                                    borderColor: isActive ? (CATEGORY_COLORS[expenseCategory] || theme.primary) : theme.border,
                                    backgroundColor: isActive ? `${CATEGORY_COLORS[expenseCategory] || theme.primary}12` : 'transparent',
                                    marginBottom: 4,
                                  }}
                                >
                                  <Text style={{ color: isActive ? (CATEGORY_COLORS[expenseCategory] || theme.primary) : theme.textSecondary, fontSize: 12, fontWeight: isActive ? '700' : '500' }}>
                                    {chip}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </XStack>
                        </YStack>
                      );
                    })() : null}

                    {/* Expense Name text input — always visible for custom entry */}
                    <FormInput
                      label="Or Type a Name (Optional)"
                      placeholder="e.g. Lunch, Bus Fare (or leave blank)"
                      value={expenseName}
                      onChangeText={setExpenseName}
                    />

                    {/* Amount + quick presets */}
                    <YStack gap={8}>
                      <FormInput
                        label="Amount (₱)"
                        placeholder="e.g. 120"
                        keyboardType="numeric"
                        value={expenseAmount}
                        onChangeText={setExpenseAmount}
                        leftIcon={{ ios: 'banknote', android: 'payments', web: 'payments' } as any}
                      />
                      {/* Amount Quick Presets */}
                      <XStack gap={6} flexWrap="wrap">
                        {[20, 50, 100, 150, 200, 500, 1000].map((preset) => {
                          const isActive = expenseAmount === preset.toString();
                          return (
                            <TouchableOpacity
                              key={preset}
                              onPress={() => setExpenseAmount(isActive ? '' : preset.toString())}
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 6,
                                borderWidth: 1.5,
                                borderColor: isActive ? theme.primary : theme.border,
                                backgroundColor: isActive ? `${theme.primary}12` : 'transparent',
                              }}
                            >
                              <Text style={{ color: isActive ? theme.primary : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                                ₱{preset}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </XStack>
                    </YStack>

                    <FormInput
                      label="Notes (Optional)"
                      placeholder="e.g. School canteen lunch"
                      value={expenseNotes}
                      onChangeText={setExpenseNotes}
                    />

                    <XStack gap={10} marginTop={6}>
                      <Button flex={1} backgroundColor={theme.backgroundElement} height={44} borderRadius={10} onPress={() => setShowExpenseForm(false)}>
                        <Text color={theme.text} fontWeight="600">Cancel</Text>
                      </Button>
                      <FormButton flex={1.5} variant="primary" height={44} onPress={handleLogExpense}>
                        Log Purchase
                      </FormButton>
                    </XStack>
                  </CbudgetCard>
                </View>
              )}


              {/* Category limits progress */}
              <YStack gap={16}>
                <Text color={theme.text} fontSize={16} fontWeight="700" paddingHorizontal={4}>
                  Category Budget Breakdown
                </Text>

                <YStack gap={14}>
                  {/* --- FIXED BILLS SECTION --- */}
                  {store.selectedCategories.includes('Bills') && (
                    <YStack gap={10}>
                      <Text color={theme.primary as any} fontSize={12} fontWeight="800" paddingHorizontal={4} letterSpacing={0.5}>
                        FIXED MONTHLY BILLS
                      </Text>
                      {store.selectedCategories.filter(c => c === 'Bills').map((cat) => {
                        const spentInCat = store.loggedExpenses
                          .filter((e) => e.category === cat)
                          .reduce((sum, e) => sum + e.amount, 0);
                        const limitInCat = store.categoryLimits?.[cat] || (store.totalBudget / (store.selectedCategories.length || 1));
                        const ratio = spentInCat / limitInCat;
                        const isOver = spentInCat > limitInCat;
                        const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Custom'];
                        const catIcon = CATEGORY_ICONS[cat] || CATEGORY_ICONS['Custom'];

                        return (
                          <TouchableOpacity key={cat} activeOpacity={0.85} onPress={() => setSelectedCategoryBreakdown(cat)}>
                            <CbudgetCard padding={14} gap={10} borderColor={isOver ? `${theme.error}30` as any : theme.border} borderWidth={1}>
                              <XStack justifyContent="space-between" alignItems="center">
                                <XStack gap={10} alignItems="center">
                                  <View width={36} height={36} borderRadius={8} backgroundColor={`${catColor}15` as any} alignItems="center" justifyContent="center">
                                    <SymbolView name={catIcon} size={15} tintColor={catColor} />
                                  </View>
                                  <YStack gap={2}>
                                    <Text color={theme.text} fontSize={14} fontWeight="700">{cat}</Text>
                                    <Text color={theme.textSecondary} fontSize={11}>
                                      Spent ₱{spentInCat.toLocaleString()} of ₱{limitInCat.toLocaleString()}
                                    </Text>
                                  </YStack>
                                </XStack>

                                <XStack
                                  backgroundColor={(isOver ? `${theme.error}15` : `${theme.success}10`) as any}
                                  borderRadius={8}
                                  paddingHorizontal={8}
                                  paddingVertical={4}
                                >
                                  <Text color={isOver ? theme.error : theme.success} fontSize={10} fontWeight="700">
                                    {isOver ? 'OVER BUDGET' : `${Math.round(ratio * 100)}%`}
                                  </Text>
                                </XStack>
                              </XStack>

                              <Progress value={Math.min(100, ratio * 100)} height={5} backgroundColor={theme.backgroundElement} borderRadius={3}>
                                <Progress.Indicator backgroundColor={(isOver ? theme.error : catColor) as any} borderRadius={3} />
                              </Progress>
                            </CbudgetCard>
                          </TouchableOpacity>
                        );
                      })}
                    </YStack>
                  )}

                  {/* --- DAILY/VARIABLE SPENDING SECTION --- */}
                  <YStack gap={10}>
                    <Text color={theme.primary as any} fontSize={12} fontWeight="800" paddingHorizontal={4} letterSpacing={0.5} marginTop={store.selectedCategories.includes('Bills') ? 4 : 0}>
                      DAILY & VARIABLE SPENDING
                    </Text>
                    {store.selectedCategories.filter(c => c !== 'Bills').length === 0 ? (
                      <CbudgetCard padding={14}>
                        <Text color={theme.textSecondary} fontSize={12}>No variable spending categories selected.</Text>
                      </CbudgetCard>
                    ) : (
                      store.selectedCategories.filter(c => c !== 'Bills').map((cat) => {
                        const spentInCat = store.loggedExpenses
                          .filter((e) => e.category === cat)
                          .reduce((sum, e) => sum + e.amount, 0);
                        const limitInCat = store.categoryLimits?.[cat] || (store.totalBudget / (store.selectedCategories.length || 1));
                        const ratio = spentInCat / limitInCat;
                        const isOver = spentInCat > limitInCat;
                        const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Custom'];
                        const catIcon = CATEGORY_ICONS[cat] || CATEGORY_ICONS['Custom'];

                        return (
                          <TouchableOpacity key={cat} activeOpacity={0.85} onPress={() => setSelectedCategoryBreakdown(cat)}>
                            <CbudgetCard padding={14} gap={10} borderColor={isOver ? `${theme.error}30` as any : theme.border} borderWidth={1}>
                              <XStack justifyContent="space-between" alignItems="center">
                                <XStack gap={10} alignItems="center">
                                  <View width={36} height={36} borderRadius={8} backgroundColor={`${catColor}15` as any} alignItems="center" justifyContent="center">
                                    <SymbolView name={catIcon} size={15} tintColor={catColor} />
                                  </View>
                                  <YStack gap={2}>
                                    <Text color={theme.text} fontSize={14} fontWeight="700">{cat}</Text>
                                    <Text color={theme.textSecondary} fontSize={11}>
                                      Spent ₱{spentInCat.toLocaleString()} of ₱{limitInCat.toLocaleString()}
                                    </Text>
                                  </YStack>
                                </XStack>

                                <XStack
                                  backgroundColor={(isOver ? `${theme.error}15` : `${theme.success}10`) as any}
                                  borderRadius={8}
                                  paddingHorizontal={8}
                                  paddingVertical={4}
                                >
                                  <Text color={isOver ? theme.error : theme.success} fontSize={10} fontWeight="700">
                                    {isOver ? 'OVER BUDGET' : `${Math.round(ratio * 100)}%`}
                                  </Text>
                                </XStack>
                              </XStack>

                              <Progress value={Math.min(100, ratio * 100)} height={5} backgroundColor={theme.backgroundElement} borderRadius={3}>
                                <Progress.Indicator backgroundColor={(isOver ? theme.error : catColor) as any} borderRadius={3} />
                              </Progress>
                            </CbudgetCard>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </YStack>
                </YStack>
              </YStack>
            </YStack>
          )}

          {/* ==================== SAVINGS TAB VIEW ==================== */}
          {activeTab === 'savings' && (
            <YStack gap={Spacing.five}>

              {/* Smart Savings Insights Hero */}
              <View>
                <CbudgetCard borderLeftWidth={5} borderLeftColor={theme.primary} gap={10} backgroundColor={`${theme.primary}08` as any}>
                  <XStack gap={6} alignItems="center">
                    <SymbolView
                      name={{ ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' } as const}
                      size={16}
                      tintColor={theme.primary as any}
                    />
                    <Text color={theme.primary as any} fontSize={13} fontWeight="700" letterSpacing={0.5}>
                      SMART SAVINGS COACH INSIGHTS
                    </Text>
                  </XStack>

                  {store.savingsGoals.length === 0 ? (
                    <Text color={theme.textSecondary} fontSize={12} lineHeight={16}>
                      {isGuest
                        ? 'Create a savings goal below. Cbudget will calculate educational projections to help you track your progress!'
                        : 'Create a savings goal below. Cbudget will calculate educational projections and recommend spending optimizations to help you build habits fast!'}
                    </Text>
                  ) : (
                    <YStack gap={8}>
                      {store.savingsGoals.map((g, idx) => {
                        const remaining = Math.max(0, g.targetAmount - g.currentSavings);
                        const days = parseInt(g.targetDate) || 120;
                        const dailyRate = Math.round(remaining / days);
                        
                        // Educational tip
                        return (
                          <YStack key={g.id} gap={2} paddingBottom={idx < store.savingsGoals.length - 1 ? 6 : 0} borderBottomWidth={idx < store.savingsGoals.length - 1 ? 1 : 0} borderBottomColor={`${theme.border}40` as any}>
                            <Text color={theme.text} fontSize={13} fontWeight="600">
                              For <Text color={theme.primary as any}>{g.name}</Text>:
                            </Text>
                            <Text color={theme.textSecondary} fontSize={12} lineHeight={16}>
                              • Save <Text fontWeight="700" color={theme.text}>₱{dailyRate}/day</Text> to reach your target in <Text fontWeight="700">{days} days</Text>.
                            </Text>
                            {!isGuest && (
                              <Text color={theme.textSecondary} fontSize={12} lineHeight={16}>
                                • Pro-Tip: Reduce shopping expenses by <Text fontWeight="700" color={theme.warning}>₱300/week</Text> to complete this goal <Text fontWeight="700" color={theme.success}>1.5 months earlier</Text>!
                              </Text>
                            )}
                          </YStack>
                        );
                      })}
                    </YStack>
                  )}
                </CbudgetCard>
              </View>

              {/* Create Savings Goal Button */}
              <View>
                <FormButton
                  variant="primary"
                  onPress={() => setShowAddGoalModal(true)}
                  leftIcon={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' } as any}
                >
                  Create Savings Goal
                </FormButton>
              </View>

              {/* Savings Goals List */}
              <YStack gap={12}>
                <Text color={theme.text} fontSize={16} fontWeight="700" paddingHorizontal={4}>
                  Active Savings Goals
                </Text>

                {store.savingsGoals.length === 0 ? (
                  <CbudgetCard padding={24} alignItems="center" justifyContent="center" gap={10}>
                    <SymbolView
                      name={{ ios: 'heart.text.square.fill', android: 'library_add', web: 'library_add' } as const}
                      size={28}
                      tintColor={theme.textSecondary}
                    />
                    <Text color={theme.textSecondary} fontSize={13} textAlign="center">
                      No savings goals set. Create a goal like "Emergency Fund" to practice disciplined saving before simulation investing.
                    </Text>
                  </CbudgetCard>
                ) : (
                  store.savingsGoals.map((g, idx) => {
                    const ratio = g.currentSavings / g.targetAmount;
                    const progressVal = Math.min(100, ratio * 100);
                    const goalIcon = SAVINGS_CATEGORY_ICONS[g.category] || SAVINGS_CATEGORY_ICONS['Custom'];

                    return (
                      <View key={g.id}>
                        <CbudgetCard gap={12}>
                          <XStack justifyContent="space-between" alignItems="center">
                            <XStack gap={10} alignItems="center">
                              <View width={36} height={36} borderRadius={8} backgroundColor={`${theme.primary}15` as any} alignItems="center" justifyContent="center">
                                <SymbolView name={goalIcon} size={15} tintColor={theme.primary as any} />
                              </View>
                              <YStack gap={2}>
                                <Text color={theme.text} fontSize={14} fontWeight="700">{g.name}</Text>
                                <Text color={theme.textSecondary} fontSize={11}>
                                  Category: {g.category} • Target Date: {g.targetDate} days
                                </Text>
                              </YStack>
                            </XStack>

                            <Text color={theme.primary as any} fontSize={14} fontWeight="800">
                              {progressVal.toFixed(0)}%
                            </Text>
                          </XStack>

                          <YStack gap={4}>
                            <Progress value={progressVal} height={6} backgroundColor={theme.backgroundElement} borderRadius={3}>
                              <Progress.Indicator backgroundColor={theme.primary} borderRadius={3} />
                            </Progress>
                            <XStack justifyContent="space-between">
                              <Text color={theme.textSecondary} fontSize={11}>
                                Saved: ₱{g.currentSavings.toLocaleString()}
                              </Text>
                              <Text color={theme.textSecondary} fontSize={11}>
                                Target: ₱{g.targetAmount.toLocaleString()}
                              </Text>
                            </XStack>
                          </YStack>

                          {g.currentSavings >= g.targetAmount ? (
                            <XStack backgroundColor={`${theme.success}10` as any} padding={8} borderRadius={8} justifyContent="center" alignItems="center" gap={6}>
                              <SymbolView name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' } as const} size={12} tintColor={theme.success} />
                              <Text color={theme.success} fontSize={12} fontWeight="700">GOAL FULLY FUNDED</Text>
                            </XStack>
                          ) : (
                            <Button
                              height={34}
                              backgroundColor={theme.backgroundElement}
                              borderColor={theme.border}
                              borderWidth={1}
                              borderRadius={8}
                              onPress={() => {
                                setContributeGoalId(g.id);
                                setContributeAmount('');
                              }}
                            >
                              <Text color={theme.text} fontSize={12} fontWeight="700">Contribute Cash</Text>
                            </Button>
                          )}
                        </CbudgetCard>
                      </View>
                    );
                  })
                )}
              </YStack>
            </YStack>
          )}

          {/* ==================== TRANSACTION HISTORY TAB VIEW ==================== */}
          {activeTab === 'history' && (
            <YStack gap={Spacing.five}>
              {/* Summary Metrics Card */}
              <View>
                <CbudgetCard padding={16} gap={10}>
                  <Text color={theme.text} fontSize={14} fontWeight="800">
                    Transaction Summary
                  </Text>
                  <View height={1} backgroundColor={theme.border} marginTop={4} marginBottom={2} />
                  <XStack justifyContent="space-between" paddingTop={4}>
                    <YStack gap={2}>
                      <Text color={theme.textSecondary} fontSize={10} fontWeight="600">Total Transactions</Text>
                      <Text color={theme.text} fontSize={16} fontWeight="700">{store.loggedExpenses.length}</Text>
                    </YStack>
                    <YStack gap={2} alignItems="flex-end">
                      <Text color={theme.textSecondary} fontSize={10} fontWeight="600">Total Simulated Spent</Text>
                      <Text color={theme.primary as any} fontSize={16} fontWeight="700">
                        ₱{store.loggedExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                      </Text>
                    </YStack>
                  </XStack>
                </CbudgetCard>
              </View>

              {/* Transactions List */}
              <YStack gap={10}>
                <Text color={theme.text} fontSize={16} fontWeight="700" paddingHorizontal={4}>
                  Logged Purchases
                </Text>

                {store.loggedExpenses.length === 0 ? (
                  <CbudgetCard padding={24} alignItems="center" justifyContent="center" gap={10}>
                    <SymbolView
                      name={{ ios: 'doc.plaintext.fill', android: 'receipt', web: 'receipt' } as const}
                      size={28}
                      tintColor={theme.textSecondary}
                    />
                    <Text color={theme.textSecondary} fontSize={13} textAlign="center">
                      No purchases logged. Set up your budget and record simulated purchases to track where your money goes.
                    </Text>
                  </CbudgetCard>
                ) : (
                  store.loggedExpenses.map((exp) => {
                    const catColor = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS['Custom'];
                    const catIcon = CATEGORY_ICONS[exp.category] || CATEGORY_ICONS['Custom'];
                    return (
                      <View key={exp.id}>
                        <CbudgetCard padding={14} gap={10}>
                          <XStack justifyContent="space-between" alignItems="center">
                            <XStack gap={10} alignItems="center" flex={1}>
                              <View width={36} height={36} borderRadius={8} backgroundColor={`${catColor}15` as any} alignItems="center" justifyContent="center">
                                <SymbolView name={catIcon} size={15} tintColor={catColor} />
                              </View>
                              <YStack gap={2} flex={1}>
                                <Text color={theme.text} fontSize={14} fontWeight="700" numberOfLines={1}>{exp.name}</Text>
                                <Text color={theme.textSecondary} fontSize={11}>
                                  Category: {exp.category} • {exp.date}
                                </Text>
                                {exp.notes ? (
                                  <Text color={`${theme.textSecondary}bb` as any} fontSize={10} fontStyle="italic" numberOfLines={1}>
                                    Notes: {exp.notes}
                                  </Text>
                                ) : null}
                              </YStack>
                            </XStack>

                            <XStack gap={10} alignItems="center">
                              <Text color={theme.text} fontSize={14} fontWeight="800">
                                ₱{exp.amount.toLocaleString()}
                              </Text>
                              <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                  Alert.alert(
                                    'Delete Transaction?',
                                    `Are you sure you want to delete "${exp.name}"? This will return the ₱${exp.amount.toLocaleString()} limit to your budget.`,
                                    [
                                      { text: 'Cancel', style: 'cancel' },
                                      { text: 'Delete', style: 'destructive', onPress: () => store.deleteExpense(exp.id) }
                                    ]
                                  );
                                }}
                              >
                                <View width={28} height={28} borderRadius={6} backgroundColor={`${theme.error}10` as any} alignItems="center" justifyContent="center">
                                  <SymbolView name={{ ios: 'trash.fill', android: 'delete', web: 'delete' } as const} size={13} tintColor={theme.error} />
                                </View>
                              </TouchableOpacity>
                            </XStack>
                          </XStack>
                        </CbudgetCard>
                      </View>
                    );
                  })
                )}
              </YStack>
            </YStack>
          )}

        </ScrollView>
      </SafeAreaView>

      {/* MODAL: Create Savings Goal */}
      <Modal visible={showAddGoalModal} transparent animationType="slide" onRequestClose={() => setShowAddGoalModal(false)}>
        <View style={styles.modalOverlay}>
          <CbudgetCard style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor={theme.border} paddingBottom={10}>
              <Text color={theme.text} fontSize={16} fontWeight="700">Create Savings Goal</Text>
              <TouchableOpacity onPress={() => setShowAddGoalModal(false)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' } as const} size={20} tintColor={theme.textSecondary} />
              </TouchableOpacity>
            </XStack>

            <ScrollView contentContainerStyle={{ gap: 14, paddingTop: 10 }}>
              <FormInput
                label="Goal Name"
                placeholder="e.g. Emergency Fund, Tuition Fee"
                value={goalName}
                onChangeText={setGoalName}
              />

              <FormInput
                label="Target Amount (₱)"
                placeholder="e.g. 5000"
                keyboardType="numeric"
                value={goalTargetAmount}
                onChangeText={setGoalTargetAmount}
                leftIcon={{ ios: 'banknote', android: 'payments', web: 'payments' } as any}
              />

              <YStack gap={4}>
                <Text color={theme.textSecondary} fontSize={11} fontWeight="600" textTransform="uppercase">Goal Category</Text>
                <XStack gap={6} flexWrap="wrap">
                  {Object.keys(SAVINGS_CATEGORY_ICONS).map((cat) => {
                    const isSelected = goalCategory === cat;
                    return (
                      <Button
                        key={cat}
                        backgroundColor={isSelected ? theme.primary as any : theme.backgroundElement}
                        borderRadius={8}
                        height={34}
                        paddingHorizontal={10}
                        onPress={() => setGoalCategory(cat)}
                        borderWidth={0}
                      >
                        <Text color={isSelected ? '#FFFFFF' : theme.text} fontSize={11} fontWeight="600">
                          {cat}
                        </Text>
                      </Button>
                    );
                  })}
                </XStack>
              </YStack>

              <YStack gap={4}>
                <Text color={theme.textSecondary} fontSize={11} fontWeight="600" textTransform="uppercase">Target Timeline</Text>
                <XStack gap={6}>
                  {[
                    { label: '30 Days', val: '30' },
                    { label: '90 Days', val: '90' },
                    { label: '180 Days', val: '180' },
                    { label: '1 Year', val: '365' },
                  ].map((item) => {
                    const isSelected = goalTargetDate === item.val;
                    return (
                      <Button
                        key={item.val}
                        backgroundColor={isSelected ? theme.primary as any : theme.backgroundElement}
                        borderRadius={8}
                        flex={1}
                        height={34}
                        onPress={() => setGoalTargetDate(item.val)}
                        borderWidth={0}
                      >
                        <Text color={isSelected ? '#FFFFFF' : theme.text} fontSize={11} fontWeight="600">
                          {item.label}
                        </Text>
                      </Button>
                    );
                  })}
                </XStack>
              </YStack>

              <XStack gap={10} marginTop={10}>
                <Button flex={1} backgroundColor={theme.backgroundElement} height={44} borderRadius={10} onPress={() => setShowAddGoalModal(false)}>
                  <Text color={theme.text} fontWeight="600">Cancel</Text>
                </Button>
                <FormButton flex={1.5} variant="primary" height={44} onPress={handleAddGoal}>
                  Set Savings Goal
                </FormButton>
              </XStack>
            </ScrollView>
          </CbudgetCard>
        </View>
      </Modal>

      {/* MODAL: Contribute Savings */}
      <Modal visible={contributeGoalId !== null} transparent animationType="slide" onRequestClose={() => setContributeGoalId(null)}>
        <View style={styles.modalOverlay}>
          <CbudgetCard style={[styles.modalContent, { backgroundColor: theme.surface }]} gap={14}>
            <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor={theme.border} paddingBottom={10}>
              <Text color={theme.text} fontSize={16} fontWeight="700">Contribute Cash to Goal</Text>
              <TouchableOpacity onPress={() => setContributeGoalId(null)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' } as const} size={20} tintColor={theme.textSecondary} />
              </TouchableOpacity>
            </XStack>

            <Text color={theme.textSecondary} fontSize={12} lineHeight={16}>
              Contribute cash from your unallocated budget buffer: <Text color={theme.text} fontWeight="700">₱{budgetLeftover.toLocaleString()}</Text> available.
            </Text>

            <FormInput
              label="Contribution (₱)"
              placeholder="e.g. 500"
              keyboardType="numeric"
              value={contributeAmount}
              onChangeText={setContributeAmount}
              leftIcon={{ ios: 'banknote', android: 'payments', web: 'payments' } as any}
            />

            <XStack gap={10} marginTop={6}>
              <Button flex={1} backgroundColor={theme.backgroundElement} height={44} borderRadius={10} onPress={() => setContributeGoalId(null)}>
                <Text color={theme.text} fontWeight="600">Cancel</Text>
              </Button>
              <FormButton flex={1.5} variant="primary" height={44} onPress={handleContributeSavings}>
                Contribute Savings
              </FormButton>
            </XStack>
          </CbudgetCard>
        </View>
      </Modal>

      {/* MODAL: Category Transactions Breakdown */}
      <Modal
        visible={!!selectedCategoryBreakdown}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCategoryBreakdown(null)}
      >
        <View style={styles.modalOverlay}>
          {(() => {
            if (!selectedCategoryBreakdown) return null;
            const cat = selectedCategoryBreakdown;
            const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Custom'];
            const catIcon = CATEGORY_ICONS[cat] || CATEGORY_ICONS['Custom'];
            const spentInCat = store.loggedExpenses
              .filter((e) => e.category === cat)
              .reduce((sum, e) => sum + e.amount, 0);
            const limitInCat = store.categoryLimits?.[cat] || (store.totalBudget / (store.selectedCategories.length || 1));
            const ratio = spentInCat / limitInCat;
            const isOver = spentInCat > limitInCat;
            const catExpenses = store.loggedExpenses.filter((e) => e.category === cat);

            return (
              <CbudgetCard style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                {/* Header */}
                <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor={theme.border} paddingBottom={10}>
                  <XStack gap={8} alignItems="center">
                    <View width={28} height={28} borderRadius={6} backgroundColor={`${catColor}15` as any} alignItems="center" justifyContent="center">
                      <SymbolView name={catIcon} size={14} tintColor={catColor} />
                    </View>
                    <Text color={theme.text} fontSize={15} fontWeight="700">
                      {cat} Breakdown
                    </Text>
                  </XStack>
                  <TouchableOpacity onPress={() => setSelectedCategoryBreakdown(null)}>
                    <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' } as const} size={20} tintColor={theme.textSecondary} />
                  </TouchableOpacity>
                </XStack>

                {/* Mini analytics */}
                <YStack gap={8} marginVertical={10}>
                  <XStack justifyContent="space-between" alignItems="baseline">
                    <Text color={theme.textSecondary} fontSize={12}>Total Limit Allocated</Text>
                    <Text color={theme.text} fontSize={16} fontWeight="800">₱{limitInCat.toLocaleString()}</Text>
                  </XStack>
                  <XStack justifyContent="space-between" alignItems="baseline">
                    <Text color={theme.textSecondary} fontSize={12}>Total Spent</Text>
                    <Text color={isOver ? theme.error : theme.success} fontSize={16} fontWeight="800">₱{spentInCat.toLocaleString()}</Text>
                  </XStack>
                  
                  {/* Progress bar */}
                  <View height={6} backgroundColor={theme.backgroundElement} borderRadius={3} overflow="hidden" marginTop={4}>
                    <View
                      height="100%"
                      width={`${Math.min(100, ratio * 100)}%`}
                      backgroundColor={isOver ? theme.error : catColor}
                      borderRadius={3}
                    />
                  </View>
                </YStack>

                {/* Transactions list */}
                <Text color={theme.text} fontSize={13} fontWeight="700" marginTop={6} marginBottom={8}>
                  Expense Logs
                </Text>
                
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  {catExpenses.length === 0 ? (
                    <YStack padding={20} alignItems="center" justifyContent="center" gap={6}>
                      <SymbolView name={{ ios: 'doc.plaintext.fill', android: 'receipt', web: 'receipt' } as const} size={20} tintColor={theme.textSecondary} />
                      <Text color={theme.textSecondary} fontSize={11} textAlign="center">
                        No purchases logged under {cat} yet.
                      </Text>
                    </YStack>
                  ) : (
                    <YStack gap={8}>
                      {catExpenses.map((exp) => (
                        <XStack key={exp.id} justifyContent="space-between" alignItems="center" padding={10} backgroundColor={theme.backgroundElement} borderRadius={6} borderWidth={1} borderColor={theme.border}>
                          <YStack gap={2} flex={1}>
                            <Text color={theme.text} fontSize={12} fontWeight="700" numberOfLines={1}>{exp.name}</Text>
                            <Text color={theme.textSecondary} fontSize={10}>{exp.date}</Text>
                            {exp.notes ? (
                              <Text color={`${theme.textSecondary}bb` as any} fontSize={9} fontStyle="italic" numberOfLines={1}>
                                {exp.notes}
                              </Text>
                            ) : null}
                          </YStack>
                          <XStack gap={8} alignItems="center">
                            <Text color={theme.text} fontSize={12} fontWeight="800">₱{exp.amount.toLocaleString()}</Text>
                            <TouchableOpacity
                              onPress={() => {
                                Alert.alert(
                                  'Delete Transaction?',
                                  `Are you sure you want to delete "${exp.name}"?`,
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                      text: 'Delete',
                                      style: 'destructive',
                                      onPress: () => {
                                        store.deleteExpense(exp.id);
                                      }
                                    }
                                  ]
                                );
                              }}
                            >
                              <SymbolView name={{ ios: 'trash.fill', android: 'delete', web: 'delete' } as const} size={12} tintColor={theme.error} />
                            </TouchableOpacity>
                          </XStack>
                        </XStack>
                      ))}
                    </YStack>
                  )}
                </ScrollView>

                <Button
                  marginTop={14}
                  height={38}
                  backgroundColor={theme.backgroundElement}
                  borderRadius={6}
                  borderWidth={1}
                  borderColor={theme.border}
                  onPress={() => setSelectedCategoryBreakdown(null)}
                >
                  <Text color={theme.text} fontSize={12} fontWeight="700">Close</Text>
                </Button>
              </CbudgetCard>
            );
          })()}
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
    paddingHorizontal: 6,
    paddingTop: 20,
    paddingBottom: 32,
  },
  customInput: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    padding: 16,
    borderRadius: 16,
  },
});
