import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert, Modal, TextInput, TouchableOpacity, Image as RNImage } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Button, Progress } from 'tamagui';
import { useAuthStore } from '@/store/authStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { FormButton } from '@/components/ui/FormButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { Spacing } from '@/constants/theme';

import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { PouchyHelper } from '@/components/ui/PouchyHelper';

export const getMasteryAvatarDetails = (title: string) => {
  switch (title) {
    case 'Smart Saver':
      return {
        initials: 'SS',
        color: '#10B981', // emerald
        borderColor: '#10B981',
        borderStyle: 'dashed' as const,
        bg: 'rgba(16, 185, 129, 0.1)',
      };
    case 'Investment Explorer':
      return {
        initials: 'IE',
        color: '#3B82F6', // royal blue
        borderColor: '#3B82F6',
        borderStyle: 'solid' as const,
        bg: 'rgba(59, 130, 246, 0.1)',
      };
    case 'Financial Strategist':
      return {
        initials: 'FS',
        color: '#F59E0B', // amber
        borderColor: '#F59E0B',
        borderStyle: 'solid' as const,
        bg: 'rgba(245, 158, 11, 0.1)',
      };
    case 'Budget Beginner':
    default:
      return {
        initials: 'BB',
        color: '#64748B', // slate
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

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme() as any;
  const { user, isPremium } = useAuthStore();
  
  const store = useGamificationStore();

  const [showAIChat, setShowAIChat] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; text: string; sender: 'user' | 'ai'; suggestion?: string }>>([
    { id: '1', text: "Hey! I'm Pouchy, your AI Financial Coach. Ask me how to budget, grow savings goals, or practice investing Cbudget in our sandbox!", sender: 'ai' },
  ]);

  useEffect(() => {
    store.checkAndUpdateStreak();
  }, []);

  // Derived calculations
  const totalSpent = store.loggedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSavingsContribution = store.savingsGoals.reduce((sum, g) => sum + g.currentSavings, 0);
  const budgetRemaining = store.totalBudget - totalSpent;
  const budgetLeftover = Math.max(0, budgetRemaining - totalSavingsContribution - store.virtualBalance);

  // Asset price reference for holdings - synced with GInvest-equivalent simulation tickers
  const assetPrices: Record<string, number> = {
    'MONEY.SIM': 105.15,
    'BOND.SIM': 185.30,
    'PSEi.SIM': 345.50,
    'TECH.SIM': 512.80,
  };
  const holdingsValue = Object.keys(store.portfolioAllocations).reduce(
    (sum, ticker) => sum + (store.portfolioAllocations[ticker] || 0) * (assetPrices[ticker] || 0),
    0
  );
  const totalSimValue = holdingsValue + store.virtualBalance;

  const handleStartCoachChat = () => {
    setShowAIChat(true);
  };

  return (
    <YStack flex={1} backgroundColor={theme.background} position="relative">
      <BackgroundSystem mode="tabs" />
      <SafeAreaView style={[styles.safeArea, { zIndex: 1 }]} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={{ backgroundColor: 'transparent' }}>
          
          {/* Greeting & Streak Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(450)}>
            <XStack justifyContent="space-between" alignItems="center" marginBottom={Spacing[16]}>
              <YStack gap={2}>
                <XStack alignItems="center" gap={6}>
                  <Text color={theme.textSecondary} fontSize={11} fontWeight="700" textTransform="uppercase" letterSpacing={0.5}>
                    {store.customAvatar.toUpperCase()}
                  </Text>
                  {isPremium && (
                    <XStack
                      backgroundColor="rgba(245, 158, 11, 0.12)"
                      borderColor="rgba(245, 158, 11, 0.35)"
                      borderWidth={1}
                      borderRadius={100}
                      paddingHorizontal={8}
                      paddingVertical={1.5}
                      alignItems="center"
                      gap={3}
                    >
                      <SymbolView
                        name={{ ios: 'crown.fill', android: 'star', web: 'star' } as any}
                        size={9}
                        tintColor="#F59E0B"
                      />
                      <Text color="#F59E0B" fontSize={8} fontWeight="800" letterSpacing={0.5}>
                        PREMIUM
                      </Text>
                    </XStack>
                  )}
                </XStack>
                <Text color={theme.text} fontSize={20} fontWeight="700" letterSpacing={-0.5}>
                  Hey {user?.name ? user.name.split(' ')[0] : 'Explorer'} 👋
                </Text>
              </YStack>

              <XStack alignItems="center" gap={4}>
                <SymbolView
                  name={{ ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' } as const}
                  size={16}
                  tintColor={theme.warning}
                />
                <Text color={theme.text} fontSize={14} fontWeight="600">
                  {store.streakDays}-day streak
                </Text>
              </XStack>
            </XStack>
          </Animated.View>

          {/* ==================== 1. BUDGET REMAINING CARD ==================== */}
          <Animated.View entering={FadeInDown.delay(150).duration(500)}>
            <CbudgetCard
              marginBottom={Spacing[16]}
              borderLeftWidth={5}
              borderLeftColor={theme.primary}
              padding={20}
              gap={12}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <YStack gap={2}>
                  <Text color={theme.textSecondary} fontSize={10} fontWeight="700" letterSpacing={0.8} textTransform="uppercase">
                    BUDGET REMAINING
                  </Text>
                  <Text color={theme.text} fontSize={32} fontWeight="bold">
                    ₱{budgetLeftover.toLocaleString()}
                  </Text>
                </YStack>
                <Button
                  size="$3"
                  backgroundColor={theme.primary}
                  borderRadius={10}
                  pressStyle={{ opacity: 0.85 }}
                  onPress={() => router.push('/(tabs)/budget' as Href)}
                >
                  <Text color="#FFFFFF" fontWeight="700" fontSize={12}>Manage</Text>
                </Button>
              </XStack>

              {store.isBudgetSetupComplete && (
                <Progress value={(totalSpent / store.totalBudget) * 100} height={6} backgroundColor={theme.backgroundElement}>
                  <Progress.Indicator backgroundColor={totalSpent > store.totalBudget ? theme.error : theme.success} />
                </Progress>
              )}
            </CbudgetCard>
          </Animated.View>

          {/* Shortcut Quick actions Grid */}
          <Animated.View entering={FadeInDown.delay(180).duration(500)}>
            <YStack gap={10} marginBottom={Spacing[16]}>
              <Text color={theme.text} fontSize={15} fontWeight="700" paddingHorizontal={4}>
                Quick Actions
              </Text>

              <XStack justifyContent="space-between" gap={8}>
                {/* Achievements Shortcut */}
                <YStack alignItems="center" flex={1} gap={6}>
                  <Button
                    width={50}
                    height={50}
                    borderRadius={10}
                    backgroundColor={theme.surface}
                    borderColor={theme.border}
                    borderWidth={1}
                    alignItems="center"
                    justifyContent="center"
                    padding={0}
                    pressStyle={{ scale: 0.95, backgroundColor: theme.backgroundElement }}
                    onPress={() => router.push('/(tabs)/profile' as Href)}
                  >
                    <SymbolView
                      name={{ ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' } as any}
                      size={22}
                      tintColor={theme.primary}
                    />
                  </Button>
                  <Text color={theme.text} fontSize={10} fontWeight="700" textAlign="center">
                    Achievements
                  </Text>
                </YStack>

                {/* AI Coach Assistant */}
                <YStack alignItems="center" flex={1} gap={6}>
                  <Button
                    width={50}
                    height={50}
                    borderRadius={10}
                    backgroundColor={theme.surface}
                    borderColor={theme.border}
                    borderWidth={1}
                    alignItems="center"
                    justifyContent="center"
                    padding={0}
                    pressStyle={{ scale: 0.95, backgroundColor: theme.backgroundElement }}
                    onPress={handleStartCoachChat}
                  >
                    <PouchyHelper expression="smiling" size={38} />
                  </Button>
                  <Text color={theme.text} fontSize={10} fontWeight="700" textAlign="center">
                    Pouchy Coach
                  </Text>
                </YStack>

                {/* Mastery Avatar Customization */}
                <YStack alignItems="center" flex={1} gap={6}>
                  <Button
                    width={50}
                    height={50}
                    borderRadius={10}
                    backgroundColor={theme.surface}
                    borderColor={theme.border}
                    borderWidth={1}
                    alignItems="center"
                    justifyContent="center"
                    padding={0}
                    pressStyle={{ scale: 0.95, backgroundColor: theme.backgroundElement }}
                    onPress={() => setShowAvatarPicker(true)}
                  >
                    <SymbolView
                      name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' } as any}
                      size={24}
                      tintColor={theme.primary}
                    />
                  </Button>
                  <Text color={theme.text} fontSize={10} fontWeight="700" textAlign="center">
                    Avatar Style
                  </Text>
                </YStack>

                {/* Investment Lab */}
                <YStack alignItems="center" flex={1} gap={6}>
                  <Button
                    width={50}
                    height={50}
                    borderRadius={10}
                    backgroundColor={theme.surface}
                    borderColor={theme.border}
                    borderWidth={1}
                    alignItems="center"
                    justifyContent="center"
                    padding={0}
                    pressStyle={{ scale: 0.95, backgroundColor: theme.backgroundElement }}
                    onPress={() => router.push('/(tabs)/invest' as Href)}
                  >
                    <SymbolView
                      name={{ ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' } as any}
                      size={22}
                      tintColor={theme.primary}
                    />
                  </Button>
                  <Text color={theme.text} fontSize={10} fontWeight="700" textAlign="center">
                    Invest Lab
                  </Text>
                </YStack>

              </XStack>
            </YStack>
          </Animated.View>


          {/* ==================== 2. FINANCIAL HEALTH HERO CARD ==================== */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <CbudgetCard
              marginBottom={Spacing[16]}
              borderLeftWidth={5}
              borderLeftColor={theme.primary}
              padding={16}
              gap={12}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <YStack gap={2} flex={1}>
                  <Text color={theme.textSecondary} fontSize={11} fontWeight="700" letterSpacing={0.8} textTransform="uppercase">
                    Cbudget Scorecard
                  </Text>
                  <Text color={theme.text} fontSize={18} fontWeight="700">
                    Financial Health Score
                  </Text>
                </YStack>
                <YStack
                  width={50}
                  height={50}
                  borderRadius={25}
                  backgroundColor={`${theme.primary}12` as any}
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={2.5}
                  borderColor={theme.primary}
                >
                  <Text color={theme.primary} fontSize={16} fontWeight="700">
                    {store.getFinancialHealthScore()}
                  </Text>
                </YStack>
              </XStack>

              <XStack flexWrap="wrap" gap={8} marginTop={4}>
                {[
                  { label: 'Budget Discipline', val: store.budgetingScore, color: theme.success },
                  { label: 'Savings Progress', val: store.savingScore, color: theme.primary },
                  { label: 'Learning Progress', val: store.learningScore, color: theme.primary },
                  { label: 'Investment Knowledge', val: store.investingScore, color: theme.warning },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={{
                      flex: 1,
                      minWidth: 120,
                      backgroundColor: theme.backgroundElement,
                      borderRadius: 10,
                      padding: 10,
                      gap: 4,
                    }}
                  >
                    <Text color={theme.textSecondary} fontSize={10} fontWeight="600">{item.label}</Text>
                    <XStack alignItems="center" justifyContent="space-between">
                      <Text color={theme.text} fontSize={14} fontWeight="700">{item.val}%</Text>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                    </XStack>
                  </View>
                ))}
              </XStack>
            </CbudgetCard>
          </Animated.View>

          {/* ==================== 3. SAVINGS GOAL PROGRESS ==================== */}
          <Animated.View entering={FadeInDown.delay(250).duration(500)}>
            <CbudgetCard marginBottom={Spacing[16]} padding={16} gap={10}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text color={theme.text} fontSize={15} fontWeight="700">
                  Savings Goals
                </Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/budget' as Href)}>
                  <Text color={theme.primary as any} fontSize={12} fontWeight="700">View Goals</Text>
                </TouchableOpacity>
              </XStack>

              {store.savingsGoals.length === 0 ? (
                <Text color={theme.textSecondary} fontSize={12} fontStyle="italic">
                  No active savings goals. Set up an emergency fund to shield your money!
                </Text>
              ) : (
                <YStack gap={8}>
                  {store.savingsGoals.slice(0, 2).map((goal) => {
                    const ratio = goal.currentSavings / goal.targetAmount;
                    return (
                      <YStack key={goal.id} gap={4}>
                        <XStack justifyContent="space-between">
                          <Text color={theme.text} fontSize={13} fontWeight="600">{goal.name}</Text>
                          <Text color={theme.primary as any} fontSize={12} fontWeight="700">₱{goal.currentSavings.toLocaleString()} / ₱{goal.targetAmount.toLocaleString()}</Text>
                        </XStack>
                        <Progress value={Math.min(100, ratio * 100)} height={5} backgroundColor={theme.backgroundElement}>
                          <Progress.Indicator backgroundColor={theme.primary} />
                        </Progress>
                      </YStack>
                    );
                  })}
                </YStack>
              )}
            </CbudgetCard>
          </Animated.View>

          {/* ==================== 4. INVESTMENT SIMULATION SUMMARY ==================== */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <CbudgetCard marginBottom={Spacing[16]} padding={16} gap={10}>
              <XStack justifyContent="space-between" alignItems="center">
                <YStack gap={2}>
                  <Text color={theme.textSecondary} fontSize={10} fontWeight="700" letterSpacing={0.8} textTransform="uppercase">
                    VIRTUAL PORTFOLIO VALUE
                  </Text>
                  <Text color={theme.text} fontSize={22} fontWeight="700">
                    ₱{totalSimValue.toLocaleString()}
                  </Text>
                </YStack>
                <Button
                  size="$3"
                  backgroundColor={theme.primary as any}
                  borderRadius={10}
                  pressStyle={{ opacity: 0.85 }}
                  onPress={() => router.push('/(tabs)/invest' as Href)}
                >
                  <Text color="#FFFFFF" fontWeight="700" fontSize={12}>Arena</Text>
                </Button>
              </XStack>

              <XStack justifyContent="space-between" backgroundColor={theme.backgroundElement} padding={10} borderRadius={10}>
                <YStack gap={2}>
                  <Text color={theme.textSecondary} fontSize={10} fontWeight="600">Sim Cash</Text>
                  <Text color={theme.text} fontSize={13} fontWeight="700">₱{store.virtualBalance.toLocaleString()}</Text>
                </YStack>
                <YStack gap={2} alignItems="flex-end">
                  <Text color={theme.textSecondary} fontSize={10} fontWeight="600">Holdings</Text>
                  <Text color={theme.text} fontSize={13} fontWeight="700">₱{holdingsValue.toLocaleString()}</Text>
                </YStack>
              </XStack>
            </CbudgetCard>
          </Animated.View>

          {/* ==================== 5. LEARNING PROGRESS ==================== */}
          <Animated.View entering={FadeInDown.delay(350).duration(500)}>
            <CbudgetCard
              marginBottom={Spacing[16]}
              borderLeftWidth={5}
              borderLeftColor={theme.primary}
              padding={16}
              gap={12}
              backgroundColor={`${theme.primary}05` as any}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <YStack gap={2}>
                  <Text color={theme.primary} fontSize={10} fontWeight="700" letterSpacing={0.8} textTransform="uppercase">
                    ACADEMY PATHWAY
                  </Text>
                  <Text color={theme.text} fontSize={15} fontWeight="700">
                    Complete Academic Roadmap
                  </Text>
                </YStack>
                <Button
                  size="$3"
                  backgroundColor={theme.surface}
                  borderColor={theme.border}
                  borderWidth={1}
                  borderRadius={8}
                  onPress={() => router.push('/(tabs)/learn' as Href)}
                >
                  <Text color={theme.primary} fontWeight="700" fontSize={12}>Learn</Text>
                </Button>
              </XStack>

              <XStack gap={10} alignItems="center">
                <Progress value={store.learningScore} height={5} flex={1} backgroundColor={theme.backgroundElement}>
                  <Progress.Indicator backgroundColor={theme.primary} />
                </Progress>
                <Text color={theme.text} fontSize={12} fontWeight="700">{store.learningScore}% Done</Text>
              </XStack>
            </CbudgetCard>
          </Animated.View>

          {/* ==================== 6. RECENT TRANSACTIONS ==================== */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <CbudgetCard marginBottom={Spacing[24]} padding={16} gap={10}>
              <Text color={theme.text} fontSize={15} fontWeight="700">
                Recent Tracked Expenses
              </Text>

              {store.loggedExpenses.length === 0 ? (
                <Text color={theme.textSecondary} fontSize={12} fontStyle="italic">
                  No simulated expenses logged yet. Add some in the Budget tab!
                </Text>
              ) : (
                <YStack gap={8}>
                  {store.loggedExpenses.slice(0, 3).map((exp) => (
                    <XStack key={exp.id} justifyContent="space-between" alignItems="center" paddingBottom={4} borderBottomWidth={1} borderBottomColor={`${theme.border}30` as any}>
                      <YStack gap={2}>
                        <Text color={theme.text} fontSize={13} fontWeight="600">{exp.name}</Text>
                        <Text color={theme.textSecondary} fontSize={10}>{exp.category} • {exp.date}</Text>
                      </YStack>
                      <Text color={theme.text} fontSize={13} fontWeight="700">
                        ₱{exp.amount.toLocaleString()}
                      </Text>
                    </XStack>
                  ))}
                </YStack>
              )}
            </CbudgetCard>
          </Animated.View>



        </ScrollView>
      </SafeAreaView>

      {/* AI COACH HELPER MODAL */}
      <Modal visible={showAIChat} transparent={true} animationType="slide" onRequestClose={() => setShowAIChat(false)}>
        <View style={styles.modalOverlay}>
          <CbudgetCard
            style={styles.chatModalContainer}
            gap={Spacing[16]}
            borderColor={isPremium ? '#F59E0B' : theme.border}
            borderWidth={isPremium ? 2 : 1}
          >
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap={8} alignItems="center">
                <PouchyHelper expression="smiling" size={36} />
                <YStack>
                  <Text color={isPremium ? '#F59E0B' : theme.text} fontSize={15} fontWeight="900">
                    Pouchy AI Coach{isPremium ? ' PRO' : ''}
                  </Text>
                  <Text color={theme.textSecondary} fontSize={10}>Always here to help you learn!</Text>
                </YStack>
                {isPremium && (
                  <SymbolView
                    name={{ ios: 'crown.fill', android: 'star', web: 'star' } as any}
                    size={14}
                    tintColor="#F59E0B"
                  />
                )}
              </XStack>
              <TouchableOpacity onPress={() => setShowAIChat(false)}>
                <SymbolView
                  name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' } as const}
                  size={24}
                  tintColor={theme.textSecondary}
                />
              </TouchableOpacity>
            </XStack>

            {/* Chat History */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12 }}>
              {chatMessages.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <XStack key={msg.id} gap={8} width="100%" justifyContent={isAI ? 'flex-start' : 'flex-end'} alignItems="flex-end">
                    {isAI && (
                      <PouchyHelper expression="smiling" size={32} />
                    )}
                    <YStack gap={4} maxWidth="80%" alignItems={isAI ? 'flex-start' : 'flex-end'}>
                      <View
                        style={{
                          backgroundColor: isAI ? theme.backgroundElement : theme.primary,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 16,
                          borderBottomLeftRadius: isAI ? 4 : 16,
                          borderBottomRightRadius: isAI ? 16 : 4,
                        } as any}
                      >
                        <Text color={isAI ? theme.text : '#FFFFFF'} fontSize={13} lineHeight={18}>
                          {msg.text}
                        </Text>
                      </View>
                      {msg.suggestion && (
                        <Button
                          size="$2"
                          backgroundColor={`${theme.primary}12` as any}
                          borderColor={`${theme.primary}35` as any}
                          borderWidth={1}
                          borderRadius={8}
                          onPress={() => {
                            setShowAIChat(false);
                            router.push(msg.suggestion as Href);
                          }}
                          alignSelf={isAI ? 'flex-start' : 'flex-end'}
                        >
                          <Text color={theme.primary} fontSize={11} fontWeight="700">
                            Start Lesson & Earn XP
                          </Text>
                        </Button>
                      )}
                    </YStack>
                  </XStack>
                );
              })}
            </ScrollView>

            {/* Prepopulated Coach Questions */}
            <XStack gap={6} flexWrap="wrap">
              {[
                'Can I afford this purchase?',
                'How can I save faster?',
                'Saving vs Investing?',
                'Focus on emergency fund first?'
              ].map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => {
                    const userMsg = { id: Date.now().toString(), text: q, sender: 'user' as const };
                    setChatMessages((prev) => [...prev, userMsg]);
                    
                    let replyText = 'Analyzing...';
                    let suggestionLink = '';
                    
                    if (q.includes('afford')) {
                      replyText = `Before making a simulated purchase, ask: Is this a Need or a Want? If it's a Want, does it fit within your remaining ₱${budgetLeftover.toLocaleString()} budget buffer? If yes, log it. If not, wait until your next budget reset!`;
                      suggestionLink = '/(tabs)/budget';
                    } else if (q.includes('save faster')) {
                      replyText = "To save faster, try the 'Pay Yourself First' strategy: save 15-20% of your budget immediately on payday. You can also identify category leaks (like entertainment or shopping) in your budget and cut back!";
                      suggestionLink = '/(tabs)/budget';
                    } else if (q.includes('Saving vs Investing')) {
                      replyText = "Saving is putting money in a safe, liquid place (like savings goals) for short-term needs. Investing is allocating leftover capital to diversified assets in the Investment Lab to grow your wealth over time by taking calculated risks. Always build savings first!";
                      suggestionLink = '/(tabs)/learn';
                    } else if (q.includes('emergency fund')) {
                      replyText = "Absolutely! An emergency fund is your financial shield. You should secure 3 to 6 months of basic living expenses (start with a small ₱5,000 goal) before allocating any cash into simulated investments. Safety and liquidity come first in the Budget → Save → Invest framework.";
                      suggestionLink = '/(tabs)/budget';
                    }
                    
                    setTimeout(() => {
                      setChatMessages((prev) => [
                        ...prev,
                        { id: (Date.now() + 1).toString(), text: replyText, sender: 'ai', suggestion: suggestionLink }
                      ]);
                    }, 800);
                  }}
                  style={{
                    backgroundColor: theme.backgroundElement,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8
                  }}
                >
                  <Text color={theme.primary} fontSize={11} fontWeight="700">
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </XStack>

            {/* Custom Message Input */}
            <XStack gap={8} alignItems="center">
              <TextInput
                placeholder="Ask your coach..."
                placeholderTextColor={`${theme.text}45`}
                style={[styles.chatInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={chatInput}
                onChangeText={setChatInput}
              />
              <TouchableOpacity
                onPress={() => {
                  if (!chatInput.trim()) return;
                  const text = chatInput;
                  setChatInput('');
                  setChatMessages((prev) => [...prev, { id: Date.now().toString(), text, sender: 'user' }]);
                  
                  setTimeout(() => {
                    setChatMessages((prev) => [
                      ...prev,
                      { id: (Date.now() + 1).toString(), text: 'Responsible wealth building requires structured steps. I highly recommend completing the budgeting and saving fundamentals (Levels 1-5) in the academy before practicing allocations in the Investment Lab!', sender: 'ai', suggestion: '/(tabs)/learn' }
                    ]);
                  }, 800);
                }}
                style={[styles.chatSendBtn, { backgroundColor: theme.primary }]}
              >
                <SymbolView
                  name={{ ios: 'paperplane.fill', android: 'send', web: 'send' } as any}
                  size={14}
                  tintColor="#FFFFFF"
                />
              </TouchableOpacity>
            </XStack>
          </CbudgetCard>
        </View>
      </Modal>

      {/* Avatar Picker Modal */}
      <Modal visible={showAvatarPicker} transparent={true} animationType="fade" onRequestClose={() => setShowAvatarPicker(false)}>
        <View style={styles.modalOverlay}>
          <CbudgetCard style={styles.avatarModalContainer} gap={Spacing[16]}>
            <XStack justifyContent="space-between" alignItems="center">
              <Text color={theme.text} fontSize={16} fontWeight="700">
                Choose Mastery Avatar Title
              </Text>
              <TouchableOpacity onPress={() => setShowAvatarPicker(false)}>
                <SymbolView
                  name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' } as const}
                  size={20}
                  tintColor={theme.textSecondary}
                />
              </TouchableOpacity>
            </XStack>

            <YStack gap={10} width="100%" marginVertical={Spacing[8]}>
              {['Budget Beginner', 'Smart Saver', 'Investment Explorer', 'Financial Strategist'].map((avatarName) => {
                const details = getMasteryAvatarDetails(avatarName);
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
                      borderColor: store.customAvatar === avatarName ? details.borderColor : theme.border,
                      borderStyle: details.borderStyle,
                      borderRadius: 12,
                      padding: 12,
                      gap: 12,
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
                      } as any}
                    >
                      <Text color={details.color as any} fontWeight="900" fontSize={13}>
                        {details.initials}
                      </Text>
                    </View>
                    <YStack flex={1}>
                      <Text color={theme.text} fontWeight="700" fontSize={14}>
                        {avatarName}
                      </Text>
                      <Text color={theme.textSecondary} fontSize={11}>
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
    paddingHorizontal: 20,
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
  chatModalContainer: {
    width: '100%',
    height: 480,
    maxWidth: 400,
  },
  avatarModalContainer: {
    width: '100%',
    maxWidth: 360,
  },
  chatInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  chatSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
