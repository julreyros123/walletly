import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Button, View } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { useGamificationStore } from '@/store/gamificationStore';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { useCurrency } from '@/utils/currency';
import { ASSET_DATA as assetData, TEEN_GUIDES as teenGuides } from '@/constants/assets';

import { InteractiveChart } from '@/features/invest/components/InteractiveChart';

export default function InvestDetailsScreen() {
  const router = useRouter();
  const theme = useTheme() as any;
  const store = useGamificationStore();
  const params = useLocalSearchParams<{ ticker?: string }>();
  const { symbol: currencySymbol } = useCurrency();

  const asset = assetData[params.ticker || 'NOVA'] || assetData.NOVA;

  const [chartTimeframe, setChartTimeframe] = useState<'1D' | '1W' | '1M'>('1D');
  const [scrubbedPrice, setScrubbedPrice] = useState<number | null>(null);
  const [allocationType, setAllocationType] = useState<'buy' | 'sell'>('buy');
  const [unitsAmount, setUnitsAmount] = useState('');
  const [tradeMode, setTradeMode] = useState<'pesos' | 'shares'>('pesos'); // Default to Pesos for simple teen micro-investing
  const [isTrading, setIsTrading] = useState(false);
  const [showTeenGuide, setShowTeenGuide] = useState(true); // Default to open for teenager education
  const [showJargonModal, setShowJargonModal] = useState(false);
  const [dividendsClaimed, setDividendsClaimed] = useState<Record<string, boolean>>({});

  const getAssetOwnedUnits = (ticker: string) => {
    return store.portfolioAllocations[ticker] || 0;
  };

  const ownedUnits = getAssetOwnedUnits(asset.ticker);
  const assetTotalValue = ownedUnits * asset.price;
  const changeIsPositive = asset.change >= 0;

  const activeHistory = 
    chartTimeframe === '1D' ? asset.history1D :
    chartTimeframe === '1W' ? asset.history1W :
    asset.history1M;

  const typedUnits = tradeMode === 'shares'
    ? (parseFloat(unitsAmount) || 0)
    : (parseFloat(unitsAmount) || 0) / asset.price;

  const estimatedCost = tradeMode === 'shares'
    ? typedUnits * asset.price
    : (parseFloat(unitsAmount) || 0);

  // Percentage preset calculations for quick allocations
  const handleQuickPercent = (pct: number) => {
    if (allocationType === 'buy') {
      const maxCash = store.virtualBalance;
      const targetCash = maxCash * pct;
      if (tradeMode === 'pesos') {
        setUnitsAmount(targetCash.toFixed(2));
      } else {
        const targetUnits = targetCash / asset.price;
        setUnitsAmount(targetUnits.toFixed(4));
      }
    } else {
      const maxUnits = ownedUnits;
      const targetUnits = maxUnits * pct;
      if (tradeMode === 'pesos') {
        const targetCash = targetUnits * asset.price;
        setUnitsAmount(targetCash.toFixed(2));
      } else {
        setUnitsAmount(targetUnits.toFixed(4));
      }
    }
  };

  const handleExecuteAllocation = () => {
    const inputVal = parseFloat(unitsAmount);
    if (isNaN(inputVal) || inputVal <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    const qty = tradeMode === 'shares' ? inputVal : inputVal / asset.price;
    const totalCost = qty * asset.price;

    if (allocationType === 'buy') {
      if (totalCost > store.virtualBalance) {
        Alert.alert('Insufficient Cash', 'You do not have enough simulated cash in your balance.');
        return;
      }

      const success = store.tradeAssetSim(asset.ticker, 'buy', qty, asset.price);
      if (success) {
        Alert.alert(
          '🎉 Order Executed!',
          `You just bought ${qty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} units of ${asset.ticker} with your virtual sandbox cash.\n\n🚀 You're officially tracking the ${asset.partner} sector—watch your dashboard to see how your factory slice performs! (+15 XP)`
        );
      } else {
        Alert.alert('Error', 'Transaction failed.');
      }
    } else {
      if (qty > ownedUnits) {
        Alert.alert('Insufficient Units', `You only have ${ownedUnits.toFixed(4)} units of this asset.`);
        return;
      }

      const success = store.tradeAssetSim(asset.ticker, 'sell', qty, asset.price);
      if (success) {
        Alert.alert(
          '🎉 Order Executed!',
          `You just sold ${qty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} units of ${asset.ticker} with your virtual sandbox cash.\n\n🚀 You've updated your position in the ${asset.partner} sector! (+10 XP)`
        );
      } else {
        Alert.alert('Error', 'Transaction failed.');
      }
    }

    setUnitsAmount('');
    setIsTrading(false);
  };

  const handleClaimDividends = () => {
    if (ownedUnits <= 0) {
      Alert.alert('No Shares Owned', 'You must own at least a fraction of this stock to earn dividends!');
      return;
    }

    // Daily simulated dividend of 1.0% of total holdings value
    const dividendAmount = assetTotalValue * 0.01;
    const roundedDividend = parseFloat(dividendAmount.toFixed(2));

    const success = store.claimDailyDividend(asset.ticker, roundedDividend);
    if (!success) {
      Alert.alert('Dividends Already Claimed', 'You have already claimed dividends for this stock today. Check back tomorrow!');
      return;
    }

    Alert.alert(
      '🎉 Dividends Claimed!',
      `You earned ${currencySymbol}${roundedDividend.toLocaleString(undefined, { minimumFractionDigits: 2 })} in passive dividends from your ${ownedUnits.toFixed(4)} shares of ${asset.ticker}! (+5 XP)\n\n💡 Dividends are a share of the company's profits paid out to shareholders just for holding the stock.`
    );
  };

  // Range percentage position for Low/High bar widget
  const high52Percent = ((asset.price - asset.low52) / (asset.high52 - asset.low52)) * 100;
  const currentPos = Math.min(Math.max(high52Percent, 0), 100);

  return (
    <YStack flex={1} backgroundColor={theme.background}>
      <BackgroundSystem mode="tabs" height={340} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        
        {/* Navigation Header */}
        <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={16} paddingVertical={12} borderBottomWidth={1} borderBottomColor={theme.border}>
          <TouchableOpacity onPress={() => router.back()}>
            <XStack gap={4} alignItems="center" backgroundColor={theme.backgroundElement} paddingHorizontal={12} paddingVertical={6} borderRadius={100} borderWidth={1} borderColor={theme.border}>
              <PhosphorIcon
                name="CaretLeft"
                size={16}
                color={theme.text}
              />
              <Text color={theme.text} fontWeight="700" fontSize={13}>Back</Text>
            </XStack>
          </TouchableOpacity>

          <View backgroundColor="rgba(245, 158, 11, 0.12)" paddingHorizontal={10} paddingVertical={4} borderRadius={100} borderWidth={1} borderColor="rgba(245, 158, 11, 0.3)">
            <Text color="#F59E0B" fontSize={10} style={{ fontFamily: "Inter_700Bold" }} letterSpacing={0.5}>
              SIMULATED
            </Text>
          </View>
          
          <TouchableOpacity onPress={() => setShowJargonModal(true)}>
            <XStack gap={4} alignItems="center" backgroundColor="rgba(59, 130, 246, 0.12)" paddingHorizontal={10} paddingVertical={6} borderRadius={100} borderWidth={1} borderColor="rgba(59, 130, 246, 0.3)">
              <Text color="#60A5FA" fontWeight="700" fontSize={11}>💡 Jargon</Text>
            </XStack>
          </TouchableOpacity>
        </XStack>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Price / Info Header */}
          <YStack gap={4} paddingHorizontal={8} marginBottom={16} marginTop={12}>
            <XStack gap={12} alignItems="center" width="100%">
              <View
                width={48}
                height={48}
                borderRadius={14}
                style={{ backgroundColor: `${asset.color}10`, borderColor: `${asset.color}20` }}
                alignItems="center"
                justifyContent="center"
                borderWidth={1.5}
              >
                <PhosphorIcon name={asset.icon} size={22} color={asset.color} weight="duotone" />
              </View>
              <YStack gap={6} flex={1}>
                <Text color="#FFFFFF" fontSize={18} style={{ fontFamily: "Inter_700Bold" }} letterSpacing={-0.4} numberOfLines={1}>
                  {asset.name}
                </Text>
                <XStack gap={6} flexWrap="wrap" alignItems="center">
                  <View backgroundColor="rgba(255, 255, 255, 0.06)" paddingHorizontal={8} paddingVertical={4} borderRadius={6} borderWidth={1} borderColor="rgba(255, 255, 255, 0.08)">
                    <Text color="rgba(255, 255, 255, 0.85)" fontSize={11} style={{ fontFamily: "Inter_700Bold" }}>
                      🏷️ {asset.partner}
                    </Text>
                  </View>
                  <View 
                    backgroundColor={
                      asset.riskProfile === 'Conservative'
                        ? 'rgba(16, 185, 129, 0.08)'
                        : asset.riskProfile === 'Moderate'
                        ? 'rgba(245, 158, 11, 0.08)'
                        : 'rgba(239, 68, 68, 0.08)'
                    }
                    paddingHorizontal={8}
                    paddingVertical={4}
                    borderRadius={6}
                    borderWidth={1}
                    borderColor={
                      asset.riskProfile === 'Conservative'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : asset.riskProfile === 'Moderate'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)'
                    }
                  >
                    <Text 
                      color={
                        asset.riskProfile === 'Conservative'
                          ? '#10B981'
                          : asset.riskProfile === 'Moderate'
                          ? '#F59E0B'
                          : '#EF4444'
                      }
                      fontSize={11} 
                      style={{ fontFamily: "Inter_700Bold" }}
                    >
                      {asset.riskProfile === 'Conservative' ? '🟢 Conservative' : asset.riskProfile === 'Moderate' ? '🟡 Moderate' : '🔥 High Growth'}
                    </Text>
                  </View>
                </XStack>
              </YStack>
            </XStack>

            <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={8} marginTop={12}>
              <Text color={theme.text} fontSize={28} style={{ fontFamily: "Inter_700Bold" }} letterSpacing={-0.5} lineHeight={34}>
                {currencySymbol}{(scrubbedPrice ? scrubbedPrice : asset.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              
              <XStack
                backgroundColor={changeIsPositive ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'}
                borderRadius={8}
                paddingHorizontal={10}
                paddingVertical={4}
                alignItems="center"
                gap={4}
              >
                <PhosphorIcon
                  name={changeIsPositive ? 'TrendUp' : 'TrendDown'}
                  size={11}
                  color={changeIsPositive ? '#22C55E' : '#EF4444'}
                  weight="bold"
                />
                <Text color={changeIsPositive ? '#22C55E' : '#EF4444'} fontSize={11} style={{ fontFamily: "Inter_700Bold" }}>
                  {changeIsPositive ? '+' : ''}
                  {asset.change.toFixed(2)}%
                </Text>
              </XStack>
            </XStack>
          </YStack>

          {/* Interactive Chart Card */}
          <CbudgetCard padding={18} gap={14} marginBottom={20}>
            <XStack justifyContent="space-between" alignItems="center">
              <Text color={theme.text} fontSize={14} fontWeight="800" letterSpacing={-0.2}>
                Performance History
              </Text>
              <XStack gap={4} backgroundColor={theme.backgroundElement} borderRadius={10} padding={3} borderWidth={1} borderColor={theme.border}>
                {(['1D', '1W', '1M'] as const).map((tf) => (
                  <TouchableOpacity
                    key={tf}
                    onPress={() => {
                      setChartTimeframe(tf);
                      setScrubbedPrice(null);
                    }}
                    style={[
                      styles.timeframeToggle,
                      chartTimeframe === tf && { backgroundColor: theme.text },
                    ]}
                  >
                    <Text
                      color={chartTimeframe === tf ? theme.background : theme.text}
                      fontSize={10}
                      fontWeight="900"
                    >
                      {tf}
                    </Text>
                  </TouchableOpacity>
                ))}
              </XStack>
            </XStack>

            <InteractiveChart
              data={activeHistory}
              color={asset.color}
              onChangePrice={setScrubbedPrice}
              theme={theme}
            />
          </CbudgetCard>

          {/* Holdings summary and trading actions */}
          {isTrading ? (
            <Animated.View entering={FadeInDown.duration(300)}>
              <CbudgetCard 
                borderWidth={0} 
                borderColor="transparent"
                gap={14} 
                marginBottom={20} 
                padding={20}
                borderRadius={12}
                style={{
                  backgroundColor: theme.surface,
                  shadowOpacity: 0,
                  shadowRadius: 0,
                  elevation: 0,
                }}
              >
                {/* Modal Title & Price Header */}
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack gap={2}>
                    <Text color={theme.text} fontSize={16} fontWeight="900" letterSpacing={-0.3}>
                      {allocationType === 'buy' ? `Invest in ${asset.ticker}` : `Sell ${asset.ticker}`}
                    </Text>
                    <Text color={theme.textSecondary} fontSize={12} opacity={0.8}>
                      Current Stock Price: {currencySymbol}{asset.price.toLocaleString()}
                    </Text>
                  </YStack>
                  <TouchableOpacity onPress={() => setIsTrading(false)}>
                    <PhosphorIcon name="XCircle" size={20} color={theme.textSecondary} weight="fill" />
                  </TouchableOpacity>
                </XStack>

                {/* Buy / Sell Segmented Switch */}
                <XStack gap={6} backgroundColor={theme.backgroundElement} borderRadius={12} padding={4} width="100%" marginBottom={4}>
                  <TouchableOpacity
                    onPress={() => {
                      setAllocationType('buy');
                      setUnitsAmount('');
                    }}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: allocationType === 'buy' ? '#10B981' : 'transparent'
                    }}
                  >
                    <Text color={allocationType === 'buy' ? '#FFFFFF' : theme.text} fontSize={11} style={{ fontFamily: "Inter_700Bold" }}>
                      Buy
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setAllocationType('sell');
                      setUnitsAmount('');
                    }}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: allocationType === 'sell' ? '#EF4444' : 'transparent'
                    }}
                  >
                    <Text color={allocationType === 'sell' ? '#FFFFFF' : theme.text} fontSize={11} style={{ fontFamily: "Inter_700Bold" }}>
                      Sell
                    </Text>
                  </TouchableOpacity>
                </XStack>

                <YStack gap={10}>
                  {/* Segmented Mode Selector */}
                  <XStack gap={6} backgroundColor={theme.backgroundElement} borderRadius={12} padding={4} width="100%" marginTop={4}>
                    <TouchableOpacity
                      onPress={() => {
                        setTradeMode('pesos');
                        setUnitsAmount('');
                      }}
                      activeOpacity={0.8}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 12,
                        alignItems: 'center',
                        backgroundColor: tradeMode === 'pesos' ? theme.primary : 'transparent'
                      }}
                    >
                      <Text color={tradeMode === 'pesos' ? '#FFFFFF' : theme.text} fontSize={11} style={{ fontFamily: "Inter_700Bold" }}>
                        Trade in Cash ({currencySymbol})
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setTradeMode('shares');
                        setUnitsAmount('');
                      }}
                      activeOpacity={0.8}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 12,
                        alignItems: 'center',
                        backgroundColor: tradeMode === 'shares' ? theme.primary : 'transparent'
                      }}
                    >
                      <Text color={tradeMode === 'shares' ? '#FFFFFF' : theme.text} fontSize={11} style={{ fontFamily: "Inter_700Bold" }}>
                        Trade in Shares
                      </Text>
                    </TouchableOpacity>
                  </XStack>

                  <FormInput
                    label={tradeMode === 'pesos' ? (allocationType === 'buy' ? 'Amount to Invest' : 'Amount to Sell') : (allocationType === 'buy' ? 'Shares to Buy' : 'Shares to Sell')}
                    placeholder={tradeMode === 'pesos' ? `${currencySymbol} 0.00` : '0.00'}
                    keyboardType="numeric"
                    value={unitsAmount}
                    onChangeText={setUnitsAmount}
                    leftIcon={tradeMode === 'pesos' ? 'Banknote' : 'Tag'}
                  />

                  {/* Live conversion helper text for teens */}
                  {unitsAmount !== '' && parseFloat(unitsAmount) > 0 && (
                    <Text color="#94A3B8" fontSize={11} style={{ fontFamily: "Inter_600SemiBold" }} textAlign="center" marginTop={-4}>
                      {tradeMode === 'pesos' 
                        ? `≈ ${typedUnits.toFixed(4)} shares of ${asset.ticker}`
                        : `≈ ${currencySymbol}${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} cash value`}
                    </Text>
                  )}

                  {/* Quick Preset Selector */}
                  <XStack gap={8} justifyContent="center" marginTop={2}>
                    <TouchableOpacity 
                      onPress={() => handleQuickPercent(0.25)} 
                      style={[styles.percentPresetBtn, { backgroundColor: theme.backgroundElement, borderWidth: 0, borderRadius: 12 }]}
                    >
                      <Text color={theme.text} fontSize={10} fontWeight="700">25%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleQuickPercent(0.50)} 
                      style={[styles.percentPresetBtn, { backgroundColor: theme.backgroundElement, borderWidth: 0, borderRadius: 12 }]}
                    >
                      <Text color={theme.text} fontSize={10} fontWeight="700">50%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleQuickPercent(1.00)} 
                      style={[styles.percentPresetBtn, { backgroundColor: theme.backgroundElement, borderWidth: 0, borderRadius: 12 }]}
                    >
                      <Text color={theme.text} fontSize={10} fontWeight="700">MAX</Text>
                    </TouchableOpacity>
                  </XStack>

                  {/* Estimation subcard */}
                  <YStack backgroundColor={theme.background} padding={12} borderRadius={12} gap={6} borderWidth={0}>
                    <XStack justifyContent="space-between" alignItems="center" gap={8}>
                      <Text color={theme.textSecondary} fontSize={12} flex={1}>
                        {allocationType === 'buy' ? 'Estimated Shares to Receive' : 'Estimated Return Value'}
                      </Text>
                      <Text color={theme.text} fontSize={13} fontWeight="800" textAlign="right">
                        {allocationType === 'buy' 
                          ? `${typedUnits.toFixed(4)} units`
                          : `${currencySymbol}${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </Text>
                    </XStack>
                    <XStack justifyContent="space-between" alignItems="center" gap={8}>
                      <Text color={theme.textSecondary} fontSize={12} flex={1}>
                        {allocationType === 'buy' ? 'Available Sandbox Cash' : 'Owned Shares Available'}
                      </Text>
                      <Text color={theme.text} fontSize={13} fontWeight="800" textAlign="right">
                        {allocationType === 'buy' 
                          ? `${currencySymbol}${store.virtualBalance.toLocaleString()}` 
                          : `${ownedUnits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} units`}
                      </Text>
                    </XStack>
                  </YStack>
                </YStack>

                <FormButton
                  variant="primary"
                  height={46}
                  borderRadius={12}
                  leftIcon="CheckCircle"
                  onPress={handleExecuteAllocation}
                  disabled={typedUnits <= 0}
                  style={{
                    backgroundColor: typedUnits <= 0 ? 'rgba(255, 255, 255, 0.05)' : (allocationType === 'buy' ? '#10B981' : '#EF4444'),
                    opacity: typedUnits <= 0 ? 0.5 : 1
                  }}
                >
                  {allocationType === 'buy' ? 'CONFIRM INVEST' : 'CONFIRM SELL'}
                </FormButton>
              </CbudgetCard>
            </Animated.View>
          ) : (
            /* Quick trade shortcuts panel */
            <CbudgetCard padding={16} gap={14} marginBottom={20}>
              <YStack gap={12}>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text color={theme.textSecondary} fontSize={11} fontWeight="700" letterSpacing={0.5} opacity={0.6}>
                    YOUR HOLDINGS
                  </Text>
                  <Text color={theme.text} fontSize={15} fontWeight="800">
                    {ownedUnits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} units (~{currencySymbol}{assetTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </Text>
                </XStack>

                {ownedUnits > 0 && (
                  <YStack gap={10} marginVertical={4}>
                    {/* Share Slice Progress Visualizer */}
                    <XStack gap={10} alignItems="center" backgroundColor="rgba(255, 255, 255, 0.03)" padding={10} borderRadius={8} borderWidth={1} borderColor="rgba(255, 255, 255, 0.05)">
                      <Text fontSize={16}>🍰</Text>
                      <YStack flex={1} gap={3}>
                        <XStack justifyContent="space-between" alignItems="center">
                          <Text color={theme.textSecondary} fontSize={9} fontWeight="700">
                            SHARE SLICE METER
                          </Text>
                          <Text color={theme.text} fontSize={10} fontWeight="800">
                            {ownedUnits < 1 ? `${(ownedUnits * 100).toFixed(1)}%` : '100%+' }
                          </Text>
                        </XStack>
                        <View height={5} backgroundColor="rgba(255, 255, 255, 0.08)" borderRadius={4} overflow="hidden" width="100%">
                          <View width={`${Math.min(100, ownedUnits * 100)}%`} height="100%" style={{ backgroundColor: asset.color }} borderRadius={4} />
                        </View>
                        <Text color="rgba(255, 255, 255, 0.5)" fontSize={9} style={{ fontFamily: "Inter_600SemiBold" }}>
                          {ownedUnits < 1 
                            ? `You own a ${(ownedUnits * 100).toFixed(1)}% slice of 1 full share!`
                            : `You own ${Math.floor(ownedUnits)} whole share(s) + ${( (ownedUnits % 1) * 100 ).toFixed(1)}% slice!`
                          }
                        </Text>
                      </YStack>
                    </XStack>

                    {/* Passive Dividends claim button */}
                    <XStack justifyContent="space-between" alignItems="center" backgroundColor="rgba(16, 185, 129, 0.05)" padding={10} borderRadius={8} borderWidth={1} borderColor="rgba(16, 185, 129, 0.15)">
                      <YStack gap={2} flex={1}>
                        <Text color="#3EB47D" fontSize={10} style={{ fontFamily: "Inter_700Bold" }} letterSpacing={0.5}>
                          🎁 PASSIVE DIVIDENDS (1% DAILY)
                        </Text>
                        <Text color={theme.textSecondary} fontSize={9} lineHeight={12}>
                          {dividendsClaimed[asset.ticker] 
                            ? 'Dividends claimed for today!' 
                            : `Tap to claim dividends for holding ${asset.ticker}`}
                        </Text>
                      </YStack>
                      <TouchableOpacity
                        onPress={handleClaimDividends}
                        disabled={dividendsClaimed[asset.ticker]}
                        activeOpacity={0.8}
                        style={{
                          backgroundColor: dividendsClaimed[asset.ticker] ? 'rgba(255, 255, 255, 0.05)' : '#059669',
                          borderWidth: dividendsClaimed[asset.ticker] ? 1 : 0,
                          borderColor: 'rgba(255,255,255,0.1)',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                        }}
                      >
                        <Text color={dividendsClaimed[asset.ticker] ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} fontSize={9} style={{ fontFamily: "Inter_700Bold" }}>
                          {dividendsClaimed[asset.ticker] ? 'CLAIMED' : 'CLAIM'}
                        </Text>
                      </TouchableOpacity>
                    </XStack>
                  </YStack>
                )}
                
                <XStack gap={8} width="100%">
                  <FormButton
                    variant="outline"
                    height={38}
                    borderRadius={10}
                    fullWidth={false}
                    disabled={ownedUnits === 0}
                    leftIcon="MinusCircle"
                    onPress={() => {
                      setAllocationType('sell');
                      setIsTrading(true);
                      setUnitsAmount('');
                    }}
                    style={{ borderColor: 'rgba(255, 255, 255, 0.15)', backgroundColor: 'transparent', flex: 1 }}
                  >
                    Sell
                  </FormButton>
                  <FormButton
                    variant="primary"
                    height={38}
                    borderRadius={10}
                    fullWidth={false}
                    leftIcon="PlusCircle"
                    onPress={() => {
                      setAllocationType('buy');
                      setIsTrading(true);
                      setUnitsAmount('');
                    }}
                    style={{ backgroundColor: theme.primary, flex: 1 }}
                  >
                    Invest
                  </FormButton>
                </XStack>
              </YStack>
            </CbudgetCard>
          )}

          {/* Teen Academy Educational Card */}
          <CbudgetCard padding={18} gap={14} marginBottom={20} style={{ borderColor: `${asset.color}40` }} borderWidth={1.5}>
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap={8} alignItems="center">
                <PhosphorIcon
                  name="Lightbulb"
                  size={20}
                  color="#F59E0B"
                  weight="fill"
                />
                <Text color="#FFFFFF" fontSize={16} style={{ fontFamily: "Inter_700Bold" }} letterSpacing={-0.2}>
                  Teen Academy 🎓
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setShowTeenGuide(!showTeenGuide)}>
                <View backgroundColor={showTeenGuide ? theme.primary : theme.backgroundElement} paddingHorizontal={12} paddingVertical={6} borderRadius={8}>
                  <Text color={showTeenGuide ? '#FFFFFF' : theme.text} fontSize={11} style={{ fontFamily: "Inter_700Bold" }}>
                    {showTeenGuide ? 'HIDE SIMPLE' : 'EXPLAIN IT SIMPLE'}
                  </Text>
                </View>
              </TouchableOpacity>
            </XStack>

            {showTeenGuide ? (
              <YStack gap={12} marginTop={4}>
                <Text color="#FFFFFF" fontSize={15} lineHeight={22} style={{ fontFamily: "Inter_500Medium" }}>
                  {teenGuides[asset.ticker].analogy}
                </Text>
                <View height={1} backgroundColor="rgba(255, 255, 255, 0.1)" />
                <XStack gap={10} alignItems="flex-start" backgroundColor="rgba(255, 255, 255, 0.03)" padding={12} borderRadius={10}>
                  <PhosphorIcon name="Warning" size={16} color={asset.color} weight="fill" style={{ marginTop: 2 }} />
                  <Text color="#E2E8F0" fontSize={13} style={{ fontFamily: "Inter_500Medium", flex: 1, lineHeight: 19 }}>
                    {teenGuides[asset.ticker].riskExplanation}
                  </Text>
                </XStack>
              </YStack>
            ) : (
              <Text color="#94A3B8" fontSize={13} lineHeight={18} style={{ fontFamily: "Inter_400Regular" }}>
                Struggling with financial jargon? Tap the button to get a simplified explanation with gaming & school analogies!
              </Text>
            )}
          </CbudgetCard>

          {/* 1-Year Range Bar Widget */}
          <CbudgetCard padding={16} gap={10} marginBottom={20}>
            <Text color={theme.text} fontSize={14} fontWeight="800" letterSpacing={-0.2}>
              1-Year Price Range
            </Text>
            
            <YStack gap={8} marginTop={4}>
              <View height={6} backgroundColor={theme.backgroundElement} borderRadius={10} position="relative" width="100%">
                <View
                  position="absolute"
                  top={0}
                  bottom={0}
                  left={0}
                  width={`${currentPos}%`}
                  style={{ backgroundColor: asset.color }}
                  borderRadius={10}
                />
                <View
                  position="absolute"
                  top={-3}
                  left={`${currentPos}%`}
                  width={12}
                  height={12}
                  borderRadius={100}
                  backgroundColor={theme.text}
                  borderWidth={2}
                  borderColor={theme.background}
                  style={{ marginLeft: -6 } as any}
                />
              </View>
              <XStack justifyContent="space-between">
                <YStack gap={1}>
                  <Text color={theme.textSecondary} fontSize={11} fontWeight="600" opacity={0.6}>LOWEST THIS YEAR</Text>
                  <Text color={theme.text} fontSize={14} fontWeight="800">{currencySymbol}{asset.low52.toLocaleString()}</Text>
                </YStack>
                <YStack alignItems="flex-end" gap={1}>
                  <Text color={theme.textSecondary} fontSize={11} fontWeight="600" opacity={0.6}>HIGHEST THIS YEAR</Text>
                  <Text color={theme.text} fontSize={14} fontWeight="800">{currencySymbol}{asset.high52.toLocaleString()}</Text>
                </YStack>
              </XStack>
            </YStack>
          </CbudgetCard>

          {/* Key Metrics Grid */}
          <CbudgetCard padding={16} gap={14} marginBottom={20}>
            <Text color={theme.text} fontSize={14} fontWeight="800" letterSpacing={-0.2}>
              Key Statistics
            </Text>
            
            <XStack justifyContent="space-between" flexWrap="wrap" gap={12}>
              <XStack width="47%" gap={10} alignItems="center" paddingVertical={4}>
                <PhosphorIcon name="ChartBar" size={16} color={theme.primary} />
                <YStack gap={1}>
                  <Text color={theme.textSecondary} opacity={0.6} fontSize={11} fontWeight="700">COMPANY VALUE</Text>
                  <Text color={theme.text} fontSize={15} fontWeight="800">{asset.marketCap}</Text>
                </YStack>
              </XStack>
              <XStack width="47%" gap={10} alignItems="center" paddingVertical={4}>
                <PhosphorIcon name="Waveform" size={16} color={theme.primary} />
                <YStack gap={1}>
                  <Text color={theme.textSecondary} opacity={0.6} fontSize={11} fontWeight="700">TRADED TODAY</Text>
                  <Text color={theme.text} fontSize={15} fontWeight="800">{asset.volume}</Text>
                </YStack>
              </XStack>
              <XStack width="47%" gap={10} alignItems="center" paddingVertical={4}>
                <PhosphorIcon name="Tag" size={16} color={theme.primary} />
                <YStack gap={1}>
                  <Text color={theme.textSecondary} opacity={0.6} fontSize={11} fontWeight="700">PRICE RATING</Text>
                  <Text color={theme.text} fontSize={15} fontWeight="800">{asset.peRatio}</Text>
                </YStack>
              </XStack>
              <XStack width="47%" gap={10} alignItems="center" paddingVertical={4}>
                <PhosphorIcon name="Tag" size={16} color={theme.primary} weight="fill" />
                <YStack gap={1}>
                  <Text color={theme.textSecondary} opacity={0.6} fontSize={11} fontWeight="700">RISK CLASS</Text>
                  <Text style={{ color: asset.color }} fontSize={15} fontWeight="800">{asset.riskProfile}</Text>
                </YStack>
              </XStack>
            </XStack>
          </CbudgetCard>

          {/* Corporate Profile Card */}
          <CbudgetCard padding={16} gap={10} marginBottom={24}>
            <Text color={theme.text} fontSize={14} fontWeight="800" letterSpacing={-0.2}>
              Corporate Profile
            </Text>
            <Text color={theme.textSecondary} fontSize={13} lineHeight={20} opacity={0.8}>
              {asset.description}
            </Text>
          </CbudgetCard>
        </ScrollView>

        {/* Jargon Explainer Modal */}
        <Modal
          visible={showJargonModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowJargonModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <CbudgetCard
              padding={20}
              gap={16}
              width="100%"
              maxWidth={360}
              borderRadius={16}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <Text color={theme.text} fontSize={16} fontWeight="800">
                  💡 Finance Jargon Explainer
                </Text>
                <TouchableOpacity onPress={() => setShowJargonModal(false)}>
                  <PhosphorIcon
                    name="XCircle"
                    size={20}
                    color={theme.textSecondary}
                    weight="fill"
                  />
                </TouchableOpacity>
              </XStack>

              <YStack gap={14} marginTop={4}>
                <YStack gap={4}>
                  <Text color={theme.primary} fontSize={13} fontWeight="800">
                    🍕 What is a Fractional Share?
                  </Text>
                  <Text color={theme.textSecondary} fontSize={12} lineHeight={17}>
                    Think of a share of stock like a whole pizza. If a full pizza costs {currencySymbol}500, but you only have {currencySymbol}50, you can buy exactly a single slice (10%). That slice is your <Text fontWeight="700" color={theme.text}>fractional share</Text>! It lets you invest in big companies with whatever cash you have.
                  </Text>
                </YStack>

                <View height={1} backgroundColor={theme.border} opacity={0.6} />

                <YStack gap={4}>
                  <Text color={theme.primary} fontSize={13} fontWeight="800">
                    🎁 What are Dividends?
                  </Text>
                  <Text color={theme.textSecondary} fontSize={12} lineHeight={17}>
                    When a company earns a profit, they sometimes choose to distribute a portion of that cash back to their shareholders. It is like a shop sharing some weekend profits with you because you helped fund them! You earn passive money <Text fontWeight="700" color={theme.text}>just by owning the stock</Text>.
                  </Text>
                </YStack>
              </YStack>

              <FormButton
                variant="primary"
                height={40}
                borderRadius={10}
                marginTop={10}
                onPress={() => setShowJargonModal(false)}
              >
                Got It!
              </FormButton>
            </CbudgetCard>
          </View>
        </Modal>
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
    paddingTop: 12,
    paddingBottom: 32,
  },
  timeframeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  percentPresetBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
});
