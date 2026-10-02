import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Fonts } from '@/constants/theme';
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
      {/* Background Gradient matching Budget Card — No ambient circles */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="heroCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#239B56" stopOpacity={1} />
            <Stop offset="50%" stopColor="#1D8348" stopOpacity={1} />
            <Stop offset="100%" stopColor="#145A32" stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" rx={20} fill="url(#heroCardGrad)" />
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
                color="#A7F3D0"
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
            <PhosphorIcon name="CaretRight" size={11} color="#D1FAE5" weight="bold" />
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
          accessibilityHint="Remaining budget available to spend in your current cycle"
        >
          <Text style={styles.currencySymbol}>{currencySymbol}</Text>
          <Text style={styles.balanceDigits} numberOfLines={1} adjustsFontSizeToFit>
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
            <Text style={styles.spentLabel} numberOfLines={1} ellipsizeMode="tail">
              Spent: {isBalanceHidden ? `${currencySymbol} •••` : `${currencySymbol} ${displaySpent.toLocaleString()}`}
            </Text>
            <View style={styles.limitGroup}>
              {isOverLimit && (
                <Text style={styles.overLimitText} numberOfLines={1}>OVER LIMIT</Text>
              )}
              <Text style={styles.limitLabel} numberOfLines={1}>
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
                { backgroundColor: isOverLimit ? '#EF4444' : '#34D399' },
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
    backgroundColor: '#1D8348',
    shadowColor: '#1D8348',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
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
    color: '#A7F3D0',
    fontSize: 11,
    fontFamily: Fonts.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  eyeBtn: {
    padding: 2,
  },
  budgetPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  budgetPillText: {
    color: '#D1FAE5',
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
    color: '#D1FAE5',
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
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontFamily: Fonts.medium,
    flex: 1,
    marginRight: 6,
  },
  limitGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  overLimitText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontFamily: Fonts.bold,
    letterSpacing: 0.3,
  },
  limitLabel: {
    color: '#A7F3D0',
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default BalanceHeroCard;
