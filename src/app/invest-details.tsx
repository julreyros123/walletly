import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Button, View } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { useGamificationStore } from '@/store/gamificationStore';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';

interface AssetDetails {
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
  marketCap: string;
  volume: string;
  high52: number;
  low52: number;
  peRatio: string;
  history1D: number[];
  history1W: number[];
  history1M: number[];
}

interface TeenGuide {
  analogy: string;
  riskExplanation: string;
}

// Custom scrubbing interactive line chart
function InteractiveChart({
  data,
  color,
  onChangePrice,
  theme,
}: {
  data: number[];
  color: string;
  onChangePrice: (val: number | null) => void;
  theme: any;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const chartHeight = 130;
  const [chartWidth, setChartWidth] = useState(300); // Dynamic layout fallback

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (chartWidth - 10) + 5;
    const y = chartHeight - 15 - ((val - min) / range) * (chartHeight - 30);
    return { x, y, val };
  });

  const lastPoint = points[points.length - 1];

  return (
    <YStack gap={8} marginTop={12} width="100%">
      <View
        height={chartHeight}
        width="100%"
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setChartWidth(w);
        }}
        style={{ position: 'relative', overflow: 'visible' }}
      >
        {/* Subtle Horizontal Grid Guides */}
        <View position="absolute" top={20} left={0} right={0} height={1} backgroundColor="rgba(255, 255, 255, 0.04)" />
        <View position="absolute" top={70} left={0} right={0} height={1} backgroundColor="rgba(255, 255, 255, 0.04)" />
        <View position="absolute" top={120} left={0} right={0} height={1} backgroundColor="rgba(255, 255, 255, 0.04)" />

        {/* Draw Area Fill Stems */}
        {points.map((pt, idx) => (
          <View
            key={`area-${idx}`}
            style={{
              position: 'absolute',
              left: pt.x,
              top: pt.y,
              width: 1,
              height: chartHeight - pt.y - 10,
              backgroundColor: color,
              opacity: activeIndex === idx ? 0.4 : 0.12,
            }}
          />
        ))}

        {/* Draw Line Segments */}
        {points.map((pt, idx) => {
          if (idx === points.length - 1) return null;
          const nextPt = points[idx + 1];
          const dx = nextPt.x - pt.x;
          const dy = nextPt.y - pt.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          return (
            <View
              key={`seg-${idx}`}
              style={{
                position: 'absolute',
                left: pt.x + dx / 2 - dist / 2,
                top: pt.y + dy / 2 - 1.25,
                width: dist,
                height: 2.5,
                backgroundColor: color,
                transform: [{ rotate: `${angle}rad` }],
                opacity: activeIndex === null || activeIndex === idx || activeIndex === idx + 1 ? 1 : 0.4,
              }}
            />
          );
        })}

        {/* Live Active End Point Node */}
        {activeIndex === null && lastPoint && (
          <View
            style={{
              position: 'absolute',
              left: lastPoint.x - 7,
              top: lastPoint.y - 7,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: `${color}33`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: color,
              }}
            />
          </View>
        )}

        {/* Vertical scrubbing indicator line */}
        {activeIndex !== null && points[activeIndex] && (
          <View
            style={{
              position: 'absolute',
              left: points[activeIndex].x,
              top: 0,
              bottom: 10,
              width: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
            }}
          />
        )}

        {/* Active glowing scrubbing dot */}
        {activeIndex !== null && points[activeIndex] && (
          <View
            style={{
              position: 'absolute',
              left: points[activeIndex].x - 7,
              top: points[activeIndex].y - 7,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: color,
              borderWidth: 2,
              borderColor: '#FFFFFF',
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.9,
              shadowRadius: 8,
              elevation: 6,
            }}
          />
        )}

        {/* Overlay touch zones for interactive scrubbing */}
        <XStack style={{ ...StyleSheet.absoluteFillObject }} justifyContent="space-between">
          {points.map((pt, idx) => (
            <TouchableOpacity
              key={`zone-${idx}`}
              onPressIn={() => {
                setActiveIndex(idx);
                onChangePrice(pt.val);
              }}
              onPressOut={() => {
                setActiveIndex(null);
                onChangePrice(null);
              }}
              activeOpacity={1}
              style={{
                width: `${100 / data.length}%`,
                height: '100%',
              }}
            />
          ))}
        </XStack>
      </View>

      <YStack alignItems="center" gap={4} marginTop={4} width="100%">
        <Text color={theme.textSecondary} opacity={0.7} fontSize={12} fontFamily="Inter_500Medium" textAlign="center">
          💡 Tap & drag the line to see price history
        </Text>
        <XStack justifyContent="space-between" width="100%" paddingHorizontal={4}>
          <Text color={theme.textSecondary} fontSize={10} fontFamily="Inter_700Bold" opacity={0.6}>TIMELINE START</Text>
          <Text color={theme.textSecondary} fontSize={10} fontFamily="Inter_700Bold" opacity={0.6}>LIVE NOW</Text>
        </XStack>
      </YStack>
    </YStack>
  );
}

