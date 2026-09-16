import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Progress } from 'tamagui';
import { Fonts, Typography } from '@/constants/theme';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
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

  return (
    <View style={styles.container}>
      {/* Left Bento: Savings Goals */}
      <CbudgetCard flex={1} padding={16} gap={10}>
        <View style={styles.cardHeader}>
          <Text style={[styles.sectionOverline, { color: theme.textSecondary }]}>
            SAVINGS GOAL
          </Text>
          <InteractivePressable
            onPress={onPressViewGoals}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="View savings goals"
          >
            <Text style={styles.linkText}>View</Text>
          </InteractivePressable>
        </View>

        {firstGoal ? (
          <View style={styles.cardBody}>
            <Text
              style={[styles.goalName, { color: theme.text }]}
              numberOfLines={1}
            >
              {firstGoal.name}
            </Text>
            <Text style={styles.highlightAmount}>
              {currencySymbol}{firstGoal.currentSavings.toLocaleString()}
            </Text>
            <Progress
              value={Math.min(
                100,
                firstGoal.targetAmount > 0
                  ? (firstGoal.currentSavings / firstGoal.targetAmount) * 100
                  : 0
              )}
              height={5}
              backgroundColor={
                theme.mode === 'hybrid' || theme.mode === 'light'
                  ? '#E2E8F0'
                  : 'rgba(255, 255, 255, 0.08)'
              }
              borderRadius={3}
            >
              <Progress.Indicator backgroundColor="#10B981" borderRadius={3} />
            </Progress>
            <Text style={[styles.captionText, { color: theme.textSecondary }]}>
              Target: {currencySymbol}{firstGoal.targetAmount.toLocaleString()}
            </Text>
          </View>
        ) : (
          <View style={styles.emptyBody}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No Goals Yet
            </Text>
            <Text style={[styles.captionText, { color: theme.textSecondary }]}>
              Tap to set a goal
            </Text>
          </View>
        )}
      </CbudgetCard>

      {/* Right Bento: Investments Portfolio */}
      <CbudgetCard flex={1} padding={16} gap={10}>
        <View style={styles.cardHeader}>
          <Text style={[styles.sectionOverline, { color: theme.textSecondary }]}>
            INVESTMENTS
          </Text>
          <InteractivePressable
            onPress={onPressInvestArena}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Open investment arena"
          >
            <Text style={styles.linkText}>Arena</Text>
          </InteractivePressable>
        </View>

        <View style={styles.cardBody}>
          <Text
            style={[styles.portfolioTotal, { color: theme.text }]}
            numberOfLines={1}
          >
            {currencySymbol}{totalSimValue.toLocaleString()}
          </Text>
          <View style={styles.investDetailRow}>
            <Text style={[styles.captionText, { color: theme.textSecondary }]}>
              Cash:
            </Text>
            <Text style={[styles.subValue, { color: theme.text }]}>
              {currencySymbol}{virtualBalance.toLocaleString()}
            </Text>
          </View>
          <View style={styles.investDetailRow}>
            <Text style={[styles.captionText, { color: theme.textSecondary }]}>
              Stocks:
            </Text>
            <Text style={[styles.subValue, { color: theme.text }]}>
              {currencySymbol}{holdingsValue.toLocaleString()}
            </Text>
          </View>
        </View>
      </CbudgetCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionOverline: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  linkText: {
    color: '#10B981',
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  cardBody: {
    gap: 6,
  },
  emptyBody: {
    gap: 4,
    paddingVertical: 6,
  },
  goalName: {
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  highlightAmount: {
    color: '#10B981',
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  portfolioTotal: {
    fontSize: 16,
    fontFamily: Fonts.extraBold,
    letterSpacing: -0.3,
  },
  investDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  captionText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  subValue: {
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
});

export default BentoGoalsAndPortfolio;
