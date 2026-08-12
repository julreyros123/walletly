import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Button, View } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { useRouter, Href } from 'expo-router';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { useGamificationStore } from '@/store/gamificationStore';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { Spacing } from '@/constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
  
  // Simulated Virtual Assets Config - Mirrored from GCash GInvest Fund Classes
  const assets: Asset[] = [
    {
      ticker: 'MONEY.SIM',
      name: 'ATRAM Peso Money Market Fund',
      price: 105.15,
      change: 0.12,
      icon: { ios: 'banknote.fill', android: 'savings', web: 'savings' } as const,
      color: theme.primary,
      sparkline: [10, 11, 11, 12, 13, 14, 15],
      riskProfile: 'Conservative',
      partner: 'ATRAM',
      description: 'Low-risk fund investing in short-term government debt and bank deposits. Ideal for parking cash stable-growth.',
    },
    {
      ticker: 'BOND.SIM',
      name: 'ALFM Peso Bond Fund',
      price: 185.30,
      change: 0.45,
      icon: { ios: 'doc.text.fill', android: 'receipt_long', web: 'receipt_long' } as const,
      color: theme.primary,
      sparkline: [20, 22, 21, 23, 22, 24, 25],
      riskProfile: 'Moderate',
      partner: 'ALFM / BPI Investment',
      description: 'Moderate-risk fund designed for steady interest income and capital preservation via corporate/government bonds.',
    },
    {
      ticker: 'PSEi.SIM',
      name: 'ALFM Philippine Stock Index Fund',
      price: 345.50,
      change: 1.85,
      icon: { ios: 'chart.bar.fill', android: 'show_chart', web: 'show_chart' } as const,
      color: theme.primary,
      sparkline: [35, 38, 32, 40, 42, 38, 44],
      riskProfile: 'Aggressive',
      partner: 'ALFM / BPI Investment',
      description: 'Tracks the top 30 largest companies in the Philippines (SM, Ayala, BDO) for aggressive stock growth.',
    },
    {
      ticker: 'TECH.SIM',
      name: 'ATRAM Global Technology Feeder Fund',
      price: 512.80,
      change: -2.40,
      icon: { ios: 'bolt.fill', android: 'electric_car', web: 'electric_car' } as const,
      color: theme.warning,
      sparkline: [48, 52, 45, 58, 50, 42, 38],
      riskProfile: 'Aggressive',
      partner: 'ATRAM',
      description: 'High-risk feeder fund investing in global tech giants (Microsoft, Apple, NVIDIA) for high-growth potential.',
    },
  ];

  const store = useGamificationStore();
  const [activeAssetIdx, setActiveAssetIdx] = useState<number | null>(null);
  const [allocationType, setAllocationType] = useState<'buy' | 'sell'>('buy'); // buy = allocate, sell = withdraw
  const [unitsAmount, setUnitsAmount] = useState('');

  // Transfer state
  const [transferAmount, setTransferAmount] = useState('');

  // Calculate remaining budget headroom
  const totalSpent = store.loggedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetRemaining = store.totalBudget - totalSpent;
  const totalSavingsGoalContributions = store.savingsGoals.reduce((sum, g) => sum + g.currentSavings, 0);
  
  // Leftover cash available in budget (unallocated)
  const budgetLeftover = Math.max(0, budgetRemaining - totalSavingsGoalContributions - store.virtualBalance);

  // Sync asset units and holdings value from store
  const getAssetOwnedUnits = (ticker: string) => {
    return store.portfolioAllocations[ticker] || 0;
  };

  const holdingsValue = assets.reduce((sum, a) => sum + getAssetOwnedUnits(a.ticker) * a.price, 0);
  const totalPortfolioValue = holdingsValue + store.virtualBalance;

  const handleOpenAllocation = (index: number, type: 'buy' | 'sell') => {
    setActiveAssetIdx(index);
    setAllocationType(type);
    setUnitsAmount('');
  };

  // Transfer cash from budget remaining to simulator cash
  const handleTransferToSimulation = () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid transfer amount.');
      return;
    }
    if (amt > budgetLeftover) {
      Alert.alert(
        'Insufficient Budget Buffer',
        `You only have ₱${budgetLeftover.toLocaleString()} available in your unallocated budget cash after savings contributions.`
      );
      return;
    }

    const success = store.allocateToSimulation(amt);
    if (success) {
      Alert.alert('Funds Allocated!', `₱${amt.toLocaleString()} transferred to your simulator cash. (+10 XP)`);
      setTransferAmount('');
    } else {
      Alert.alert('Error', 'Unable to complete fund allocation.');
    }
  };

  // Execute allocation in Simulation
  const handleExecuteAllocation = () => {
    if (activeAssetIdx === null) return;
    const qty = parseFloat(unitsAmount);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Units', 'Please enter a valid simulated allocation quantity.');
      return;
    }

    const asset = assets[activeAssetIdx];
    const totalCost = qty * asset.price;

    if (allocationType === 'buy') {
      if (totalCost > store.virtualBalance) {
        Alert.alert('Insufficient Cash', 'You do not have enough unallocated simulator cash. Transfer cash from your remaining budget first.');
        return;
      }

      const success = store.tradeAssetSim(asset.ticker, 'buy', qty, asset.price);
      if (success) {
        Alert.alert(
          'Allocation Successful',
          `Successfully allocated ${qty} units of ${asset.ticker} for ₱${totalCost.toLocaleString()}. (+15 XP)`
        );
      } else {
        Alert.alert('Error', 'Transaction failed.');
      }
    } else {
      const owned = getAssetOwnedUnits(asset.ticker);
      if (qty > owned) {
        Alert.alert('Insufficient Units', `You only have ${owned} units allocated to this asset.`);
        return;
      }

      const success = store.tradeAssetSim(asset.ticker, 'sell', qty, asset.price);
      if (success) {
        Alert.alert(
          'Withdrawal Successful',
          `Successfully withdrew ${qty} units of ${asset.ticker} for ₱${totalCost.toLocaleString()}. (+10 XP)`
        );
      } else {
        Alert.alert('Error', 'Transaction failed.');
      }
    }

    setActiveAssetIdx(null);
  };

  const activeAsset = activeAssetIdx !== null ? assets[activeAssetIdx] : null;
  const typedUnits = parseFloat(unitsAmount) || 0;
  const estimatedCost = activeAsset ? typedUnits * activeAsset.price : 0;

  return (
    <YStack flex={1} backgroundColor={theme.background}>
      <BackgroundSystem mode="tabs" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header with Integrated Premium Sandbox Badge */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <XStack justifyContent="space-between" alignItems="center" marginBottom={16} flexWrap="wrap" gap={8}>
              <YStack gap={2} flex={1} minWidth={150}>
                <Text color={theme.text} fontSize={22} fontWeight="700" letterSpacing={-0.5}>
                  Investment Lab
                </Text>
                <Text color={theme.textSecondary} fontSize={13}>
                  Practice dynamic asset allocation and strategy testing.
                </Text>
              </YStack>
              <XStack
                backgroundColor={`${theme.primary}12` as any}
                paddingHorizontal={12}
                paddingVertical={5}
                borderRadius={100}
                alignItems="center"
                gap={6}
              >
                <SymbolView
                  name={{ ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' } as const}
                  size={12}
                  tintColor={theme.primary}
                />
                <Text color={theme.primary} fontSize={10} fontWeight="700" letterSpacing={0.5} textTransform="uppercase">
                  Simulated Sandbox
                </Text>
              </XStack>
            </XStack>
          </Animated.View>

          {/* Virtual Portfolio Balance Card */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <CbudgetCard marginBottom={20} gap={Spacing[16]} borderLeftWidth={5} borderLeftColor={theme.primary}>
              <YStack gap={2}>
                <Text color={theme.textSecondary} fontSize={11} fontWeight="600" letterSpacing={0.8} textTransform="uppercase">
                  Total Simulation Arena Value
                </Text>
                <Text color={theme.text} fontSize={26} fontWeight="700" letterSpacing={-1}>
                  ₱{totalPortfolioValue.toLocaleString()}
                </Text>
              </YStack>

              <XStack justifyContent="space-between" borderTopWidth={1} borderTopColor={theme.border} paddingTop={12}>
                <YStack gap={2}>
                  <Text color={theme.textSecondary} fontSize={11} fontWeight="600">
                    Allocated Holdings
                  </Text>
                  <Text color={theme.text} fontSize={14} fontWeight="800">
                    ₱{holdingsValue.toLocaleString()}
                  </Text>
                </YStack>
                <YStack alignItems="flex-end" gap={2}>
                  <Text color={theme.textSecondary} fontSize={11} fontWeight="600">
                    Simulator Cash (Unallocated)
                  </Text>
                  <Text color={theme.primary} fontSize={14} fontWeight="800">
                    ₱{store.virtualBalance.toLocaleString()}
                  </Text>
                </YStack>
              </XStack>
            </CbudgetCard>
          </Animated.View>

          {/* EDUCATIONAL ALLOCATE PROMPT PANEL */}
          {!store.isBudgetSetupComplete ? (
            <Animated.View entering={FadeInDown.duration(400)}>
              <CbudgetCard padding={20} gap={16} marginBottom={20} borderLeftWidth={4} borderLeftColor={theme.primary}>
                <XStack gap={12} alignItems="center">
                  <View backgroundColor={`${theme.primary}15` as any} padding={8} borderRadius={8}>
                    <SymbolView
                      name={{ ios: 'lock.fill', android: 'lock', web: 'lock' } as const}
                      size={18}
                      tintColor={theme.primary}
                    />
                  </View>
                  <YStack gap={2} flex={1}>
                    <Text color={theme.text} fontSize={15} fontWeight="700">
                      Unlock Investment Simulator
                    </Text>
                    <Text color={theme.textSecondary} fontSize={12} lineHeight={16}>
                      Set up your budget first to calculate your leftover cash and begin practice-investing.
                    </Text>
                  </YStack>
                </XStack>
                <Button
                  backgroundColor={theme.primary}
                  height={40}
                  borderRadius={10}
                  onPress={() => router.push('/(tabs)/budget' as Href)}
                  pressStyle={{ opacity: 0.9 }}
                >
                  <Text color="#FFFFFF" fontSize={13} fontWeight="700">Set Up Budget</Text>
                </Button>
              </CbudgetCard>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(400)}>
              <CbudgetCard padding={16} gap={12} marginBottom={20} borderColor={theme.primary} borderWidth={1}>
                <Text color={theme.text} fontSize={15} fontWeight="700">
                  Allocate Remaining Budget to Simulator
                </Text>
                <Text color={theme.textSecondary} fontSize={12} lineHeight={16}>
                  Budget Remaining: <Text color={theme.text} fontWeight="600">₱{budgetRemaining.toLocaleString()}</Text> • 
                  Savings Goals Contributions: <Text color={theme.primary as any} fontWeight="600">₱{totalSavingsGoalContributions.toLocaleString()}</Text>
                </Text>
                <Text color={theme.textSecondary} fontSize={12} lineHeight={16}>
                  Available to Allocate: <Text color={theme.success} fontWeight="700">₱{budgetLeftover.toLocaleString()}</Text>
                </Text>
                
                {budgetLeftover > 0 ? (
                  <XStack gap={8} alignItems="center" marginTop={4}>
                    <YStack flex={1}>
                      <FormInput
                        placeholder="Amount to allocate (₱)"
                        keyboardType="numeric"
                        value={transferAmount}
                        onChangeText={setTransferAmount}
                      />
                    </YStack>
                    <Button backgroundColor={theme.primary} height={42} borderRadius={10} onPress={handleTransferToSimulation}>
                      <Text color="#FFFFFF" fontSize={12} fontWeight="700">Allocate Funds</Text>
                    </Button>
                  </XStack>
                ) : (
                  <Text color={theme.warning} fontSize={11} fontWeight="600" marginTop={2}>
                    ⚠️ You have no leftover budget funds to invest. Save more or spend less to free up investment simulator capital!
                  </Text>
                )}
              </CbudgetCard>
            </Animated.View>
          )}

          {/* ACTIVE ALLOCATION INTERACTIVE PANEL */}
          {activeAssetIdx !== null && activeAsset && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <CbudgetCard borderColor={theme.primary} borderWidth={1.5} gap={14} marginBottom={20}>
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack gap={2}>
                    <Text color={theme.text} fontSize={16} fontWeight="700">
                      Allocate Funds to {activeAsset.ticker}
                    </Text>
                    <Text color={theme.textSecondary} fontSize={12}>
                      Unit Value: ₱{activeAsset.price.toLocaleString()}
                    </Text>
                  </YStack>
                  <TouchableOpacity onPress={() => setActiveAssetIdx(null)}>
                    <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' } as const} size={20} tintColor={theme.textSecondary} />
                  </TouchableOpacity>
                </XStack>

                <XStack gap={8}>
                  <Button
                    flex={1}
                    backgroundColor={allocationType === 'buy' ? theme.primary : theme.backgroundElement}
                    borderRadius={10}
                    height={38}
                    onPress={() => setAllocationType('buy')}
                    borderWidth={0}
                  >
                    <Text color={allocationType === 'buy' ? '#FFFFFF' : theme.text} fontWeight="700" fontSize={13}>
                      Allocate
                    </Text>
                  </Button>
                  <Button
                    flex={1}
                    backgroundColor={allocationType === 'sell' ? theme.error : theme.backgroundElement}
                    borderRadius={10}
                    height={38}
                    onPress={() => setAllocationType('sell')}
                    borderWidth={0}
                  >
                    <Text color={allocationType === 'sell' ? '#FFFFFF' : theme.text} fontWeight="700" fontSize={13}>
                      Withdraw
                    </Text>
                  </Button>
                </XStack>

                <YStack gap={10}>
                  <FormInput
                    label="Units to Allocate"
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={unitsAmount}
                    onChangeText={setUnitsAmount}
                    leftIcon={{ ios: 'number', android: 'tag', web: 'tag' } as any}
                  />

                  {/* Estimation subcard */}
                  <YStack backgroundColor={theme.background} padding={10} borderRadius={10} gap={6} borderWidth={1} borderColor={theme.border}>
                    <XStack justifyContent="space-between">
                      <Text color={theme.textSecondary} fontSize={11}>
                        Estimated {allocationType === 'buy' ? 'Cash Cost' : 'Cash Return'}
                      </Text>
                      <Text color={theme.text} fontSize={12} fontWeight="800">
                        ₱{estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Text>
                    </XStack>
                    <XStack justifyContent="space-between">
                      <Text color={theme.textSecondary} fontSize={11}>
                        {allocationType === 'buy' ? 'Simulator Cash Available' : 'Units Currently Owned'}
                      </Text>
                      <Text color={theme.text} fontSize={12} fontWeight="800">
                        {allocationType === 'buy' ? `₱${store.virtualBalance.toLocaleString()}` : `${getAssetOwnedUnits(activeAsset.ticker)} units`}
                      </Text>
                    </XStack>
                  </YStack>
                </YStack>

                <FormButton
                  variant={allocationType === 'buy' ? 'primary' : 'outline'}
                  height={44}
                  onPress={handleExecuteAllocation}
                  disabled={typedUnits <= 0}
                  borderColor={allocationType === 'sell' && typedUnits > 0 ? theme.error : undefined}
                  color={allocationType === 'sell' && typedUnits > 0 ? theme.error : undefined}
                >
                  Confirm {allocationType === 'buy' ? 'Allocation' : 'Withdrawal'}
                </FormButton>
              </CbudgetCard>
            </Animated.View>
          )}

          {/* Asset List */}
          <YStack gap={Spacing[16]}>
            <Text color={theme.text} fontSize={16} fontWeight="700" marginBottom={4}>
              Available Simulation Asset Classes
            </Text>

            {assets.map((asset, index) => {
              const changeIsPositive = asset.change >= 0;
              const ownedUnits = getAssetOwnedUnits(asset.ticker);
              const assetTotalValue = ownedUnits * asset.price;

              return (
                <Animated.View key={asset.ticker} entering={FadeInDown.delay(100 * index).duration(500)}>
                  <CbudgetCard padding={14} gap={10}>
                    <XStack gap={10} alignItems="center">
                      {/* Real Corporate Brand Logo Image */}
                       <View
                        width={38}
                        height={38}
                        borderRadius={10}
                        backgroundColor="#FFFFFF"
                        alignItems="center"
                        justifyContent="center"
                        padding={4}
                        borderWidth={1}
                        borderColor={theme.border}
                        style={{
                          shadowColor: '#0F172A',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        } as any}
                      >
                        <Image
                          source={{
                            uri: asset.partner.includes('ATRAM')
                              ? 'https://zgwidnilutwbdwvfesar.supabase.co/storage/v1/object/public/school-assets/e17380ee-fc81-4929-9d7c-d148bcca4029/logo-1763633704344.png'
                              : 'https://logo.clearbit.com/bpi.com.ph'
                          }}
                          style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                        />
                      </View>

                      <YStack flex={1} gap={2}>
                        <XStack gap={6} alignItems="center" flexWrap="wrap">
                          <Text color={theme.textSecondary} fontSize={10} fontWeight="700" letterSpacing={0.5}>
                            {asset.partner}
                          </Text>
                          <View
                            backgroundColor={
                              asset.riskProfile === 'Conservative'
                                ? (`${theme.success}15` as any)
                                : asset.riskProfile === 'Moderate'
                                ? (`${theme.warning}15` as any)
                                : (`${theme.error}15` as any)
                            }
                            paddingHorizontal={6}
                            paddingVertical={2}
                            borderRadius={4}
                          >
                            <Text
                              color={
                                asset.riskProfile === 'Conservative'
                                  ? theme.success
                                  : asset.riskProfile === 'Moderate'
                                  ? theme.warning
                                  : theme.error
                              }
                              fontSize={8}
                              fontWeight="700"
                            >
                              {asset.riskProfile}
                            </Text>
                          </View>
                        </XStack>
                        <Text color={theme.text} fontSize={14} fontWeight="700">
                          {asset.name}
                        </Text>
                        <XStack gap={6} alignItems="center">
                          <Text color={theme.textSecondary} fontSize={11} fontWeight="600">
                            {asset.ticker}
                          </Text>
                          <Text color={theme.textSecondary} fontSize={11}>
                            •
                          </Text>
                          <Text color={theme.text} fontSize={11} fontWeight="700">
                            ₱{asset.price.toLocaleString()}
                          </Text>
                        </XStack>
                      </YStack>

                      {/* Sparkline trend indicator */}
                      <XStack gap={2} alignItems="flex-end" height={24} marginRight={4}>
                        {asset.sparkline.map((h, sIdx) => (
                          <View
                            key={sIdx}
                            style={{
                              width: 3,
                              height: h * 0.5,
                              backgroundColor: changeIsPositive ? theme.success : theme.error,
                              borderRadius: 1,
                              opacity: sIdx === asset.sparkline.length - 1 ? 1 : 0.4
                            } as any}
                          />
                        ))}
                      </XStack>

                      <XStack
                        backgroundColor={(changeIsPositive ? `${theme.success}15` : `${theme.error}15`) as any}
                        borderRadius={6}
                        paddingHorizontal={6}
                        paddingVertical={3}
                        alignItems="center"
                        gap={2}
                      >
                        <Text color={changeIsPositive ? theme.success : theme.error} fontSize={10} fontWeight="700">
                          {changeIsPositive ? '+' : ''}
                          {asset.change.toFixed(2)}%
                        </Text>
                      </XStack>
                    </XStack>

                    {/* Educational Guide/Description */}
                    <Text color={theme.textSecondary} fontSize={11} lineHeight={15} style={{ paddingLeft: 46 }}>
                      {asset.description}
                    </Text>

                    <XStack
                      justifyContent="space-between"
                      alignItems="center"
                      borderTopWidth={1}
                      borderTopColor={theme.border}
                      paddingTop={10}
                      marginTop={2}
                    >
                      <YStack gap={2}>
                        <Text color={theme.textSecondary} fontSize={10} fontWeight="500">
                          Allocated Units
                        </Text>
                        <Text color={theme.text} fontSize={12} fontWeight="700">
                          {ownedUnits} units (~₱{assetTotalValue.toLocaleString()})
                        </Text>
                      </YStack>

                      <XStack gap={6}>
                        <Button
                          height={32}
                          backgroundColor={ownedUnits === 0 ? theme.border : theme.backgroundElement}
                          borderRadius={6}
                          onPress={() => handleOpenAllocation(index, 'sell')}
                          disabled={ownedUnits === 0}
                          borderWidth={0}
                        >
                          <Text color={ownedUnits === 0 ? theme.textSecondary : theme.text} fontSize={11} fontWeight="700">
                            Withdraw
                          </Text>
                        </Button>
                        <Button
                          height={32}
                          backgroundColor={theme.primary as any}
                          borderRadius={6}
                          onPress={() => handleOpenAllocation(index, 'buy')}
                          borderWidth={0}
                        >
                          <Text color="#FFFFFF" fontSize={11} fontWeight="700">
                            Allocate
                          </Text>
                        </Button>
                      </XStack>
                    </XStack>
                  </CbudgetCard>
                </Animated.View>
              );
            })}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
});
