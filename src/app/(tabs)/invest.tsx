import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, View } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { useGamificationStore } from '@/store/gamificationStore';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { useRouter } from 'expo-router';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';

interface Asset {
  ticker: string;
  name: string;
  price: number;
  change: number;
  icon: SymbolViewProps['name'];
  color: string;
  sparkline: number[];
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive';
  partner: string;
  description: string;
}

export default function InvestScreen() {
  const router = useRouter();
  const theme = useTheme() as any;
  const store = useGamificationStore();
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '1Y' | 'ALL'>('1Y');
  const [chartWidth, setChartWidth] = useState(280);
  
  // Compound Time Machine states
  const [compoundMonthly, setCompoundMonthly] = useState<number>(500);
  const [compoundYears, setCompoundYears] = useState<number>(10);
  const [compoundRate, setCompoundRate] = useState<number>(8);
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);
  
  const assets: Asset[] = [
    {
      ticker: 'NOVA',
      name: 'NovaChip AI Corp',
      price: 512.80,
      change: 2.45,
      icon: { ios: 'cpu', android: 'memory', web: 'memory' } as const,
      color: '#A855F7',
      sparkline: [8, 9, 7, 10, 11, 9, 12],
      riskProfile: 'Aggressive',
      partner: 'Semiconductors',
      description: 'Neural core processors and AI accelerators.',
    },
    {
      ticker: 'VOLT',
      name: 'Volt Motors',
      price: 345.50,
      change: -1.85,
      icon: { ios: 'bolt.fill', android: 'flash_on', web: 'flash_on' } as const,
      color: '#22C55E',
      sparkline: [12, 13, 11, 14, 13, 10, 9],
      riskProfile: 'Aggressive',
      partner: 'Clean Energy & EV',
      description: 'Electric mobility and smart solar storage.',
    },
    {
      ticker: 'BREW',
      name: 'StarBrew Café',
      price: 125.30,
      change: 0.35,
      icon: { ios: 'cup.and.saucer.fill', android: 'local_cafe', web: 'local_cafe' } as const,
      color: '#F59E0B',
      sparkline: [8, 8, 9, 9, 10, 10, 11],
      riskProfile: 'Moderate',
      partner: 'Consumer Retail',
      description: 'Global chain of automated barista cafes.',
    },
    {
      ticker: 'APEX',
      name: 'Apex Logi-Retail',
      price: 185.20,
      change: 0.12,
      icon: { ios: 'cart.fill', android: 'shopping_cart', web: 'shopping_cart' } as const,
      color: '#EF4444',
      sparkline: [5, 6, 6, 7, 7, 7, 8],
      riskProfile: 'Conservative',
      partner: 'E-Commerce',
      description: 'Smart retail and drone logistic delivery.',
    },
    {
      ticker: 'SOLR',
      name: 'Solaris Power',
      price: 95.60,
      change: 0.78,
      icon: { ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' } as const,
      color: '#0EA5E9',
      sparkline: [6, 6, 7, 7, 8, 8, 9],
      riskProfile: 'Conservative',
      partner: 'Utility Provider',
      description: 'Clean energy generation from orbital solar arrays.',
    },
  ];

  const [transferAmount, setTransferAmount] = useState('');

  // Risk Profiler State
  const [profilerStep, setProfilerStep] = useState(0); 
  const [answers, setAnswers] = useState<number[]>([]);

  const getAssetOwnedUnits = (ticker: string) => {
    return store.portfolioAllocations[ticker] || 0;
  };

  const holdingsValue = assets.reduce((sum, a) => sum + getAssetOwnedUnits(a.ticker) * a.price, 0);
  const totalPortfolioValue = holdingsValue + store.virtualBalance;

  // Calculate live daily portfolio performance based on assets owned
  const dailyGain = assets.reduce((sum, asset) => {
    const owned = getAssetOwnedUnits(asset.ticker);
    const value = owned * asset.price;
    const gain = value * (asset.change / 100);
    return sum + gain;
  }, 0);
  
  const dailyGainPercent = totalPortfolioValue > 0 ? (dailyGain / totalPortfolioValue) * 100 : 0;
  const isPerformancePositive = dailyGain >= 0;

  // Calculate available leftover allowance from budget
  const totalSpent = store.loggedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetRemaining = store.totalBudget - totalSpent;
  const totalSavingsContribution = store.savingsGoals.reduce((sum, g) => sum + g.currentSavings, 0);
  const availableToTransfer = Math.max(0, budgetRemaining - totalSavingsContribution - store.virtualBalance);

  const handleTransferFromAllowance = () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to transfer.');
      return;
    }
    if (amt > availableToTransfer) {
      Alert.alert(
        'Insufficient Allowance',
        `You only have ₱${availableToTransfer.toLocaleString()} available to transfer. Log fewer expenses on the Dashboard to save and invest more!`
      );
      return;
    }
    const success = store.allocateToSimulation(amt);
    if (success) {
      store.addXP(15);
      Alert.alert(
        'Transfer Successful',
        `₱${amt.toLocaleString()} has been successfully saved and transferred from your allowance budget to your Investment Sandbox Cash! (+15 XP)`
      );
      setTransferAmount('');
    } else {
      Alert.alert('Transfer Failed', 'There was a problem transferring your funds.');
    }
  };

  const handleAddSimulationCash = () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid cash amount to deposit.');
      return;
    }
    
    useGamificationStore.setState({
      virtualBalance: store.virtualBalance + amt,
    });
    store.addXP(10);
    Alert.alert('Sandbox Cash Added', `₱${amt.toLocaleString()} has been added to your simulator funds. (+10 XP)`);
    setTransferAmount('');
  };

  const handleQuickAddCash = (amt: number) => {
    useGamificationStore.setState({
      virtualBalance: store.virtualBalance + amt,
    });
    store.addXP(5);
    Alert.alert('Sandbox Cash Added', `₱${amt.toLocaleString()} added. (+5 XP)`);
  };

  // Compound Time Machine calculations
  const monthlyRate = compoundRate / 1200;
  const totalMonths = compoundYears * 12;
  const compoundFV = monthlyRate > 0 
    ? compoundMonthly * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
    : compoundMonthly * totalMonths;
  
  const compoundPrincipal = compoundMonthly * totalMonths;
  const compoundInterestEarned = Math.max(0, compoundFV - compoundPrincipal);

  // Automatically award XP and achievements when user interacts with compounding values in real-time
  useEffect(() => {
    // Check if the values are non-default to verify interaction
    if (compoundMonthly !== 500 || compoundYears !== 10 || compoundRate !== 8) {
      if (!hasSimulated) {
        store.addXP(20);
        setHasSimulated(true);
      }
      
      // Unlock compounding achievement if they try the maximum 20-year horizon
      if (compoundYears === 20 && !store.achievements.some(a => a.id === 'compound_master')) {
        store.unlockAchievement('compound_master');
        Alert.alert(
          '🏆 Achievement Unlocked!',
          `Time Compounding Guru unlocked for simulating a 20-year long-term compound interest projection! (+20 XP)`
        );
      }
    }
  }, [compoundMonthly, compoundYears, compoundRate]);

  const handleAnswerQuestion = (answerScore: number) => {
    const newAnswers = [...answers, answerScore];
    setAnswers(newAnswers);
    
    if (profilerStep === 1) {
      setProfilerStep(2);
    } else if (profilerStep === 2) {
      const totalScore = newAnswers.reduce((a, b) => a + b, 0);
      let profile: 'Conservative' | 'Moderate' | 'Aggressive' = 'Moderate';
      if (totalScore <= 2) profile = 'Conservative';
      else if (totalScore >= 5) profile = 'Aggressive';
      
      store.setRiskProfile(profile);
      setProfilerStep(3);
    }
  };

  const navigateToDetails = (ticker: string) => {
    router.push({
      pathname: '/invest-details',
      params: { ticker }
    } as any);
  };

  if (!store.riskProfile && profilerStep !== 3) {
    return (
      <YStack flex={1} backgroundColor={theme.background} position="relative">
        <BackgroundSystem mode="tabs" height={380} />
        <SafeAreaView style={[styles.safeArea, { zIndex: 1 }]} edges={['top', 'left', 'right']}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={{ backgroundColor: 'transparent' }}>
            <View>
              <YStack alignItems="center" marginTop={40} marginBottom={30} gap={10}>
                <SymbolView 
                  name={{ ios: 'shield.checkerboard', android: 'verified_user', web: 'verified_user' } as any} 
                  size={72} 
                  tintColor={theme.primary} 
                />
                <Text color={theme.text} fontSize={24} fontWeight="900" letterSpacing={-0.5} marginTop={10} textAlign="center">
                  Risk Profiler
                </Text>
                <Text color={theme.textSecondary} fontSize={14} textAlign="center" paddingHorizontal={20} opacity={0.8} lineHeight={20}>
                  Before entering the simulator, let's figure out what kind of investor you are.
                </Text>
              </YStack>

              {profilerStep === 0 && (
                <CbudgetCard padding={24} gap={20}>
                  <Text color={theme.text} fontSize={15} fontWeight="600" textAlign="center" lineHeight={22}>
                    This quick 2-question test will determine your risk tolerance and assign you a profile badge.
                  </Text>
                  <FormButton variant="primary" height={48} onPress={() => setProfilerStep(1)}>
                    Take the Test
                  </FormButton>
                </CbudgetCard>
              )}

              {profilerStep === 1 && (
                <CbudgetCard padding={24} gap={16}>
                  <Text color={theme.textSecondary} fontSize={11} fontWeight="800" letterSpacing={0.8} opacity={0.6}>QUESTION 1 / 2</Text>
                  <Text color={theme.text} fontSize={18} fontWeight="800" marginBottom={10} letterSpacing={-0.3}>
                    What is your primary investment goal?
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => handleAnswerQuestion(1)}
                    style={[styles.profilerOption, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                    activeOpacity={0.7}
                  >
                    <Text color={theme.text} fontSize={14} fontWeight="600">A) Protect my money from losing value</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleAnswerQuestion(2)}
                    style={[styles.profilerOption, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                    activeOpacity={0.7}
                  >
                    <Text color={theme.text} fontSize={14} fontWeight="600">B) Grow my wealth steadily over time</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleAnswerQuestion(3)}
                    style={[styles.profilerOption, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                    activeOpacity={0.7}
                  >
                    <Text color={theme.text} fontSize={14} fontWeight="600">C) Maximize returns, even with high risk</Text>
                  </TouchableOpacity>
                </CbudgetCard>
              )}

              {profilerStep === 2 && (
                <CbudgetCard padding={24} gap={16}>
                  <Text color={theme.textSecondary} fontSize={11} fontWeight="800" letterSpacing={0.8} opacity={0.6}>QUESTION 2 / 2</Text>
                  <Text color={theme.text} fontSize={18} fontWeight="800" marginBottom={10} letterSpacing={-0.3}>
                    If your portfolio dropped 20% in one month, what would you do?
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleAnswerQuestion(1)}
                    style={[styles.profilerOption, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                    activeOpacity={0.7}
                  >
                    <Text color={theme.text} fontSize={14} fontWeight="600">A) Sell everything to stop losses</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleAnswerQuestion(2)}
                    style={[styles.profilerOption, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                    activeOpacity={0.7}
                  >
                    <Text color={theme.text} fontSize={14} fontWeight="600">B) Wait and see what happens</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleAnswerQuestion(3)}
                    style={[styles.profilerOption, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                    activeOpacity={0.7}
                  >
                    <Text color={theme.text} fontSize={14} fontWeight="600">C) Buy more while prices are low</Text>
                  </TouchableOpacity>
                </CbudgetCard>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="#0B132B">
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View marginBottom={20}>
            <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={8}>
              <YStack gap={2} flex={1} minWidth={150}>
                <Text color="#FFFFFF" fontSize={24} fontFamily="Inter_700Bold" letterSpacing={-0.4} lineHeight={30}>
                  Investment Lab
                </Text>
                <Text color="rgba(255, 255, 255, 0.6)" fontSize={13} fontFamily="Inter_400Regular" lineHeight={18}>
                  Practice asset allocation and strategy testing risk-free.
                </Text>
              </YStack>
              <XStack style={styles.statusBadge} alignItems="center" gap={6}>
                <SymbolView
                  name={{ ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' } as const}
                  size={12}
                  tintColor="#3EB47D"
                />
                <Text style={styles.statusText} textTransform="uppercase">
                  Sandbox Active
                </Text>
              </XStack>
            </XStack>
          </View>

          {/* Unified Net Portfolio Balance Card */}
          <CbudgetCard 
            padding={20} 
            gap={16} 
            marginBottom={16}
            backgroundColor="#1C2541"
            borderColor="rgba(255, 255, 255, 0.08)"
            borderWidth={1}
            borderRadius={16}
            elevation={0}
          >
            <YStack alignItems="center" gap={4}>
              <XStack gap={8} alignItems="center">
                <Text color="#8D99AE" fontSize={11} fontFamily="Inter_600SemiBold" letterSpacing={0.5} textTransform="uppercase">
                  Net Portfolio Value
                </Text>
                {store.riskProfile && (
                  <TouchableOpacity
                    onPress={() => {
                      store.setRiskProfile(null);
                      setProfilerStep(0);
                      setAnswers([]);
                    }}
                  >
                    <Text
                      color={
                        store.riskProfile === 'Conservative'
                          ? '#10B981'
                          : store.riskProfile === 'Moderate'
                          ? '#F59E0B'
                          : '#EF4444'
                      }
                      fontSize={10}
                      fontFamily="Inter_700Bold"
                      letterSpacing={0.5}
                      textTransform="uppercase"
                    >
                      • {store.riskProfile}
                    </Text>
                  </TouchableOpacity>
                )}
              </XStack>
              
              <XStack alignItems="baseline" gap={4} marginTop={4}>
                <Text color="#3EB47D" fontSize={20} fontFamily="Inter_700Bold">₱</Text>
                <Text color="#FFFFFF" fontSize={28} fontFamily="Inter_700Bold" letterSpacing={-0.5} lineHeight={34}>
                  {totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </XStack>
            </YStack>

            <XStack justifyContent="space-between" paddingTop={14} borderTopWidth={1} borderTopColor="rgba(255, 255, 255, 0.06)">
              <YStack gap={2}>
                <Text color="#8D99AE" fontSize={11} fontFamily="Inter_500Medium" lineHeight={16}>
                  Invested Assets
                </Text>
                <Text color="#FFFFFF" fontSize={15} fontFamily="Inter_700Bold" lineHeight={20}>
                  ₱{holdingsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </YStack>
              <YStack alignItems="flex-end" gap={2}>
                <Text color="#8D99AE" fontSize={11} fontFamily="Inter_500Medium" lineHeight={16}>
                  Sandbox Cash
                </Text>
                <Text color="#3EB47D" fontSize={15} fontFamily="Inter_700Bold" lineHeight={20}>
                  ₱{store.virtualBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </YStack>
            </XStack>

            {/* Asset Allocation Breakdown Bar */}
            <YStack gap={8} marginTop={4}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="#8D99AE" fontSize={10} fontFamily="Inter_600SemiBold" letterSpacing={0.5} textTransform="uppercase">
                  Asset Allocation
                </Text>
                <XStack gap={10}>
                  <XStack gap={4} alignItems="center">
                    <View width={6} height={6} borderRadius={3} backgroundColor="#3EB47D" />
                    <Text color="#8D99AE" fontSize={10} fontFamily="Inter_500Medium">
                      Stocks ({totalPortfolioValue > 0 ? Math.round((holdingsValue / totalPortfolioValue) * 100) : 0}%)
                    </Text>
                  </XStack>
                  <XStack gap={4} alignItems="center">
                    <View width={6} height={6} borderRadius={3} backgroundColor="#10B981" />
                    <Text color="#8D99AE" fontSize={10} fontFamily="Inter_500Medium">
                      Cash ({totalPortfolioValue > 0 ? Math.round((store.virtualBalance / totalPortfolioValue) * 100) : 100}%)
                    </Text>
                  </XStack>
                </XStack>
              </XStack>

              <View height={6} backgroundColor="rgba(255, 255, 255, 0.08)" borderRadius={3} overflow="hidden" flexDirection="row" width="100%">
                <View 
                  width={`${totalPortfolioValue > 0 ? Math.min(100, (holdingsValue / totalPortfolioValue) * 100) : 0}%`} 
                  height="100%" 
                  backgroundColor="#3EB47D" 
                />
                <View 
                  width={`${totalPortfolioValue > 0 ? Math.min(100, (store.virtualBalance / totalPortfolioValue) * 100) : 100}%`} 
                  height="100%" 
                  backgroundColor="#10B981" 
                />
              </View>
            </YStack>
          </CbudgetCard>

          {/* 1-Year Portfolio Growth Line Chart with Segmented Time Control */}
          <CbudgetCard 
            padding={20} 
            gap={14} 
            marginBottom={16}
            backgroundColor="#1C2541"
            borderColor="rgba(255, 255, 255, 0.08)"
            borderWidth={1}
            borderRadius={16}
            elevation={0}
          >
            <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={10}>
              <YStack gap={2}>
                <Text color="#8D99AE" fontSize={11} fontFamily="Inter_600SemiBold" letterSpacing={0.5} textTransform="uppercase">
                  Portfolio Performance
                </Text>
                <XStack gap={6} alignItems="center">
                  <Text color="#FFFFFF" fontSize={14} fontFamily="Inter_700Bold">
                    {isPerformancePositive ? '+' : ''}₱{dailyGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <View 
                    backgroundColor={isPerformancePositive ? 'rgba(5, 150, 105, 0.15)' : 'rgba(239, 68, 68, 0.15)'} 
                    paddingHorizontal={6} 
                    paddingVertical={2} 
                    borderRadius={4}
                  >
                    <Text 
                      color={isPerformancePositive ? '#059669' : '#EF4444'} 
                      fontSize={10} 
                      fontFamily="Inter_600SemiBold"
                    >
                      {isPerformancePositive ? '+' : ''}{dailyGainPercent.toFixed(2)}%
                    </Text>
                  </View>
                </XStack>
              </YStack>

              {/* Perfectly Aligned Segmented Time Control (Equal Width 34px Pills) */}
              <XStack 
                backgroundColor="rgba(255, 255, 255, 0.04)" 
                borderRadius={8} 
                padding={3} 
                gap={3} 
                borderWidth={1} 
                borderColor="rgba(255, 255, 255, 0.08)"
                alignItems="center"
              >
                {(['1D', '1W', '1M', '1Y', 'ALL'] as const).map((range) => {
                  const isSelected = timeRange === range;
                  return (
                    <TouchableOpacity
                      key={range}
                      onPress={() => setTimeRange(range)}
                      activeOpacity={0.8}
                      style={{
                        width: 34,
                        height: 26,
                        borderRadius: 6,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: isSelected ? '#3EB47D' : 'transparent',
                      }}
                    >
                      <Text
                        color={isSelected ? '#FFFFFF' : '#8D99AE'}
                        fontSize={10}
                        fontFamily={isSelected ? 'Inter_700Bold' : 'Inter_600SemiBold'}
                        textAlign="center"
                      >
                        {range}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </XStack>
            </XStack>

            {/* Premium Financial Performance Chart */}
            <View 
              height={72} 
              width="100%" 
              position="relative" 
              marginTop={8} 
              justifyContent="center"
              onLayout={(e) => {
                const width = e.nativeEvent.layout.width;
                if (width > 0) setChartWidth(width);
              }}
            >
              {/* Subtle Grid Baseline Guides */}
              <View position="absolute" top={10} left={0} right={0} height={1} backgroundColor="rgba(255, 255, 255, 0.04)" />
              <View position="absolute" top={36} left={0} right={0} height={1} backgroundColor="rgba(255, 255, 255, 0.04)" />
              <View position="absolute" top={62} left={0} right={0} height={1} backgroundColor="rgba(255, 255, 255, 0.04)" />

              {(() => {
                const chartData = timeRange === '1D' 
                  ? [498200, 499100, 498500, 500200, 499800, 501400, 500000]
                  : timeRange === '1W'
                  ? [485000, 488000, 492000, 489000, 494000, 497000, 500000]
                  : timeRange === '1M'
                  ? [460000, 468000, 475000, 471000, 484000, 492000, 500000]
                  : timeRange === 'ALL'
                  ? [320000, 360000, 410000, 440000, 470000, 485000, 500000]
                  : [410000, 428000, 422000, 445000, 462000, 478000, 495000, 500000]; // 1Y default
                
                const cMin = Math.min(...chartData);
                const cMax = Math.max(...chartData);
                const cRange = cMax - cMin || 1;
                const cHeight = 64;
                const cWidth = chartWidth || 280;

                const cPoints = chartData.map((val, idx) => {
                  const x = (idx / (chartData.length - 1)) * cWidth;
                  const y = cHeight - 4 - ((val - cMin) / cRange) * (cHeight - 8);
                  return { x, y };
                });

                const lastPoint = cPoints[cPoints.length - 1];

                return (
                  <>
                    {/* Area Fill Stems */}
                    {cPoints.map((pt, idx) => (
                      <View
                        key={`stem-${idx}`}
                        style={{
                          position: 'absolute',
                          left: pt.x,
                          top: pt.y,
                          width: 1,
                          height: cHeight - pt.y,
                          backgroundColor: '#3EB47D',
                          opacity: 0.12,
                        }}
                      />
                    ))}

                    {/* Continuous Vector Curve Segments */}
                    {cPoints.map((pt, idx) => {
                      if (idx === cPoints.length - 1) return null;
                      const nextPt = cPoints[idx + 1];
                      const dx = nextPt.x - pt.x;
                      const dy = nextPt.y - pt.y;
                      const dist = Math.sqrt(dx * dx + dy * dy);
                      const angle = Math.atan2(dy, dx);

                      return (
                        <View
                          key={`chart-seg-${idx}`}
                          style={{
                            position: 'absolute',
                            left: pt.x + dx / 2 - dist / 2,
                            top: pt.y + dy / 2 - 1,
                            width: dist,
                            height: 2,
                            backgroundColor: '#3EB47D',
                            transform: [{ rotate: `${angle}rad` }],
                          }}
                        />
                      );
                    })}

                    {/* Glowing Active Indicator Node at End Point */}
                    {lastPoint && (
                      <View
                        style={{
                          position: 'absolute',
                          left: lastPoint.x - 7,
                          top: lastPoint.y - 7,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: 'rgba(62, 180, 125, 0.25)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#3EB47D',
                          }}
                        />
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          </CbudgetCard>

          {/* Sandbox Cash Manager Card */}
          <CbudgetCard 
            padding={20} 
            gap={14} 
            marginBottom={16}
            backgroundColor="#1C2541"
            borderColor="rgba(255, 255, 255, 0.08)"
            borderWidth={1}
            borderRadius={16}
            elevation={0}
          >
            <YStack gap={2}>
              <Text color="#FFFFFF" fontSize={14} fontFamily="Inter_700Bold" letterSpacing={-0.2} lineHeight={20}>
                Simulated Sandbox Cash Manager
              </Text>
              <Text color="#8D99AE" fontSize={11} fontFamily="Inter_500Medium" lineHeight={15}>
                Available leftover allowance budget to invest: <Text color="#3EB47D" fontFamily="Inter_700Bold">₱{Math.round(availableToTransfer).toLocaleString()}</Text>
              </Text>
            </YStack>
            
            <YStack gap={10}>
              <FormInput
                placeholder="Enter amount (₱)"
                keyboardType="numeric"
                value={transferAmount}
                onChangeText={setTransferAmount}
              />
              
              <XStack gap={8} width="100%" alignItems="center">
                <FormButton
                  variant="primary"
                  height={40}
                  borderRadius={8}
                  fullWidth={false}
                  leftIcon={{ ios: 'arrow.left.arrow.right', android: 'swap_horiz', web: 'swap_horiz' } as any}
                  onPress={handleTransferFromAllowance}
                  style={{ backgroundColor: '#059669', flex: 1.2 }}
                >
                  Transfer Cash
                </FormButton>
                <FormButton
                  variant="outline"
                  height={40}
                  borderRadius={8}
                  fullWidth={false}
                  leftIcon={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' } as any}
                  onPress={handleAddSimulationCash}
                  style={{ borderColor: 'rgba(255, 255, 255, 0.15)', backgroundColor: 'transparent', flex: 0.8 }}
                >
                  Sim Grant
                </FormButton>
              </XStack>
            </YStack>

            <YStack gap={6} marginTop={4}>
              <Text color="rgba(255, 255, 255, 0.5)" fontSize={10} fontFamily="Inter_600SemiBold" letterSpacing={0.5} textTransform="uppercase" textAlign="center">
                Quick Sim Test Grants
              </Text>
              <XStack gap={8} justifyContent="center">
                <TouchableOpacity onPress={() => handleQuickAddCash(500)} style={styles.quickCashBtn}>
                  <Text color="#FFFFFF" fontSize={11} fontFamily="Inter_600SemiBold">+₱500</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleQuickAddCash(1000)} style={styles.quickCashBtn}>
                  <Text color="#FFFFFF" fontSize={11} fontFamily="Inter_600SemiBold">+₱1K</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleQuickAddCash(5000)} style={styles.quickCashBtn}>
                  <Text color="#FFFFFF" fontSize={11} fontFamily="Inter_600SemiBold">+₱5K</Text>
                </TouchableOpacity>
              </XStack>
            </YStack>
          </CbudgetCard>

          {/* Compound Interest Time Machine Card */}
          <CbudgetCard 
            padding={20} 
            gap={16} 
            marginBottom={16}
            backgroundColor="#1C2541"
            borderColor="rgba(255, 255, 255, 0.08)"
            borderWidth={1}
            borderRadius={16}
            elevation={0}
          >
            <YStack gap={2}>
              <XStack gap={6} alignItems="center">
                <SymbolView
                  name={{ ios: 'hourglass.badge.plus', android: 'hourglass_empty', web: 'hourglass_empty' } as any}
                  size={16}
                  tintColor="#3EB47D"
                />
                <Text color="#FFFFFF" fontSize={14} fontFamily="Inter_700Bold" letterSpacing={-0.2} lineHeight={20}>
                  Compound Interest Time Machine
                </Text>
              </XStack>
              <Text color="#8D99AE" fontSize={12} fontFamily="Inter_400Regular" lineHeight={16} marginTop={2}>
                Simulate how small regular monthly savings compound and grow over time!
              </Text>
            </YStack>

            {/* 1. Allowance Monthly Savings Option Selector */}
            <YStack gap={6}>
              <Text color="rgba(255, 255, 255, 0.7)" fontSize={11} fontFamily="Inter_600SemiBold" letterSpacing={0.5} textTransform="uppercase">
                Monthly Savings Amount
              </Text>
              <XStack gap={6} flexWrap="wrap">
                {([100, 500, 1000, 2500, 5000] as const).map((amt) => {
                  const isSel = compoundMonthly === amt;
                  return (
                    <TouchableOpacity
                      key={amt}
                      onPress={() => setCompoundMonthly(amt)}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: isSel ? '#3EB47D' : 'rgba(255, 255, 255, 0.08)',
                        backgroundColor: isSel ? 'rgba(62, 180, 125, 0.12)' : '#0B132B',
                      }}
                    >
                      <Text color={isSel ? '#3EB47D' : '#FFFFFF'} fontSize={11} fontFamily="Inter_700Bold">
                        ₱{amt.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </XStack>
            </YStack>

            {/* 2. Target Horizon Selection */}
            <YStack gap={6}>
              <Text color="rgba(255, 255, 255, 0.7)" fontSize={11} fontFamily="Inter_600SemiBold" letterSpacing={0.5} textTransform="uppercase">
                Years to Compounding
              </Text>
              <XStack gap={6} flexWrap="wrap">
                {([2, 5, 10, 20] as const).map((yr) => {
                  const isSel = compoundYears === yr;
                  return (
                    <TouchableOpacity
                      key={yr}
                      onPress={() => setCompoundYears(yr)}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: isSel ? '#3EB47D' : 'rgba(255, 255, 255, 0.08)',
                        backgroundColor: isSel ? 'rgba(62, 180, 125, 0.12)' : '#0B132B',
                      }}
                    >
                      <Text color={isSel ? '#3EB47D' : '#FFFFFF'} fontSize={11} fontFamily="Inter_700Bold">
                        {yr} {yr === 1 ? 'Year' : 'Yrs'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </XStack>
            </YStack>

            {/* 3. Interest Rates Strategy Selection */}
            <YStack gap={6}>
              <Text color="rgba(255, 255, 255, 0.7)" fontSize={11} fontFamily="Inter_600SemiBold" letterSpacing={0.5} textTransform="uppercase">
                Compounding Strategy (Growth Rate)
              </Text>
              <XStack gap={6} flexWrap="wrap">
                {([
                  { rate: 4, label: '4% (Savings)' },
                  { rate: 8, label: '8% (Index Fund)' },
                  { rate: 12, label: '12% (Tech Stock)' }
                ] as const).map((strategy) => {
                  const isSel = compoundRate === strategy.rate;
                  return (
                    <TouchableOpacity
                      key={strategy.rate}
                      onPress={() => setCompoundRate(strategy.rate)}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: isSel ? '#3EB47D' : 'rgba(255, 255, 255, 0.08)',
                        backgroundColor: isSel ? 'rgba(62, 180, 125, 0.12)' : '#0B132B',
                      }}
                    >
                      <Text color={isSel ? '#3EB47D' : '#FFFFFF'} fontSize={11} fontFamily="Inter_700Bold">
                        {strategy.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </XStack>
            </YStack>

            {/* 4. Future Value and Visual Projections Split */}
            <YStack backgroundColor="#0B132B" padding={14} borderRadius={12} gap={10} borderWidth={1} borderColor="rgba(255, 255, 255, 0.06)">
              <XStack justifyContent="space-between">
                <Text color="#8D99AE" fontSize={11} fontFamily="Inter_500Medium">Principal Saved</Text>
                <Text color="#FFFFFF" fontSize={12} fontFamily="Inter_700Bold">₱{Math.round(compoundPrincipal).toLocaleString()}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="#8D99AE" fontSize={11} fontFamily="Inter_500Medium">Simulated Growth</Text>
                <Text color="#10B981" fontSize={12} fontFamily="Inter_700Bold">+₱{Math.round(compoundInterestEarned).toLocaleString()}</Text>
              </XStack>
              <View height={1} backgroundColor="rgba(255, 255, 255, 0.08)" />
              <XStack justifyContent="space-between" alignItems="baseline">
                <Text color="#8D99AE" fontSize={11} fontFamily="Inter_600SemiBold">Future Wealth</Text>
                <Text color="#FFFFFF" fontSize={18} fontFamily="Inter_700Bold">₱{Math.round(compoundFV).toLocaleString()}</Text>
              </XStack>

              {/* Progress Split Bar visualization (Principal vs Interest) */}
              <View height={6} backgroundColor="rgba(255, 255, 255, 0.08)" borderRadius={3} overflow="hidden" flexDirection="row" width="100%" marginTop={2}>
                <View 
                  width={`${compoundFV > 0 ? Math.min(100, (compoundPrincipal / compoundFV) * 100) : 100}%`} 
                  height="100%" 
                  backgroundColor="#64748B" 
                />
                <View 
                  width={`${compoundFV > 0 ? Math.min(100, (compoundInterestEarned / compoundFV) * 100) : 0}%`} 
                  height="100%" 
                  backgroundColor="#10B981" 
                />
              </View>
              <XStack justifyContent="space-between" marginTop={-2}>
                <Text color="#8D99AE" fontSize={9} fontFamily="Inter_400Regular">• Principal ({compoundFV > 0 ? Math.round((compoundPrincipal / compoundFV) * 100) : 100}%)</Text>
                <Text color="#10B981" fontSize={9} fontFamily="Inter_600SemiBold">• Growth ({compoundFV > 0 ? Math.round((compoundInterestEarned / compoundFV) * 100) : 0}%)</Text>
              </XStack>
            </YStack>

            {/* 5. Relatable Teenage Milestone Converter Box */}
            <View backgroundColor="rgba(16, 185, 129, 0.05)" padding={12} borderRadius={10} borderWidth={1} borderColor="rgba(16, 185, 129, 0.15)">
              <Text color="#10B981" fontSize={11} fontFamily="Inter_700Bold" letterSpacing={0.5} textTransform="uppercase">
                Relatable Teenage Milestone
              </Text>
              <Text color="#E2E8F0" fontSize={12} fontFamily="Inter_500Medium" lineHeight={16} marginTop={4}>
                {(() => {
                  if (compoundFV < 15000) {
                    return "👟 That's equal to buying 2 pairs of premium sneakers or a mechanical keyboard!";
                  } else if (compoundFV >= 15000 && compoundFV < 50000) {
                    return "🎮 That's equivalent to 2 Nintendo Switch consoles or a standard iPad!";
                  } else if (compoundFV >= 50000 && compoundFV < 200000) {
                    return "🖥️ That's equivalent to a custom watercooled gaming PC or a roundtrip flight to Japan!";
                  } else if (compoundFV >= 200000 && compoundFV < 1000000) {
                    return "🏍️ That's equivalent to a brand new underbone motorcycle or a full college semester!";
                  } else {
                    return "🚗 That's enough to buy a brand new EV sports car or a downpayment on a condo!";
                  }
                })()}
              </Text>
            </View>

          </CbudgetCard>

          {/* Watchlist Section */}
          <YStack gap={10}>
            <XStack justifyContent="space-between" alignItems="center" marginBottom={2} paddingHorizontal={4}>
              <Text color="#FFFFFF" fontSize={16} fontFamily="Inter_700Bold" letterSpacing={-0.3}>
                Practice Sandbox Portfolio
              </Text>
              <Text color="#8D99AE" fontSize={11} fontFamily="Inter_600SemiBold" letterSpacing={0.5}>
                TAP TO ANALYZE
              </Text>
            </XStack>

            <CbudgetCard 
              padding={0} 
              borderRadius={16}
              backgroundColor="#1C2541"
              borderColor="rgba(255, 255, 255, 0.08)"
              borderWidth={1}
              elevation={0}
              style={{ overflow: 'hidden' }}
            >
              {assets.map((asset, index) => {
                const changeIsPositive = asset.change >= 0;
                const ownedUnits = getAssetOwnedUnits(asset.ticker);
                const assetTotalValue = ownedUnits * asset.price;
                const isLast = index === assets.length - 1;

                return (
                  <View key={asset.ticker}>
                    <TouchableOpacity
                      onPress={() => navigateToDetails(asset.ticker)}
                      activeOpacity={0.7}
                      style={{
                        padding: 16,
                        backgroundColor: 'transparent',
                      }}
                    >
                      <XStack justifyContent="space-between" alignItems="center">
                        <XStack gap={12} alignItems="center">
                          {/* Flat Icon container */}
                          <View
                            width={40}
                            height={40}
                            borderRadius={10}
                            backgroundColor="rgba(255, 255, 255, 0.04)"
                            alignItems="center"
                            justifyContent="center"
                            borderWidth={1}
                            borderColor="rgba(255, 255, 255, 0.08)"
                          >
                            <SymbolView
                              name={asset.icon}
                              size={18}
                              tintColor={asset.color}
                            />
                          </View>

                          <YStack gap={2}>
                            <XStack gap={6} alignItems="center">
                              <Text color="#FFFFFF" fontSize={14} fontFamily="Inter_700Bold" letterSpacing={-0.2} lineHeight={18}>
                                {asset.ticker}
                              </Text>
                              <Text
                                color={
                                  asset.riskProfile === 'Conservative'
                                    ? '#10B981'
                                    : asset.riskProfile === 'Moderate'
                                    ? '#F59E0B'
                                    : '#EF4444'
                                }
                                fontSize={10}
                                fontFamily="Inter_700Bold"
                                letterSpacing={0.5}
                                textTransform="uppercase"
                              >
                                • {asset.riskProfile}
                              </Text>
                            </XStack>
                            <Text color="#8D99AE" fontSize={11} fontFamily="Inter_400Regular" numberOfLines={1} style={{ maxWidth: 140 }}>
                              {asset.name}
                            </Text>
                          </YStack>
                        </XStack>

                        {/* Right side Price & stats */}
                        <XStack gap={12} alignItems="center">
                          {/* Minimalist line graph sparkline */}
                          <View style={{ width: 36, height: 18, position: 'relative', overflow: 'visible', opacity: 0.9 }}>
                            {(() => {
                              const spData = asset.sparkline;
                              const spMin = Math.min(...spData);
                              const spMax = Math.max(...spData);
                              const spRange = spMax - spMin || 1;
                              const spHeight = 18;
                              const spWidth = 36;
                              
                              const spPoints = spData.map((val, idx) => {
                                const x = (idx / (spData.length - 1)) * spWidth;
                                const y = spHeight - 1 - ((val - spMin) / spRange) * (spHeight - 2);
                                return { x, y };
                              });

                              return spPoints.map((pt, idx) => {
                                if (idx === spPoints.length - 1) return null;
                                const nextPt = spPoints[idx + 1];
                                const dx = nextPt.x - pt.x;
                                const dy = nextPt.y - pt.y;
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                const angle = Math.atan2(dy, dx);

                                return (
                                  <View
                                    key={`sp-seg-${idx}`}
                                    style={{
                                      position: 'absolute',
                                      left: pt.x + dx / 2 - dist / 2,
                                      top: pt.y + dy / 2 - 0.75,
                                      width: dist,
                                      height: 1.5,
                                      backgroundColor: changeIsPositive ? '#059669' : '#EF4444',
                                      transform: [{ rotate: `${angle}rad` }],
                                    }}
                                  />
                                );
                              });
                            })()}
                          </View>

                          <YStack alignItems="flex-end" gap={2} minWidth={70}>
                            <Text color="#FFFFFF" fontSize={14} fontFamily="Inter_700Bold" lineHeight={18}>
                              ₱{asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Text>
                            <View backgroundColor={changeIsPositive ? 'rgba(5, 150, 105, 0.15)' : 'rgba(239, 68, 68, 0.12)'} paddingHorizontal={6} paddingVertical={2} borderRadius={4}>
                              <Text color={changeIsPositive ? '#059669' : '#EF4444'} fontSize={10} fontFamily="Inter_600SemiBold">
                                {changeIsPositive ? '+' : ''}
                                {asset.change.toFixed(2)}%
                              </Text>
                            </View>
                          </YStack>
                        </XStack>
                      </XStack>

                      {/* Owned units status label footer */}
                      {ownedUnits > 0 && (
                        <View marginTop={10} backgroundColor="rgba(5, 150, 105, 0.1)" padding={10} borderRadius={8} borderWidth={1} borderColor="rgba(5, 150, 105, 0.25)">
                          <Text color="#F8FAFC" fontSize={11} fontFamily="Inter_600SemiBold">
                            You own: <Text color="#059669" fontFamily="Inter_700Bold">₱{assetTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {!isLast && <View height={1} backgroundColor="rgba(255, 255, 255, 0.05)" marginHorizontal={16} />}
                  </View>
                );
              })}
            </CbudgetCard>
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </YStack>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 32,
  },
  quickCashBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0B132B',
  },
  profilerOption: {
    borderWidth: 1,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  // The Premium "Active Status" Badge
  statusBadge: {
    backgroundColor: 'rgba(62, 180, 125, 0.12)', // Solid, deep, green base
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(62, 180, 125, 0.25)', // Crisp green border line
  },
  statusText: {
    color: '#3EB47D', // Original clean brand green
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Premium Conservative Risk Tag
  riskBadge: {
    backgroundColor: '#f0fdf4', // Clean, crisp, solid very light green tint
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0', // Thin framing border
  },
  riskBadgeText: {
    color: '#16a34a', // Solid, professional dark green text
    fontSize: 10,
    fontWeight: '700',
  },
  // Premium Primary Interactive Button
  primaryButton: {
    backgroundColor: '#059669', // Sophisticated emerald green, not neon
    height: 48,
    borderRadius: 8, // Shifting away from fully round pill shapes to clean modern radiuses
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