export default function InvestDetailsScreen() {
  const router = useRouter();
  const theme = useTheme() as any;
  const store = useGamificationStore();
  const params = useLocalSearchParams<{ ticker: string }>();

  // Teen-friendly academy guides for 14-18 year olds
  const teenGuides: Record<string, TeenGuide> = {
    NOVA: {
      analogy: "🎮 Think of NOVA like buying a piece of the factory that makes the ultimate graphics cards (GPUs) for playing GTA 6 or running AI tools like ChatGPT. Since AI is blowing up, NOVA grows super fast!",
      riskExplanation: "⚡ Aggressive Risk: It's like riding a roller coaster. If gamers find a cooler chip brand tomorrow, the price could drop fast. High risk, high reward!"
    },
    VOLT: {
      analogy: "⚡ Imagine VOLT like owning a piece of Tesla. They build electric supercars and smart solar batteries. It's clean energy, which is super popular with your generation.",
      riskExplanation: "🚗 Aggressive Risk: Car companies spend billions building factories. If they have a delay launching a new car, the stock drops. Only allocate cash you don't need soon!"
    },
    BREW: {
      analogy: "☕ Think of BREW like owning your favorite local coffee shop right outside school. Students will always buy caffeinated iced lattes and bubble tea to stay awake during tests. It's super stable.",
      riskExplanation: "📈 Moderate Risk: Coffee is always popular, but if coffee bean prices rise globally, their profit dips slightly. It grows steadily whenever they open new outlets."
    },
    APEX: {
      analogy: "📦 Think of APEX like the drone-delivery service that drops off your online shopping orders at your doorstep 15 minutes after you tap buy. They run the biggest shopping warehouses.",
      riskExplanation: "🛡️ Conservative Risk: Everyone shops online constantly, making APEX very safe. It doesn't double overnight, but it is a solid safe-haven for your savings."
    },
    SOLR: {
      analogy: "☀️ Imagine SOLR like the power company, but they harvest orbital space beams. Everyone has to charge their phones, laptops, and consoles, so they pay SOLR for power every single month.",
      riskExplanation: "🛡️ Conservative Risk: Since electricity is a basic need, SOLR is extremely safe. It is like putting money in a premium piggy bank with a guaranteed slow climb."
    }
  };

  // Asset database
  const assetData: Record<string, AssetDetails> = {
    NOVA: {
      ticker: 'NOVA',
      name: 'NovaChip AI Corp',
      price: 512.80,
      change: 2.45,
      icon: { ios: 'cpu', android: 'memory', web: 'memory' } as const,
      color: '#A855F7',
      sparkline: [8, 9, 7, 10, 11, 9, 12],
      riskProfile: 'Aggressive',
      partner: 'Semiconductors',
      description: 'Neural core processors and AI accelerators for deep learning clusters.',
      marketCap: '₱1.8 Million',
      volume: '₱42,100',
      high52: 545.00,
      low52: 380.00,
      peRatio: '32.4',
      history1D: [502.10, 505.00, 498.50, 510.30, 507.00, 512.80],
      history1W: [480.00, 495.20, 510.50, 490.10, 505.30, 515.00, 512.80],
      history1M: [420.00, 435.00, 440.00, 430.00, 455.00, 470.00, 465.00, 490.00, 505.00, 512.80],
    },
    VOLT: {
      ticker: 'VOLT',
      name: 'Volt Motors',
      price: 345.50,
      change: -1.85,
      icon: { ios: 'bolt.fill', android: 'flash_on', web: 'flash_on' } as const,
      color: '#22C55E',
      sparkline: [12, 13, 11, 14, 13, 10, 9],
      riskProfile: 'Aggressive',
      partner: 'Clean Energy & EV',
      description: 'Electric mobility, structural battery packs, and smart solar grids.',
      marketCap: '₱1.2 Million',
      volume: '₱28,500',
      high52: 395.00,
      low52: 290.00,
      peRatio: '24.8',
      history1D: [352.00, 350.50, 348.00, 349.50, 346.00, 345.50],
      history1W: [365.00, 360.00, 358.00, 352.00, 350.00, 344.00, 345.50],
      history1M: [330.00, 335.00, 340.00, 352.00, 368.00, 370.00, 362.00, 355.00, 349.00, 345.50],
    },
    BREW: {
      ticker: 'BREW',
      name: 'StarBrew Café',
      price: 125.30,
      change: 0.35,
      icon: { ios: 'cup.and.saucer.fill', android: 'local_cafe', web: 'local_cafe' } as const,
      color: '#F59E0B',
      sparkline: [8, 8, 9, 9, 10, 10, 11],
      riskProfile: 'Moderate',
      partner: 'Consumer Retail',
      description: 'Global chain of automated barista cafes and specialty beans.',
      marketCap: '₱450,000',
      volume: '₱8,200',
      high52: 135.00,
      low52: 110.00,
      peRatio: '14.2',
      history1D: [124.90, 125.00, 125.10, 124.80, 125.20, 125.30],
      history1W: [122.00, 123.50, 123.00, 124.10, 124.50, 125.00, 125.30],
      history1M: [118.00, 119.50, 120.00, 120.50, 122.00, 122.50, 123.00, 124.00, 124.80, 125.30],
    },
    APEX: {
      ticker: 'APEX',
      name: 'Apex Logi-Retail',
      price: 185.20,
      change: 0.12,
      icon: { ios: 'cart.fill', android: 'shopping_cart', web: 'shopping_cart' } as const,
      color: '#EF4444',
      sparkline: [5, 6, 6, 7, 7, 7, 8],
      riskProfile: 'Conservative',
      partner: 'E-Commerce',
      description: 'Global e-commerce marketplace and autonomous drone delivery operations.',
      marketCap: '₱890,000',
      volume: '₱14,800',
      high52: 195.00,
      low52: 165.00,
      peRatio: '19.1',
      history1D: [184.80, 185.00, 185.10, 184.90, 185.00, 185.20],
      history1W: [183.50, 184.00, 183.80, 184.50, 184.80, 185.00, 185.20],
      history1M: [175.00, 177.00, 178.50, 180.00, 182.00, 181.50, 183.00, 184.00, 184.80, 185.20],
    },
    SOLR: {
      ticker: 'SOLR',
      name: 'Solaris Power',
      price: 95.60,
      change: 0.78,
      icon: { ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' } as const,
      color: '#0EA5E9',
      sparkline: [6, 6, 7, 7, 8, 8, 9],
      riskProfile: 'Conservative',
      partner: 'Utility Provider',
      description: 'Orbital energy solar reflector grids distributing wireless clean power.',
      marketCap: '₱320,000',
      volume: '₱5,400',
      high52: 102.00,
      low52: 84.00,
      peRatio: '11.8',
      history1D: [94.80, 95.00, 95.20, 95.10, 95.40, 95.60],
      history1W: [93.00, 93.80, 94.20, 94.00, 94.80, 95.20, 95.60],
      history1M: [88.00, 89.50, 90.00, 91.20, 92.50, 93.00, 93.80, 94.50, 95.00, 95.60],
    },
  };

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
    if (dividendsClaimed[asset.ticker]) {
      Alert.alert('Dividends Claimed', 'You have already claimed dividends for this stock today.');
      return;
    }

    // Daily simulated dividend of 1.0% of total holdings value
    const dividendAmount = assetTotalValue * 0.01;
    const roundedDividend = parseFloat(dividendAmount.toFixed(2));

    useGamificationStore.setState({
      virtualBalance: store.virtualBalance + roundedDividend,
      xp: store.xp + 5
    });

    setDividendsClaimed({ ...dividendsClaimed, [asset.ticker]: true });

    Alert.alert(
      '🎉 Dividends Claimed!',
      `You earned ₱${roundedDividend.toLocaleString(undefined, { minimumFractionDigits: 2 })} in passive dividends from your ${ownedUnits.toFixed(4)} shares of ${asset.ticker}! (+5 XP)\n\n💡 Dividends are a share of the company's profits paid out to shareholders just for holding the stock.`
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
              <SymbolView
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' } as any}
                size={16}
                tintColor={theme.text}
              />
              <Text color={theme.text} fontWeight="700" fontSize={13}>Back</Text>
            </XStack>
          </TouchableOpacity>

          <View backgroundColor="rgba(245, 158, 11, 0.12)" paddingHorizontal={10} paddingVertical={4} borderRadius={100} borderWidth={1} borderColor="rgba(245, 158, 11, 0.3)">
            <Text color="#F59E0B" fontSize={10} fontFamily="Inter_700Bold" letterSpacing={0.5}>
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
                backgroundColor={`${asset.color}10`}
                alignItems="center"
                justifyContent="center"
                borderWidth={1.5}
                borderColor={`${asset.color}20`}
              >
                <SymbolView name={asset.icon} size={22} tintColor={asset.color} />
              </View>
              <YStack gap={6} flex={1}>
                <Text color="#FFFFFF" fontSize={18} fontFamily="Inter_700Bold" letterSpacing={-0.4} numberOfLines={1}>
                  {asset.name}
                </Text>
                <XStack gap={6} flexWrap="wrap" alignItems="center">
                  <View backgroundColor="rgba(255, 255, 255, 0.06)" paddingHorizontal={8} paddingVertical={4} borderRadius={6} borderWidth={1} borderColor="rgba(255, 255, 255, 0.08)">
                    <Text color="rgba(255, 255, 255, 0.85)" fontSize={11} fontFamily="Inter_700Bold">
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
                      fontFamily="Inter_700Bold"
                    >
                      {asset.riskProfile === 'Conservative' ? '🟢 Conservative' : asset.riskProfile === 'Moderate' ? '🟡 Moderate' : '🔥 High Growth'}
                    </Text>
                  </View>
                </XStack>
              </YStack>
            </XStack>

            <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={8} marginTop={12}>
              <Text color={theme.text} fontSize={28} fontFamily="Inter_700Bold" letterSpacing={-0.5} lineHeight={34}>
                ₱{(scrubbedPrice ? scrubbedPrice : asset.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              
              <XStack
                backgroundColor={changeIsPositive ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'}
                borderRadius={8}
                paddingHorizontal={10}
                paddingVertical={4}
                alignItems="center"
                gap={4}
              >
                <SymbolView
                  name={changeIsPositive ? 'arrow.up.right' : 'arrow.down.right'}
                  size={11}
                  tintColor={changeIsPositive ? '#22C55E' : '#EF4444'}
                />
                <Text color={changeIsPositive ? '#22C55E' : '#EF4444'} fontSize={11} fontFamily="Inter_700Bold">
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
                      Current Stock Price: ₱{asset.price.toLocaleString()}
                    </Text>
                  </YStack>
                  <TouchableOpacity onPress={() => setIsTrading(false)}>
                    <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' } as const} size={20} tintColor={theme.textSecondary} />
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
                    <Text color={allocationType === 'buy' ? '#FFFFFF' : theme.text} fontSize={11} fontFamily="Inter_700Bold">
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
                    <Text color={allocationType === 'sell' ? '#FFFFFF' : theme.text} fontSize={11} fontFamily="Inter_700Bold">
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
                      <Text color={tradeMode === 'pesos' ? '#FFFFFF' : theme.text} fontSize={11} fontFamily="Inter_700Bold">
                        Trade in Pesos (₱)
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
                      <Text color={tradeMode === 'shares' ? '#FFFFFF' : theme.text} fontSize={11} fontFamily="Inter_700Bold">
                        Trade in Shares
                      </Text>
                    </TouchableOpacity>
                  </XStack>

                  <FormInput
                    label={tradeMode === 'pesos' ? (allocationType === 'buy' ? 'Amount to Invest' : 'Amount to Sell') : (allocationType === 'buy' ? 'Shares to Buy' : 'Shares to Sell')}
                    placeholder={tradeMode === 'pesos' ? '₱ 0.00' : '0.00'}
                    keyboardType="numeric"
                    value={unitsAmount}
                    onChangeText={setUnitsAmount}
                    leftIcon={tradeMode === 'pesos' ? ({ ios: 'banknote', android: 'payments', web: 'payments' } as any) : ({ ios: 'number', android: 'tag', web: 'tag' } as any)}
                  />

                  {/* Live conversion helper text for teens */}
                  {unitsAmount !== '' && parseFloat(unitsAmount) > 0 && (
                    <Text color="#94A3B8" fontSize={11} fontFamily="Inter_600SemiBold" textAlign="center" marginTop={-4}>
                      {tradeMode === 'pesos' 
                        ? `≈ ${typedUnits.toFixed(4)} shares of ${asset.ticker}`
                        : `≈ ₱${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} cash value`}
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
                          : `₱${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </Text>
                    </XStack>
                    <XStack justifyContent="space-between" alignItems="center" gap={8}>
                      <Text color={theme.textSecondary} fontSize={12} flex={1}>
                        {allocationType === 'buy' ? 'Available Sandbox Cash' : 'Owned Shares Available'}
                      </Text>
                      <Text color={theme.text} fontSize={13} fontWeight="800" textAlign="right">
                        {allocationType === 'buy' 
                          ? `₱${store.virtualBalance.toLocaleString()}` 
                          : `${ownedUnits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} units`}
                      </Text>
                    </XStack>
                  </YStack>
                </YStack>

                <FormButton
                  variant="primary"
                  height={46}
                  borderRadius={12}
                  leftIcon={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' } as any}
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
                    {ownedUnits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} units (~₱{assetTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
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
                          <View width={`${Math.min(100, ownedUnits * 100)}%`} height="100%" backgroundColor={asset.color} borderRadius={4} />
                        </View>
                        <Text color="rgba(255, 255, 255, 0.5)" fontSize={9} fontFamily="Inter_600SemiBold">
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
                        <Text color="#3EB47D" fontSize={10} fontFamily="Inter_700Bold" letterSpacing={0.5}>
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
                        <Text color={dividendsClaimed[asset.ticker] ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} fontSize={9} fontFamily="Inter_700Bold">
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
                    leftIcon={{ ios: 'minus.circle.fill', android: 'remove_circle', web: 'remove_circle' } as any}
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
                    leftIcon={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' } as any}
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
          <CbudgetCard padding={18} gap={14} marginBottom={20} borderColor={`${asset.color}40`} borderWidth={1.5}>
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap={8} alignItems="center">
                <SymbolView
                  name={{ ios: 'lightbulb.fill', android: 'emoji_objects', web: 'emoji_objects' } as any}
                  size={20}
                  tintColor="#F59E0B"
                />
                <Text color="#FFFFFF" fontSize={16} fontFamily="Inter_700Bold" letterSpacing={-0.2}>
                  Teen Academy 🎓
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setShowTeenGuide(!showTeenGuide)}>
                <View backgroundColor={showTeenGuide ? theme.primary : theme.backgroundElement} paddingHorizontal={12} paddingVertical={6} borderRadius={8}>
                  <Text color={showTeenGuide ? '#FFFFFF' : theme.text} fontSize={11} fontFamily="Inter_700Bold">
                    {showTeenGuide ? 'HIDE SIMPLE' : 'EXPLAIN IT SIMPLE'}
                  </Text>
                </View>
              </TouchableOpacity>
            </XStack>

            {showTeenGuide ? (
              <YStack gap={12} marginTop={4}>
                <Text color="#FFFFFF" fontSize={15} lineHeight={22} fontFamily="Inter_500Medium">
                  {teenGuides[asset.ticker].analogy}
                </Text>
                <View height={1} backgroundColor="rgba(255, 255, 255, 0.1)" />
                <XStack gap={10} alignItems="flex-start" backgroundColor="rgba(255, 255, 255, 0.03)" padding={12} borderRadius={10}>
                  <SymbolView name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' } as any} size={16} tintColor={asset.color} style={{ marginTop: 2 }} />
                  <Text color="#E2E8F0" fontSize={13} fontFamily="Inter_500Medium" style={{ flex: 1, lineHeight: 19 }}>
                    {teenGuides[asset.ticker].riskExplanation}
                  </Text>
                </XStack>
              </YStack>
            ) : (
              <Text color="#94A3B8" fontSize={13} lineHeight={18} fontFamily="Inter_400Regular">
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
                  backgroundColor={asset.color}
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
                  <Text color={theme.text} fontSize={14} fontWeight="800">₱{asset.low52.toLocaleString()}</Text>
                </YStack>
                <YStack alignItems="flex-end" gap={1}>
                  <Text color={theme.textSecondary} fontSize={11} fontWeight="600" opacity={0.6}>HIGHEST THIS YEAR</Text>
                  <Text color={theme.text} fontSize={14} fontWeight="800">₱{asset.high52.toLocaleString()}</Text>
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
                <SymbolView name={{ ios: 'chart.bar.xaxis', android: 'bar_chart', web: 'bar_chart' } as any} size={16} tintColor={theme.primary} />
                <YStack gap={1}>
                  <Text color={theme.textSecondary} opacity={0.6} fontSize={11} fontWeight="700">COMPANY VALUE</Text>
                  <Text color={theme.text} fontSize={15} fontWeight="800">{asset.marketCap}</Text>
                </YStack>
              </XStack>
              <XStack width="47%" gap={10} alignItems="center" paddingVertical={4}>
                <SymbolView name={{ ios: 'waveform', android: 'show_chart', web: 'show_chart' } as any} size={16} tintColor={theme.primary} />
                <YStack gap={1}>
                  <Text color={theme.textSecondary} opacity={0.6} fontSize={11} fontWeight="700">TRADED TODAY</Text>
                  <Text color={theme.text} fontSize={15} fontWeight="800">{asset.volume}</Text>
                </YStack>
              </XStack>
              <XStack width="47%" gap={10} alignItems="center" paddingVertical={4}>
                <SymbolView name={{ ios: 'number.square', android: 'tag', web: 'tag' } as any} size={16} tintColor={theme.primary} />
                <YStack gap={1}>
                  <Text color={theme.textSecondary} opacity={0.6} fontSize={11} fontWeight="700">PRICE RATING</Text>
                  <Text color={theme.text} fontSize={15} fontWeight="800">{asset.peRatio}</Text>
                </YStack>
              </XStack>
              <XStack width="47%" gap={10} alignItems="center" paddingVertical={4}>
                <SymbolView name={{ ios: 'tag.fill', android: 'sell', web: 'sell' } as any} size={16} tintColor={theme.primary} />
                <YStack gap={1}>
                  <Text color={theme.textSecondary} opacity={0.6} fontSize={11} fontWeight="700">RISK CLASS</Text>
                  <Text color={asset.color} fontSize={15} fontWeight="800">{asset.riskProfile}</Text>
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
                  <SymbolView
                    name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' } as any}
                    size={20}
                    tintColor={theme.textSecondary}
                  />
                </TouchableOpacity>
              </XStack>

              <YStack gap={14} marginTop={4}>
                <YStack gap={4}>
                  <Text color={theme.primary} fontSize={13} fontWeight="800">
                    🍕 What is a Fractional Share?
                  </Text>
                  <Text color={theme.textSecondary} fontSize={12} lineHeight={17}>
                    Think of a share of stock like a whole pizza. If a full pizza costs ₱500, but you only have ₱50, you can buy exactly a single slice (10%). That slice is your <Text fontWeight="700" color={theme.text}>fractional share</Text>! It lets you invest in big companies with whatever cash you have.
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
