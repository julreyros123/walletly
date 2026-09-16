import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, TextInput, Animated, Easing, GestureResponderEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, View } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { PhosphorIcon, PhosphorIconName } from '@/components/ui/PhosphorIcon';
import { useGamificationStore } from '@/store/gamificationStore';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { FormInput } from '@/components/ui/FormInput';
import { FormButton } from '@/components/ui/FormButton';
import { useRouter, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { AnimatedSegmentSwitch } from '@/components/ui/AnimatedSegmentSwitch';
import { ASSETS_LIST as assets, Asset } from '@/constants/assets';
import { safeHaptic } from '@/utils/haptics';
import { MotionIcon } from '@/components/ui/MotionIcon';
import { Fonts } from '@/constants/theme';
import { toast } from '@/store/toastStore';
import { RiskAssessmentModal } from '@/features/invest/components/RiskAssessmentModal';
import { useCurrency } from '@/utils/currency';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';

interface PortfolioDataPoint {
  timestamp: string;
  label: string;
  value: number;
}

function generateBezierPaths(pts: { x: number; y: number }[], height: number) {
  if (!pts || pts.length === 0) return { linePath: '', areaPath: '' };
  if (pts.length === 1) {
    return { linePath: `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`, areaPath: '' };
  }

  let linePath = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];

    // Catmull-Rom spline tangents converted to cubic bezier control points
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const firstPt = pts[0];
  const lastPt = pts[pts.length - 1];
  const areaPath = `${linePath} L ${lastPt.x.toFixed(1)} ${height} L ${firstPt.x.toFixed(1)} ${height} Z`;

  return { linePath, areaPath };
}


const MARKET_BENCHMARKS = [
  { name: 'PSEi', val: '6,854.20', chg: '+0.42%', up: true },
  { name: 'S&P 500', val: '5,864.67', chg: '+0.78%', up: true },
  { name: 'USD/PHP', val: '58.25', chg: '-0.15%', up: false },
  { name: 'BTC/USD', val: '$91,420', chg: '+2.10%', up: true },
  { name: 'ETH/USD', val: '$3,410', chg: '+3.15%', up: true },
  { name: 'GOLD', val: '$2,748', chg: '+0.35%', up: true },
  { name: 'NVDA', val: '$141.50', chg: '+1.85%', up: true },
  { name: 'BDO', val: '₱158.40', chg: '+0.60%', up: true },
];

