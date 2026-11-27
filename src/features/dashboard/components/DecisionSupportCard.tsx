import React, { useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { useTheme } from '@/hooks/use-theme';
import { Fonts } from '@/constants/theme';
import { safeHaptic } from '@/utils/haptics';
import {
  BUDGET_STATUS,
  runDecisionSupportEngine,
  type BudgetClassificationStatus,
  type MatchableAsset,
} from '@/utils/decisionEngine';

export interface DecisionSupportCardProps {
  budget: number;
  spent: number;
  isBudgetSetupComplete: boolean;
  assets: readonly MatchableAsset[];
  currencySymbol: string;
  onPressSetBudget?: () => void;
  onPressAllocateRecommended?: (amount: number, matchedTicker?: string) => void;
  compact?: boolean;
}

function getStatusVisuals(status: BudgetClassificationStatus) {
  switch (status) {
    case BUDGET_STATUS.OVERSPENDING:
      return {
        label: 'Overspending',
        accent: '#EF4444',
        bgTint: 'rgba(239, 68, 68, 0.12)',
        borderTint: 'rgba(239, 68, 68, 0.28)',
        icon: 'ShieldWarning' as const,
      };
    case BUDGET_STATUS.WARNING:
      return {
        label: 'Warning (≥80%)',
        accent: '#F59E0B',
        bgTint: 'rgba(245, 158, 11, 0.12)',
        borderTint: 'rgba(245, 158, 11, 0.28)',
        icon: 'Warning' as const,
      };
    case BUDGET_STATUS.WITHIN_BUDGET:
      return {
        label: 'Within Budget',
        accent: '#10B981',
        bgTint: 'rgba(16, 185, 129, 0.12)',
        borderTint: 'rgba(16, 185, 129, 0.28)',
        icon: 'CheckCircle' as const,
      };
    default:
      return {
        label: 'Set a Valid Budget',
        accent: '#64748B',
        bgTint: 'rgba(100, 116, 139, 0.12)',
        borderTint: 'rgba(100, 116, 139, 0.28)',
        icon: 'Info' as const,
      };
  }
}

export function DecisionSupportCard({
  budget,
  spent,
  isBudgetSetupComplete,
  assets,
  currencySymbol,
  onPressSetBudget,
  onPressAllocateRecommended,
  compact = false,
}: DecisionSupportCardProps) {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';

  const effectiveBudgetForEngine = isBudgetSetupComplete || spent > 0 ? budget : 0;

  const summary = useMemo(
    () =>
      runDecisionSupportEngine({
        budget: effectiveBudgetForEngine,
        expenses: spent,
        assets,
        currencySymbol,
      }),
    [effectiveBudgetForEngine, spent, assets, currencySymbol]
  );

  const { evaluation, allocation, matching } = summary;
  const visuals = getStatusVisuals(evaluation.status);

  const cardBg = isDark ? '#131D31' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';
  const subBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC';

  const formattedRemaining =
    evaluation.remainingBudget < 0
      ? `-${currencySymbol}${Math.abs(evaluation.remainingBudget).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : `${currencySymbol}${evaluation.remainingBudget.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          marginBottom: compact ? 0 : 14,
        },
      ]}
    >
      {/* Header Row: Title + Rule-Based Status Badge */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <PhosphorIcon name="ShieldCheck" size={16} color={visuals.accent} weight="fill" />
          <Text style={[styles.overline, { color: theme.textSecondary }]}>
            RULE-BASED ADVISOR
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: visuals.bgTint, borderColor: visuals.borderTint },
          ]}
        >
          <PhosphorIcon name={visuals.icon} size={12} color={visuals.accent} weight="bold" />
          <Text style={[styles.statusBadgeText, { color: visuals.accent }]}>
            {visuals.label}
          </Text>
        </View>
      </View>

      {/* Equation 1 Metrics Strip */}
      {evaluation.isValidBudget ? (
        <View style={[styles.metricsStrip, { backgroundColor: subBg, borderColor: cardBorder }]}>
          <View style={styles.metricCol}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Spent (TE)</Text>
            <Text style={[styles.metricVal, { color: theme.text }]} numberOfLines={1}>
              {currencySymbol}
              {evaluation.totalExpenses.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: cardBorder }]} />

          <View style={styles.metricCol}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Remaining (RB)</Text>
            <Text
              style={[
                styles.metricVal,
                { color: evaluation.remainingBudget < 0 ? '#EF4444' : '#10B981' },
              ]}
              numberOfLines={1}
            >
              {formattedRemaining}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: cardBorder }]} />

          <View style={styles.metricCol}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Usage (BU)</Text>
            <Text style={[styles.metricVal, { color: visuals.accent }]} numberOfLines={1}>
              {evaluation.budgetUtilization.toFixed(1)}%
            </Text>
          </View>
        </View>
      ) : null}

      {/* Equation 2 Gated Investment Recommendation */}
      <View
        style={[
          styles.recommendationBox,
          {
            backgroundColor: visuals.bgTint,
            borderColor: visuals.borderTint,
          },
        ]}
      >
        <View style={styles.recTextCol}>
          <Text style={[styles.recHeadline, { color: theme.text }]}>
            {allocation.message}
          </Text>
          {evaluation.isValidBudget ? (
            <Text style={[styles.recSubtext, { color: theme.textSecondary }]}>
              {allocation.isGated
                ? `Investment Allocation (20% Rule): ${currencySymbol}0.00 • Gated on ${evaluation.status}`
                : `20% of ${formattedRemaining} remaining • Match: ${matching.summaryLabel}`}
            </Text>
          ) : null}
        </View>

        {!evaluation.isValidBudget && onPressSetBudget ? (
          <TouchableOpacity
            onPress={() => {
              safeHaptic('light');
              onPressSetBudget();
            }}
            activeOpacity={0.8}
            style={[styles.ctaButton, { backgroundColor: '#10B981' }]}
          >
            <Text style={styles.ctaButtonText}>Set Budget</Text>
          </TouchableOpacity>
        ) : !allocation.isGated &&
          allocation.recommendedAllocation > 0 &&
          onPressAllocateRecommended ? (
          <TouchableOpacity
            onPress={() => {
              safeHaptic('light');
              onPressAllocateRecommended(
                allocation.recommendedAllocation,
                matching.closestMatch?.ticker
              );
            }}
            activeOpacity={0.8}
            style={[styles.ctaButton, { backgroundColor: '#10B981' }]}
          >
            <Text style={styles.ctaButtonText}>
              Invest {currencySymbol}
              {allocation.recommendedAllocation.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </Text>
            <PhosphorIcon name="ArrowRight" size={12} color="#FFFFFF" weight="bold" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overline: {
    fontSize: 10.5,
    fontFamily: Fonts.bold,
    letterSpacing: 0.7,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontFamily: Fonts.bold,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: 1,
    height: 24,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: Fonts.medium,
  },
  metricVal: {
    fontSize: 12.5,
    fontFamily: Fonts.bold,
  },
  recommendationBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  recTextCol: {
    flex: 1,
    gap: 3,
  },
  recHeadline: {
    fontSize: 12.5,
    fontFamily: Fonts.bold,
    lineHeight: 17,
  },
  recSubtext: {
    fontSize: 10.5,
    fontFamily: Fonts.medium,
    lineHeight: 15,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: Fonts.bold,
  },
});
