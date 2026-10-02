import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Progress } from 'tamagui';
import { Fonts } from '@/constants/theme';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { useTheme } from '@/hooks/use-theme';
import { useCurrency } from '@/utils/currency';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSavings: number;
}

interface BentoGoalsAndPortfolioProps {
  savingsGoals: SavingsGoal[];
  totalSimValue: number;
  virtualBalance: number;
  holdingsValue: number;
  onPressViewGoals: () => void;
  onPressInvestArena: () => void;
}

export function BentoGoalsAndPortfolio({
  savingsGoals,
  totalSimValue,
  virtualBalance,
  holdingsValue,
  onPressViewGoals,
  onPressInvestArena,
}: BentoGoalsAndPortfolioProps) {
  const theme = useTheme();
  const { symbol: currencySymbol } = useCurrency();
  const firstGoal = savingsGoals[0];
  const goalProgress =
    firstGoal && firstGoal.targetAmount > 0
      ? Math.min(100, Math.round((firstGoal.currentSavings / firstGoal.targetAmount) * 100))
      : 0;

  return (
    <View style={styles.container}>
      {/* ── 1. SAVINGS GOALS (CARDLESS, PURE ICON & TEXT) ────────────────── */}
      <View style={styles.sectionBlock}>
        {/* Clean Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Savings Goals
          </Text>
          <InteractivePressable
            onPress={onPressViewGoals}
            style={styles.headerActionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="View savings goals"
          >
            <Text style={styles.linkText}>View All</Text>
            <PhosphorIcon name="CaretRight" size={13} color="#10B981" weight="bold" />
          </InteractivePressable>
        </View>

        {/* Pure Icon and Text Item */}
        {firstGoal ? (
          <InteractivePressable
            onPress={onPressViewGoals}
            style={styles.rowItem}
            accessibilityRole="button"
            accessibilityLabel={`${firstGoal.name}: ${currencySymbol}${firstGoal.currentSavings.toLocaleString()} of ${currencySymbol}${firstGoal.targetAmount.toLocaleString()} saved`}
          >
            <View style={styles.rowTop}>
              <View style={styles.leftGroup}>
                {/* Settings-style Circular Icon */}
                <View style={[styles.iconCircle, { backgroundColor: '#10B981' }]}>
                  <PhosphorIcon name="PiggyBank" size={20} color="#FFFFFF" weight="bold" />
                </View>
                <View style={styles.textGroup}>
                  <Text style={[styles.mainTitle, { color: theme.text }]} numberOfLines={1}>
                    {firstGoal.name}
                  </Text>
                  <Text style={[styles.subText, { color: theme.textSecondary }]}>
                    {currencySymbol}{firstGoal.currentSavings.toLocaleString()} of {currencySymbol}{firstGoal.targetAmount.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.rightGroup}>
                <Text style={styles.percentText}>{goalProgress}%</Text>
                <PhosphorIcon name="CaretRight" size={14} color={theme.textSecondary} weight="bold" />
              </View>
            </View>

            {/* Full-width clean progress line */}
            <View style={styles.progressTrack}>
              <Progress
                value={goalProgress}
                height={5}
                backgroundColor={
                  theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
                }
                borderRadius={2.5}
              >
                <Progress.Indicator backgroundColor="#10B981" borderRadius={2.5} />
              </Progress>
            </View>
          </InteractivePressable>
        ) : (
          <InteractivePressable
            onPress={onPressViewGoals}
            style={styles.rowItem}
            accessibilityRole="button"
            accessibilityLabel="Tap to set your first savings goal"
          >
            <View style={styles.rowTop}>
              <View style={styles.leftGroup}>
                {/* Settings-style Circular Icon */}
                <View style={[styles.iconCircle, { backgroundColor: '#10B981' }]}>
                  <PhosphorIcon name="PiggyBank" size={20} color="#FFFFFF" weight="bold" />
                </View>
                <View style={styles.textGroup}>
                  <Text style={[styles.mainTitle, { color: theme.text }]}>
                    Set a Savings Goal
                  </Text>
                  <Text style={[styles.subText, { color: theme.textSecondary }]}>
                    Tap to set a target & build savings
                  </Text>
                </View>
              </View>

              <View style={styles.rightGroup}>
                <PhosphorIcon name="CaretRight" size={15} color={theme.textSecondary} weight="bold" />
              </View>
            </View>
          </InteractivePressable>
        )}
      </View>

      {/* ── 2. INVESTMENTS (CARDLESS, PURE ICON & TEXT) ──────────────────── */}
      <View style={styles.sectionBlock}>
        {/* Clean Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Investments
          </Text>
          <InteractivePressable
            onPress={onPressInvestArena}
            style={styles.headerActionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Open investment arena"
          >
            <Text style={styles.linkText}>Arena</Text>
            <PhosphorIcon name="CaretRight" size={13} color="#10B981" weight="bold" />
          </InteractivePressable>
        </View>

        {/* Pure Icon and Text Item */}
        <InteractivePressable
          onPress={onPressInvestArena}
          style={styles.rowItem}
          accessibilityRole="button"
          accessibilityLabel={`Total investment balance: ${currencySymbol}${totalSimValue.toLocaleString()}`}
        >
          <View style={styles.rowTop}>
            <View style={styles.leftGroup}>
              {/* Settings-style Circular Icon */}
              <View style={[styles.iconCircle, { backgroundColor: '#059669' }]}>
                <PhosphorIcon name="ChartLineUp" size={20} color="#FFFFFF" weight="bold" />
              </View>
              <View style={styles.textGroup}>
                <Text style={[styles.valueAmount, { color: theme.text }]}>
                  {currencySymbol}{totalSimValue.toLocaleString()}
                </Text>
                <Text style={[styles.subText, { color: theme.textSecondary }]}>
                  Cash: <Text style={[styles.boldSubText, { color: theme.text }]}>{currencySymbol}{virtualBalance.toLocaleString()}</Text>   •   Stocks: <Text style={[styles.boldSubText, { color: theme.text }]}>{currencySymbol}{holdingsValue.toLocaleString()}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.rightGroup}>
              <PhosphorIcon name="CaretRight" size={15} color={theme.textSecondary} weight="bold" />
            </View>
          </View>
        </InteractivePressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 6,
    marginBottom: 8,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 18.5,
    fontFamily: Fonts.extraBold,
    letterSpacing: -0.4,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  linkText: {
    color: '#10B981',
    fontSize: 13.5,
    fontFamily: Fonts.bold,
  },
  rowItem: {
    paddingVertical: 4,
    gap: 10,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  mainTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    letterSpacing: -0.2,
  },
  valueAmount: {
    fontSize: 21,
    fontFamily: Fonts.extraBold,
    letterSpacing: -0.4,
  },
  subText: {
    fontSize: 12.5,
    fontFamily: Fonts.medium,
  },
  boldSubText: {
    fontFamily: Fonts.bold,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  percentText: {
    color: '#10B981',
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  progressTrack: {
    paddingLeft: 54,
  },
});

export default BentoGoalsAndPortfolio;
