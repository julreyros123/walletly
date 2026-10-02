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
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { Fonts } from '@/constants/theme';
import { useGamificationStore, getCycleMetrics } from '@/store/gamificationStore';
import { toast } from '@/store/toastStore';
import { safeHaptic } from '@/utils/haptics';
import { useCurrency } from '@/utils/currency';

interface DepositFundsModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function DepositFundsModal({ visible, onClose }: DepositFundsModalProps) {
  const insets = useSafeAreaInsets();
  const { symbol: currencySymbol } = useCurrency();
  const store = useGamificationStore();
  const [amount, setAmount] = useState('');

  const cycleMetrics = getCycleMetrics(store);
  const availableToTransfer = Math.max(0, cycleMetrics.balance);

  const numericAmount = parseFloat((amount || '').replace(/[^0-9.]/g, '')) || 0;
  const isOverAllowance = numericAmount > availableToTransfer;
  const canDeposit = numericAmount > 0 && !isOverAllowance;

  const handleDepositFromAllowance = () => {
    if (!canDeposit) {
      safeHaptic('error');
      if (isOverAllowance) {
        toast.warning(
          'Insufficient Balance',
          `You only have ${currencySymbol}${availableToTransfer.toLocaleString()} in your ${cycleMetrics.cycleName.toLowerCase()} allowance.`
        );
      } else {
        toast.warning('Enter an Amount', 'Please enter how much you want to deposit.');
      }
      return;
    }

    const success = store.allocateToSimulation(numericAmount);
    if (success) {
      safeHaptic('success');
      store.addXP(15);
      toast.success(
        'Funds Transferred (+15 XP)',
        `${currencySymbol}${numericAmount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })} transferred to Buying Power.`
      );
      setAmount('');
      onClose();
    } else {
      safeHaptic('error');
      toast.error('Transfer Failed', 'Could not complete transfer.');
    }
  };

  const handleQuickFill = (val: number) => {
    safeHaptic('light');
    setAmount(val.toString());
  };

