import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Fonts, Typography } from '@/constants/theme';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { useCurrency } from '@/utils/currency';

interface BalanceHeroCardProps {
  cardTitle: string;
  isBalanceHidden: boolean;
  onToggleBalanceHidden: () => void;
  displayBalance: number;
  displaySpent: number;
  displayLimit: number;
  onPressBudgetDetails: () => void;
}

export function BalanceHeroCard({
  cardTitle,
  isBalanceHidden,
  onToggleBalanceHidden,
  displayBalance,
  displaySpent,
  displayLimit,
  onPressBudgetDetails,
}: BalanceHeroCardProps) {
  const { symbol: currencySymbol } = useCurrency();
  const progressRatio = Math.min(1, displayLimit > 0 ? displaySpent / displayLimit : 0);
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progressRatio, { duration: 650 });
  }, [progressRatio, animatedProgress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.round(animatedProgress.value * 100)}%`,
  }));

  const isOverLimit = displaySpent > displayLimit && displayLimit > 0;

  return (
    <View style={styles.cardContainer}>
      {/* Background Gradient & Ambient Sheen */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="heroCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#0B1322" stopOpacity={1} />
            <Stop offset="50%" stopColor="#0F172A" stopOpacity={1} />
            <Stop offset="100%" stopColor="#141E33" stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id="heroBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(16, 185, 129, 0.45)" stopOpacity={1} />
            <Stop offset="50%" stopColor="rgba(255, 255, 255, 0.10)" stopOpacity={1} />
            <Stop offset="100%" stopColor="rgba(59, 130, 246, 0.25)" stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" rx={20} fill="url(#heroCardGrad)" />
        {/* Atmospheric ambient glows */}
        <Circle cx="88%" cy="12%" r={90} fill="#10B981" fillOpacity={0.08} />
        <Circle cx="12%" cy="85%" r={80} fill="#3B82F6" fillOpacity={0.05} />
        {/* Dual-tinted glass hairline border */}
        <Rect width="100%" height="100%" rx={20} fill="none" stroke="url(#heroBorderGrad)" strokeWidth={1.2} />
      </Svg>

      <View style={styles.cardContent}>
        {/* Header row: Title + Privacy Eye Toggle + Budget Details Pill */}
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Text style={styles.cardTitle}>{cardTitle}</Text>
            <InteractivePressable
              onPress={onToggleBalanceHidden}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.eyeBtn}
              accessibilityLabel={isBalanceHidden ? 'Show balance' : 'Hide balance'}
              accessibilityHint="Toggles balance visibility on screen"
            >
              <PhosphorIcon
                name={isBalanceHidden ? 'EyeSlash' : 'Eye'}
                size={14}
                color="#94A3B8"
                weight="fill"
              />
            </InteractivePressable>
          </View>

          <InteractivePressable
            onPress={onPressBudgetDetails}
            style={styles.budgetPill}
            accessibilityLabel="View budget details"
            accessibilityHint="Opens your budget breakdown"
          >
            <Text style={styles.budgetPillText}>Budget Details</Text>
          </InteractivePressable>
        </View>

        {/* Big Balance Digits */}
        <View
          style={styles.balanceRow}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={
            isBalanceHidden
              ? 'Balance hidden'
              : `Current balance: ${currencySymbol} ${displayBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
        >
          <Text style={styles.currencySymbol}>{currencySymbol}</Text>
          <Text style={styles.balanceDigits}>
            {isBalanceHidden
              ? '• • • • • •'
              : displayBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
          </Text>
        </View>

        {/* Spend Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelsRow}>
            <Text style={styles.spentLabel}>
              Spent: {isBalanceHidden ? `${currencySymbol} •••` : `${currencySymbol} ${displaySpent.toLocaleString()}`}
            </Text>
            <View style={styles.limitGroup}>
              {isOverLimit && (
                <View style={styles.overLimitBadge}>
                  <Text style={styles.overLimitText}>OVER LIMIT</Text>
                </View>
              )}
              <Text style={styles.limitLabel}>
                Limit: {currencySymbol} {displayLimit.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Animated Progress Bar */}
          <View
            style={styles.progressBarTrack}
            accessible={true}
            accessibilityRole="progressbar"
            accessibilityLabel={`Spent ${currencySymbol} ${displaySpent.toLocaleString()} of ${currencySymbol} ${displayLimit.toLocaleString()} limit`}
            accessibilityValue={{ min: 0, max: displayLimit, now: displaySpent }}
          >
            <Animated.View
              style={[
                styles.progressBarFill,
                progressStyle,
                { backgroundColor: isOverLimit ? '#EF4444' : '#10B981' },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 8,
    marginTop: 0,
    marginHorizontal: 16,
    zIndex: 10,
  },
  cardContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Fonts.bold,
    letterSpacing: 0.8,
  },
  eyeBtn: {
    padding: 2,
  },
  budgetPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  budgetPillText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 2,
  },
  currencySymbol: {
    color: '#10B981',
    fontSize: 22,
    fontFamily: Fonts.bold,
  },
  balanceDigits: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: Fonts.extraBold,
    letterSpacing: -0.8,
  },
  progressSection: {
    gap: 7,
    marginTop: 4,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spentLabel: {
    color: 'rgba(148, 163, 184, 0.9)',
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  limitGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overLimitBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overLimitText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: Fonts.bold,
    letterSpacing: 0.3,
  },
  limitLabel: {
    color: '#E2E8F0',
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default BalanceHeroCard;
