import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { Fonts } from '@/constants/theme';
import { safeHaptic } from '@/utils/haptics';

export type BudgetCycleType = 'daily' | 'weekly' | 'monthly';

export interface SetBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  currentCycle: BudgetCycleType;
  initialAmount: number;
  currencySymbol: string;
  onSave: (cycle: BudgetCycleType, amount: number) => void;
}

const PRESETS: Record<BudgetCycleType, number[]> = {
  daily: [50, 100, 150, 200, 300, 500],
  weekly: [500, 1000, 1500, 2000, 3000, 5000],
  monthly: [3000, 5000, 8000, 10000, 15000, 20000],
};

const CYCLE_META: Record<BudgetCycleType, { title: string; subtitle: string; icon: string }> = {
  daily: {
    title: 'Daily Baon Limit',
    subtitle: 'Set how much you plan to spend per day',
    icon: 'Sun',
  },
  weekly: {
    title: 'Weekly Allowance',
    subtitle: 'Set your overall allowance limit for the week',
    icon: 'CalendarX',
  },
  monthly: {
    title: 'Monthly Budget',
    subtitle: 'Set your total target spending for the month',
    icon: 'Wallet',
  },
};

export function SetBudgetModal({
  visible,
  onClose,
  currentCycle,
  initialAmount,
  currencySymbol,
  onSave,
}: SetBudgetModalProps) {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';

  const [selectedCycle, setSelectedCycle] = useState<BudgetCycleType>(currentCycle);
  const [amountInput, setAmountInput] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setSelectedCycle(currentCycle);
      setAmountInput(initialAmount > 0 ? initialAmount.toString() : '');
    }
  }, [visible, currentCycle, initialAmount]);

  const parsedAmount = useMemo(() => {
    const num = parseFloat(amountInput.replace(/,/g, ''));
    return isNaN(num) || num <= 0 ? 0 : num;
  }, [amountInput]);

  const categoryBreakdown = useMemo(() => {
    if (parsedAmount <= 0) return null;
    return {
      food: Math.round(parsedAmount * 0.35),
      transport: Math.round(parsedAmount * 0.20),
      school: Math.round(parsedAmount * 0.15),
      bills: Math.round(parsedAmount * 0.15),
      other: Math.round(parsedAmount * 0.15),
    };
  }, [parsedAmount]);

  const handleSelectPreset = (val: number) => {
    safeHaptic('light');
    setAmountInput(val.toString());
  };

  const handleCycleChange = (cycle: BudgetCycleType) => {
    safeHaptic('light');
    setSelectedCycle(cycle);
  };

  const handleSave = () => {
    if (parsedAmount <= 0) {
      safeHaptic('error');
      return;
    }
    safeHaptic('success');
    onSave(selectedCycle, parsedAmount);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          {/* Top Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconPill,
                  { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)' },
                ]}
              >
                <PhosphorIcon name="Wallet" size={20} color="#10B981" weight="fill" />
              </View>
              <View>
                <Text
                  style={[
                    styles.title,
                    { color: isDark ? '#F1F5F9' : '#0F172A', fontFamily: Fonts.bold },
                  ]}
                >
                  {CYCLE_META[selectedCycle].title}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: isDark ? '#94A3B8' : '#64748B', fontFamily: Fonts.medium },
                  ]}
                >
                  {CYCLE_META[selectedCycle].subtitle}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                safeHaptic('light');
                onClose();
              }}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? '#334155' : '#F5F5F5' },
              ]}
              activeOpacity={0.7}
            >
              <PhosphorIcon
                name="X"
                size={16}
                color={isDark ? '#94A3B8' : '#64748B'}
                weight="bold"
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Cycle Selector Chips */}
            <View
              style={[
                styles.cycleTrack,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F5F5F5',
                  borderColor: isDark ? '#334155' : '#E5E7EB',
                },
              ]}
            >
              {(['daily', 'weekly', 'monthly'] as BudgetCycleType[]).map((cycle) => {
                const isSelected = selectedCycle === cycle;
                const label = cycle === 'daily' ? 'Daily' : cycle === 'weekly' ? 'Weekly' : 'Monthly';
                return (
                  <TouchableOpacity
                    key={cycle}
                    onPress={() => handleCycleChange(cycle)}
                    style={[
                      styles.cycleTab,
                      isSelected && {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isDark ? 0.25 : 0.08,
                        shadowRadius: 3,
                        elevation: 2,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.cycleTabText,
                        {
                          color: isSelected
                            ? '#10B981'
                            : isDark
                            ? '#94A3B8'
                            : '#64748B',
                          fontFamily: isSelected ? Fonts.bold : Fonts.medium,
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Hero Amount Input Field */}
            <View style={styles.inputSection}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: isDark ? '#CBD5E1' : '#475569', fontFamily: Fonts.semiBold },
                ]}
              >
                Target Amount
              </Text>

              <View
                style={[
                  styles.heroInputContainer,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: parsedAmount > 0 ? '#10B981' : isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.currencyBadge}>
                  <Text style={[styles.currencyText, { fontFamily: Fonts.bold }]}>
                    {currencySymbol}
                  </Text>
                </View>

                <TextInput
                  value={amountInput}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9.]/g, '');
                    setAmountInput(cleaned);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                  style={[
                    styles.textInput,
                    {
                      color: isDark ? '#F8FAFC' : '#0F172A',
                      fontFamily: Fonts.extraBold,
                    },
                  ]}
                  maxLength={10}
                />

                {amountInput.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      safeHaptic('light');
                      setAmountInput('');
                    }}
                    style={styles.clearBtn}
                  >
                    <PhosphorIcon
                      name="XCircle"
                      size={18}
                      color={isDark ? '#64748B' : '#94A3B8'}
                      weight="fill"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Quick Preset Pills */}
            <View style={styles.presetSection}>
              <Text
                style={[
                  styles.presetSectionLabel,
                  { color: isDark ? '#94A3B8' : '#64748B', fontFamily: Fonts.semiBold },
                ]}
              >
                Quick Presets
              </Text>
              <View style={styles.presetsGrid}>
                {PRESETS[selectedCycle].map((val) => {
                  const isCurrent = parsedAmount === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      onPress={() => handleSelectPreset(val)}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: isCurrent
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isDark
                            ? '#0F172A'
                            : '#F5F5F5',
                          borderColor: isCurrent
                            ? '#10B981'
                            : isDark
                            ? '#334155'
                            : '#E5E7EB',
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          {
                            color: isCurrent
                              ? '#10B981'
                              : isDark
                              ? '#E2E8F0'
                              : '#334155',
                            fontFamily: isCurrent ? Fonts.bold : Fonts.semiBold,
                          },
                        ]}
                      >
                        {currencySymbol}{val.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Smart Category Preview */}
            <View
              style={[
                styles.previewContainer,
                {
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.previewHeader}>
                <PhosphorIcon name="Sparkle" size={15} color="#10B981" weight="fill" />
                <Text
                  style={[
                    styles.previewTitle,
                    { color: isDark ? '#E2E8F0' : '#334155', fontFamily: Fonts.bold },
                  ]}
                >
                  Recommended Category Split
                </Text>
              </View>

              {categoryBreakdown ? (
                <View style={styles.breakdownList}>
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: isDark ? '#94A3B8' : '#64748B', fontFamily: Fonts.medium }]}>
                      🍔 Food & Drinks (35%)
                    </Text>
                    <Text style={[styles.breakdownVal, { color: isDark ? '#F1F5F9' : '#0F172A', fontFamily: Fonts.bold }]}>
                      {currencySymbol}{categoryBreakdown.food.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: isDark ? '#94A3B8' : '#64748B', fontFamily: Fonts.medium }]}>
                      🚌 Commute / Transport (20%)
                    </Text>
                    <Text style={[styles.breakdownVal, { color: isDark ? '#F1F5F9' : '#0F172A', fontFamily: Fonts.bold }]}>
                      {currencySymbol}{categoryBreakdown.transport.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: isDark ? '#94A3B8' : '#64748B', fontFamily: Fonts.medium }]}>
                      🎓 School & Academics (15%)
                    </Text>
                    <Text style={[styles.breakdownVal, { color: isDark ? '#F1F5F9' : '#0F172A', fontFamily: Fonts.bold }]}>
                      {currencySymbol}{categoryBreakdown.school.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: isDark ? '#94A3B8' : '#64748B', fontFamily: Fonts.medium }]}>
                      🧾 Bills & Subscriptions (15%)
                    </Text>
                    <Text style={[styles.breakdownVal, { color: isDark ? '#F1F5F9' : '#0F172A', fontFamily: Fonts.bold }]}>
                      {currencySymbol}{categoryBreakdown.bills.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: isDark ? '#94A3B8' : '#64748B', fontFamily: Fonts.medium }]}>
                      🛍️ Fun & Essentials (15%)
                    </Text>
                    <Text style={[styles.breakdownVal, { color: isDark ? '#F1F5F9' : '#0F172A', fontFamily: Fonts.bold }]}>
                      {currencySymbol}{categoryBreakdown.other.toLocaleString()}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text
                  style={[
                    styles.emptyPreviewText,
                    { color: isDark ? '#64748B' : '#94A3B8', fontFamily: Fonts.medium },
                  ]}
                >
                  Type or choose an amount above to preview balanced limits for each category.
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View
            style={[
              styles.buttonRow,
              {
                borderTopColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                safeHaptic('light');
                onClose();
              }}
              style={[
                styles.cancelBtn,
                { backgroundColor: isDark ? '#334155' : '#F5F5F5' },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.cancelBtnText,
                  { color: isDark ? '#CBD5E1' : '#475569', fontFamily: Fonts.bold },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={parsedAmount <= 0}
              style={[
                styles.submitBtn,
                {
                  opacity: parsedAmount <= 0 ? 0.5 : 1,
                },
              ]}
              activeOpacity={0.85}
            >
              <PhosphorIcon name="CheckCircle" size={18} color="#FFFFFF" weight="fill" />
              <Text style={[styles.submitBtnText, { fontFamily: Fonts.bold }]}>
                Save Budget
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  cycleTrack: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
  },
  cycleTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleTabText: {
    fontSize: 12,
  },
  inputSection: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  heroInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 56,
  },
  currencyBadge: {
    paddingHorizontal: 6,
  },
  currencyText: {
    fontSize: 22,
    color: '#10B981',
  },
  textInput: {
    flex: 1,
    fontSize: 22,
    paddingHorizontal: 6,
    letterSpacing: -0.5,
  },
  clearBtn: {
    padding: 4,
  },
  presetSection: {
    gap: 8,
  },
  presetSectionLabel: {
    fontSize: 11.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
  },
  previewContainer: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewTitle: {
    fontSize: 12,
  },
  breakdownList: {
    gap: 6,
    marginTop: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11,
  },
  breakdownVal: {
    fontSize: 11.5,
  },
  emptyPreviewText: {
    fontSize: 11.5,
    lineHeight: 16,
    paddingVertical: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
  },
  submitBtn: {
    flex: 1.8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
  },
});
