import React, { useState } from 'react';
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
import { PouchyBubble } from '@/components/ui/PouchyBubble';

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

  // Onboarding Wizard local states
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [setupBudgetType, setSetupBudgetType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [setupAmount, setSetupAmount] = useState('');
  const [setupCategories, setSetupCategories] = useState<string[]>(['Food', 'Transportation', 'School']);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'budget' | 'savings'>('budget');

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

    store.setupBudget(setupBudgetType, amt, setupCategories);
    Alert.alert('Onboarding Complete!', `Your ${setupBudgetType} budget of ₱${amt.toLocaleString()} has been set up! (+30 XP)`);
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
    if (!expenseName.trim()) {
      Alert.alert('Missing Field', 'Please enter a name for the expense.');
      return;
    }
    if (!expenseCategory) {
      Alert.alert('Missing Field', 'Please select a category.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid price amount.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    store.addExpense(expenseName.trim(), expenseCategory, amt, todayStr, expenseNotes.trim());
    
    // Quick Reset
    setExpenseName('');
    setExpenseAmount('');
    setExpenseNotes('');
    setShowExpenseForm(false);
    
    // Check if limit exceeded in this category
    const catTotalSpent = store.loggedExpenses
      .filter((e) => e.category === expenseCategory)
      .reduce((sum, e) => sum + e.amount, 0) + amt;
    
    // Average limit per category (simple estimation)
    const categoryLimit = store.totalBudget / (store.selectedCategories.length || 1);

    if (catTotalSpent > categoryLimit) {
      Alert.alert('Budget Alert!', `You've exceeded the average category allocation for ${expenseCategory}! Be mindful of overspending. (+10 XP)`);
    } else {
      Alert.alert('Expense Logged!', `Simulated purchase of ₱${amt.toLocaleString()} recorded. (+10 XP)`);
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

    Alert.alert('Savings Goal Set!', `Goal "${goalName.trim()}" created with target ₱${target.toLocaleString()}. (+15 XP)`);
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
        Alert.alert('Contribution Logged!', `₱${amt.toLocaleString()} contributed to savings goal! (+15 XP)`);
        setContributeAmount('');
        setContributeGoalId(null);
      } else {
        Alert.alert('Error', 'Unable to complete savings goal contribution.');
      }
    }
  };

  // Onboarding text for Pouchy
  const onboardingPouchyText = 
    onboardingStep === 1
      ? "Hey! Pouchy here. Let's decide if you want to track your budget daily, weekly, or monthly. Monthly is great for long-term planning!"
      : onboardingStep === 2
      ? `Let's set your ${setupBudgetType} limit! Make sure it's realistic so you still have leftover money to practice investing!`
      : "Choose the categories you want to track. You can add custom categories too, like your favorite hobbies or school projects!";

  // Calculate warning and expression for Pouchy on active budget view
  let activePouchyExpression: 'smiling' | 'happy' | 'sad' | 'mad' = 'smiling';
  let activePouchyText = '';
  
  // Check category limits
  let overspentCategory = '';
  let warningCategory = '';
  const limitPerCat = store.totalBudget / (store.selectedCategories.length || 1);

  store.selectedCategories.forEach((cat) => {
    const spent = store.loggedExpenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
    const ratio = spent / limitPerCat;
    if (ratio >= 1.0) {
      overspentCategory = cat;
    } else if (ratio >= 0.9 && !warningCategory) {
      warningCategory = cat;
    }
  });

  if (overspentCategory) {
    activePouchyExpression = 'mad';
    activePouchyText = `Oh no! You have overspent in the ${overspentCategory} category! Try to cut back on other categories to keep your budget balanced.`;
  } else if (warningCategory) {
    activePouchyExpression = 'mad';
    activePouchyText = `Watch out! Your spending in the ${warningCategory} category is close to the limit (over 90%). Let's keep it steady!`;
  } else if (totalSpent > store.totalBudget) {
    activePouchyExpression = 'mad';
    activePouchyText = `Danger! Your total budget of ₱${store.totalBudget.toLocaleString()} has been exceeded! Try logging a refund or slowing down your spending.`;
  } else if (totalSpent > store.totalBudget * 0.8) {
    activePouchyExpression = 'smiling';
    activePouchyText = `You've used over 80% of your total budget. Be careful with your next purchases!`;
  } else if (totalSpent === 0) {
    activePouchyExpression = 'smiling';
    activePouchyText = `Ready to track your spending? Log a simulated purchase below to see how it affects your category limits!`;
  } else {
    activePouchyExpression = 'happy';
    activePouchyText = `Awesome job! You are managing your budget very well. Keep it up and you will have plenty of cash left to invest!`;
  }

  // Savings tab Pouchy expression/text
  let savingsPouchyExpression: 'smiling' | 'happy' | 'sad' | 'mad' = 'smiling';
  let savingsPouchyText = '';
  
  if (store.savingsGoals.length === 0) {
    savingsPouchyExpression = 'smiling';
    savingsPouchyText = `Hi there! Setting up savings goals is a great way to save for important things. Let's create your first goal like "Emergency Fund"!`;
  } else {
    const allCompleted = store.savingsGoals.every(g => g.currentSavings >= g.targetAmount);
    const anyCompleted = store.savingsGoals.some(g => g.currentSavings >= g.targetAmount);
    if (allCompleted) {
      savingsPouchyExpression = 'happy';
      savingsPouchyText = `Amazing! All your savings goals are fully funded! You're ready to put your savings into simulator investments!`;
    } else if (anyCompleted) {
      savingsPouchyExpression = 'happy';
      savingsPouchyText = `Great job! You have fully funded at least one goal. Keep contributing to the others to build discipline!`;
    } else {
      savingsPouchyExpression = 'smiling';
      savingsPouchyText = `You're making progress on your goals! Remember, even small contributions add up over time. Keep saving!`;
    }
  }

  // Render First-Time Setup
  if (!store.isBudgetSetupComplete) {
    return (
      <YStack flex={1} backgroundColor={theme.background}>
        <BackgroundSystem mode="tabs" />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <YStack gap={Spacing[16]} paddingVertical={Spacing[16]} alignItems="center">
              <Text color={theme.primary} fontSize={14} fontWeight="700" letterSpacing={1} textTransform="uppercase">
                Step {onboardingStep} of 3
              </Text>
              <Text color={theme.text} fontSize={22} fontWeight="700" textAlign="center" letterSpacing={-0.5}>
                Let's Create Your First Budget
              </Text>
              <Text color={theme.textSecondary} fontSize={14} textAlign="center" paddingHorizontal={10}>
                Cbudget helps you build healthy financial habits starting with structured budgeting rules.
              </Text>
            </YStack>

            <Animated.View entering={FadeInDown.duration(400)}>
              <PouchyBubble expression="smiling" text={onboardingPouchyText} />
            </Animated.View>

            {/* STEP 1: Budget Type */}
            {onboardingStep === 1 && (
              <Animated.View entering={FadeInDown.duration(400)}>
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

                  <FormButton variant="primary" height={48} onPress={() => setOnboardingStep(2)} marginTop={10}>
                    Next Step
                  </FormButton>
                </CbudgetCard>
              </Animated.View>
            )}

            {/* STEP 2: Budget Amount */}
            {onboardingStep === 2 && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <CbudgetCard gap={20} marginTop={Spacing[16]}>
                  <Text color={theme.text} fontSize={16} fontWeight="700">
                    How much is your {setupBudgetType} budget?
                  </Text>
                  
                  <FormInput
                    label="Limit (₱)"
                    placeholder={
                      setupBudgetType === 'daily'
                        ? 'e.g. 200'
                        : setupBudgetType === 'weekly'
                        ? 'e.g. 2000'
                        : 'e.g. 10000'
                    }
                    keyboardType="numeric"
                    value={setupAmount}
                    onChangeText={setSetupAmount}
                    leftIcon={{ ios: 'banknote', android: 'payments', web: 'payments' } as any}
                  />

                  <XStack gap={10} marginTop={10}>
                    <Button flex={1} backgroundColor={theme.backgroundElement} height={48} borderRadius={12} onPress={() => setOnboardingStep(1)}>
                      <Text color={theme.text} fontWeight="600">Back</Text>
                    </Button>
                    <FormButton flex={1.8} variant="primary" height={48} onPress={() => setOnboardingStep(3)}>
                      Next Step
                    </FormButton>
                  </XStack>
                </CbudgetCard>
              </Animated.View>
            )}

            {/* STEP 3: Categories Select */}
            {onboardingStep === 3 && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <CbudgetCard gap={16} marginTop={Spacing[16]}>
                  <Text color={theme.text} fontSize={16} fontWeight="700">
                    Which categories would you like to track?
                  </Text>
                  
                  <XStack flexWrap="wrap" gap={8} marginVertical={8}>
                    {defaultCategories.map((cat) => {
                      const isSelected = setupCategories.includes(cat);
                      return (
                        <Button
                          key={cat}
                          backgroundColor={isSelected ? theme.primary : theme.backgroundElement}
                          borderRadius={100}
                          height={36}
                          onPress={() => {
                            if (isSelected) {
                              setSetupCategories(setupCategories.filter((c) => c !== cat));
                            } else {
                              setSetupCategories([...setupCategories, cat]);
                            }
                          }}
                          borderWidth={0}
                          pressStyle={{ opacity: 0.85 }}
                        >
                          <Text color={isSelected ? '#FFFFFF' : theme.text} fontSize={12} fontWeight="600">
                            {cat}
                          </Text>
                        </Button>
                      );
                    })}

                    {/* Render custom categories user added */}
                    {setupCategories.filter(c => !defaultCategories.includes(c)).map((cat) => (
                      <Button
                        key={cat}
                        backgroundColor={theme.primary}
                        borderRadius={100}
                        height={36}
                        onPress={() => {
                          setSetupCategories(setupCategories.filter((c) => c !== cat));
                        }}
                        borderWidth={0}
                      >
                        <Text color="#FFFFFF" fontSize={12} fontWeight="600">
                          {cat} ✕
                        </Text>
                      </Button>
                    ))}
                  </XStack>

                  {showCustomCatInput ? (
                    <XStack gap={8} alignItems="center" marginTop={4}>
                      <TextInput
                        placeholder="Custom Category name"
                        placeholderTextColor={`${theme.text}45`}
                        value={customCategoryName}
                        onChangeText={setCustomCategoryName}
                        style={[styles.customInput, { color: theme.text, borderColor: theme.border }]}
                      />
                      <Button backgroundColor={theme.primary as any} height={38} borderRadius={8} onPress={handleAddCustomCategory}>
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
                    <Button flex={1} backgroundColor={theme.backgroundElement} height={48} borderRadius={12} onPress={() => setOnboardingStep(2)}>
                      <Text color={theme.text} fontWeight="600">Back</Text>
                    </Button>
                    <FormButton flex={1.8} variant="primary" height={48} onPress={handleOnboardingComplete}>
                      Create Budget
                    </FormButton>
                  </XStack>
                </CbudgetCard>
              </Animated.View>
            )}

          </ScrollView>
        </SafeAreaView>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor={theme.background}>
      <BackgroundSystem mode="tabs" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Custom Segmented Tab Controller */}
        <XStack paddingHorizontal={20} marginVertical={Spacing[8]} gap={8}>
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
            <XStack gap={6} alignItems="center">
              <SymbolView
                name={{ ios: 'chart.pie.fill', android: 'pie_chart', web: 'pie_chart' } as const}
                size={14}
                tintColor={activeTab === 'budget' ? theme.primary : theme.textSecondary}
              />
              <Text color={activeTab === 'budget' ? theme.text : theme.textSecondary} fontSize={13} fontWeight="700">
                Budget Tracker
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
            <XStack gap={6} alignItems="center">
              <SymbolView
                name={{ ios: 'heart.circle.fill', android: 'favorite', web: 'favorite' } as const}
                size={14}
                tintColor={activeTab === 'savings' ? theme.primary : theme.textSecondary}
              />
              <Text color={activeTab === 'savings' ? theme.text : theme.textSecondary} fontSize={13} fontWeight="700">
                Savings Goals
              </Text>
            </XStack>
          </Button>
        </XStack>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ==================== BUDGET TAB VIEW ==================== */}
          {activeTab === 'budget' && (
            <YStack gap={Spacing.five}>
              {/* Pouchy Bubble Status Indicator */}
              <Animated.View entering={FadeInDown.duration(400)}>
                <PouchyBubble
                  expression={activePouchyExpression}
                  text={activePouchyText}
                />
              </Animated.View>

              {/* Overall Analytics Card */}
              <Animated.View entering={FadeInDown.duration(450)}>
                <CbudgetCard borderLeftWidth={5} borderLeftColor={theme.primary} gap={14}>
                  <YStack alignItems="center" gap={4}>
                    <Text color={theme.textSecondary} fontSize={11} fontWeight="600" letterSpacing={0.8} textTransform="uppercase">
                      {store.budgetType?.toUpperCase()} BUDGET REMAINING
                    </Text>
                    <Text color={theme.text} fontSize={28} fontWeight="700" letterSpacing={-0.5}>
                      ₱{budgetLeftover.toLocaleString()}
                    </Text>
                    <Text color={theme.textSecondary} fontSize={13} textAlign="center">
                      leftover of ₱{store.totalBudget.toLocaleString()} total budget limit
                    </Text>
                  </YStack>

                  <Progress
                    value={(totalSpent / store.totalBudget) * 100}
                    height={8}
                    backgroundColor={theme.backgroundElement}
                    borderRadius={4}
                  >
                    <Progress.Indicator 
                      backgroundColor={totalSpent > store.totalBudget ? theme.error : theme.success} 
                      borderRadius={4} 
                    />
                  </Progress>

                  {/* Summary Breakdown Row */}
                  <XStack justifyContent="space-between" width="100%" borderTopWidth={1} borderTopColor={theme.border} paddingTop={10}>
                    <YStack gap={2}>
                      <Text color={theme.textSecondary} fontSize={11}>Spent</Text>
                      <Text color={theme.text} fontSize={13} fontWeight="700">₱{totalSpent.toLocaleString()}</Text>
                    </YStack>
                    <YStack gap={2} alignItems="center">
                      <Text color={theme.textSecondary} fontSize={11}>Sim Savings</Text>
                      <Text color={theme.primary as any} fontSize={13} fontWeight="700">₱{totalSavingsContribution.toLocaleString()}</Text>
                    </YStack>
                    <YStack gap={2} alignItems="flex-end">
                      <Text color={theme.textSecondary} fontSize={11}>Simulation Cash</Text>
                      <Text color={theme.primary} fontSize={13} fontWeight="700">₱{store.virtualBalance.toLocaleString()}</Text>
                    </YStack>
                  </XStack>
                </CbudgetCard>
              </Animated.View>

              {/* Action Button: Log simulated expense */}
              {!showExpenseForm && (
                <Animated.View entering={FadeInDown.duration(400)}>
                  <XStack gap={10}>
                    <FormButton
                      flex={1.2}
                      variant="primary"
                      onPress={() => setShowExpenseForm(true)}
                      leftIcon={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' } as any}
                    >
                      {'Log Expense (< 5s)'}
                    </FormButton>
                    <Button
                      flex={1}
                      height={48}
                      backgroundColor={theme.backgroundElement}
                      borderRadius={12}
                      borderColor={theme.border}
                      borderWidth={1}
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
                </Animated.View>
              )}

              {/* Rapid Expense Logger Modal/Card */}
              {showExpenseForm && (
                <Animated.View entering={FadeInDown.duration(400)}>
                  <CbudgetCard borderColor={theme.primary} borderWidth={1.5} gap={14}>
                    <Text color={theme.text} fontSize={17} fontWeight="700">
                      Rapid Expense Logger
                    </Text>

                    <FormInput
                      label="Expense Name"
                      placeholder="e.g. Lunch, Bus Fare, Book"
                      value={expenseName}
                      onChangeText={setExpenseName}
                    />

                    {/* Category quick selectors */}
                    <YStack gap={6}>
                      <Text color={theme.textSecondary} fontSize={11} fontWeight="600" textTransform="uppercase">
                        Category
                      </Text>
                      <XStack gap={6} flexWrap="wrap">
                        {store.selectedCategories.map((cat) => {
                          const isSelected = expenseCategory === cat;
                          return (
                            <Button
                              key={cat}
                              backgroundColor={isSelected ? theme.primary : theme.backgroundElement}
                              borderRadius={8}
                              height={34}
                              paddingHorizontal={12}
                              onPress={() => setExpenseCategory(cat)}
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

                    <FormInput
                      label="Amount (₱)"
                      placeholder="e.g. 120"
                      keyboardType="numeric"
                      value={expenseAmount}
                      onChangeText={setExpenseAmount}
                      leftIcon={{ ios: 'banknote', android: 'payments', web: 'payments' } as any}
                    />

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
                </Animated.View>
              )}

              {/* Category limits progress */}
              <YStack gap={12}>
                <Text color={theme.text} fontSize={16} fontWeight="700" paddingHorizontal={4}>
                  Category Budget Breakdown
                </Text>

                {store.selectedCategories.map((cat, idx) => {
                  const spentInCat = store.loggedExpenses
                    .filter((e) => e.category === cat)
                    .reduce((sum, e) => sum + e.amount, 0);
                  
                  // Average limit allocation
                  const limitInCat = store.totalBudget / (store.selectedCategories.length || 1);
                  const ratio = spentInCat / limitInCat;
                  const isOver = spentInCat > limitInCat;
                  const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Custom'];
                  const catIcon = CATEGORY_ICONS[cat] || CATEGORY_ICONS['Custom'];

                  return (
                    <Animated.View key={cat} entering={FadeInDown.delay(100 * idx).duration(400)}>
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
                    </Animated.View>
                  );
                })}
              </YStack>
            </YStack>
          )}

          {/* ==================== SAVINGS TAB VIEW ==================== */}
          {activeTab === 'savings' && (
            <YStack gap={Spacing.five}>
              {/* Pouchy Bubble Status Indicator */}
              <Animated.View entering={FadeInDown.duration(400)}>
                <PouchyBubble
                  expression={savingsPouchyExpression}
                  text={savingsPouchyText}
                />
              </Animated.View>

              {/* Smart Savings Insights Hero */}
              <Animated.View entering={FadeInDown.duration(400)}>
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
                      Create a savings goal below. Cbudget will calculate educational projections and recommend spending optimizations to help you build habits fast!
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
                            <Text color={theme.textSecondary} fontSize={12} lineHeight={16}>
                              • Pro-Tip: Reduce shopping expenses by <Text fontWeight="700" color={theme.warning}>₱300/week</Text> to complete this goal <Text fontWeight="700" color={theme.success}>1.5 months earlier</Text>!
                            </Text>
                          </YStack>
                        );
                      })}
                    </YStack>
                  )}
                </CbudgetCard>
              </Animated.View>

              {/* Create Savings Goal Button */}
              <Animated.View entering={FadeInDown.duration(400)}>
                <FormButton
                  variant="primary"
                  onPress={() => setShowAddGoalModal(true)}
                  leftIcon={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' } as any}
                >
                  Create Savings Goal
                </FormButton>
              </Animated.View>

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
                      <Animated.View key={g.id} entering={FadeInDown.delay(100 * idx).duration(450)}>
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
                      </Animated.View>
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

    </YStack>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
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
