import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { useTheme } from '@/hooks/use-theme';
import { Fonts } from '@/constants/theme';
import { safeHaptic } from '@/utils/haptics';
import {
  BUDGET_STATUS,
  runDecisionSupportEngine,
  simulateInvestmentReplay,
  type MatchableAsset,
} from '@/utils/decisionEngine';
import {
  BUNDLED_FINNHUB_CHANGES,
  getAssetReplayHistory,
  type PriceHistorySource,
} from '@/services/finnhubApi';

export interface RuleBasedSimulatorCardProps {
  budget: number;
  spent: number;
  isBudgetSetupComplete: boolean;
  assets: readonly MatchableAsset[];
  currencySymbol: string;
  onAllocateRecommended: (amount: number) => void;
  onSelectTicker?: (ticker: string) => void;
}

const PERIOD_OPTIONS = [5, 7, 10] as const;

export function RuleBasedSimulatorCard({
  budget,
  spent,
  isBudgetSetupComplete,
  assets,
  currencySymbol,
  onAllocateRecommended,
  onSelectTicker,
}: RuleBasedSimulatorCardProps) {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';

  const [selectedTicker, setSelectedTicker] = useState<string>('LITE');
  const [initialAmountStr, setInitialAmountStr] = useState<string>('1000');
  const [simDays, setSimDays] = useState<number>(5);
  const [historyChanges, setHistoryChanges] = useState<number[]>(
    BUNDLED_FINNHUB_CHANGES.LITE
  );
  const [historySource, setHistorySource] =
    useState<PriceHistorySource>('bundled_sample');

  const effectiveBudget = isBudgetSetupComplete || spent > 0 ? budget : 0;

  const decision = useMemo(
    () =>
      runDecisionSupportEngine({
        budget: effectiveBudget,
        expenses: spent,
        assets,
        currencySymbol,
      }),
    [effectiveBudget, spent, assets, currencySymbol]
  );

  useEffect(() => {
    let cancelled = false;
    getAssetReplayHistory(selectedTicker, true)
      .then((res) => {
        if (!cancelled) {
          setHistoryChanges(res.changes);
          setHistorySource(res.source);
        }
      })
      .catch((err) => {
        console.warn('[RuleBasedSimulatorCard] History load warning:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTicker]);

  const activeAsset = useMemo(
    () => assets.find((a) => a.ticker === selectedTicker) ?? assets[0],
    [assets, selectedTicker]
  );

  const parsedAmount = parseFloat(initialAmountStr.replace(/[^0-9.]/g, '')) || 0;
  const startingPrice = activeAsset?.price ?? 50;

  const replay = useMemo(
    () =>
      simulateInvestmentReplay(
        parsedAmount,
        startingPrice,
        historyChanges,
        simDays
      ),
    [parsedAmount, startingPrice, historyChanges, simDays]
  );

  const cardBg = isDark ? '#1C2541' : theme.surface;
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : theme.border;
  const subBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC';

  const statusColor =
    decision.evaluation.status === BUDGET_STATUS.OVERSPENDING
      ? '#EF4444'
      : decision.evaluation.status === BUDGET_STATUS.WARNING
      ? '#F59E0B'
      : decision.evaluation.status === BUDGET_STATUS.WITHIN_BUDGET
      ? '#10B981'
      : '#64748B';

  const sourceLabel =
    historySource === 'finnhub_live'
      ? 'Finnhub Saved'
      : historySource === 'sqlite_cached'
      ? 'SQLite Offline'
      : 'Bundled Replay';

  const isPositiveReturn = replay.totalGainLoss >= 0;

  return (
    <View style={[styles.wrapper, { gap: 14 }]}>
      {/* CARD 1: Equation 2 Investment Gate & Finnhub Stock Matching */}
      <View
        style={[
          styles.card,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <PhosphorIcon name="Scales" size={16} color={statusColor} weight="fill" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              20% Allocation & Stock Matcher
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: `${statusColor}18`,
                borderColor: `${statusColor}40`,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {decision.evaluation.status}
            </Text>
          </View>
        </View>

        <Text style={[styles.messageText, { color: theme.textSecondary }]}>
          {decision.allocation.message}
        </Text>

        {/* Matched Affordable Instruments (Price <= IA) */}
        {!decision.allocation.isGated ? (
          <View style={styles.matchesBlock}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              {decision.matching.matchedAssets.length > 0
                ? `FINNHUB AFFORDABLE MATCHES (≤ ${currencySymbol}${decision.allocation.recommendedAllocation.toFixed(2)})`
                : 'FRACTIONAL SHARE ELIGIBLE'}
            </Text>
            {decision.matching.matchedAssets.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {decision.matching.matchedAssets.map((item) => (
                  <TouchableOpacity
                    key={item.ticker}
                    onPress={() => {
                      safeHaptic('light');
                      setSelectedTicker(item.ticker);
                      if (onSelectTicker) onSelectTicker(item.ticker);
                    }}
                    activeOpacity={0.75}
                    style={[
                      styles.matchChip,
                      {
                        backgroundColor: subBg,
                        borderColor:
                          selectedTicker === item.ticker ? '#10B981' : cardBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.matchTicker, { color: theme.text }]}>
                      {item.ticker}
                    </Text>
                    <Text style={styles.matchPrice}>
                      {currencySymbol}
                      {item.price.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}

            <TouchableOpacity
              onPress={() => {
                safeHaptic('light');
                onAllocateRecommended(decision.allocation.recommendedAllocation);
              }}
              activeOpacity={0.8}
              style={styles.allocateBtn}
            >
              <PhosphorIcon name="ArrowRight" size={16} color="#FFFFFF" weight="bold" />
              <Text style={styles.allocateBtnText}>
                Transfer Recommended {currencySymbol}
                {decision.allocation.recommendedAllocation.toFixed(2)} (20% RB)
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.gatedNotice, { backgroundColor: subBg, borderColor: cardBorder }]}>
            <PhosphorIcon name="Lock" size={15} color={statusColor} weight="fill" />
            <Text style={[styles.gatedText, { color: theme.textSecondary }]}>
              Recommended Allocation: {currencySymbol}0.00 — Finnhub stock matching is gated until spending is below 80% of budget.
            </Text>
          </View>
        )}
      </View>

      {/* CARD 2: Equation 4 Multi-Day Price Replay Simulator */}
      <View
        style={[
          styles.card,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <PhosphorIcon name="ChartLineUp" size={16} color="#10B981" weight="fill" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Price Replay Simulator
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: 'rgba(56, 189, 248, 0.14)',
                borderColor: 'rgba(56, 189, 248, 0.3)',
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: '#38BDF8' }]}>
              {sourceLabel}
            </Text>
          </View>
        </View>

        <Text style={[styles.messageText, { color: theme.textSecondary }]}>
          Replays recorded daily % price movements chronologically without risking real money.
        </Text>

        {/* Stock Ticker Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {assets.map((asset) => {
            const isSelected = asset.ticker === selectedTicker;
            return (
              <TouchableOpacity
                key={asset.ticker}
                onPress={() => {
                  safeHaptic('light');
                  setSelectedTicker(asset.ticker);
                }}
                activeOpacity={0.75}
                style={[
                  styles.tickerPill,
                  {
                    backgroundColor: isSelected ? '#10B981' : subBg,
                    borderColor: isSelected ? '#10B981' : cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tickerPillText,
                    { color: isSelected ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {asset.ticker} · {currencySymbol}
                  {asset.price.toFixed(0)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Hypothetical Starting Amount & Period Controls */}
        <View style={styles.controlsRow}>
          <View
            style={[
              styles.inputBox,
              { backgroundColor: subBg, borderColor: cardBorder },
            ]}
          >
            <Text style={[styles.currencyPrefix, { color: '#10B981' }]}>
              {currencySymbol}
            </Text>
            <TextInput
              value={initialAmountStr}
              onChangeText={setInitialAmountStr}
              keyboardType="numeric"
              placeholder="1000"
              placeholderTextColor={theme.textSecondary}
              style={[styles.amountInput, { color: theme.text }]}
            />
          </View>

          <View style={styles.periodGroup}>
            {PERIOD_OPTIONS.map((d) => {
              const active = simDays === d;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => {
                    safeHaptic('light');
                    setSimDays(d);
                  }}
                  activeOpacity={0.75}
                  style={[
                    styles.periodBtn,
                    {
                      backgroundColor: active ? '#10B981' : subBg,
                      borderColor: active ? '#10B981' : cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.periodBtnText,
                      { color: active ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {d}D
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Replay Outcome Summary */}
        {replay.steps.length > 0 ? (
          <>
            <View
              style={[
                styles.outcomeRow,
                { backgroundColor: subBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.outcomeCol}>
                <Text style={[styles.outcomeLabel, { color: theme.textSecondary }]}>
                  Shares (N)
                </Text>
                <Text style={[styles.outcomeValue, { color: theme.text }]}>
                  {replay.shares.toFixed(2)}
                </Text>
              </View>
              <View style={styles.outcomeCol}>
                <Text style={[styles.outcomeLabel, { color: theme.textSecondary }]}>
                  Day {replay.days} Value
                </Text>
                <Text style={[styles.outcomeValue, { color: theme.text }]}>
                  {currencySymbol}
                  {replay.finalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
              <View style={styles.outcomeCol}>
                <Text style={[styles.outcomeLabel, { color: theme.textSecondary }]}>
                  Gain / Loss
                </Text>
                <Text
                  style={[
                    styles.outcomeValue,
                    { color: isPositiveReturn ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {isPositiveReturn ? '+' : '-'}
                  {currencySymbol}
                  {Math.abs(replay.totalGainLoss).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Chronological Day-by-Day Table */}
            <View
              style={[
                styles.tableContainer,
                { borderColor: cardBorder },
              ]}
            >
              <View style={[styles.tableHeader, { backgroundColor: subBg }]}>
                <Text style={[styles.th, { flex: 0.7, color: theme.textSecondary }]}>
                  Day
                </Text>
                <Text style={[styles.th, { flex: 1, color: theme.textSecondary }]}>
                  Change
                </Text>
                <Text style={[styles.th, { flex: 1.1, color: theme.textSecondary }]}>
                  Price
                </Text>
                <Text style={[styles.th, { flex: 1.3, color: theme.textSecondary }]}>
                  Value
                </Text>
                <Text
                  style={[
                    styles.th,
                    { flex: 1.2, textAlign: 'right', color: theme.textSecondary },
                  ]}
                >
                  Gain/Loss
                </Text>
              </View>

              {replay.steps.map((step, idx) => {
                const glPos = step.gainLoss >= 0;
                const chgPos = (step.pctChange ?? 0) >= 0;
                return (
                  <View
                    key={step.day}
                    style={[
                      styles.tableRow,
                      idx < replay.steps.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: cardBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.td, { flex: 0.7, color: theme.text }]}>
                      {step.day}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        {
                          flex: 1,
                          color:
                            step.pctChange === null
                              ? theme.textSecondary
                              : chgPos
                              ? '#10B981'
                              : '#EF4444',
                        },
                      ]}
                    >
                      {step.pctChange === null
                        ? '—'
                        : `${chgPos ? '+' : ''}${step.pctChange.toFixed(1)}%`}
                    </Text>
                    <Text style={[styles.td, { flex: 1.1, color: theme.text }]}>
                      {currencySymbol}
                      {step.simulatedPrice.toFixed(2)}
                    </Text>
                    <Text style={[styles.td, { flex: 1.3, color: theme.text }]}>
                      {currencySymbol}
                      {step.value.toFixed(2)}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        {
                          flex: 1.2,
                          textAlign: 'right',
                          color:
                            step.day === 0
                              ? theme.textSecondary
                              : glPos
                              ? '#10B981'
                              : '#EF4444',
                        },
                      ]}
                    >
                      {step.day === 0
                        ? `${currencySymbol}0.00`
                        : `${glPos ? '+' : '-'}${currencySymbol}${Math.abs(
                            step.gainLoss
                          ).toFixed(2)}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  cardTitle: {
    fontSize: 14.5,
    fontFamily: Fonts.bold,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  messageText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 17,
  },
  matchesBlock: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    letterSpacing: 0.6,
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  matchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  matchTicker: {
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  matchPrice: {
    fontSize: 11.5,
    fontFamily: Fonts.semiBold,
    color: '#10B981',
  },
  allocateBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  allocateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  gatedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  gatedText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: Fonts.medium,
    lineHeight: 16,
  },
  tickerPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  tickerPillText: {
    fontSize: 11.5,
    fontFamily: Fonts.bold,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputBox: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 4,
  },
  currencyPrefix: {
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  amountInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.bold,
    padding: 0,
  },
  periodGroup: {
    flexDirection: 'row',
    gap: 5,
  },
  periodBtn: {
    height: 40,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnText: {
    fontSize: 11.5,
    fontFamily: Fonts.bold,
  },
  outcomeRow: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  outcomeCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  outcomeLabel: {
    fontSize: 10,
    fontFamily: Fonts.medium,
  },
  outcomeValue: {
    fontSize: 12.5,
    fontFamily: Fonts.bold,
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  th: {
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  td: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
});
