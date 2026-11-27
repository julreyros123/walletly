import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { useTheme } from '@/hooks/use-theme';
import { Fonts } from '@/constants/theme';
import { safeHaptic } from '@/utils/haptics';
import { formatNumberMask, parseMaskedNumber } from '@/utils/currency';

export interface RecurringScheduleItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly';
  nextDueDate: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface RecurringTransactionsCardProps {
  schedules: readonly RecurringScheduleItem[];
  currencySymbol: string;
  todayISO: string;
  nextCycleISO: (freq: 'daily' | 'weekly' | 'monthly') => string;
  onAddSchedule: (item: {
    name: string;
    category: string;
    amount: number;
    type: 'income' | 'expense';
    frequency: 'daily' | 'weekly' | 'monthly';
    nextDueDate: string;
    notes?: string;
  }) => void;
  onToggleSchedule: (id: string) => void;
  onDeleteSchedule: (id: string) => void;
}

const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'School',
  'Bills',
  'Shopping',
  'Entertainment',
  'Savings',
];

const INCOME_CATEGORIES = ['Allowance', 'Part-Time', 'Scholarship', 'Gift'];

const FREQUENCIES: { id: 'daily' | 'weekly' | 'monthly'; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export function RecurringTransactionsCard({
  schedules,
  currencySymbol,
  todayISO,
  nextCycleISO,
  onAddSchedule,
  onToggleSchedule,
  onDeleteSchedule,
}: RecurringTransactionsCardProps) {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';

  const [showModal, setShowModal] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('Allowance');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [startImmediately, setStartImmediately] = useState(true);

  const cardBg = isDark ? '#131D31' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';
  const subBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC';

  const handleOpenAdd = () => {
    safeHaptic('light');
    setTxType('income');
    setCategory('Allowance');
    setName('');
    setAmountStr('');
    setFrequency('weekly');
    setStartImmediately(true);
    setShowModal(true);
  };

  const handleSave = () => {
    const parsedAmount = parseMaskedNumber(amountStr);
    if (!name.trim() || parsedAmount <= 0) {
      safeHaptic('error');
      return;
    }
    safeHaptic('success');
    const due = startImmediately ? todayISO : nextCycleISO(frequency);
    onAddSchedule({
      name: name.trim(),
      category,
      amount: parsedAmount,
      type: txType,
      frequency,
      nextDueDate: due,
    });
    setShowModal(false);
  };

  const categories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <View style={styles.titleLine}>
            <PhosphorIcon name="Clock" size={16} color="#10B981" weight="fill" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Recurring Schedules
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Auto-logs allowance & repeated expenses on due dates
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleOpenAdd}
          activeOpacity={0.8}
          style={styles.addBtn}
        >
          <PhosphorIcon name="Plus" size={13} color="#FFFFFF" weight="bold" />
          <Text style={styles.addBtnText}>Schedule</Text>
        </TouchableOpacity>
      </View>

      {schedules.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: subBg, borderColor: cardBorder }]}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No recurring allowance or bills scheduled yet. Tap &quot;+ Schedule&quot; to automate repeated entries.
          </Text>
        </View>
      ) : (
        <View style={styles.listCol}>
          {schedules.map((item) => {
            const isIncome = item.type === 'income';
            return (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  {
                    backgroundColor: subBg,
                    borderColor: cardBorder,
                    opacity: item.isActive ? 1 : 0.55,
                  },
                ]}
              >
                <View style={styles.itemLeft}>
                  <View
                    style={[
                      styles.iconDot,
                      {
                        backgroundColor: isIncome
                          ? 'rgba(16, 185, 129, 0.14)'
                          : 'rgba(239, 68, 68, 0.14)',
                      },
                    ]}
                  >
                    <PhosphorIcon
                      name={isIncome ? 'TrendUp' : 'TrendDown'}
                      size={14}
                      color={isIncome ? '#10B981' : '#EF4444'}
                      weight="bold"
                    />
                  </View>
                  <View style={styles.itemMeta}>
                    <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemSub, { color: theme.textSecondary }]}>
                      {item.frequency.toUpperCase()} • Next: {item.nextDueDate}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemRight}>
                  <Text
                    style={[
                      styles.itemAmount,
                      { color: isIncome ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {isIncome ? '+' : '-'}
                    {currencySymbol}
                    {item.amount.toLocaleString()}
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      safeHaptic('light');
                      onToggleSchedule(item.id);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <PhosphorIcon
                      name={item.isActive ? 'CheckCircle' : 'Clock'}
                      size={18}
                      color={item.isActive ? '#10B981' : theme.textSecondary}
                      weight="fill"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      safeHaptic('light');
                      onDeleteSchedule(item.id);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <PhosphorIcon name="Trash" size={15} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Add Recurring Schedule Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <View
              style={[
                styles.modalSheet,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  New Recurring Schedule
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <PhosphorIcon name="X" size={18} color={theme.textSecondary} weight="bold" />
                </TouchableOpacity>
              </View>

              {/* Type Switch */}
              <View style={[styles.segmentRow, { backgroundColor: subBg }]}>
                {(['income', 'expense'] as const).map((t) => {
                  const active = txType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => {
                        safeHaptic('light');
                        setTxType(t);
                        setCategory(t === 'income' ? 'Allowance' : 'Food');
                      }}
                      style={[
                        styles.segmentBtn,
                        active && {
                          backgroundColor: t === 'income' ? '#10B981' : '#EF4444',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          { color: active ? '#FFFFFF' : theme.textSecondary },
                        ]}
                      >
                        {t === 'income' ? 'Recurring Income' : 'Recurring Expense'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                placeholder={
                  txType === 'income'
                    ? 'e.g. Weekly Baon Allowance'
                    : 'e.g. Daily Jeepney Fare / Mobile Load'
                }
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
                style={[
                  styles.textInput,
                  { backgroundColor: subBg, borderColor: cardBorder, color: theme.text },
                ]}
              />

              <TextInput
                placeholder={`Amount (${currencySymbol})`}
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={amountStr}
                onChangeText={(txt) => setAmountStr(formatNumberMask(txt))}
                style={[
                  styles.textInput,
                  { backgroundColor: subBg, borderColor: cardBorder, color: theme.text },
                ]}
              />

              {/* Category Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {categories.map((cat) => {
                  const sel = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: sel ? '#10B981' : subBg,
                          borderColor: sel ? '#10B981' : cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: sel ? '#FFFFFF' : theme.textSecondary },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Frequency Selector */}
              <View style={styles.freqRow}>
                {FREQUENCIES.map((f) => {
                  const sel = frequency === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => setFrequency(f.id)}
                      style={[
                        styles.freqBtn,
                        {
                          backgroundColor: sel ? '#10B981' : subBg,
                          borderColor: sel ? '#10B981' : cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: sel ? '#FFFFFF' : theme.textSecondary },
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Start Timing Toggle */}
              <TouchableOpacity
                onPress={() => setStartImmediately((prev) => !prev)}
                style={[styles.timingToggle, { backgroundColor: subBg, borderColor: cardBorder }]}
              >
                <PhosphorIcon
                  name={startImmediately ? 'CheckCircle' : 'MinusCircle'}
                  size={18}
                  color="#10B981"
                  weight="fill"
                />
                <Text style={[styles.timingText, { color: theme.text }]}>
                  Log first entry today ({todayISO}) and auto-repeat {frequency}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.85}
                style={styles.saveBtn}
              >
                <Text style={styles.saveBtnText}>Save Recurring Schedule</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleCol: {
    flex: 1,
    gap: 2,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  addBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: Fonts.bold,
  },
  emptyBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  emptyText: {
    fontSize: 11.5,
    fontFamily: Fonts.medium,
    lineHeight: 16,
  },
  listCol: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  iconDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMeta: {
    flex: 1,
    gap: 1,
  },
  itemName: {
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  itemSub: {
    fontSize: 10.5,
    fontFamily: Fonts.medium,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemAmount: {
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 24, 0.78)',
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    width: '100%',
  },
  modalSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16.5,
    fontFamily: Fonts.bold,
  },
  segmentRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  textInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13.5,
    fontFamily: Fonts.medium,
  },
  chipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11.5,
    fontFamily: Fonts.bold,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  timingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  timingText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: Fonts.medium,
  },
  saveBtn: {
    backgroundColor: '#10B981',
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
});
