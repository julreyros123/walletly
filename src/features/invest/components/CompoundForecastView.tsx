import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { Fonts } from '@/constants/theme';
import { safeHaptic } from '@/utils/haptics';
import Svg, { Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';

interface CompoundForecastViewProps {
  currencySymbol: string;
  monthly: number;
  years: number;
  rate: number;
  onMonthlyChange: (val: number) => void;
  onYearsChange: (val: number) => void;
  onRateChange: (val: number) => void;
}

const MONTHLY_PRESETS = [250, 500, 1000, 2500, 5000];
const YEAR_PRESETS = [3, 5, 10, 15, 20];
const STRATEGY_PRESETS = [
  { rate: 4, name: 'Bonds & Cash', sub: 'Low Risk • 4% p.a.' },
  { rate: 8, name: 'Index Fund', sub: 'Market Avg • 8% p.a.' },
  { rate: 12, name: 'Growth Equities', sub: 'High Risk • 12% p.a.' },
];

export function CompoundForecastView({
  currencySymbol,
  monthly,
  years,
  rate,
  onMonthlyChange,
  onYearsChange,
  onRateChange,
}: CompoundForecastViewProps) {
  // Financial Compounding Math
  const monthlyRate = rate / 1200;
  const totalMonths = years * 12;
  const futureValue =
    monthlyRate > 0
      ? monthly * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
      : monthly * totalMonths;

  const totalPrincipal = monthly * totalMonths;
  const totalInterest = Math.max(0, futureValue - totalPrincipal);
  const growthPercent = totalPrincipal > 0 ? (totalInterest / totalPrincipal) * 100 : 0;

  // Generate Year-by-Year Curve for the Visual Compounding Chart
  const chartPoints = useMemo(() => {
    const steps = Math.min(years, 20);
    const pts: { year: number; val: number }[] = [];
    for (let y = 0; y <= steps; y++) {
      const mCount = y * 12;
      const fv =
        monthlyRate > 0 && mCount > 0
          ? monthly * ((Math.pow(1 + monthlyRate, mCount) - 1) / monthlyRate)
          : monthly * mCount;
      pts.push({ year: y, val: fv });
    }
    return pts;
  }, [monthly, years, rate, monthlyRate]);

  // SVG Bezier Curve Generator
  const chartHeight = 120;
  const chartWidth = 320;
  const maxVal = Math.max(1, futureValue);

  const svgPaths = useMemo(() => {
    if (chartPoints.length < 2) return { line: '', area: '' };

    const coords = chartPoints.map((p, idx) => {
      const x = (idx / (chartPoints.length - 1)) * (chartWidth - 24) + 12;
      const y = chartHeight - 16 - (p.val / maxVal) * (chartHeight - 32);
      return { x, y };
    });

    let line = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[Math.max(0, i - 1)];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[Math.min(coords.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      line += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const last = coords[coords.length - 1];
    const area = `${line} L ${last.x.toFixed(1)} ${chartHeight} L ${coords[0].x.toFixed(1)} ${chartHeight} Z`;
    return { line, area };
  }, [chartPoints, maxVal]);

  // Standard Financial Milestone Calculation
  const milestoneLabel = useMemo(() => {
    if (futureValue >= 1000000) return 'Financial Independence Milestone (₱1M+)';
    if (futureValue >= 500000) return 'Long-Term Wealth Foundation (₱500k+)';
    if (futureValue >= 200000) return 'Major Capital Milestone (₱200k+)';
    if (futureValue >= 100000) return 'First ₱100k Portfolio Milestone';
    if (futureValue >= 50000) return 'Solid Investment Reserve (₱50k+)';
    return 'Starter Emergency Buffer';
  }, [futureValue]);

  return (
    <YStack gap={14} marginBottom={24}>
      {/* ==================== 1. HERO PROJECTED WEALTH CARD ==================== */}
      <CbudgetCard
        padding={20}
        gap={14}
        backgroundColor="#1C2541"
        borderColor="rgba(255, 255, 255, 0.08)"
        borderWidth={1}
        borderRadius={20}
        elevation={0}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <YStack gap={2}>
            <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.bold }} letterSpacing={0.8} textTransform="uppercase">
              Projected Total Value
            </Text>
            <Text color="rgba(255, 255, 255, 0.6)" fontSize={12} style={{ fontFamily: Fonts.regular }}>
              Horizon: {years} Years @ {rate}% p.a.
            </Text>
          </YStack>

          <View style={styles.milestoneBadge}>
            <PhosphorIcon name="Sparkle" size={13} color="#10B981" weight="fill" />
            <Text color="#10B981" fontSize={11} style={{ fontFamily: Fonts.bold }}>
              +{growthPercent.toFixed(0)}% Growth
            </Text>
          </View>
        </XStack>

        {/* Hero Figure */}
        <XStack alignItems="baseline" gap={4}>
          <Text color="#10B981" fontSize={24} style={{ fontFamily: Fonts.bold }}>{currencySymbol}</Text>
          <Text color="#FFFFFF" fontSize={34} style={{ fontFamily: Fonts.bold }} letterSpacing={-0.6} lineHeight={40}>
            {Math.round(futureValue).toLocaleString()}
          </Text>
        </XStack>

        {/* Exponential Growth Visual Curve */}
        <View height={chartHeight} width="100%" position="relative" marginTop={2} marginBottom={2}>
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <Defs>
              <LinearGradient id="growthAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#10B981" stopOpacity={0.28} />
                <Stop offset="80%" stopColor="#10B981" stopOpacity={0.03} />
                <Stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
              </LinearGradient>
            </Defs>

            {/* Grid Horizon Lines */}
            <Line x1="12" y1={chartHeight - 16} x2={chartWidth - 12} y2={chartHeight - 16} stroke="rgba(255, 255, 255, 0.08)" strokeWidth={1} />
            <Line x1="12" y1={16} x2={chartWidth - 12} y2={16} stroke="rgba(255, 255, 255, 0.04)" strokeWidth={1} strokeDasharray="3 3" />

            {/* Bezier Path */}
            {svgPaths.area ? <Path d={svgPaths.area} fill="url(#growthAreaGrad)" /> : null}
            {svgPaths.line ? <Path d={svgPaths.line} stroke="#10B981" strokeWidth={2.5} fill="none" /> : null}
          </Svg>
        </View>

        {/* Dual-Tone Capital Breakdown Bar */}
        <YStack gap={6}>
          <View height={8} backgroundColor="rgba(255, 255, 255, 0.08)" borderRadius={4} overflow="hidden" flexDirection="row" width="100%">
            <View
              width={`${futureValue > 0 ? Math.min(100, (totalPrincipal / futureValue) * 100) : 100}%`}
              height="100%"
              backgroundColor="#64748B"
            />
            <View
              width={`${futureValue > 0 ? Math.min(100, (totalInterest / futureValue) * 100) : 0}%`}
              height="100%"
              backgroundColor="#10B981"
            />
          </View>

          <XStack justifyContent="space-between" alignItems="center">
            <XStack alignItems="center" gap={6}>
              <View width={8} height={8} borderRadius={4} backgroundColor="#64748B" />
              <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.medium }}>
                Principal: <Text color="#FFFFFF" style={{ fontFamily: Fonts.bold }}>{currencySymbol}{Math.round(totalPrincipal).toLocaleString()}</Text>
              </Text>
            </XStack>

            <XStack alignItems="center" gap={6}>
              <View width={8} height={8} borderRadius={4} backgroundColor="#10B981" />
              <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.medium }}>
                Compound Gains: <Text color="#10B981" style={{ fontFamily: Fonts.bold }}>+{currencySymbol}{Math.round(totalInterest).toLocaleString()}</Text>
              </Text>
            </XStack>
          </XStack>
        </YStack>

        {/* Institutional Milestone Pill */}
        <View style={styles.milestoneRow}>
          <PhosphorIcon name="Trophy" size={15} color="#F59E0B" weight="fill" />
          <Text color="rgba(255, 255, 255, 0.85)" fontSize={12} style={{ fontFamily: Fonts.medium }} numberOfLines={1}>
            {milestoneLabel}
          </Text>
        </View>
      </CbudgetCard>

      {/* ==================== 2. MONTHLY CONTRIBUTION SELECTOR ==================== */}
      <CbudgetCard
        padding={16}
        gap={12}
        backgroundColor="#1C2541"
        borderColor="rgba(255, 255, 255, 0.08)"
        borderWidth={1}
        borderRadius={16}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.bold }} letterSpacing={0.8} textTransform="uppercase">
            Monthly Contribution
          </Text>
          <Text color="#10B981" fontSize={15} style={{ fontFamily: Fonts.bold }}>
            {currencySymbol}{monthly.toLocaleString()}<Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.regular }}> / mo</Text>
          </Text>
        </XStack>

        <XStack gap={8}>
          {MONTHLY_PRESETS.map((amt) => {
            const isSelected = monthly === amt;
            return (
              <TouchableOpacity
                key={amt}
                onPress={() => {
                  safeHaptic('light');
                  onMonthlyChange(amt);
                }}
                activeOpacity={0.75}
                style={[styles.presetTab, isSelected && styles.presetTabActive]}
              >
                <Text
                  color={isSelected ? '#FFFFFF' : '#8D99AE'}
                  fontSize={12}
                  style={{ fontFamily: isSelected ? Fonts.bold : Fonts.medium }}
                >
                  {currencySymbol}{amt >= 1000 ? `${amt / 1000}k` : amt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </XStack>
      </CbudgetCard>

      {/* ==================== 3. TIME HORIZON SELECTOR ==================== */}
      <CbudgetCard
        padding={16}
        gap={12}
        backgroundColor="#1C2541"
        borderColor="rgba(255, 255, 255, 0.08)"
        borderWidth={1}
        borderRadius={16}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.bold }} letterSpacing={0.8} textTransform="uppercase">
            Investment Horizon
          </Text>
          <Text color="#FFFFFF" fontSize={14} style={{ fontFamily: Fonts.bold }}>
            {years} Years
          </Text>
        </XStack>

        <XStack gap={8}>
          {YEAR_PRESETS.map((yr) => {
            const isSelected = years === yr;
            return (
              <TouchableOpacity
                key={yr}
                onPress={() => {
                  safeHaptic('light');
                  onYearsChange(yr);
                }}
                activeOpacity={0.75}
                style={[styles.presetTab, isSelected && styles.presetTabActive]}
              >
                <Text
                  color={isSelected ? '#FFFFFF' : '#8D99AE'}
                  fontSize={12}
                  style={{ fontFamily: isSelected ? Fonts.bold : Fonts.medium }}
                >
                  {yr} Yrs
                </Text>
              </TouchableOpacity>
            );
          })}
        </XStack>
      </CbudgetCard>

      {/* ==================== 4. ASSET CLASS STRATEGY SELECTOR ==================== */}
      <CbudgetCard
        padding={16}
        gap={12}
        backgroundColor="#1C2541"
        borderColor="rgba(255, 255, 255, 0.08)"
        borderWidth={1}
        borderRadius={16}
      >
        <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.bold }} letterSpacing={0.8} textTransform="uppercase">
          Expected Annual Return Strategy
        </Text>

        <YStack gap={8}>
          {STRATEGY_PRESETS.map((s) => {
            const isSelected = rate === s.rate;
            return (
              <TouchableOpacity
                key={s.rate}
                onPress={() => {
                  safeHaptic('light');
                  onRateChange(s.rate);
                }}
                activeOpacity={0.8}
                style={[styles.strategyCard, isSelected && styles.strategyCardActive]}
              >
                <YStack gap={2} flex={1}>
                  <Text
                    color={isSelected ? '#FFFFFF' : '#E2E8F0'}
                    fontSize={13}
                    style={{ fontFamily: Fonts.bold }}
                  >
                    {s.name}
                  </Text>
                  <Text color="#8D99AE" fontSize={11} style={{ fontFamily: Fonts.regular }}>
                    {s.sub}
                  </Text>
                </YStack>

                <View style={[styles.rateBadge, isSelected && styles.rateBadgeActive]}>
                  <Text
                    color={isSelected ? '#10B981' : '#8D99AE'}
                    fontSize={12}
                    style={{ fontFamily: Fonts.bold }}
                  >
                    {s.rate}% p.a.
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </YStack>
      </CbudgetCard>
    </YStack>
  );
}

const styles = StyleSheet.create({
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 4,
  },
  presetTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  presetTabActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  strategyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  strategyCardActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  rateBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  rateBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
});
