import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Platform,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text as TamaguiText, View } from 'tamagui';
const Text = (props: any) => <TamaguiText {...props} />;
import { setStatusBarStyle } from 'expo-status-bar';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { useGamificationStore } from '@/store/gamificationStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCurrency, formatNumberMask, parseMaskedNumber } from '@/utils/currency';
import {
  ASSET_DATA as assetData,
  TEEN_GUIDES as teenGuides,
  ASSET_THESIS,
  getLivePE,
  getValuationLabel,
} from '@/constants/assets';
import { useMarketStore } from '@/store/marketStore';
import { InteractiveChart } from '@/features/invest/components/InteractiveChart';
import { Fonts } from '@/constants/theme';
import { safeHaptic } from '@/utils/haptics';

export default function InvestDetailsScreen() {
  const router = useRouter();
  const store = useGamificationStore();
  const market = useMarketStore();
  const params = useLocalSearchParams<{ ticker?: string }>();
  const { symbol: currencySymbol } = useCurrency();

  const asset =
    market.assets[params.ticker || 'NOVA'] ||
    assetData[params.ticker || 'NOVA'] ||
    assetData.NOVA;

  const thesis = ASSET_THESIS[asset.ticker] || {
    businessModel: asset.description,
    catalysts: 'Ongoing enterprise execution, product roadmap milestones, and customer adoption.',
    riskExplanation: `${asset.riskProfile} Risk Profile: Subject to industry competition, regulatory scrutiny, and macroeconomic volatility.`,
  };

  const simpleGuide = teenGuides[asset.ticker] || {
    analogy: asset.description,
    riskExplanation: `${asset.riskProfile} Risk profile based on sector volatility.`,
  };

  useEffect(() => {
    setStatusBarStyle('light');
    market.initMarket();
    const stopDrift = market.startLiveDrift();
    return () => stopDrift();
  }, []);

  const [chartTimeframe, setChartTimeframe] = useState<'1D' | '1W' | '1M'>('1D');
  const [scrubbedPrice, setScrubbedPrice] = useState<number | null>(null);
  const [allocationType, setAllocationType] = useState<'buy' | 'sell'>('buy');
  const [unitsAmount, setUnitsAmount] = useState('');
  const [tradeMode, setTradeMode] = useState<'pesos' | 'shares'>('pesos');
  const [isTrading, setIsTrading] = useState(false);
  const [thesisViewMode, setThesisViewMode] = useState<'thesis' | 'simple'>('thesis');
  const [showJargonModal, setShowJargonModal] = useState(false);
  const [dividendsClaimed, setDividendsClaimed] = useState<Record<string, boolean>>({});

  const ownedUnits = store.portfolioAllocations[asset.ticker] || 0;
  const assetTotalValue = ownedUnits * asset.price;
  const changeIsPositive = asset.change >= 0;

  const activeHistory =
    chartTimeframe === '1D'
      ? asset.history1D
      : chartTimeframe === '1W'
      ? asset.history1W
      : asset.history1M;

  const numericInput = parseMaskedNumber(unitsAmount);

  const typedUnits =
    tradeMode === 'shares'
      ? numericInput
      : asset.price > 0
      ? numericInput / asset.price
      : 0;

  const estimatedCost =
    tradeMode === 'shares'
      ? typedUnits * asset.price
      : numericInput;

  // Percentage preset calculations for quick allocations
  const handleQuickPercent = (pct: number) => {
    safeHaptic('light');
    if (allocationType === 'buy') {
      const maxCash = store.virtualBalance;
      const targetCash = maxCash * pct;
      if (tradeMode === 'pesos') {
        setUnitsAmount(formatNumberMask(targetCash.toFixed(2)));
      } else {
        const targetUnits = asset.price > 0 ? targetCash / asset.price : 0;
        setUnitsAmount(targetUnits.toFixed(4));
      }
    } else {
      const maxUnits = ownedUnits;
      const targetUnits = maxUnits * pct;
      if (tradeMode === 'pesos') {
        const targetCash = targetUnits * asset.price;
        setUnitsAmount(formatNumberMask(targetCash.toFixed(2)));
      } else {
        setUnitsAmount(targetUnits.toFixed(4));
      }
    }
  };

  const handleExecuteAllocation = () => {
    safeHaptic('medium');
    const inputVal = parseMaskedNumber(unitsAmount);
    if (isNaN(inputVal) || inputVal <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    const qty = tradeMode === 'shares' ? inputVal : inputVal / asset.price;
    const totalCost = qty * asset.price;

    if (allocationType === 'buy') {
      if (totalCost > store.virtualBalance) {
        Alert.alert(
          'Insufficient Cash',
          `You need ${currencySymbol}${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} but only have ${currencySymbol}${store.virtualBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} in simulation cash.`
        );
        return;
      }

      const success = store.tradeAssetSim(asset.ticker, 'buy', qty, asset.price);
      if (success) {
        safeHaptic('success');
        store.addXP(25);
        Alert.alert(
          'Order Executed!',
          `Successfully purchased ${qty.toFixed(4)} units of ${asset.ticker} for ${currencySymbol}${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}. (+25 XP)`
        );
      }
    } else {
      if (qty > ownedUnits) {
        Alert.alert(
          'Insufficient Units',
          `You only own ${ownedUnits.toFixed(4)} units of ${asset.ticker}.`
        );
        return;
      }

      const success = store.tradeAssetSim(asset.ticker, 'sell', qty, asset.price);
      if (success) {
        safeHaptic('success');
        store.addXP(25);
        Alert.alert(
          'Order Executed!',
          `Successfully sold ${qty.toFixed(4)} units of ${asset.ticker} for ${currencySymbol}${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}. (+25 XP)`
        );
      }
    }

    setUnitsAmount('');
    setIsTrading(false);
  };

  const handleClaimDividends = () => {
    if (ownedUnits <= 0) {
      Alert.alert('No Shares Owned', 'You must hold shares of this asset to collect dividends!');
      return;
    }

    const ANNUAL_DIVIDEND_YIELD = 0.035;
    const dividendAmount = assetTotalValue * (ANNUAL_DIVIDEND_YIELD / 365);
    const roundedDividend = Math.max(0.01, parseFloat(dividendAmount.toFixed(2)));

    const success = store.claimDailyDividend(asset.ticker, roundedDividend);
    if (!success) {
      Alert.alert('Already Claimed', 'You have already collected dividends for this asset today. Check back tomorrow!');
      return;
    }

    setDividendsClaimed((prev) => ({ ...prev, [asset.ticker]: true }));
    safeHaptic('success');
    Alert.alert(
      '🎉 Dividends Collected!',
      `You received ${currencySymbol}${roundedDividend.toLocaleString(undefined, { minimumFractionDigits: 2 })} in passive yield from your ${ownedUnits.toFixed(4)} shares of ${asset.ticker}! (+5 XP)`
    );
  };

  // 52-Week Range position percentage
  const rangeSpan = asset.high52 - asset.low52 || 1;
  const currentPos = Math.min(Math.max(((asset.price - asset.low52) / rangeSpan) * 100, 0), 100);

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        {/* ==================== EXECUTIVE HEADER ==================== */}
        <XStack
          justifyContent="space-between"
          alignItems="center"
          paddingHorizontal={16}
          paddingVertical={12}
          borderBottomWidth={1}
          borderBottomColor="rgba(255, 255, 255, 0.08)"
        >
          <TouchableOpacity
            onPress={() => {
              safeHaptic('light');
              router.back();
            }}
            activeOpacity={0.7}
          >
            <XStack
              gap={6}
              alignItems="center"
              backgroundColor="rgba(255, 255, 255, 0.06)"
              paddingHorizontal={14}
              paddingVertical={8}
              borderRadius={999}
              borderWidth={1}
              borderColor="rgba(255, 255, 255, 0.1)"
            >
              <PhosphorIcon name="CaretLeft" size={15} color="#FFFFFF" weight="bold" />
              <Text color="#FFFFFF" fontSize={12} fontFamily={Fonts.bold}>
                Back
              </Text>
            </XStack>
          </TouchableOpacity>

          <View
            backgroundColor={market.isLive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.12)'}
            paddingHorizontal={12}
            paddingVertical={6}
            borderRadius={999}
            borderWidth={1}
            borderColor={market.isLive ? 'rgba(16, 185, 129, 0.28)' : 'rgba(56, 189, 248, 0.28)'}
            flexDirection="row"
            alignItems="center"
            gap={6}
          >
            <View
              width={6}
              height={6}
              borderRadius={3}
              backgroundColor={market.isLive ? '#10B981' : '#38BDF8'}
            />
            <Text
              color={market.isLive ? '#10B981' : '#38BDF8'}
              fontSize={10.5}
              fontFamily={Fonts.bold}
              letterSpacing={0.6}
            >
              {market.isLive ? 'LIVE QUOTE' : 'SANDBOX SIM'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              safeHaptic('light');
              setShowJargonModal(true);
            }}
            activeOpacity={0.7}
          >
            <XStack
              gap={5}
              alignItems="center"
              backgroundColor="rgba(59, 130, 246, 0.12)"
              paddingHorizontal={12}
              paddingVertical={8}
              borderRadius={999}
              borderWidth={1}
              borderColor="rgba(59, 130, 246, 0.28)"
            >
              <PhosphorIcon name="Lightbulb" size={14} color="#60A5FA" weight="fill" />
              <Text color="#60A5FA" fontSize={11} fontFamily={Fonts.bold}>
                Glossary
              </Text>
            </XStack>
          </TouchableOpacity>
        </XStack>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ==================== HERO ASSET HEADER ==================== */}
          <YStack gap={8} paddingHorizontal={4} marginBottom={18} marginTop={8}>
            <XStack gap={14} alignItems="center" width="100%">
              <View
                width={52}
                height={52}
                borderRadius={16}
                style={{
                  backgroundColor: `${asset.color}15`,
                  borderColor: `${asset.color}35`,
                  borderWidth: 1.5,
                }}
                alignItems="center"
                justifyContent="center"
              >
                <PhosphorIcon name={asset.icon} size={26} color={asset.color} weight="fill" />
              </View>
              <YStack gap={4} flex={1}>
                <XStack alignItems="center" gap={8} flexWrap="wrap">
                  <Text color="#FFFFFF" fontSize={20} fontFamily={Fonts.bold} letterSpacing={-0.3} numberOfLines={1}>
                    {asset.name}
                  </Text>
                  <View
                    backgroundColor="rgba(255, 255, 255, 0.08)"
                    paddingHorizontal={7}
                    paddingVertical={2.5}
                    borderRadius={6}
                    borderWidth={1}
                    borderColor="rgba(255, 255, 255, 0.12)"
                  >
                    <Text color="rgba(255, 255, 255, 0.85)" fontSize={10} fontFamily={Fonts.bold} letterSpacing={0.5}>
                      {asset.ticker}
                    </Text>
                  </View>
                </XStack>

                <XStack gap={6} flexWrap="wrap" alignItems="center">
                  <View
                    backgroundColor="rgba(255, 255, 255, 0.04)"
                    paddingHorizontal={8}
                    paddingVertical={3}
                    borderRadius={6}
                    borderWidth={1}
                    borderColor="rgba(255, 255, 255, 0.08)"
                  >
                    <Text color="rgba(255, 255, 255, 0.6)" fontSize={11} fontFamily={Fonts.medium}>
                      {asset.partner}
                    </Text>
                  </View>

                  <View
                    backgroundColor={
                      asset.riskProfile === 'Conservative'
                        ? 'rgba(16, 185, 129, 0.12)'
                        : asset.riskProfile === 'Moderate'
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'rgba(239, 68, 68, 0.12)'
                    }
                    paddingHorizontal={8}
                    paddingVertical={3}
                    borderRadius={6}
                    borderWidth={1}
                    borderColor={
                      asset.riskProfile === 'Conservative'
                        ? 'rgba(16, 185, 129, 0.28)'
                        : asset.riskProfile === 'Moderate'
                        ? 'rgba(245, 158, 11, 0.28)'
                        : 'rgba(239, 68, 68, 0.28)'
                    }
                  >
                    <Text
                      color={
                        asset.riskProfile === 'Conservative'
                          ? '#34D399'
                          : asset.riskProfile === 'Moderate'
                          ? '#FBBF24'
                          : '#F87171'
                      }
                      fontSize={11}
                      fontFamily={Fonts.bold}
                    >
                      {asset.riskProfile === 'Conservative'
                        ? 'Conservative'
                        : asset.riskProfile === 'Moderate'
                        ? 'Moderate Risk'
                        : 'High Growth'}
                    </Text>
                  </View>
                </XStack>
              </YStack>
            </XStack>

            {/* Price & Change Row */}
            <XStack justifyContent="space-between" alignItems="baseline" flexWrap="wrap" gap={8} marginTop={12}>
              <XStack alignItems="baseline" gap={4}>
                <Text color="#FFFFFF" fontSize={34} fontFamily={Fonts.bold} letterSpacing={-0.8} lineHeight={40}>
                  {currencySymbol}
                  {(scrubbedPrice ? scrubbedPrice : asset.price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </XStack>

              <XStack
                backgroundColor={changeIsPositive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)'}
                borderRadius={8}
                paddingHorizontal={10}
                paddingVertical={5}
                alignItems="center"
                gap={5}
                borderWidth={1}
                borderColor={changeIsPositive ? 'rgba(34, 197, 94, 0.28)' : 'rgba(239, 68, 68, 0.28)'}
              >
                <PhosphorIcon
                  name={changeIsPositive ? 'TrendUp' : 'TrendDown'}
                  size={13}
                  color={changeIsPositive ? '#4ADE80' : '#F87171'}
                  weight="bold"
                />
                <Text
                  color={changeIsPositive ? '#4ADE80' : '#F87171'}
                  fontSize={12}
                  fontFamily={Fonts.bold}
                >
                  {changeIsPositive ? '+' : ''}
                  {asset.change.toFixed(2)}%
                </Text>
              </XStack>
            </XStack>
          </YStack>

          {/* ==================== PERFORMANCE CHART CARD ==================== */}
          <View style={styles.fintechCard}>
            <XStack justifyContent="space-between" alignItems="center" marginBottom={12}>
              <Text color="#FFFFFF" fontSize={14} fontFamily={Fonts.bold} letterSpacing={-0.2}>
                Performance History
              </Text>
              <XStack
                gap={4}
                backgroundColor="rgba(11, 19, 43, 0.8)"
                borderRadius={10}
                padding={3}
                borderWidth={1}
                borderColor="rgba(255, 255, 255, 0.08)"
              >
                {(['1D', '1W', '1M'] as const).map((tf) => (
                  <TouchableOpacity
                    key={tf}
                    onPress={() => {
                      safeHaptic('light');
                      setChartTimeframe(tf);
                      setScrubbedPrice(null);
                    }}
                    style={[
                      styles.timeframeToggle,
                      chartTimeframe === tf && {
                        backgroundColor: '#10B981',
                      },
                    ]}
                  >
                    <Text
                      color={chartTimeframe === tf ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
                      fontSize={10.5}
                      fontFamily={Fonts.bold}
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
              theme={{ mode: 'dark' }}
              forceDark={true}
            />
          </View>

          {/* ==================== PORTFOLIO POSITION & ACTIONS ==================== */}
          <View style={styles.fintechCard}>
            <XStack justifyContent="space-between" alignItems="center" marginBottom={8}>
              <Text color="rgba(255, 255, 255, 0.5)" fontSize={11} fontFamily={Fonts.bold} letterSpacing={0.8} textTransform="uppercase">
                Portfolio Position
              </Text>
              <Text color="#FFFFFF" fontSize={14} fontFamily={Fonts.bold}>
                {ownedUnits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} units (~{currencySymbol}{assetTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </Text>
            </XStack>

            {ownedUnits > 0 && (
              <YStack gap={8} marginTop={6}>
                {/* Equity progress bar */}
                <YStack gap={6} backgroundColor="rgba(11, 19, 43, 0.6)" padding={12} borderRadius={12} borderWidth={1} borderColor="rgba(255, 255, 255, 0.06)">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text color="rgba(255, 255, 255, 0.5)" fontSize={10} fontFamily={Fonts.bold} letterSpacing={0.5}>
                      EQUITY WEIGHT
                    </Text>
                    <Text color="#FFFFFF" fontSize={11} fontFamily={Fonts.bold}>
                      {ownedUnits < 1 ? `${(ownedUnits * 100).toFixed(1)}% of 1 Share` : `${ownedUnits.toFixed(4)} Shares`}
                    </Text>
                  </XStack>
                  <View height={5} backgroundColor="rgba(255, 255, 255, 0.08)" borderRadius={3} overflow="hidden">
                    <View
                      width={`${Math.min(100, Math.max(4, ownedUnits * 100))}%`}
                      height="100%"
                      style={{ backgroundColor: asset.color }}
                      borderRadius={3}
                    />
                  </View>
                </YStack>

                {/* Passive Dividends banner */}
                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  backgroundColor="rgba(16, 185, 129, 0.08)"
                  padding={12}
                  borderRadius={12}
                  borderWidth={1}
                  borderColor="rgba(16, 185, 129, 0.2)"
                >
                  <YStack gap={2} flex={1}>
                    <Text color="#34D399" fontSize={11} fontFamily={Fonts.bold} letterSpacing={0.4}>
                      EST. 3.5% ANNUAL DIVIDEND YIELD
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.6)" fontSize={10.5} fontFamily={Fonts.medium}>
                      {dividendsClaimed[asset.ticker]
                        ? 'Daily dividends collected for today'
                        : 'Daily dividend distribution ready to claim'}
                    </Text>
                  </YStack>
                  <TouchableOpacity
                    onPress={handleClaimDividends}
                    disabled={dividendsClaimed[asset.ticker]}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: dividendsClaimed[asset.ticker] ? 'rgba(255, 255, 255, 0.06)' : '#10B981',
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      color={dividendsClaimed[asset.ticker] ? 'rgba(255, 255, 255, 0.4)' : '#FFFFFF'}
                      fontSize={11}
                      fontFamily={Fonts.bold}
                    >
                      {dividendsClaimed[asset.ticker] ? 'CLAIMED' : 'CLAIM'}
                    </Text>
                  </TouchableOpacity>
                </XStack>
              </YStack>
            )}

            {/* Action Buttons */}
            <XStack gap={10} marginTop={12}>
              <TouchableOpacity
                onPress={() => {
                  safeHaptic('medium');
                  setAllocationType('sell');
                  setIsTrading(true);
                  setUnitsAmount('');
                }}
                disabled={ownedUnits === 0}
                activeOpacity={0.8}
                style={[
                  styles.actionBtnSecondary,
                  ownedUnits === 0 && { opacity: 0.35 },
                ]}
              >
                <XStack alignItems="center" justifyContent="center" gap={6}>
                  <PhosphorIcon name="MinusCircle" size={15} color="#FFFFFF" weight="bold" />
                  <Text color="#FFFFFF" fontSize={13} fontFamily={Fonts.bold}>
                    Sell
                  </Text>
                </XStack>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  safeHaptic('medium');
                  setAllocationType('buy');
                  setIsTrading(true);
                  setUnitsAmount('');
                }}
                activeOpacity={0.8}
                style={styles.actionBtnPrimary}
              >
                <XStack alignItems="center" justifyContent="center" gap={6}>
                  <PhosphorIcon name="PlusCircle" size={15} color="#FFFFFF" weight="bold" />
                  <Text color="#FFFFFF" fontSize={13} fontFamily={Fonts.bold}>
                    Invest
                  </Text>
                </XStack>
              </TouchableOpacity>
            </XStack>
          </View>

          {/* ==================== STRATEGIC THESIS & MARKET ANALYSIS ==================== */}
          <View style={styles.fintechCard}>
            <XStack justifyContent="space-between" alignItems="center" marginBottom={12}>
              <XStack gap={8} alignItems="center">
                <View
                  width={28}
                  height={28}
                  borderRadius={8}
                  backgroundColor="rgba(245, 158, 11, 0.15)"
                  alignItems="center"
                  justifyContent="center"
                >
                  <PhosphorIcon name="Lightbulb" size={16} color="#FBBF24" weight="fill" />
                </View>
                <Text color="#FFFFFF" fontSize={14} fontFamily={Fonts.bold} letterSpacing={-0.2}>
                  Strategic Thesis & Outlook
                </Text>
              </XStack>

              <TouchableOpacity
                onPress={() => {
                  safeHaptic('light');
                  setThesisViewMode(thesisViewMode === 'thesis' ? 'simple' : 'thesis');
                }}
                activeOpacity={0.8}
              >
                <View
                  backgroundColor="rgba(255, 255, 255, 0.08)"
                  paddingHorizontal={10}
                  paddingVertical={5}
                  borderRadius={8}
                  borderWidth={1}
                  borderColor="rgba(255, 255, 255, 0.12)"
                >
                  <Text color="#FFFFFF" fontSize={10.5} fontFamily={Fonts.bold}>
                    {thesisViewMode === 'thesis' ? 'SIMPLIFIED' : 'ANALYST'}
                  </Text>
                </View>
              </TouchableOpacity>
            </XStack>

            {thesisViewMode === 'thesis' ? (
              <YStack gap={12}>
                <YStack gap={4}>
                  <Text color="#38BDF8" fontSize={11} fontFamily={Fonts.bold} letterSpacing={0.5} textTransform="uppercase">
                    Core Business Model
                  </Text>
                  <Text color="rgba(255, 255, 255, 0.85)" fontSize={13} lineHeight={19} fontFamily={Fonts.medium}>
                    {thesis.businessModel}
                  </Text>
                </YStack>

                <View height={1} backgroundColor="rgba(255, 255, 255, 0.06)" />

                <YStack gap={4}>
                  <Text color="#34D399" fontSize={11} fontFamily={Fonts.bold} letterSpacing={0.5} textTransform="uppercase">
                    Growth Catalysts
                  </Text>
                  <Text color="rgba(255, 255, 255, 0.85)" fontSize={13} lineHeight={19} fontFamily={Fonts.medium}>
                    {thesis.catalysts}
                  </Text>
                </YStack>

                <View height={1} backgroundColor="rgba(255, 255, 255, 0.06)" />

                <XStack
                  gap={10}
                  alignItems="flex-start"
                  backgroundColor="rgba(11, 19, 43, 0.6)"
                  padding={12}
                  borderRadius={10}
                  borderWidth={1}
                  borderColor="rgba(255, 255, 255, 0.06)"
                >
                  <PhosphorIcon name="Warning" size={16} color="#FBBF24" weight="fill" style={{ marginTop: 2 }} />
                  <Text color="rgba(255, 255, 255, 0.75)" fontSize={12} lineHeight={18} fontFamily={Fonts.medium} flex={1}>
                    {thesis.riskExplanation}
                  </Text>
                </XStack>
              </YStack>
            ) : (
              <YStack gap={10}>
                <Text color="rgba(255, 255, 255, 0.85)" fontSize={13.5} lineHeight={20} fontFamily={Fonts.medium}>
                  {simpleGuide.analogy}
                </Text>
                <XStack
                  gap={10}
                  alignItems="flex-start"
                  backgroundColor="rgba(11, 19, 43, 0.6)"
                  padding={12}
                  borderRadius={10}
                  borderWidth={1}
                  borderColor="rgba(255, 255, 255, 0.06)"
                >
                  <PhosphorIcon name="Info" size={16} color="#38BDF8" weight="fill" style={{ marginTop: 2 }} />
                  <Text color="rgba(255, 255, 255, 0.75)" fontSize={12} lineHeight={18} fontFamily={Fonts.medium} flex={1}>
                    {simpleGuide.riskExplanation}
                  </Text>
                </XStack>
              </YStack>
            )}
          </View>

          {/* ==================== 52-WEEK PRICE RANGE GAUGE ==================== */}
          <View style={styles.fintechCard}>
            <Text color="#FFFFFF" fontSize={14} fontFamily={Fonts.bold} letterSpacing={-0.2} marginBottom={12}>
              52-Week Price Range
            </Text>

            <YStack gap={10}>
              <View height={8} backgroundColor="rgba(255, 255, 255, 0.08)" borderRadius={6} position="relative" width="100%">
                <View
                  position="absolute"
                  top={0}
                  bottom={0}
                  left={0}
                  width={`${currentPos}%`}
                  style={{ backgroundColor: asset.color }}
                  borderRadius={6}
                />
                <View
                  position="absolute"
                  top={-4}
                  left={`${currentPos}%`}
                  width={16}
                  height={16}
                  borderRadius={8}
                  backgroundColor="#FFFFFF"
                  borderWidth={3}
                  borderColor="#0B132B"
                  style={{ marginLeft: -8 } as any}
                />
              </View>

              <XStack justifyContent="space-between" alignItems="center">
                <YStack gap={2}>
                  <Text color="rgba(255, 255, 255, 0.45)" fontSize={10} fontFamily={Fonts.bold} letterSpacing={0.5}>
                    52-WEEK LOW
                  </Text>
                  <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                    {currencySymbol}{asset.low52.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </YStack>
                <YStack alignItems="flex-end" gap={2}>
                  <Text color="rgba(255, 255, 255, 0.45)" fontSize={10} fontFamily={Fonts.bold} letterSpacing={0.5}>
                    52-WEEK HIGH
                  </Text>
                  <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                    {currencySymbol}{asset.high52.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          </View>

          {/* ==================== KEY STATISTICS BENTO GRID ==================== */}
          <View style={styles.fintechCard}>
            <Text color="#FFFFFF" fontSize={14} fontFamily={Fonts.bold} letterSpacing={-0.2} marginBottom={12}>
              Key Statistics
            </Text>

            <XStack justifyContent="space-between" flexWrap="wrap" gap={10}>
              {/* Stat 1: Market Cap */}
              <View style={styles.statBox}>
                <XStack gap={8} alignItems="center" marginBottom={4}>
                  <View style={styles.statIconBadge}>
                    <PhosphorIcon name="ChartBar" size={14} color="#38BDF8" weight="bold" />
                  </View>
                  <Text color="rgba(255, 255, 255, 0.5)" fontSize={10} fontFamily={Fonts.bold} letterSpacing={0.5}>
                    MARKET CAP
                  </Text>
                </XStack>
                <Text color="#FFFFFF" fontSize={15} fontFamily={Fonts.bold}>
                  {asset.marketCap}
                </Text>
              </View>

              {/* Stat 2: Volume */}
              <View style={styles.statBox}>
                <XStack gap={8} alignItems="center" marginBottom={4}>
                  <View style={styles.statIconBadge}>
                    <PhosphorIcon name="Waveform" size={14} color="#34D399" weight="bold" />
                  </View>
                  <Text color="rgba(255, 255, 255, 0.5)" fontSize={10} fontFamily={Fonts.bold} letterSpacing={0.5}>
                    24H VOLUME
                  </Text>
                </XStack>
                <Text color="#FFFFFF" fontSize={15} fontFamily={Fonts.bold}>
                  {asset.volume}
                </Text>
              </View>

              {/* Stat 3: P/E Ratio */}
              <View style={styles.statBox}>
                <XStack gap={8} alignItems="center" marginBottom={4}>
                  <View style={styles.statIconBadge}>
                    <PhosphorIcon name="Tag" size={14} color="#FBBF24" weight="bold" />
                  </View>
                  <Text color="rgba(255, 255, 255, 0.5)" fontSize={10} fontFamily={Fonts.bold} letterSpacing={0.5}>
                    P/E RATIO
                  </Text>
                </XStack>
                <XStack gap={6} alignItems="center">
                  <Text color="#FFFFFF" fontSize={15} fontFamily={Fonts.bold}>
                    {getLivePE(asset.price, asset.eps)}
                  </Text>
                  <View
                    paddingHorizontal={6}
                    paddingVertical={2}
                    borderRadius={4}
                    style={{
                      backgroundColor: `${getValuationLabel(getLivePE(asset.price, asset.eps)).color}20`,
                      borderColor: `${getValuationLabel(getLivePE(asset.price, asset.eps)).color}40`,
                      borderWidth: 1,
                    }}
                  >
                    <Text
                      style={{ color: getValuationLabel(getLivePE(asset.price, asset.eps)).color }}
                      fontSize={9.5}
                      fontFamily={Fonts.bold}
                    >
                      {getValuationLabel(getLivePE(asset.price, asset.eps)).label}
                    </Text>
                  </View>
                </XStack>
              </View>

              {/* Stat 4: Risk Class */}
              <View style={styles.statBox}>
                <XStack gap={8} alignItems="center" marginBottom={4}>
                  <View style={styles.statIconBadge}>
                    <PhosphorIcon name="ShieldCheck" size={14} color={asset.color} weight="bold" />
                  </View>
                  <Text color="rgba(255, 255, 255, 0.5)" fontSize={10} fontFamily={Fonts.bold} letterSpacing={0.5}>
                    RISK CLASS
                  </Text>
                </XStack>
                <Text style={{ color: asset.color }} fontSize={15} fontFamily={Fonts.bold}>
                  {asset.riskProfile}
                </Text>
              </View>
            </XStack>
          </View>

          {/* ==================== CORPORATE PROFILE CARD ==================== */}
          <View style={styles.fintechCard}>
            <Text color="#FFFFFF" fontSize={14} fontFamily={Fonts.bold} letterSpacing={-0.2} marginBottom={8}>
              Corporate Profile
            </Text>
            <Text color="rgba(255, 255, 255, 0.75)" fontSize={13} lineHeight={20} fontFamily={Fonts.regular}>
              {asset.description}
            </Text>
          </View>
        </ScrollView>

        {/* ==================== TRADE ORDER MODAL ==================== */}
        <Modal
          visible={isTrading}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsTrading(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalKeyboardAvoid}
            >
              <View style={styles.tradeModalCard}>
                <XStack justifyContent="space-between" alignItems="center" marginBottom={14}>
                  <YStack gap={2}>
                    <Text color="#FFFFFF" fontSize={17} fontFamily={Fonts.bold} letterSpacing={-0.3}>
                      {allocationType === 'buy' ? `Invest in ${asset.ticker}` : `Sell ${asset.ticker}`}
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.6)" fontSize={12} fontFamily={Fonts.medium}>
                      Current Market Price: {currencySymbol}{asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                  </YStack>
                  <TouchableOpacity onPress={() => setIsTrading(false)}>
                    <PhosphorIcon name="XCircle" size={22} color="rgba(255, 255, 255, 0.6)" weight="fill" />
                  </TouchableOpacity>
                </XStack>

                {/* Buy / Sell Switch */}
                <XStack
                  gap={6}
                  backgroundColor="rgba(11, 19, 43, 0.8)"
                  borderRadius={12}
                  padding={4}
                  marginBottom={12}
                  borderWidth={1}
                  borderColor="rgba(255, 255, 255, 0.08)"
                >
                  <TouchableOpacity
                    onPress={() => {
                      safeHaptic('light');
                      setAllocationType('buy');
                      setUnitsAmount('');
                    }}
                    style={[
                      styles.orderSwitchBtn,
                      allocationType === 'buy' && { backgroundColor: '#10B981' },
                    ]}
                  >
                    <Text
                      color={allocationType === 'buy' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
                      fontSize={12}
                      fontFamily={Fonts.bold}
                    >
                      Buy Order
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      safeHaptic('light');
                      setAllocationType('sell');
                      setUnitsAmount('');
                    }}
                    style={[
                      styles.orderSwitchBtn,
                      allocationType === 'sell' && { backgroundColor: '#EF4444' },
                    ]}
                  >
                    <Text
                      color={allocationType === 'sell' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
                      fontSize={12}
                      fontFamily={Fonts.bold}
                    >
                      Sell Order
                    </Text>
                  </TouchableOpacity>
                </XStack>

                {/* Mode Selector */}
                <XStack
                  gap={6}
                  backgroundColor="rgba(11, 19, 43, 0.8)"
                  borderRadius={10}
                  padding={3}
                  marginBottom={14}
                  borderWidth={1}
                  borderColor="rgba(255, 255, 255, 0.08)"
                >
                  <TouchableOpacity
                    onPress={() => {
                      safeHaptic('light');
                      setTradeMode('pesos');
                      setUnitsAmount('');
                    }}
                    style={[
                      styles.modeSwitchBtn,
                      tradeMode === 'pesos' && { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
                    ]}
                  >
                    <Text
                      color={tradeMode === 'pesos' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
                      fontSize={11}
                      fontFamily={Fonts.bold}
                    >
                      In Cash ({currencySymbol})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      safeHaptic('light');
                      setTradeMode('shares');
                      setUnitsAmount('');
                    }}
                    style={[
                      styles.modeSwitchBtn,
                      tradeMode === 'shares' && { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
                    ]}
                  >
                    <Text
                      color={tradeMode === 'shares' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
                      fontSize={11}
                      fontFamily={Fonts.bold}
                    >
                      In Shares
                    </Text>
                  </TouchableOpacity>
                </XStack>

                {/* Amount Input */}
                <YStack gap={6} marginBottom={12}>
                  <Text color="rgba(255, 255, 255, 0.6)" fontSize={11} fontFamily={Fonts.bold} letterSpacing={0.5} textTransform="uppercase">
                    {tradeMode === 'pesos'
                      ? allocationType === 'buy' ? 'Amount to Invest' : 'Amount to Liquidate'
                      : allocationType === 'buy' ? 'Shares to Buy' : 'Shares to Sell'}
                  </Text>
                  <View style={styles.tradeInputRow}>
                    <Text color="#10B981" fontSize={18} fontFamily={Fonts.bold} marginRight={8}>
                      {tradeMode === 'pesos' ? currencySymbol : 'Qty'}
                    </Text>
                    <TextInput
                      value={unitsAmount}
                      onChangeText={(val) => {
                        if (tradeMode === 'pesos') {
                          setUnitsAmount(formatNumberMask(val));
                        } else {
                          setUnitsAmount(val);
                        }
                      }}
                      placeholder="0.00"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      keyboardType="numeric"
                      style={styles.tradeTextInput}
                    />
                  </View>
                </YStack>

                {/* Preset Chips */}
                <XStack gap={8} justifyContent="space-between" marginBottom={14}>
                  {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                    <TouchableOpacity
                      key={pct}
                      onPress={() => handleQuickPercent(pct)}
                      style={styles.percentChip}
                    >
                      <Text color="#FFFFFF" fontSize={11} fontFamily={Fonts.bold}>
                        {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </XStack>

                {/* Order Summary */}
                <YStack backgroundColor="rgba(11, 19, 43, 0.8)" padding={12} borderRadius={12} gap={8} marginBottom={16} borderWidth={1} borderColor="rgba(255, 255, 255, 0.06)">
                  <XStack justifyContent="space-between">
                    <Text color="rgba(255, 255, 255, 0.5)" fontSize={11.5} fontFamily={Fonts.medium}>
                      {allocationType === 'buy' ? 'Estimated Shares' : 'Gross Proceeds'}
                    </Text>
                    <Text color="#FFFFFF" fontSize={12.5} fontFamily={Fonts.bold}>
                      {allocationType === 'buy'
                        ? `${typedUnits.toFixed(4)} units`
                        : `${currencySymbol}${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text color="rgba(255, 255, 255, 0.5)" fontSize={11.5} fontFamily={Fonts.medium}>
                      {allocationType === 'buy' ? 'Available Buying Power' : 'Units in Portfolio'}
                    </Text>
                    <Text color="#FFFFFF" fontSize={12.5} fontFamily={Fonts.bold}>
                      {allocationType === 'buy'
                        ? `${currencySymbol}${store.virtualBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : `${ownedUnits.toFixed(4)} units`}
                    </Text>
                  </XStack>
                </YStack>

                <TouchableOpacity
                  onPress={handleExecuteAllocation}
                  disabled={typedUnits <= 0}
                  activeOpacity={0.8}
                  style={[
                    styles.confirmTradeBtn,
                    {
                      backgroundColor:
                        typedUnits <= 0
                          ? 'rgba(255, 255, 255, 0.08)'
                          : allocationType === 'buy'
                          ? '#10B981'
                          : '#EF4444',
                    },
                  ]}
                >
                  <Text
                    color={typedUnits <= 0 ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF'}
                    fontSize={14}
                    fontFamily={Fonts.bold}
                  >
                    {allocationType === 'buy' ? 'Confirm Purchase' : 'Confirm Sale'}
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* ==================== FINANCIAL GLOSSARY MODAL ==================== */}
        <Modal
          visible={showJargonModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowJargonModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.jargonModalCard}>
              <XStack justifyContent="space-between" alignItems="center" marginBottom={14}>
                <XStack gap={8} alignItems="center">
                  <PhosphorIcon name="Lightbulb" size={18} color="#60A5FA" weight="fill" />
                  <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>
                    Financial Insights Glossary
                  </Text>
                </XStack>
                <TouchableOpacity onPress={() => setShowJargonModal(false)}>
                  <PhosphorIcon name="XCircle" size={20} color="rgba(255, 255, 255, 0.6)" weight="fill" />
                </TouchableOpacity>
              </XStack>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <YStack gap={12}>
                  <YStack gap={3}>
                    <Text color="#38BDF8" fontSize={12} fontFamily={Fonts.bold}>
                      Fractional Shares
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.75)" fontSize={11.5} lineHeight={16.5} fontFamily={Fonts.regular}>
                      Allows you to purchase an exact slice of a share for as little as {currencySymbol}10. You do not need to afford a full share to participate in price growth.
                    </Text>
                  </YStack>

                  <View height={1} backgroundColor="rgba(255, 255, 255, 0.08)" />

                  <YStack gap={3}>
                    <Text color="#34D399" fontSize={12} fontFamily={Fonts.bold}>
                      Dividend Yield
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.75)" fontSize={11.5} lineHeight={16.5} fontFamily={Fonts.regular}>
                      Periodic cash payments distributed to shareholders directly from corporate profits, providing passive income simply by holding ownership.
                    </Text>
                  </YStack>

                  <View height={1} backgroundColor="rgba(255, 255, 255, 0.08)" />

                  <YStack gap={3}>
                    <Text color="#FBBF24" fontSize={12} fontFamily={Fonts.bold}>
                      P/E Ratio (Price-to-Earnings)
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.75)" fontSize={11.5} lineHeight={16.5} fontFamily={Fonts.regular}>
                      Compares the share price against annual earnings per share. A lower ratio often suggests undervalued assets, while higher ratios reflect strong anticipated future growth.
                    </Text>
                  </YStack>

                  <View height={1} backgroundColor="rgba(255, 255, 255, 0.08)" />

                  <YStack gap={3}>
                    <Text color="#A855F7" fontSize={12} fontFamily={Fonts.bold}>
                      Market Capitalization
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.75)" fontSize={11.5} lineHeight={16.5} fontFamily={Fonts.regular}>
                      The total market valuation of all circulating corporate shares combined, indicating company size and overall stability.
                    </Text>
                  </YStack>
                </YStack>
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowJargonModal(false)}
                style={styles.closeJargonBtn}
              >
                <Text color="#FFFFFF" fontSize={13} fontFamily={Fonts.bold}>
                  Understood
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  fintechCard: {
    backgroundColor: '#111C35',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  timeframeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBox: {
    width: '48%',
    backgroundColor: 'rgba(11, 19, 43, 0.65)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalKeyboardAvoid: {
    width: '100%',
    alignItems: 'center',
  },
  tradeModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#111C35',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  orderSwitchBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeSwitchBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  tradeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 43, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tradeTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts.bold,
    padding: 0,
  },
  percentChip: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmTradeBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jargonModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#111C35',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeJargonBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 14,
  },
});
