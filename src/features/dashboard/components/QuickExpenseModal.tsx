import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { Fonts } from '@/constants/theme';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { toast } from '@/store/toastStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { useCurrency, formatNumberMask, parseMaskedNumber } from '@/utils/currency';
import { useTheme } from '@/hooks/use-theme';

interface QuickExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (amount: number, name: string, category: string) => void;
}

const DEFAULT_CATEGORIES = [
  'Food',
  'Transportation',
  'School',
  'Bills',
  'Shopping',
  'Entertainment',
  'Savings',
  'Other',
];

export function QuickExpenseModal({
  visible,
  onClose,
  onSave,
}: QuickExpenseModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const selectedCategories = useGamificationStore((state) => state.selectedCategories);
  const { currency: currencyCode, symbol: currencySymbol } = useCurrency();

  const categories =
    selectedCategories && selectedCategories.length > 0
      ? selectedCategories
      : DEFAULT_CATEGORIES;

  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Food');

  const handleConfirm = () => {
    const num = parseMaskedNumber(amount);
    if (isNaN(num) || num <= 0) {
      toast.warning('Invalid Amount', 'Please enter a valid expense amount.');
      return;
    }

    const expenseName = name.trim() || `${category} Expense`;
    onSave(num, expenseName, category);

    // Reset inputs
    setAmount('');
    setName('');
    onClose();
  };

  const isDark = theme.mode === 'dark';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            },
          ]}
        >
          {/* Sheet Handle */}
          <View
            style={[
              styles.sheetHandle,
              { backgroundColor: isDark ? '#475569' : '#CBD5E1' },
            ]}
          />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Quick Log Expense</Text>
            <InteractivePressable
              onPress={() => {
                Keyboard.dismiss();
                onClose();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <PhosphorIcon
                name="XCircle"
                size={22}
                color={theme.textSecondary}
                weight="fill"
              />
            </InteractivePressable>
          </View>

          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Amount ({currencyCode})</Text>
              <View
                style={[
                  styles.amountInputRow,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                <TextInput
                  value={amount}
                  onChangeText={(val) => setAmount(formatNumberMask(val))}
                  placeholder="0.00"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  style={[styles.amountInput, { color: theme.text }]}
                />
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Description</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Lunch, Grab Ride, Books"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
              />
            </View>

            {/* Category Chips */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Category</Text>
              <View style={styles.categoriesWrap}>
                {categories.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <InteractivePressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: isDark ? '#0F172A' : '#F5F5F5',
                          borderColor: theme.border,
                        },
                        isSelected && styles.categoryChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: theme.textSecondary },
                          isSelected && styles.categoryChipTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </InteractivePressable>
                  );
                })}
              </View>
            </View>

            {/* Confirm Button */}
            <InteractivePressable
              onPress={handleConfirm}
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmBtnText}>Confirm & Log Expense</Text>
            </InteractivePressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: Fonts.bold,
  },
  inputGroup: {
    gap: 6,
    marginBottom: 14,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  currencySymbol: {
    color: '#10B981',
    fontSize: 22,
    fontFamily: Fonts.bold,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: Fonts.bold,
    padding: 0,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  confirmBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
});

export default QuickExpenseModal;
