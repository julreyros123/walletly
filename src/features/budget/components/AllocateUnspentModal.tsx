import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, Alert, Platform } from 'react-native';
import { YStack, XStack } from 'tamagui';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { FormInput } from '@/components/ui/FormInput';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useGamificationStore, getCycleMetrics, format12HourTime, formatShortDate } from '@/store/gamificationStore';
import { useCurrency } from '@/utils/currency';
import { safeHaptic } from '@/utils/haptics';

interface AllocateUnspentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AllocateUnspentModal({ visible, onClose, onSuccess }: AllocateUnspentModalProps) {
  const theme = useTheme() as any;
  const isDark = theme.mode === 'dark';
  const store = useGamificationStore();
  const { symbol: currencySymbol } = useCurrency();

  const cycleMetrics = useMemo(
    () => getCycleMetrics(store),
    [store.totalBudget, store.budgetType, store.loggedExpenses]
  );

  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const now = new Date();
  const formattedDate = formatShortDate(now);
  const formattedTime = format12HourTime(now);

  const availableBalance = cycleMetrics.balance;

  const handleSaveAll = () => {
    safeHaptic('light');
    setAmountInput(availableBalance.toString());
  };

  const handleQuickAdd = (amt: number) => {
    safeHaptic('light');
    setAmountInput(Math.min(amt, availableBalance).toString());
  };

  const handleSubmit = () => {
    safeHaptic('success');
    const amt = parseFloat((amountInput || '').replace(/[^0-9.]/g, ''));
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to save.');
      return;
    }

    if (amt > availableBalance) {
      Alert.alert(
        'Insufficient Balance',
        `You only have ${currencySymbol}${availableBalance.toLocaleString()} remaining in your ${cycleMetrics.cycleName.toLowerCase()}.`
      );
      return;
    }

    const defaultNote = noteInput.trim() || `Unspent ${cycleMetrics.cycleName.toLowerCase()} surplus`;
    const success = store.allocateUnspentSavings(amt, defaultNote);

    if (success) {
      setAmountInput('');
      setNoteInput('');
      onClose();
      Alert.alert(
        'Saved to Vault! 🎉',
        `${currencySymbol}${amt.toLocaleString()} has been safely allocated to your Savings Vault (+15 XP). Recorded at ${formattedTime}.`
      );
      onSuccess?.();
    } else {
      Alert.alert('Unable to Save', 'Could not allocate unspent funds at this time.');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center" paddingBottom={12} borderBottomWidth={1} borderBottomColor={isDark ? '#334155' : '#E2E8F0'}>
            <XStack alignItems="center" gap={10}>
              <View style={[styles.iconCircle, { backgroundColor: '#10B981' }]}>
                <PhosphorIcon name="PiggyBank" size={18} color="#FFFFFF" weight="fill" />
              </View>
              <YStack gap={1}>
                <Text style={[styles.title, { color: theme.text }]}>Save Unspent Baon</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Allocate surplus balance to Savings Vault</Text>
              </YStack>
            </XStack>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <PhosphorIcon name="XCircle" size={20} color={theme.textSecondary} weight="fill" />
            </TouchableOpacity>
          </XStack>

          {/* Body */}
          <YStack gap={14} paddingTop={14}>
            {/* Available Balance Box */}
            <View style={[styles.balanceBox, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text style={[styles.balanceBoxLabel, { color: theme.textSecondary }]}>
                  {cycleMetrics.cycleName} Leftover:
                </Text>
                <Text style={[styles.balanceBoxValue, { color: '#10B981' }]}>
                  {currencySymbol}{availableBalance.toLocaleString()}
                </Text>
              </XStack>
            </View>

            {/* Quick Action Chips */}
            {availableBalance > 0 && (
              <XStack gap={8} flexWrap="wrap">
                <TouchableOpacity onPress={handleSaveAll} style={[styles.chip, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}>
                  <Text style={[styles.chipText, { color: '#10B981', fontFamily: Fonts.bold }]}>
                    Save All ({currencySymbol}{availableBalance.toLocaleString()})
                  </Text>
                </TouchableOpacity>
                {availableBalance >= 10 && (
                  <TouchableOpacity onPress={() => handleQuickAdd(10)} style={[styles.chip, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: theme.border }]}>
                    <Text style={[styles.chipText, { color: theme.text }]}>{currencySymbol}10</Text>
                  </TouchableOpacity>
                )}
                {availableBalance >= 20 && (
                  <TouchableOpacity onPress={() => handleQuickAdd(20)} style={[styles.chip, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: theme.border }]}>
                    <Text style={[styles.chipText, { color: theme.text }]}>{currencySymbol}20</Text>
                  </TouchableOpacity>
                )}
                {availableBalance >= 50 && (
                  <TouchableOpacity onPress={() => handleQuickAdd(50)} style={[styles.chip, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: theme.border }]}>
                    <Text style={[styles.chipText, { color: theme.text }]}>{currencySymbol}50</Text>
                  </TouchableOpacity>
                )}
              </XStack>
            )}

            {/* Amount Input */}
            <FormInput
              label={`Amount to Save (${currencySymbol})`}
              placeholder="e.g. 40"
              keyboardType="numeric"
              value={amountInput}
              onChangeText={setAmountInput}
            />

            {/* Optional Note */}
            <FormInput
              label="Note (Optional)"
              placeholder={`e.g. ${cycleMetrics.cycleName} surplus`}
              value={noteInput}
              onChangeText={setNoteInput}
            />

            {/* 12-Hour Timestamp Preview */}
            <View style={[styles.timestampRow, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
              <PhosphorIcon name="Clock" size={14} color="#10B981" weight="bold" />
              <Text style={[styles.timestampText, { color: theme.textSecondary }]}>
                Timestamp: <Text style={{ color: theme.text, fontFamily: Fonts.bold }}>{formattedDate} • {formattedTime}</Text>
              </Text>
            </View>

            {/* Action Buttons */}
            <XStack gap={10} marginTop={4}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelBtn, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                style={[styles.submitBtn, { opacity: availableBalance <= 0 ? 0.6 : 1 }]}
                disabled={availableBalance <= 0}
              >
                <Text style={styles.submitBtnText}>Deposit to Vault (+15 XP)</Text>
              </TouchableOpacity>
            </XStack>
          </YStack>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  balanceBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  balanceBoxLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  balanceBoxValue: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  timestampText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
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
    fontFamily: Fonts.bold,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
});