  const handleFillMax = () => {
    safeHaptic('light');
    if (availableToTransfer > 0) {
      setAmount(Math.floor(availableToTransfer).toString());
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              {/* iOS Drag Handle */}
              <View style={styles.dragPill} />

              {/* Header Navigation Bar */}
              <View style={styles.header}>
                <View style={styles.headerTitleGroup}>
                  <Text style={styles.headerTitle}>Fund Brokerage</Text>
                  <Text style={styles.headerSubtitle}>
                    Instant transfer to trading buying power
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    safeHaptic('light');
                    onClose();
                  }}
                  style={styles.closeBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <PhosphorIcon name="X" size={16} color="#8D99AE" weight="bold" />
                </TouchableOpacity>
              </View>

              {/* Interactive Transfer Route Architecture (From -> To) */}
              <View style={styles.routeContainer}>
                {/* Source Account Card */}
                <View style={styles.accountCard}>
                  <View style={styles.accountIconWrap}>
                    <PhosphorIcon name="Wallet" size={18} color="#10B981" weight="fill" />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>Allowance Wallet</Text>
                    <Text style={styles.accountDesc}>
                      {currencySymbol}{Math.round(availableToTransfer).toLocaleString()} available
                    </Text>
                  </View>
                  <View style={styles.accountBadge}>
                    <Text style={styles.accountBadgeText}>SOURCE</Text>
                  </View>
                </View>

                {/* Linking Directional Arrow */}
                <View style={styles.routeConnector}>
                  <View style={styles.routeLine} />
                  <View style={styles.arrowCircle}>
                    <PhosphorIcon name="ArrowsDownUp" size={13} color="#6EE7B7" weight="bold" />
                  </View>
                  <View style={styles.routeLine} />
                </View>

                {/* Destination Account Card */}
                <View style={styles.accountCard}>
                  <View style={[styles.accountIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <PhosphorIcon name="ChartLineUp" size={18} color="#3B82F6" weight="fill" />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>Trading Buying Power</Text>
                    <Text style={styles.accountDesc}>
                      Current: {currencySymbol}{store.virtualBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={[styles.accountBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                    <Text style={[styles.accountBadgeText, { color: '#3B82F6' }]}>DESTINATION</Text>
                  </View>
                </View>
              </View>

              {/* Large Hero Currency Display & Input */}
              <View style={[styles.heroInputCard, isOverAllowance && styles.heroInputCardError]}>
                <Text style={styles.heroPrefix}>{currencySymbol}</Text>
                <TextInput
                  style={styles.heroInput}
                  placeholder="0.00"
                  placeholderTextColor="rgba(255, 255, 255, 0.25)"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus={true}
                  selectionColor="#10B981"
                />
              </View>

              {isOverAllowance && (
                <View style={styles.errorNotice}>
                  <PhosphorIcon name="Warning" size={14} color="#EF4444" weight="fill" />
                  <Text style={styles.errorNoticeText}>
                    Amount exceeds available allowance ({currencySymbol}{Math.round(availableToTransfer).toLocaleString()})
                  </Text>
                </View>
              )}

              {/* Quick Amount Preset Chips */}
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleQuickFill(100)}
                >
                  <Text style={styles.presetText}>+{currencySymbol}100</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleQuickFill(500)}
                >
                  <Text style={styles.presetText}>+{currencySymbol}500</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleQuickFill(1000)}
                >
                  <Text style={styles.presetText}>+{currencySymbol}1,000</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetChip, styles.presetChipMax]}
                  onPress={handleFillMax}
                >
                  <Text style={styles.presetTextMax}>Max</Text>
                </TouchableOpacity>
              </View>

              {/* Financial Transaction Metadata Table */}
              <View style={styles.metaTable}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Settlement Speed</Text>
                  <Text style={styles.metaValueHighlight}>Instant Execution</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Transfer Fee</Text>
                  <Text style={styles.metaValueFree}>₱0.00 (Zero Fee)</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Available for Trading</Text>
                  <Text style={styles.metaValue}>Immediately</Text>
                </View>
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity
                style={[styles.primaryCta, !canDeposit && styles.primaryCtaDisabled]}
                onPress={handleDepositFromAllowance}
                activeOpacity={0.8}
                disabled={!canDeposit}
              >
                <PhosphorIcon
                  name="CheckCircle"
                  size={18}
                  color={canDeposit ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)'}
                  weight="bold"
                />
                <Text style={[styles.primaryCtaText, !canDeposit && styles.primaryCtaTextDisabled]}>
                  {numericAmount > 0
                    ? `Transfer ${currencySymbol}${numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    : 'Enter Transfer Amount'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 24, 0.85)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    minHeight: SCREEN_HEIGHT * 0.72,
    justifyContent: 'flex-start',
  },
  dragPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#8D99AE',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 16,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  accountIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 13.5,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  accountDesc: {
    fontSize: 11.5,
    fontFamily: Fonts.regular,
    color: '#8D99AE',
    marginTop: 1,
  },
  accountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  accountBadgeText: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: '#10B981',
    letterSpacing: 0.5,
  },
  routeConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  routeLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  arrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  heroInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 72,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  heroInputCardError: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  heroPrefix: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: '#10B981',
    marginRight: 6,
  },
  heroInput: {
    fontSize: 36,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    minWidth: 120,
    textAlign: 'left',
  },
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  errorNoticeText: {
    fontSize: 11.5,
    fontFamily: Fonts.medium,
    color: '#EF4444',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetChipMax: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  presetText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
  presetTextMax: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#10B981',
  },
  metaTable: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
    marginBottom: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11.5,
    fontFamily: Fonts.regular,
    color: '#8D99AE',
  },
  metaValue: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#FFFFFF',
  },
  metaValueHighlight: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#10B981',
  },
  metaValueFree: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#6EE7B7',
  },
  primaryCta: {
    height: 50,
    backgroundColor: '#10B981',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  primaryCtaDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  primaryCtaText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  primaryCtaTextDisabled: {
    color: 'rgba(255, 255, 255, 0.35)',
  },
});