export default function InvestScreen() {
  const router = useRouter();
  const theme = useTheme() as any;
  const store = useGamificationStore();
  const { symbol: currencySymbol } = useCurrency();

  // Live Feed & Moving Ticker Tape Animations
  const tickerTranslateX = useRef(new Animated.Value(0)).current;
  const eqBar1 = useRef(new Animated.Value(0.4)).current;
  const eqBar2 = useRef(new Animated.Value(0.85)).current;
  const eqBar3 = useRef(new Animated.Value(0.5)).current;
  const eqBar4 = useRef(new Animated.Value(0.75)).current;
  const rippleScale = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0.8)).current;
  const [tickerTrackWidth, setTickerTrackWidth] = useState(0);

  useEffect(() => {
    // 1. Equalizer Bar 1 Loop
    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.timing(eqBar1, { toValue: 1.0, duration: 240, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(eqBar1, { toValue: 0.3, duration: 200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(eqBar1, { toValue: 0.75, duration: 220, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(eqBar1, { toValue: 0.45, duration: 180, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );

    // 2. Equalizer Bar 2 Loop
    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.timing(eqBar2, { toValue: 0.35, duration: 190, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(eqBar2, { toValue: 1.0, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(eqBar2, { toValue: 0.5, duration: 210, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(eqBar2, { toValue: 0.85, duration: 230, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );

    // 3. Equalizer Bar 3 Loop
    const anim3 = Animated.loop(
      Animated.sequence([
        Animated.timing(eqBar3, { toValue: 0.9, duration: 230, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(eqBar3, { toValue: 0.4, duration: 220, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(eqBar3, { toValue: 1.0, duration: 250, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(eqBar3, { toValue: 0.3, duration: 180, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );

    // 4. Equalizer Bar 4 Loop
    const anim4 = Animated.loop(
      Animated.sequence([
        Animated.timing(eqBar4, { toValue: 0.45, duration: 210, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(eqBar4, { toValue: 0.95, duration: 240, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(eqBar4, { toValue: 0.35, duration: 190, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(eqBar4, { toValue: 0.75, duration: 230, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );

    // 5. Radar Ripple Pulse Loop
    const rippleAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(rippleScale, { toValue: 2.2, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(rippleOpacity, { toValue: 0, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(rippleScale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(rippleOpacity, { toValue: 0.8, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );

    anim1.start();
    anim2.start();
    anim3.start();
    anim4.start();
    rippleAnim.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
      anim4.stop();
      rippleAnim.stop();
    };
  }, []);

  // 4. Sideward Moving Marquee Ticker Tape Animation
  useEffect(() => {
    if (tickerTrackWidth <= 0) return;

    tickerTranslateX.setValue(0);
    const marqueeAnimation = Animated.loop(
      Animated.timing(tickerTranslateX, {
        toValue: -tickerTrackWidth,
        duration: Math.max(14000, tickerTrackWidth * 26),
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    marqueeAnimation.start();
    return () => marqueeAnimation.stop();
  }, [tickerTrackWidth]);

  useFocusEffect(
    React.useCallback(() => {
      setStatusBarStyle('light');
    }, [])
  );
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '1Y' | 'ALL'>('1Y');
  const [chartWidth, setChartWidth] = useState(280);
  const [scrubbedIndex, setScrubbedIndex] = useState<number | null>(null);
  const lastHapticIndex = useRef<number | null>(null);
  const chartPulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(chartPulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(chartPulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);
  
  // Active Tab Segment: Portfolio & Market vs Compounding vs Sandbox Cash
  const [activeTab, setActiveTab] = useState<'portfolio' | 'compound' | 'cash'>('portfolio');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'Conservative' | 'Moderate' | 'Aggressive'>('ALL');
  const [sortBy, setSortBy] = useState<'default' | 'gainers' | 'losers' | 'price_high' | 'price_low'>('default');
  const [showFilterTray, setShowFilterTray] = useState(false);

  // Compound Time Machine states
  const [compoundMonthly, setCompoundMonthly] = useState<number>(500);
  const [compoundYears, setCompoundYears] = useState<number>(10);
  const [compoundRate, setCompoundRate] = useState<number>(8);
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);

  const [transferAmount, setTransferAmount] = useState('');

  // Risk Assessment Modal State
  const [showRiskModal, setShowRiskModal] = useState(false);

  const getAssetOwnedUnits = (ticker: string) => {
    return store.portfolioAllocations[ticker] || 0;
  };

  const holdingsValue = assets.reduce((sum, a) => sum + getAssetOwnedUnits(a.ticker) * a.price, 0);
  const totalPortfolioValue = holdingsValue + store.virtualBalance;

  const filteredAssets = assets
    .filter((asset) => {
      if (assetFilter !== 'ALL' && asset.riskProfile !== assetFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTicker = asset.ticker.toLowerCase().includes(q);
        const matchName = asset.name.toLowerCase().includes(q);
        const matchSector = asset.partner.toLowerCase().includes(q);
        if (!matchTicker && !matchName && !matchSector) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'gainers') return b.change - a.change;
      if (sortBy === 'losers') return a.change - b.change;
      if (sortBy === 'price_high') return b.price - a.price;
      if (sortBy === 'price_low') return a.price - b.price;
      return 0;
    });

  // Calculate live daily portfolio performance based on assets owned
  const dailyGain = assets.reduce((sum, asset) => {
    const owned = getAssetOwnedUnits(asset.ticker);
    const value = owned * asset.price;
    const gain = value * (asset.change / 100);
    return sum + gain;
  }, 0);
  
  const dailyGainPercent = totalPortfolioValue > 0 ? (dailyGain / totalPortfolioValue) * 100 : 0;
  const isPerformancePositive = dailyGain >= 0;

  // Dynamic scaled chart data based on user's actual portfolio balance
  const isDemoPortfolio = totalPortfolioValue <= 0;
  const effectivePortfolioValue = isDemoPortfolio ? 10000 : totalPortfolioValue;
  const effectiveDailyGain = isDemoPortfolio ? 425.80 : dailyGain;
  const effectiveDailyGainPercent = isDemoPortfolio ? 4.45 : dailyGainPercent;

  const portfolioChartSeries = useMemo((): PortfolioDataPoint[] => {
    const cur = effectivePortfolioValue;
    const g = effectiveDailyGain;

    if (timeRange === '1D') {
      const start = Math.max(10, cur - g);
      const intradayProfile = [
        { t: '9:30 AM', m: 0.0 },
        { t: '9:45 AM', m: -0.12 },
        { t: '10:00 AM', m: 0.15 },
        { t: '10:15 AM', m: 0.28 },
        { t: '10:30 AM', m: 0.42 },
        { t: '10:45 AM', m: 0.35 },
        { t: '11:00 AM', m: 0.20 },
        { t: '11:15 AM', m: 0.38 },
        { t: '11:30 AM', m: 0.52 },
        { t: '11:45 AM', m: 0.48 },
        { t: '12:00 PM', m: 0.55 },
        { t: '12:15 PM', m: 0.50 },
        { t: '12:30 PM', m: 0.58 },
        { t: '12:45 PM', m: 0.62 },
        { t: '1:00 PM', m: 0.60 },
        { t: '1:15 PM', m: 0.68 },
        { t: '1:30 PM', m: 0.72 },
        { t: '1:45 PM', m: 0.65 },
        { t: '2:00 PM', m: 0.78 },
        { t: '2:30 PM', m: 0.85 },
        { t: '3:00 PM', m: 0.82 },
        { t: '3:30 PM', m: 0.94 },
        { t: '3:45 PM', m: 0.91 },
        { t: '4:00 PM', m: 1.0 },
      ];
      return intradayProfile.map((p) => ({
        timestamp: `Today, ${p.t}`,
        label: p.t,
        value: Math.max(10, start + g * p.m),
      }));
    }

    if (timeRange === '1W') {
      const weekProfile = [
        { t: 'Mon 9:30 AM', m: 0.962 },
        { t: 'Mon 11:30 AM', m: 0.958 },
        { t: 'Mon 2:00 PM', m: 0.965 },
        { t: 'Mon 4:00 PM', m: 0.970 },
        { t: 'Tue 9:30 AM', m: 0.968 },
        { t: 'Tue 11:30 AM', m: 0.974 },
        { t: 'Tue 2:00 PM', m: 0.980 },
        { t: 'Tue 4:00 PM', m: 0.976 },
        { t: 'Wed 9:30 AM', m: 0.982 },
        { t: 'Wed 11:30 AM', m: 0.988 },
        { t: 'Wed 2:00 PM', m: 0.985 },
        { t: 'Wed 4:00 PM', m: 0.991 },
        { t: 'Thu 9:30 AM', m: 0.987 },
        { t: 'Thu 11:30 AM', m: 0.993 },
        { t: 'Thu 2:00 PM', m: 0.989 },
        { t: 'Thu 4:00 PM', m: 0.994 },
        { t: 'Fri 9:30 AM', m: 0.992 },
        { t: 'Fri 11:30 AM', m: 0.996 },
        { t: 'Fri 1:30 PM', m: 0.995 },
        { t: 'Fri 3:00 PM', m: 0.998 },
        { t: 'Fri 4:00 PM', m: 1.0 },
      ];
      return weekProfile.map((p) => ({
        timestamp: p.t,
        label: p.t.split(' ')[0],
        value: cur * p.m,
      }));
    }

    if (timeRange === '1M') {
      const monthMultipliers = [
        { t: 'Day 1', m: 0.912 },
        { t: 'Day 3', m: 0.918 },
        { t: 'Day 5', m: 0.908 },
        { t: 'Day 7', m: 0.924 },
        { t: 'Day 9', m: 0.932 },
        { t: 'Day 11', m: 0.928 },
        { t: 'Day 13', m: 0.941 },
        { t: 'Day 15', m: 0.938 },
        { t: 'Day 17', m: 0.952 },
        { t: 'Day 19', m: 0.960 },
        { t: 'Day 21', m: 0.955 },
        { t: 'Day 23', m: 0.968 },
        { t: 'Day 25', m: 0.974 },
        { t: 'Day 27', m: 0.982 },
        { t: 'Day 29', m: 0.991 },
        { t: 'Today', m: 1.0 },
      ];
      return monthMultipliers.map((p) => ({
        timestamp: `Month ${p.t}`,
        label: p.t,
        value: cur * p.m,
      }));
    }

    if (timeRange === '1Y') {
      const yearMultipliers = [
        { t: 'Jan', m: 0.785 },
        { t: 'Feb', m: 0.802 },
        { t: 'Mar', m: 0.814 },
        { t: 'Apr', m: 0.835 },
        { t: 'May', m: 0.825 },
        { t: 'Jun', m: 0.855 },
        { t: 'Jul', m: 0.884 },
        { t: 'Aug', m: 0.872 },
        { t: 'Sep', m: 0.905 },
        { t: 'Oct', m: 0.928 },
        { t: 'Nov', m: 0.962 },
        { t: 'Dec', m: 0.985 },
        { t: 'Today', m: 1.0 },
      ];
      return yearMultipliers.map((p) => ({
        timestamp: `${p.t} Checkpoint`,
        label: p.t,
        value: cur * p.m,
      }));
    }

    // 'ALL'
    const allMultipliers = [
      { t: '2022', m: 0.62 },
      { t: 'Q2 22', m: 0.65 },
      { t: 'Q3 22', m: 0.61 },
      { t: 'Q4 22', m: 0.69 },
      { t: '2023', m: 0.72 },
      { t: 'Q2 23', m: 0.76 },
      { t: 'Q3 23', m: 0.74 },
      { t: 'Q4 23', m: 0.81 },
      { t: '2024', m: 0.85 },
      { t: 'Q2 24', m: 0.88 },
      { t: 'Q3 24', m: 0.86 },
      { t: 'Q4 24', m: 0.92 },
      { t: '2025', m: 0.95 },
      { t: 'Current', m: 1.0 },
    ];
    return allMultipliers.map((p) => ({
      timestamp: p.t,
      label: p.t,
      value: cur * p.m,
    }));
  }, [timeRange, effectivePortfolioValue, effectiveDailyGain]);

  const seriesValues = portfolioChartSeries.map((s) => s.value);
  const periodHigh = Math.max(...seriesValues);
  const periodLow = Math.min(...seriesValues);
  const periodSpread = periodHigh - periodLow;
  const startVal = seriesValues[0] || effectivePortfolioValue;

  const activePoint = scrubbedIndex !== null && portfolioChartSeries[scrubbedIndex] 
    ? portfolioChartSeries[scrubbedIndex] 
    : null;
  const displayVal = activePoint ? activePoint.value : effectivePortfolioValue;
  const displayDelta = activePoint ? activePoint.value - startVal : effectiveDailyGain;
  const displayDeltaPct = activePoint && startVal > 0 
    ? ((activePoint.value - startVal) / startVal) * 100 
    : effectiveDailyGainPercent;
  const isDeltaPositive = displayDelta >= 0;
  const chartAccentColor = isDeltaPositive ? '#10B981' : '#EF4444';

  const timelineLabels = useMemo(() => {
    if (timeRange === '1D') return ['9:30 AM', '11:30 AM', '1:30 PM', '4:00 PM'];
    if (timeRange === '1W') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    if (timeRange === '1M') return ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
    if (timeRange === '1Y') return ['Q1 Jan', 'Q2 Apr', 'Q3 Jul', 'Q4 Oct'];
    return ['2022', '2023', '2024', '2025', 'Now'];
  }, [timeRange]);

  const effectiveTotal = Math.max(1, totalPortfolioValue > 0 ? totalPortfolioValue : 10000);
  const effectiveHoldings = totalPortfolioValue > 0 ? holdingsValue : 6800;
  const effectiveCash = totalPortfolioValue > 0 ? store.virtualBalance : 3200;
  const equitiesRatio = Math.round((effectiveHoldings / effectiveTotal) * 100);
  const cashRatio = 100 - equitiesRatio;

  const handleScrubMove = (evt: GestureResponderEvent) => {
    const touchX = evt.nativeEvent.locationX;
    const width = chartWidth || 300;
    const count = portfolioChartSeries.length;
    if (count <= 1) return;
    const clampedX = Math.max(0, Math.min(width, touchX));
    const rawIdx = Math.round((clampedX / width) * (count - 1));
    const idx = Math.max(0, Math.min(count - 1, rawIdx));
    
    if (idx !== lastHapticIndex.current) {
      safeHaptic('light');
      lastHapticIndex.current = idx;
    }
    setScrubbedIndex(idx);
  };

  const handleScrubEnd = () => {
    setScrubbedIndex(null);
    lastHapticIndex.current = null;
  };

  // Calculate available leftover allowance from budget
  const totalSpent = store.loggedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetRemaining = store.totalBudget - totalSpent;
  const totalSavingsContribution = store.savingsGoals.reduce((sum, g) => sum + g.currentSavings, 0);
  const availableToTransfer = Math.max(0, budgetRemaining - totalSavingsContribution - store.virtualBalance);

  const handleTransferFromAllowance = () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.warning('Invalid Amount', 'Please enter a valid amount to transfer.');
      return;
    }
    if (amt > availableToTransfer) {
      toast.warning(
        'Insufficient Allowance',
        `You only have ${currencySymbol}${availableToTransfer.toLocaleString()} available to transfer.`
      );
      return;
    }
    const success = store.allocateToSimulation(amt);
    if (success) {
      store.addXP(15);
      toast.success(
        'Transfer Successful (+15 XP)',
        `${currencySymbol}${amt.toLocaleString()} transferred from allowance to Investment Sandbox Cash!`
      );
      setTransferAmount('');
    } else {
      toast.error('Transfer Failed', 'There was a problem transferring your funds.');
    }
  };

  const handleAddSimulationCash = () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.warning('Invalid Amount', 'Please enter a valid cash amount to deposit.');
      return;
    }
    
    store.addSimulationCash(amt, 10);
    toast.success('Sandbox Cash Added (+10 XP)', `${currencySymbol}${amt.toLocaleString()} added to simulator funds.`);
    setTransferAmount('');
  };

  const handleQuickAddCash = (amt: number) => {
    store.addSimulationCash(amt, 5);
    toast.success('Sandbox Cash Added (+5 XP)', `${currencySymbol}${amt.toLocaleString()} added.`);
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
        toast.success(
          'Time Compounding Guru! (+20 XP)',
          'Simulated a 20-year long-term compound interest projection.'
        );
      }
    }
  }, [compoundMonthly, compoundYears, compoundRate]);

  const navigateToDetails = (ticker: string) => {
    router.push({
      pathname: '/invest-details',
      params: { ticker }
    } as any);
  };

  return (
    <YStack flex={1} backgroundColor="#0B132B">
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* ==================== TOP HEADER (MATCHING BUDGET.TSX) ==================== */}
        <View style={styles.topHeader}>
          <YStack gap={2} flex={1} paddingRight={8}>
            <Text color="#FFFFFF" fontSize={24} style={{ fontFamily: Fonts.bold }} letterSpacing={-0.4} lineHeight={30}>
              Investment Lab
            </Text>
            <Text color="rgba(255, 255, 255, 0.6)" fontSize={12.5} style={{ fontFamily: Fonts.regular }} lineHeight={17}>
              Virtual portfolio & market simulator
            </Text>
          </YStack>
          <XStack style={styles.statusBadge} alignItems="center" gap={6} flexShrink={0}>
            <View width={6} height={6} borderRadius={3} backgroundColor="#10B981" />
            <Text style={styles.statusText} textTransform="uppercase">
              Sim Active
            </Text>
          </XStack>
        </View>

        {/* ==================== SEGMENTED TOP SWITCHER (SINGLE CAPSULE TRACK - MATCHING BUDGET.TSX) ==================== */}
        <View style={styles.capsuleTrackWrapper}>
          <AnimatedSegmentSwitch<'portfolio' | 'compound' | 'cash'>
            options={[
              { id: 'portfolio', label: 'Portfolio' },
              { id: 'compound', label: 'Time Machine' },
              { id: 'cash', label: 'Sandbox Cash' },
            ]}
            activeId={activeTab}
            onChange={(tab) => setActiveTab(tab)}
            height={40}
            forceDark={true}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Real-Time Market Indices Moving Ribbon (Continuous Sideward Stream + Animated Live Feed Icon) */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 14,
              height: 36,
              overflow: 'hidden',
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* Docked Animated LIVE FEED Pill (With Real-time Equalizer & Radar Ripple) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                paddingHorizontal: 10,
                height: '100%',
                backgroundColor: '#0B132B',
                borderRightWidth: 1,
                borderRightColor: 'rgba(255, 255, 255, 0.08)',
                zIndex: 2,
              }}
            >
              {/* Real-time Frequency Equalizer Bars (Live streaming soundwave) */}
              <XStack alignItems="center" gap={2} height={14}>
                <Animated.View
                  style={{
                    width: 2.5,
                    height: 12,
                    borderRadius: 1.5,
                    backgroundColor: '#10B981',
                    transform: [{ scaleY: eqBar1 }],
                  }}
                />
                <Animated.View
                  style={{
                    width: 2.5,
                    height: 12,
                    borderRadius: 1.5,
                    backgroundColor: '#10B981',
                    transform: [{ scaleY: eqBar2 }],
                  }}
                />
                <Animated.View
                  style={{
                    width: 2.5,
                    height: 12,
                    borderRadius: 1.5,
                    backgroundColor: '#10B981',
                    transform: [{ scaleY: eqBar3 }],
                  }}
                />
                <Animated.View
                  style={{
                    width: 2.5,
                    height: 12,
                    borderRadius: 1.5,
                    backgroundColor: '#10B981',
                    transform: [{ scaleY: eqBar4 }],
                  }}
                />
              </XStack>

              {/* Live Signal Beacon Dot with Outward Radar Ripple */}
              <View width={10} height={10} alignItems="center" justifyContent="center">
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: 'rgba(16, 185, 129, 0.45)',
                    transform: [{ scale: rippleScale }],
                    opacity: rippleOpacity,
                  }}
                />
                <View width={5} height={5} borderRadius={2.5} backgroundColor="#10B981" />
              </View>

              <Text color="#FFFFFF" fontSize={10.5} style={{ fontFamily: Fonts.bold }} letterSpacing={0.5}>
                LIVE FEED
              </Text>
            </View>

            {/* Continuous Sideward Moving Ticker Stream */}
            <View style={{ flex: 1, overflow: 'hidden' }}>
              <Animated.View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  transform: [{ translateX: tickerTranslateX }],
                }}
              >
                {/* First set of benchmark items (measured for seamless loop width) */}
                <View
                  onLayout={(e) => {
                    const w = e.nativeEvent.layout.width;
                    if (w > 0 && Math.abs(w - tickerTrackWidth) > 1) {
                      setTickerTrackWidth(w);
                    }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 }}
                >
                  {MARKET_BENCHMARKS.map((item, idx) => (
                    <View key={`b1-${idx}`} style={styles.indexPill}>
                      <XStack alignItems="center" gap={5}>
                        <Text color="#FFFFFF" fontSize={11} style={{ fontFamily: Fonts.bold }}>{item.name}</Text>
                        <Text color="rgba(255, 255, 255, 0.7)" fontSize={11} style={{ fontFamily: Fonts.medium }}>{item.val}</Text>
                        <Text color={item.up ? '#10B981' : '#EF4444'} fontSize={10.5} style={{ fontFamily: Fonts.bold }}>{item.chg}</Text>
                      </XStack>
                    </View>
                  ))}
                </View>

                {/* Second duplicated set for seamless infinite sideways loop */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 }}>
                  {MARKET_BENCHMARKS.map((item, idx) => (
                    <View key={`b2-${idx}`} style={styles.indexPill}>
                      <XStack alignItems="center" gap={5}>
                        <Text color="#FFFFFF" fontSize={11} style={{ fontFamily: Fonts.bold }}>{item.name}</Text>
                        <Text color="rgba(255, 255, 255, 0.7)" fontSize={11} style={{ fontFamily: Fonts.medium }}>{item.val}</Text>
                        <Text color={item.up ? '#10B981' : '#EF4444'} fontSize={10.5} style={{ fontFamily: Fonts.bold }}>{item.chg}</Text>
                      </XStack>
                    </View>
                  ))}
                </View>
              </Animated.View>
            </View>
          </View>

          {/* TAB 1: PORTFOLIO & MARKET WATCHLIST */}
          {activeTab === 'portfolio' && (
            <>
              {/* Unified Hero: Net Portfolio Balance & Real Scaled Performance */}
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
                {/* Header Row: Label + Risk Archetype Chip */}
                <XStack justifyContent="space-between" alignItems="center" width="100%">
                  <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.bold }} letterSpacing={0.8} textTransform="uppercase">
                    Net Portfolio Value
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      safeHaptic('light');
                      setShowRiskModal(true);
                    }}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: store.riskProfile
                        ? store.riskProfile === 'Conservative'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : store.riskProfile === 'Moderate'
                          ? 'rgba(245, 158, 11, 0.12)'
                          : 'rgba(239, 68, 68, 0.12)'
                        : 'rgba(16, 185, 129, 0.15)',
                      paddingHorizontal: 8,
                      paddingVertical: 3.5,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: store.riskProfile
                        ? store.riskProfile === 'Conservative'
                          ? 'rgba(16, 185, 129, 0.25)'
                          : store.riskProfile === 'Moderate'
                          ? 'rgba(245, 158, 11, 0.25)'
                          : 'rgba(239, 68, 68, 0.25)'
                        : 'rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <PhosphorIcon
                      name={store.riskProfile ? 'ShieldCheck' : 'Sparkle'}
                      size={12}
                      color={
                        store.riskProfile === 'Conservative'
                          ? '#10B981'
                          : store.riskProfile === 'Moderate'
                          ? '#F59E0B'
                          : store.riskProfile === 'Aggressive'
                          ? '#EF4444'
                          : '#10B981'
                      }
                    />
                    <Text
                      color={
                        store.riskProfile === 'Conservative'
                          ? '#10B981'
                          : store.riskProfile === 'Moderate'
                          ? '#F59E0B'
                          : store.riskProfile === 'Aggressive'
                          ? '#EF4444'
                          : '#10B981'
                      }
                      fontSize={11}
                      style={{ fontFamily: Fonts.semiBold }}
                    >
                      {store.riskProfile ? `${store.riskProfile} Profile` : 'Set Risk Target (+25 XP)'}
                    </Text>
                  </TouchableOpacity>
                </XStack>

                {/* Hero Balance & Dynamic Interactive Scrubbed Metric */}
                <YStack alignItems="flex-start" gap={2}>
                  <XStack alignItems="baseline" gap={4}>
                    <Text color={chartAccentColor} fontSize={22} style={{ fontFamily: Fonts.bold }}>{currencySymbol}</Text>
                    <Text color="#FFFFFF" fontSize={32} style={{ fontFamily: Fonts.bold }} letterSpacing={-0.5} lineHeight={38}>
                      {displayVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    {isDemoPortfolio && (
                      <View
                        backgroundColor="rgba(245, 158, 11, 0.15)"
                        borderColor="rgba(245, 158, 11, 0.3)"
                        borderWidth={1}
                        borderRadius={6}
                        paddingHorizontal={6}
                        paddingVertical={2}
                        marginLeft={6}
                      >
                        <Text color="#F59E0B" fontSize={10} style={{ fontFamily: Fonts.bold }}>
                          DEMO MODEL
                        </Text>
                      </View>
                    )}
                  </XStack>

                  <XStack alignItems="center" gap={6} marginTop={2} flexWrap="wrap">
                    <View 
                      backgroundColor={isDeltaPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'} 
                      paddingHorizontal={7} 
                      paddingVertical={2.5} 
                      borderRadius={6}
                      flexDirection="row"
                      alignItems="center"
                      gap={4}
                    >
                      <PhosphorIcon
                        name={isDeltaPositive ? 'TrendUp' : 'TrendDown'}
                        size={12}
                        color={chartAccentColor}
                      />
                      <Text 
                        color={chartAccentColor} 
                        fontSize={11} 
                        style={{ fontFamily: Fonts.bold }}
                      >
                        {isDeltaPositive ? '+' : ''}{currencySymbol}{Math.abs(displayDelta).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isDeltaPositive ? '+' : ''}{displayDeltaPct.toFixed(2)}%)
                      </Text>
                    </View>

                    {activePoint ? (
                      <View 
                        backgroundColor="rgba(62, 180, 125, 0.15)"
                        borderColor="rgba(62, 180, 125, 0.3)"
                        borderWidth={1}
                        borderRadius={6}
                        paddingHorizontal={6}
                        paddingVertical={2}
                        flexDirection="row"
                        alignItems="center"
                        gap={4}
                      >
                        <PhosphorIcon name="Clock" size={11} color="#6EE7B7" />
                        <Text color="#6EE7B7" fontSize={11} style={{ fontFamily: Fonts.semiBold }}>
                          {activePoint.timestamp}
                        </Text>
                      </View>
                    ) : (
                      <Text color="rgba(255, 255, 255, 0.45)" fontSize={11} style={{ fontFamily: Fonts.regular }}>
                        {timeRange === '1D' ? 'Today' : timeRange === '1W' ? 'Past 5 Days' : timeRange === '1M' ? 'Past 30 Days' : timeRange === '1Y' ? 'Past Year' : 'All-Time'}
                      </Text>
                    )}

                    {activePoint && (
                      <Text color="rgba(255, 255, 255, 0.35)" fontSize={10} style={{ fontFamily: Fonts.regular }}>
                        • Release to reset
                      </Text>
                    )}
                  </XStack>
                </YStack>

                {/* Segmented Time Control (Timeline Filters) */}
                <XStack 
                  backgroundColor="rgba(255, 255, 255, 0.04)" 
                  borderRadius={8} 
                  padding={3} 
                  gap={3} 
                  borderWidth={1} 
                  borderColor="rgba(255, 255, 255, 0.08)"
                  alignItems="center"
                  justifyContent="space-between"
                  marginTop={4}
                >
                  {(['1D', '1W', '1M', '1Y', 'ALL'] as const).map((range) => {
                    const isSelected = timeRange === range;
                    return (
                      <TouchableOpacity
                        key={range}
                        onPress={() => {
                          safeHaptic('light');
                          setTimeRange(range);
                        }}
                        activeOpacity={0.8}
                        style={{
                          flex: 1,
                          height: 28,
                          borderRadius: 6,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: isSelected ? '#10B981' : 'transparent',
                        }}
                      >
                        <Text
                          color={isSelected ? '#FFFFFF' : '#8D99AE'}
                          fontSize={11}
                          style={{ fontFamily: isSelected ? Fonts.bold : Fonts.semiBold }}
                          textAlign="center"
                        >
                          {range}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </XStack>

                {/* High-Fidelity Interactive Performance Chart */}
                {(() => {
                  const cHeight = 160;
                  const cWidth = chartWidth || 300;
                  const paddingY = 18;
                  const usableHeight = cHeight - paddingY * 2;
                  const valRange = periodHigh === periodLow ? 1 : periodHigh - periodLow;

                  const cPoints = portfolioChartSeries.map((pt, idx) => {
                    const x = (idx / (portfolioChartSeries.length - 1)) * cWidth;
                    const y = cHeight - paddingY - ((pt.value - periodLow) / valRange) * usableHeight;
                    return { ...pt, x, y };
                  });

                  const highY = cHeight - paddingY - ((periodHigh - periodLow) / valRange) * usableHeight;
                  const lowY = cHeight - paddingY - ((periodLow - periodLow) / valRange) * usableHeight;
                  const { linePath, areaPath } = generateBezierPaths(cPoints, cHeight);
                  const lastPoint = cPoints[cPoints.length - 1];

                  return (
                    <YStack width="100%" gap={6} marginTop={6}>
                      {/* Chart Canvas with Pan / Touch Responder */}
                      <View 
                        height={cHeight} 
                        width="100%" 
                        position="relative" 
                        onLayout={(e) => {
                          const width = e.nativeEvent.layout.width;
                          if (width > 0) setChartWidth(width);
                        }}
                        onStartShouldSetResponder={() => true}
                        onMoveShouldSetResponder={() => true}
                        onResponderGrant={handleScrubMove}
                        onResponderMove={handleScrubMove}
                        onResponderRelease={handleScrubEnd}
                        onResponderTerminate={handleScrubEnd}
                      >
                        <Svg width={cWidth} height={cHeight} style={StyleSheet.absoluteFill}>
                          <Defs>
                            <LinearGradient id="portfolioAreaGrad" x1="0" y1="0" x2="0" y2="1">
                              <Stop offset="0%" stopColor={chartAccentColor} stopOpacity={0.32} />
                              <Stop offset="65%" stopColor={chartAccentColor} stopOpacity={0.08} />
                              <Stop offset="100%" stopColor={chartAccentColor} stopOpacity={0.0} />
                            </LinearGradient>
                          </Defs>

                          {/* Subtle Vertical Time Dividers */}
                          {[0.25, 0.5, 0.75].map((pct, i) => (
                            <Line
                              key={`grid-vert-${i}`}
                              x1={cWidth * pct}
                              y1={8}
                              x2={cWidth * pct}
                              y2={cHeight - 8}
                              stroke="rgba(255, 255, 255, 0.04)"
                              strokeWidth={1}
                              strokeDasharray="4 4"
                            />
                          ))}

                          {/* High Watermark Horizontal Dashed Line */}
                          <Line
                            x1={0}
                            y1={highY}
                            x2={cWidth}
                            y2={highY}
                            stroke={chartAccentColor}
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            opacity={0.35}
                          />

                          {/* Low Watermark Horizontal Dashed Line */}
                          <Line
                            x1={0}
                            y1={lowY}
                            x2={cWidth}
                            y2={lowY}
                            stroke="rgba(255, 255, 255, 0.15)"
                            strokeWidth={1}
                            strokeDasharray="3 3"
                          />

                          {/* Area Fill Gradient */}
                          {areaPath ? (
                            <Path d={areaPath} fill="url(#portfolioAreaGrad)" />
                          ) : null}

                          {/* Glowing Neon Line Stroke */}
                          {linePath ? (
                            <Path
                              d={linePath}
                              fill="none"
                              stroke={chartAccentColor}
                              strokeWidth={2.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ) : null}

                          {/* Active Scrubbing Vertical Cursor & Indicator Point */}
                          {activePoint && scrubbedIndex !== null && cPoints[scrubbedIndex] ? (
                            <>
                              <Line
                                x1={cPoints[scrubbedIndex].x}
                                y1={4}
                                x2={cPoints[scrubbedIndex].x}
                                y2={cHeight - 4}
                                stroke="#FFFFFF"
                                strokeWidth={1.5}
                                strokeDasharray="4 3"
                                opacity={0.65}
                              />
                              <Circle
                                cx={cPoints[scrubbedIndex].x}
                                cy={cPoints[scrubbedIndex].y}
                                r={8}
                                fill={chartAccentColor === '#10B981' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}
                              />
                              <Circle
                                cx={cPoints[scrubbedIndex].x}
                                cy={cPoints[scrubbedIndex].y}
                                r={4}
                                fill={chartAccentColor}
                                stroke="#FFFFFF"
                                strokeWidth={2}
                              />
                            </>
                          ) : null}

                          {/* Terminal Live Pulsing Radar Point (when not scrubbing) */}
                          {!activePoint && lastPoint ? (
                            <>
                              <Circle
                                cx={lastPoint.x}
                                cy={lastPoint.y}
                                r={6}
                                fill={chartAccentColor === '#10B981' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}
                              />
                              <Circle
                                cx={lastPoint.x}
                                cy={lastPoint.y}
                                r={3.5}
                                fill={chartAccentColor}
                                stroke="#FFFFFF"
                                strokeWidth={1.5}
                              />
                            </>
                          ) : null}
                        </Svg>

                        {/* Animated Radar Pulse Ring over Terminal Point (UI Thread 60fps) */}
                        {!activePoint && lastPoint ? (
                          <Animated.View
                            pointerEvents="none"
                            style={{
                              position: 'absolute',
                              left: lastPoint.x - 12,
                              top: lastPoint.y - 12,
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: chartAccentColor,
                              opacity: chartPulseAnim.interpolate({
                                inputRange: [0, 0.7, 1],
                                outputRange: [0.6, 0.15, 0],
                              }),
                              transform: [
                                {
                                  scale: chartPulseAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.6, 1.8],
                                  }),
                                },
                              ],
                            }}
                          />
                        ) : null}

                        {/* High Watermark Badge */}
                        <View
                          position="absolute"
                          top={Math.max(2, Math.min(cHeight - 28, highY - 10))}
                          right={4}
                          backgroundColor="rgba(16, 185, 129, 0.12)"
                          borderColor="rgba(16, 185, 129, 0.25)"
                          borderWidth={1}
                          borderRadius={4}
                          paddingHorizontal={6}
                          paddingVertical={1.5}
                          pointerEvents="none"
                        >
                          <Text color="#10B981" fontSize={9.5} style={{ fontFamily: Fonts.bold }}>
                            ▲ HIGH {currencySymbol}{periodHigh.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                        </View>

                        {/* Low Watermark Badge */}
                        <View
                          position="absolute"
                          top={Math.max(2, Math.min(cHeight - 28, lowY - 10))}
                          left={4}
                          backgroundColor="rgba(255, 255, 255, 0.06)"
                          borderColor="rgba(255, 255, 255, 0.1)"
                          borderWidth={1}
                          borderRadius={4}
                          paddingHorizontal={6}
                          paddingVertical={1.5}
                          pointerEvents="none"
                        >
                          <Text color="rgba(255, 255, 255, 0.55)" fontSize={9.5} style={{ fontFamily: Fonts.bold }}>
                            ▼ LOW {currencySymbol}{periodLow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                        </View>
                      </View>

                      {/* X-Axis Timeline Graduation Labels */}
                      <XStack justifyContent="space-between" width="100%" paddingHorizontal={4} marginTop={2}>
                        {timelineLabels.map((lbl, idx) => (
                          <Text
                            key={`time-lbl-${idx}`}
                            color="rgba(255, 255, 255, 0.4)"
                            fontSize={10}
                            style={{ fontFamily: Fonts.medium }}
                          >
                            {lbl}
                          </Text>
                        ))}
                      </XStack>

                      {/* Key Institutional Portfolio Metrics Strip */}
                      <XStack 
                        marginTop={8} 
                        paddingTop={10} 
                        borderTopWidth={1} 
                        borderColor="rgba(255, 255, 255, 0.07)" 
                        justifyContent="space-between" 
                        alignItems="center"
                        gap={6}
                      >
                        {/* Stat 1: Period High/Low Spread */}
                        <YStack flex={1} alignItems="flex-start" gap={1}>
                          <Text color="rgba(255, 255, 255, 0.45)" fontSize={10} style={{ fontFamily: Fonts.medium }}>
                            Period High / Low
                          </Text>
                          <Text color="#FFFFFF" fontSize={11} style={{ fontFamily: Fonts.bold }} numberOfLines={1}>
                            {currencySymbol}{periodHigh.toLocaleString(undefined, { maximumFractionDigits: 0 })} / {currencySymbol}{periodLow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </Text>
                        </YStack>

                        {/* Divider */}
                        <View width={1} height={22} backgroundColor="rgba(255, 255, 255, 0.08)" />

                        {/* Stat 2: Spread Volatility */}
                        <YStack flex={1} alignItems="center" gap={1}>
                          <Text color="rgba(255, 255, 255, 0.45)" fontSize={10} style={{ fontFamily: Fonts.medium }}>
                            Spread Range
                          </Text>
                          <Text color="#6EE7B7" fontSize={11} style={{ fontFamily: Fonts.bold }} numberOfLines={1}>
                            {currencySymbol}{periodSpread.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                        </YStack>

                        {/* Divider */}
                        <View width={1} height={22} backgroundColor="rgba(255, 255, 255, 0.08)" />

                        {/* Stat 3: Capital Allocation */}
                        <YStack flex={1} alignItems="flex-end" gap={1}>
                          <Text color="rgba(255, 255, 255, 0.45)" fontSize={10} style={{ fontFamily: Fonts.medium }}>
                            Capital Split
                          </Text>
                          <Text color="#FFFFFF" fontSize={11} style={{ fontFamily: Fonts.bold }} numberOfLines={1}>
                            {equitiesRatio}% Eq • {cashRatio}% Cash
                          </Text>
                        </YStack>
                      </XStack>

                      {/* Demo Mode Advisory Notice (only when virtual balance is zero) */}
                      {isDemoPortfolio && (
                        <View
                          backgroundColor="rgba(245, 158, 11, 0.08)"
                          borderColor="rgba(245, 158, 11, 0.2)"
                          borderWidth={1}
                          borderRadius={8}
                          padding={8}
                          marginTop={4}
                          flexDirection="row"
                          alignItems="center"
                          gap={8}
                        >
                          <PhosphorIcon name="Info" size={15} color="#F59E0B" />
                          <Text color="rgba(255, 255, 255, 0.75)" fontSize={11} style={{ fontFamily: Fonts.medium }} flex={1} lineHeight={15}>
                            Simulated {currencySymbol}10,000 model trajectory. Deposit sandbox cash below to trade and track live portfolio returns!
                          </Text>
                        </View>
                      )}
                    </YStack>
                  );
                })()}


                {/* Quick Brokerage Action Buttons */}
                <XStack gap={10} width="100%" marginTop={4}>
                  <TouchableOpacity
                    onPress={() => {
                      safeHaptic('light');
                      setActiveTab('cash');
                    }}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: '#10B981',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <PhosphorIcon name="PlusCircle" size={15} color="#FFFFFF" weight="bold" />
                    <Text color="#FFFFFF" fontSize={12} style={{ fontFamily: Fonts.bold }}>
                      Deposit Cash
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      safeHaptic('light');
                      setActiveTab('compound');
                    }}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <PhosphorIcon name="Hourglass" size={15} color="#6EE7B7" weight="bold" />
                    <Text color="#FFFFFF" fontSize={12} style={{ fontFamily: Fonts.bold }}>
                      Time Machine
                    </Text>
                  </TouchableOpacity>
                </XStack>

                {/* Asset Allocation Metrics Split */}
                <XStack justifyContent="space-between" paddingTop={14} borderTopWidth={1} borderTopColor="rgba(255, 255, 255, 0.06)">
                  <YStack gap={2}>
                    <Text color="#8D99AE" fontSize={12} style={{ fontFamily: Fonts.medium }} lineHeight={16}>
                      Invested Assets
                    </Text>
                    <Text color="#FFFFFF" fontSize={15} style={{ fontFamily: Fonts.bold }} lineHeight={20}>
                      {currencySymbol}{holdingsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                  </YStack>
                  <YStack alignItems="flex-end" gap={2}>
                    <Text color="#8D99AE" fontSize={12} style={{ fontFamily: Fonts.medium }} lineHeight={16}>
                      Sandbox Cash
                    </Text>
                    <Text color="#3EB47D" fontSize={15} style={{ fontFamily: Fonts.bold }} lineHeight={20}>
                      {currencySymbol}{store.virtualBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                  </YStack>
                </XStack>

                {/* Asset Allocation Breakdown Bar */}
                <YStack gap={8} marginTop={2}>
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.bold }} letterSpacing={0.8} textTransform="uppercase">
                      Asset Allocation
                    </Text>
                    <XStack gap={10}>
                      <XStack gap={4} alignItems="center">
                        <View width={6} height={6} borderRadius={3} backgroundColor="#3EB47D" />
                        <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.medium }}>
                          Stocks ({totalPortfolioValue > 0 ? Math.round((holdingsValue / totalPortfolioValue) * 100) : 0}%)
                        </Text>
                      </XStack>
                      <XStack gap={4} alignItems="center">
                        <View width={6} height={6} borderRadius={3} backgroundColor="#10B981" />
                        <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.medium }}>
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

              {/* ==================== DEMO INVESTMENT COMPANIES (WITH GRID FILTER & SEARCH) ==================== */}
              <YStack gap={12} marginBottom={24}>
                {/* Header Row: Title & Active Filters Reset */}
                <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={2}>
                  <YStack gap={1}>
                    <Text color="#FFFFFF" fontSize={16} style={{ fontFamily: Fonts.bold }} letterSpacing={-0.3}>
                      Demo Investment Companies
                    </Text>
                    <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.medium }}>
                      {filteredAssets.length} of {assets.length} companies available
                    </Text>
                  </YStack>

                  {(assetFilter !== 'ALL' || sortBy !== 'default' || searchQuery.length > 0) && (
                    <TouchableOpacity
                      onPress={() => {
                        safeHaptic('light');
                        setSearchQuery('');
                        setAssetFilter('ALL');
                        setSortBy('default');
                        setShowFilterTray(false);
                      }}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        borderWidth: 1,
                        borderColor: 'rgba(239, 68, 68, 0.25)',
                      }}
                    >
                      <PhosphorIcon name="ArrowClockwise" size={11} color="#EF4444" />
                      <Text color="#EF4444" fontSize={10.5} style={{ fontFamily: Fonts.bold }}>Reset</Text>
                    </TouchableOpacity>
                  )}
                </XStack>

                {/* Unified Pro Fintech Action Bar: Expanded Search + Combined Filter & Grid View Toggle */}
                <XStack gap={8} alignItems="center">
                  {/* Expanded Live Search Input (Fills Available Width) */}
                  <XStack
                    flex={1}
                    backgroundColor="#1C2541"
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="rgba(255, 255, 255, 0.08)"
                    paddingHorizontal={12}
                    height={40}
                    alignItems="center"
                    gap={8}
                  >
                    <PhosphorIcon name="MagnifyingGlass" size={16} color="#8D99AE" />
                    <TextInput
                      placeholder="Search companies, tickers..."
                      placeholderTextColor="#64748B"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      style={{ flex: 1, color: '#FFFFFF', fontSize: 13, fontFamily: Fonts.regular, padding: 0 }}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <PhosphorIcon name="XCircle" size={16} color="#8D99AE" />
                      </TouchableOpacity>
                    )}
                  </XStack>

                  {/* 2 Clean Frameless Icons with Reduced Side Gap */}
                  <XStack gap={2} alignItems="center">
                    {/* Combined Filter Icon (Toggles Risk & Sort Tray) */}
                    <TouchableOpacity
                      onPress={() => {
                        safeHaptic('light');
                        setShowFilterTray((prev) => !prev);
                      }}
                      activeOpacity={0.6}
                      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                      style={{
                        width: 34,
                        height: 36,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PhosphorIcon
                        name="FunnelSimple"
                        size={20}
                        color={showFilterTray || assetFilter !== 'ALL' || sortBy !== 'default' ? '#10B981' : '#8D99AE'}
                        weight={showFilterTray || assetFilter !== 'ALL' || sortBy !== 'default' ? 'bold' : 'regular'}
                      />
                    </TouchableOpacity>

                    {/* Single Dynamic Grid/List View Mode Icon */}
                    <TouchableOpacity
                      onPress={() => {
                        safeHaptic('light');
                        setViewMode(viewMode === 'grid' ? 'list' : 'grid');
                      }}
                      activeOpacity={0.6}
                      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                      style={{
                        width: 34,
                        height: 36,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PhosphorIcon
                        name={viewMode === 'grid' ? 'List' : 'SquaresFour'}
                        size={20}
                        color={viewMode === 'grid' ? '#10B981' : '#8D99AE'}
                        weight="bold"
                      />
                    </TouchableOpacity>
                  </XStack>
                </XStack>

                {/* Combined Filter & Sort Tray */}
                {showFilterTray && (
                  <YStack backgroundColor="#1C2541" padding={14} borderRadius={14} borderWidth={1} borderColor="rgba(16, 185, 129, 0.25)" gap={12}>
                    <XStack justifyContent="space-between" alignItems="center">
                      <XStack gap={6} alignItems="center">
                        <PhosphorIcon name="FunnelSimple" size={14} color="#10B981" weight="bold" />
                        <Text color="#FFFFFF" fontSize={13} style={{ fontFamily: Fonts.bold }}>
                          Filter & Sort Watchlist
                        </Text>
                      </XStack>
                      {(assetFilter !== 'ALL' || sortBy !== 'default') && (
                        <TouchableOpacity
                          onPress={() => {
                            safeHaptic('light');
                            setAssetFilter('ALL');
                            setSortBy('default');
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text color="#10B981" fontSize={11.5} style={{ fontFamily: Fonts.semiBold }}>Reset All</Text>
                        </TouchableOpacity>
                      )}
                    </XStack>

                    {/* Risk Profile Section */}
                    <YStack gap={6}>
                      <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.semiBold }}>
                        Risk Profile
                      </Text>
                      <XStack gap={6} flexWrap="wrap">
                        {(['ALL', 'Conservative', 'Moderate', 'Aggressive'] as const).map((risk) => {
                          const isSel = assetFilter === risk;
                          return (
                            <TouchableOpacity
                              key={risk}
                              onPress={() => {
                                safeHaptic('light');
                                setAssetFilter(risk);
                              }}
                              activeOpacity={0.75}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 10,
                                backgroundColor: isSel ? '#10B981' : 'rgba(255, 255, 255, 0.05)',
                                borderWidth: 1,
                                borderColor: isSel ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                              }}
                            >
                              <Text
                                color={isSel ? '#FFFFFF' : '#8D99AE'}
                                fontSize={11.5}
                                style={{ fontFamily: isSel ? Fonts.bold : Fonts.medium }}
                              >
                                {risk === 'ALL' ? 'All Risks' : risk}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </XStack>
                    </YStack>

                    {/* Sort Order Section */}
                    <YStack gap={6}>
                      <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.semiBold }}>
                        Sort Order
                      </Text>
                      <XStack gap={6} flexWrap="wrap">
                        {[
                          { id: 'default', label: 'Default' },
                          { id: 'gainers', label: '🔥 Top Gainers' },
                          { id: 'losers', label: '📉 Top Losers' },
                          { id: 'price_high', label: 'Price: High → Low' },
                          { id: 'price_low', label: 'Price: Low → High' },
                        ].map((s) => {
                          const isSel = sortBy === s.id;
                          return (
                            <TouchableOpacity
                              key={s.id}
                              onPress={() => {
                                safeHaptic('light');
                                setSortBy(s.id as any);
                              }}
                              activeOpacity={0.75}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 10,
                                backgroundColor: isSel ? '#10B981' : 'rgba(255, 255, 255, 0.05)',
                                borderWidth: 1,
                                borderColor: isSel ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                              }}
                            >
                              <Text
                                color={isSel ? '#FFFFFF' : '#8D99AE'}
                                fontSize={11.5}
                                style={{ fontFamily: isSel ? Fonts.bold : Fonts.medium }}
                              >
                                {s.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </XStack>
                    </YStack>
                  </YStack>
                )}

                {/* Active Filter Badges (only when tray is closed and filters are applied) */}
                {!showFilterTray && (assetFilter !== 'ALL' || sortBy !== 'default') && (
                  <XStack gap={6} alignItems="center" flexWrap="wrap">
                    {assetFilter !== 'ALL' && (
                      <TouchableOpacity
                        onPress={() => {
                          safeHaptic('light');
                          setAssetFilter('ALL');
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 9,
                          paddingVertical: 4,
                          borderRadius: 8,
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          borderWidth: 1,
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        <Text color="#10B981" fontSize={11} style={{ fontFamily: Fonts.semiBold }}>
                          Risk: {assetFilter}
                        </Text>
                        <PhosphorIcon name="X" size={10} color="#10B981" />
                      </TouchableOpacity>
                    )}
                    {sortBy !== 'default' && (
                      <TouchableOpacity
                        onPress={() => {
                          safeHaptic('light');
                          setSortBy('default');
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 9,
                          paddingVertical: 4,
                          borderRadius: 8,
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          borderWidth: 1,
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        <Text color="#10B981" fontSize={11} style={{ fontFamily: Fonts.semiBold }}>
                          Sort: {sortBy === 'gainers' ? 'Gainers' : sortBy === 'losers' ? 'Losers' : sortBy === 'price_high' ? 'High→Low' : 'Low→High'}
                        </Text>
                        <PhosphorIcon name="X" size={10} color="#10B981" />
                      </TouchableOpacity>
                    )}
                  </XStack>
                )}

                {/* View Mode: 2-Column Side-by-Side Grid vs List View */}
                {viewMode === 'grid' ? (
                  <YStack gap={10}>
                    {Array.from({ length: Math.ceil(filteredAssets.length / 2) }).map((_, rowIndex) => {
                      const first = filteredAssets[rowIndex * 2];
                      const second = filteredAssets[rowIndex * 2 + 1];

                      const renderCard = (asset: Asset) => {
                        const changeIsPositive = asset.change >= 0;
                        const ownedUnits = getAssetOwnedUnits(asset.ticker);
                        const assetTotalValue = ownedUnits * asset.price;

                        return (
                          <TouchableOpacity
                            key={asset.ticker}
                            onPress={() => navigateToDetails(asset.ticker)}
                            activeOpacity={0.8}
                            style={{
                              flex: 1,
                              backgroundColor: '#1C2541',
                              borderRadius: 14,
                              padding: 12,
                              borderWidth: 1,
                              borderColor: 'rgba(255, 255, 255, 0.08)',
                              gap: 10,
                              justifyContent: 'space-between',
                            }}
                          >
                            {/* Grid Item Header */}
                            <XStack justifyContent="space-between" alignItems="center">
                              <View
                                width={34}
                                height={34}
                                borderRadius={8}
                                backgroundColor="rgba(255, 255, 255, 0.04)"
                                alignItems="center"
                                justifyContent="center"
                                borderWidth={1}
                                borderColor="rgba(255, 255, 255, 0.08)"
                              >
                                <PhosphorIcon
                                  name={asset.icon}
                                  size={17}
                                  color={asset.color}
                                  weight="duotone"
                                />
                              </View>

                              <View
                                backgroundColor={
                                  asset.riskProfile === 'Conservative'
                                    ? 'rgba(16, 185, 129, 0.12)'
                                    : asset.riskProfile === 'Moderate'
                                    ? 'rgba(245, 158, 11, 0.12)'
                                    : 'rgba(239, 68, 68, 0.12)'
                                }
                                paddingHorizontal={5}
                                paddingVertical={1.5}
                                borderRadius={4}
                                borderWidth={1}
                                borderColor={
                                  asset.riskProfile === 'Conservative'
                                    ? 'rgba(16, 185, 129, 0.25)'
                                    : asset.riskProfile === 'Moderate'
                                    ? 'rgba(245, 158, 11, 0.25)'
                                    : 'rgba(239, 68, 68, 0.25)'
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
                                  fontSize={9}
                                  style={{ fontFamily: Fonts.semiBold }}
                                >
                                  {asset.riskProfile}
                                </Text>
                              </View>
                            </XStack>

                            {/* Grid Ticker & Name */}
                            <YStack gap={1}>
                              <Text color="#FFFFFF" fontSize={15} style={{ fontFamily: Fonts.bold }}>
                                {asset.ticker}
                              </Text>
                              <Text color="#8D99AE" fontSize={11} numberOfLines={1} style={{ fontFamily: Fonts.regular }}>
                                {asset.name}
                              </Text>
                              <Text color="rgba(255, 255, 255, 0.4)" fontSize={9.5} numberOfLines={1} style={{ fontFamily: Fonts.medium }}>
                                {asset.partner}
                              </Text>
                            </YStack>

                            {/* Price & Change */}
                            <YStack gap={3}>
                              <Text color="#FFFFFF" fontSize={15} style={{ fontFamily: Fonts.bold }}>
                                {currencySymbol}{asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </Text>
                              <View 
                                backgroundColor={changeIsPositive ? 'rgba(5, 150, 105, 0.15)' : 'rgba(239, 68, 68, 0.12)'} 
                                paddingHorizontal={6} 
                                paddingVertical={2} 
                                borderRadius={4}
                                alignSelf="flex-start"
                              >
                                <Text color={changeIsPositive ? '#059669' : '#EF4444'} fontSize={10.5} style={{ fontFamily: Fonts.bold }}>
                                  {changeIsPositive ? '+' : ''}{asset.change.toFixed(2)}%
                                </Text>
                              </View>
                            </YStack>

                            {/* Owned Units Badge */}
                            {ownedUnits > 0 && (
                              <View backgroundColor="rgba(5, 150, 105, 0.15)" padding={6} borderRadius={6} borderWidth={1} borderColor="rgba(5, 150, 105, 0.25)">
                                <Text color="#10B981" fontSize={10} style={{ fontFamily: Fonts.bold }}>
                                  Own: {ownedUnits} shares ({currencySymbol}{Math.round(assetTotalValue).toLocaleString()})
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      };

                      return (
                        <XStack key={rowIndex} gap={10}>
                          {/* Column 1 */}
                          <View flex={1}>
                            {renderCard(first)}
                          </View>

                          {/* Column 2 (or empty flex placeholder if odd count) */}
                          <View flex={1}>
                            {second ? renderCard(second) : null}
                          </View>
                        </XStack>
                      );
                    })}
                  </YStack>
                ) : (
                  /* List View */
                  <CbudgetCard 
                    padding={0} 
                    borderRadius={16}
                    backgroundColor="#1C2541"
                    borderColor="rgba(255, 255, 255, 0.08)"
                    borderWidth={1}
                    elevation={0}
                    style={{ overflow: 'hidden' }}
                  >
                    {filteredAssets.map((asset, index) => {
                      const changeIsPositive = asset.change >= 0;
                      const ownedUnits = getAssetOwnedUnits(asset.ticker);
                      const assetTotalValue = ownedUnits * asset.price;
                      const isLast = index === filteredAssets.length - 1;

                      return (
                        <View key={asset.ticker}>
                          <TouchableOpacity
                            onPress={() => navigateToDetails(asset.ticker)}
                            activeOpacity={0.7}
                            style={{ padding: 14 }}
                          >
                            <XStack justifyContent="space-between" alignItems="center">
                              <XStack gap={10} alignItems="center" flex={1} marginRight={10}>
                                <View
                                  width={38}
                                  height={38}
                                  borderRadius={10}
                                  backgroundColor="rgba(255, 255, 255, 0.04)"
                                  alignItems="center"
                                  justifyContent="center"
                                  borderWidth={1}
                                  borderColor="rgba(255, 255, 255, 0.08)"
                                  flexShrink={0}
                                >
                                  <PhosphorIcon
                                    name={asset.icon}
                                    size={18}
                                    color={asset.color}
                                    weight="duotone"
                                  />
                                </View>

                                <YStack gap={2} flex={1}>
                                  <XStack gap={6} alignItems="center">
                                    <Text color="#FFFFFF" fontSize={15} style={{ fontFamily: Fonts.bold }}>
                                      {asset.ticker}
                                    </Text>
                                    <View
                                      backgroundColor={
                                        asset.riskProfile === 'Conservative'
                                          ? 'rgba(16, 185, 129, 0.12)'
                                          : asset.riskProfile === 'Moderate'
                                          ? 'rgba(245, 158, 11, 0.12)'
                                          : 'rgba(239, 68, 68, 0.12)'
                                      }
                                      paddingHorizontal={6}
                                      paddingVertical={1.5}
                                      borderRadius={4}
                                    >
                                      <Text
                                        color={
                                          asset.riskProfile === 'Conservative'
                                            ? '#10B981'
                                            : asset.riskProfile === 'Moderate'
                                            ? '#F59E0B'
                                            : '#EF4444'
                                        }
                                        fontSize={10}
                                        style={{ fontFamily: Fonts.semiBold }}
                                      >
                                        {asset.riskProfile}
                                      </Text>
                                    </View>
                                  </XStack>
                                  <Text color="#8D99AE" fontSize={12} numberOfLines={1} style={{ fontFamily: Fonts.regular }}>
                                    {asset.name} • {asset.partner}
                                  </Text>
                                </YStack>
                              </XStack>

                              <YStack alignItems="flex-end" gap={2} minWidth={75}>
                                <Text color="#FFFFFF" fontSize={15} style={{ fontFamily: Fonts.bold }}>
                                  {currencySymbol}{asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </Text>
                                <View backgroundColor={changeIsPositive ? 'rgba(5, 150, 105, 0.15)' : 'rgba(239, 68, 68, 0.12)'} paddingHorizontal={7} paddingVertical={2} borderRadius={4}>
                                  <Text color={changeIsPositive ? '#059669' : '#EF4444'} fontSize={10.5} style={{ fontFamily: Fonts.bold }}>
                                    {changeIsPositive ? '+' : ''}{asset.change.toFixed(2)}%
                                  </Text>
                                </View>
                              </YStack>
                            </XStack>

                            {ownedUnits > 0 && (
                              <View marginTop={8} backgroundColor="rgba(5, 150, 105, 0.1)" padding={8} borderRadius={6} borderWidth={1} borderColor="rgba(5, 150, 105, 0.25)">
                                <Text color="#F8FAFC" fontSize={11} style={{ fontFamily: Fonts.medium }}>
                                  You own: <Text color="#059669" style={{ fontFamily: Fonts.bold }}>{ownedUnits} units ({currencySymbol}{assetTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</Text>
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                          {!isLast && <View height={1} backgroundColor="rgba(255, 255, 255, 0.05)" marginHorizontal={14} />}
                        </View>
                      );
                    })}
                  </CbudgetCard>
                )}

                {filteredAssets.length === 0 && (
                  <View backgroundColor="#1C2541" padding={24} borderRadius={14} alignItems="center" gap={6}>
                    <Text color="#FFFFFF" fontSize={14} style={{ fontFamily: Fonts.bold }}>No Assets Match Filters</Text>
                    <Text color="#8D99AE" fontSize={12} textAlign="center">
                      Try clearing your search query or adjusting your risk/sort filters.
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        safeHaptic('light');
                        setSearchQuery('');
                        setAssetFilter('ALL');
                        setSortBy('default');
                        setShowFilterTray(false);
                      }}
                      style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#10B981', borderRadius: 8 }}
                    >
                      <Text color="#FFFFFF" fontSize={12} style={{ fontFamily: Fonts.bold }}>Reset Filters</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </YStack>
            </>
          )}

          {/* TAB 2: COMPOUND INTEREST TIME MACHINE */}
          {activeTab === 'compound' && (
            <>
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
                    <PhosphorIcon
                      name="Hourglass"
                      size={16}
                      color="#3EB47D"
                      weight="duotone"
                    />
                    <Text color="#FFFFFF" fontSize={16} style={{ fontFamily: Fonts.bold }} letterSpacing={-0.2} lineHeight={22}>
                      Compound Interest Time Machine
                    </Text>
                  </XStack>
                  <Text color="#8D99AE" fontSize={13} style={{ fontFamily: Fonts.regular }} lineHeight={18} marginTop={2}>
                    Simulate how small regular monthly savings compound and grow over time!
                  </Text>
                </YStack>

                {/* 0. Target Goal Milestone Filter Presets */}
                <YStack gap={6}>
                  <Text color="rgba(255, 255, 255, 0.7)" fontSize={11} style={{ fontFamily: Fonts.bold }} letterSpacing={0.8} textTransform="uppercase">
                    Target Goal Presets (Quick Filter)
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {[
                      { id: 'console', label: `🎮 Console (${currencySymbol}30k)`, m: 500, y: 4, r: 8 },
                      { id: 'phone', label: `📱 Phone (${currencySymbol}60k)`, m: 1000, y: 4, r: 8 },
                      { id: 'pc', label: `💻 Custom PC (${currencySymbol}120k)`, m: 1500, y: 5, r: 12 },
                      { id: 'motor', label: `🏍️ Motorcycle (${currencySymbol}250k)`, m: 2500, y: 6, r: 10 },
                      { id: 'college', label: `🎓 College Fund (${currencySymbol}500k)`, m: 2500, y: 10, r: 8 },
                      { id: 'wealth', label: `🚀 First Million (${currencySymbol}1.5M)`, m: 5000, y: 15, r: 10 },
                    ].map((preset) => {
                      const isLoaded = compoundMonthly === preset.m && compoundYears === preset.y && compoundRate === preset.r;
                      return (
                        <TouchableOpacity
                          key={preset.id}
                          onPress={() => {
                            safeHaptic('light');
                            setCompoundMonthly(preset.m);
                            setCompoundYears(preset.y);
                            setCompoundRate(preset.r);
                            toast.info('Goal Loaded', `${preset.label}: ${currencySymbol}${preset.m.toLocaleString()}/mo for ${preset.y} yrs.`);
                          }}
                          activeOpacity={0.8}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 12,
                            backgroundColor: isLoaded ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            borderWidth: 1,
                            borderColor: isLoaded ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <Text
                            color={isLoaded ? '#10B981' : '#CBD5E1'}
                            fontSize={11}
                            style={{ fontFamily: isLoaded ? Fonts.bold : Fonts.medium }}
                          >
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </YStack>

                {/* 1. Monthly Savings Amount Selector */}
                <YStack gap={8}>
                  <Text color="rgba(255, 255, 255, 0.7)" fontSize={11} style={{ fontFamily: Fonts.bold }} letterSpacing={0.8} textTransform="uppercase">
                    Monthly Savings Amount
                  </Text>
                  <XStack gap={8} flexWrap="wrap">
                    {([100, 500, 1000, 2500, 5000] as const).map((amt) => {
                      const isSel = compoundMonthly === amt;
                      return (
                        <TouchableOpacity
                          key={amt}
                          onPress={() => setCompoundMonthly(amt)}
                          activeOpacity={0.8}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: isSel ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                            backgroundColor: isSel ? '#10B981' : '#0B132B',
                          }}
                        >
                          <Text color="#FFFFFF" fontSize={12} style={{ fontFamily: Fonts.bold }}>
                            {currencySymbol}{amt.toLocaleString()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </XStack>
                </YStack>

                {/* 2. Target Horizon Selection */}
                <YStack gap={8}>
                  <Text color="rgba(255, 255, 255, 0.7)" fontSize={11} style={{ fontFamily: Fonts.bold }} letterSpacing={0.8} textTransform="uppercase">
                    Years to Compounding
                  </Text>
                  <XStack gap={8} flexWrap="wrap">
                    {([2, 5, 10, 20] as const).map((yr) => {
                      const isSel = compoundYears === yr;
                      return (
                        <TouchableOpacity
                          key={yr}
                          onPress={() => setCompoundYears(yr)}
                          activeOpacity={0.8}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 7,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: isSel ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                            backgroundColor: isSel ? '#10B981' : '#0B132B',
                          }}
                        >
                          <Text color="#FFFFFF" fontSize={12} style={{ fontFamily: Fonts.bold }}>
                            {yr} Yrs
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </XStack>
                </YStack>

                {/* 3. Interest Rates Strategy Selection */}
                <YStack gap={8}>
                  <Text color="rgba(255, 255, 255, 0.7)" fontSize={11} style={{ fontFamily: Fonts.bold }} letterSpacing={0.8} textTransform="uppercase">
                    Compounding Strategy (Growth Rate)
                  </Text>
                  <XStack gap={8} flexWrap="wrap">
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
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: isSel ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                            backgroundColor: isSel ? '#10B981' : '#0B132B',
                          }}
                        >
                          <Text color="#FFFFFF" fontSize={12} style={{ fontFamily: Fonts.bold }}>
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
                    <Text color="#8D99AE" fontSize={12} style={{ fontFamily: Fonts.medium }}>Principal Saved</Text>
                    <Text color="#FFFFFF" fontSize={13} style={{ fontFamily: Fonts.bold }}>{currencySymbol}{Math.round(compoundPrincipal).toLocaleString()}</Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text color="#8D99AE" fontSize={12} style={{ fontFamily: Fonts.medium }}>Simulated Growth</Text>
                    <Text color="#10B981" fontSize={13} style={{ fontFamily: Fonts.bold }}>+{currencySymbol}{Math.round(compoundInterestEarned).toLocaleString()}</Text>
                  </XStack>
                  <View height={1} backgroundColor="rgba(255, 255, 255, 0.08)" />
                  <XStack justifyContent="space-between" alignItems="baseline">
                    <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.bold }} letterSpacing={0.8} textTransform="uppercase">Future Wealth</Text>
                    <Text color="#FFFFFF" fontSize={22} style={{ fontFamily: Fonts.bold }}>{currencySymbol}{Math.round(compoundFV).toLocaleString()}</Text>
                  </XStack>

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
                    <Text color="#8D99AE" fontSize={10} style={{ fontFamily: Fonts.medium }}>• Principal ({compoundFV > 0 ? Math.round((compoundPrincipal / compoundFV) * 100) : 100}%)</Text>
                    <Text color="#10B981" fontSize={10} style={{ fontFamily: Fonts.semiBold }}>• Growth ({compoundFV > 0 ? Math.round((compoundInterestEarned / compoundFV) * 100) : 0}%)</Text>
                  </XStack>
                </YStack>

                {/* 5. Relatable Teenage Milestone Converter */}
                <View backgroundColor="rgba(16, 185, 129, 0.05)" padding={12} borderRadius={10} borderWidth={1} borderColor="rgba(16, 185, 129, 0.15)">
                  <Text color="#10B981" fontSize={11} style={{ fontFamily: Fonts.bold }} letterSpacing={0.8} textTransform="uppercase">
                    Relatable Teenage Milestone
                  </Text>
                  <Text color="#E2E8F0" fontSize={13} style={{ fontFamily: Fonts.medium }} lineHeight={18} marginTop={4}>
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

              {/* Compounding Wisdom Card */}
              <CbudgetCard
                padding={18}
                gap={10}
                marginBottom={16}
                backgroundColor="#131D31"
                borderColor="rgba(255, 255, 255, 0.08)"
                borderWidth={1}
                borderRadius={16}
              >
                <XStack gap={8} alignItems="center">
                  <PhosphorIcon
                    name="Sparkle"
                    size={16}
                    color="#F59E0B"
                    weight="fill"
                  />
                  <Text color="#FFFFFF" fontSize={14} style={{ fontFamily: Fonts.bold }}>
                    The Teenage Compounding Superpower
                  </Text>
                </XStack>
                <Text color="rgba(255, 255, 255, 0.7)" fontSize={13} style={{ fontFamily: Fonts.regular }} lineHeight={18}>
                  Albert Einstein called compound interest the 8th wonder of the world. Because you start early, time multiplies your gains exponentially. Even modest savings of {currencySymbol}500/month in early years will outpace huge sums invested late in life!
                </Text>
              </CbudgetCard>
            </>
          )}

          {/* TAB 3: SANDBOX CASH & TRANSFERS */}
          {activeTab === 'cash' && (
            <>
              {/* Buying Power Hero Card */}
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
                <YStack alignItems="center" gap={4}>
                  <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.bold }} letterSpacing={0.8} textTransform="uppercase">
                    Available Buying Power
                  </Text>
                  <XStack alignItems="baseline" gap={4} marginTop={4}>
                    <Text color="#3EB47D" fontSize={22} style={{ fontFamily: Fonts.bold }}>{currencySymbol}</Text>
                    <Text color="#FFFFFF" fontSize={30} style={{ fontFamily: Fonts.bold }} letterSpacing={-0.5} lineHeight={36}>
                      {store.virtualBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </XStack>
                </YStack>

                <XStack justifyContent="space-between" paddingTop={14} borderTopWidth={1} borderTopColor="rgba(255, 255, 255, 0.06)">
                  <YStack gap={2}>
                    <Text color="#8D99AE" fontSize={12} style={{ fontFamily: Fonts.medium }} lineHeight={16}>
                      Invested in Stocks
                    </Text>
                    <Text color="#FFFFFF" fontSize={15} style={{ fontFamily: Fonts.bold }} lineHeight={20}>
                      {currencySymbol}{holdingsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                  </YStack>
                  <YStack alignItems="flex-end" gap={2}>
                    <Text color="#8D99AE" fontSize={12} style={{ fontFamily: Fonts.medium }} lineHeight={16}>
                      Allowance Buffer
                    </Text>
                    <Text color="#3EB47D" fontSize={15} style={{ fontFamily: Fonts.bold }} lineHeight={20}>
                      {currencySymbol}{Math.round(availableToTransfer).toLocaleString()}
                    </Text>
                  </YStack>
                </XStack>
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
                  <Text color="#FFFFFF" fontSize={15} style={{ fontFamily: Fonts.bold }} letterSpacing={-0.2} lineHeight={20}>
                    Transfer Allowance to Simulator
                  </Text>
                  <Text color="#8D99AE" fontSize={12} style={{ fontFamily: Fonts.medium }} lineHeight={16}>
                    Available leftover allowance to allocate: <Text color="#3EB47D" style={{ fontFamily: Fonts.bold }}>{currencySymbol}{Math.round(availableToTransfer).toLocaleString()}</Text>
                  </Text>
                </YStack>
                
                <YStack gap={10}>
                  <FormInput
                    placeholder={`Enter amount (${currencySymbol})`}
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
                      leftIcon="ArrowsLeftRight"
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
                      leftIcon="PlusCircle"
                      onPress={handleAddSimulationCash}
                      style={{ borderColor: 'rgba(255, 255, 255, 0.15)', backgroundColor: 'transparent', flex: 0.8 }}
                    >
                      Sim Grant
                    </FormButton>
                  </XStack>
                </YStack>

                <YStack gap={8} marginTop={4}>
                  <Text color="rgba(255, 255, 255, 0.5)" fontSize={11} style={{ fontFamily: Fonts.bold }} letterSpacing={0.8} textTransform="uppercase" textAlign="center">
                    Instant Sandbox Test Grants
                  </Text>
                  <XStack gap={8} justifyContent="center">
                    <TouchableOpacity onPress={() => handleQuickAddCash(500)} style={styles.quickCashBtn}>
                      <Text color="#FFFFFF" fontSize={12} style={{ fontFamily: Fonts.bold }}>+{currencySymbol}500</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleQuickAddCash(1000)} style={styles.quickCashBtn}>
                      <Text color="#FFFFFF" fontSize={12} style={{ fontFamily: Fonts.bold }}>+{currencySymbol}1K</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleQuickAddCash(5000)} style={styles.quickCashBtn}>
                      <Text color="#FFFFFF" fontSize={12} style={{ fontFamily: Fonts.bold }}>+{currencySymbol}5K</Text>
                    </TouchableOpacity>
                  </XStack>
                </YStack>
              </CbudgetCard>

              {/* Safety & Learning Guidelines Card */}
              <CbudgetCard
                padding={16}
                gap={8}
                marginBottom={16}
                backgroundColor="#131D31"
                borderColor="rgba(255, 255, 255, 0.08)"
                borderWidth={1}
                borderRadius={16}
              >
                <XStack gap={8} alignItems="center">
                  <PhosphorIcon
                    name="ShieldCheck"
                    size={16}
                    color="#10B981"
                    weight="duotone"
                  />
                  <Text color="#FFFFFF" fontSize={14} style={{ fontFamily: Fonts.bold }}>
                    Safe Sandbox Environment
                  </Text>
                </XStack>
                <Text color="rgba(255, 255, 255, 0.7)" fontSize={13} style={{ fontFamily: Fonts.regular }} lineHeight={18}>
                  All trades in the Investment Lab use simulated currency. No actual banking money is lost or risked. Practice placing orders, tracking gains, and understanding volatility with complete peace of mind.
                </Text>
              </CbudgetCard>
            </>
          )}


        </ScrollView>
      </SafeAreaView>

      <RiskAssessmentModal
        visible={showRiskModal}
        onClose={() => setShowRiskModal(false)}
        onComplete={() => setShowRiskModal(false)}
      />
    </YStack>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  capsuleTrackWrapper: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 8,
  },
  capsuleTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131D31',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  quickCashBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0B132B',
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusText: {
    color: '#10B981',
    fontSize: 10.5,
    fontFamily: Fonts.bold,
    letterSpacing: 0.6,
  },
  indicesTickerContainer: {
    paddingVertical: 2,
    paddingRight: 16,
    alignItems: 'center',
  },
  indicesTickerScroll: {
    marginBottom: 14,
  },
  indexPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
  gameBannerCard: {
    backgroundColor: '#131D31',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  gameBannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameNewTag: {
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gamePlayBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
});
