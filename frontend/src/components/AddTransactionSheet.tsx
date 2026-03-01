import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  TextInput, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor } from 'react-native-reanimated';
import { format, isToday, subDays, addDays, startOfDay } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { Spacing, FontSize, Radius, FontFamily } from '../constants/theme';
import { PAYMENT_METHODS } from '../constants/categories';
import CustomNumpad from './CustomNumpad';
import { getAllCategories, insertTransaction, updateTransaction, type Category, type Transaction } from '../db/database';

const AnimatedToggle = ({ value, onToggle, colors }: { value: boolean; onToggle: () => void; colors: any }) => {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, { damping: 15, stiffness: 120 });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.border, colors.primary]),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(value ? 22 : 0, { damping: 15, stiffness: 120 }) }],
  }));

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
      <Animated.View style={[styles.toggle, trackStyle]}>
        <Animated.View style={[styles.toggleThumb, thumbStyle]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

interface AddTransactionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (id?: number) => void;
  editTransaction?: Transaction | null;
}

export default function AddTransactionSheet({ visible, onClose, onSaved, editTransaction }: AddTransactionSheetProps) {
  const { colors, defaultPaymentMethod } = useTheme();
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState(defaultPaymentMethod);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'weekly' | 'monthly'>('monthly');
  const [isSplit, setIsSplit] = useState(false);
  const [splitShareStr, setSplitShareStr] = useState('0');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (visible) {
      setCategories(getAllCategories());
      if (editTransaction) {
        setAmountStr(editTransaction.amount.toString());
        setSelectedCategoryId(editTransaction.categoryId);
        setNote(editTransaction.note || '');
        setSelectedDate(new Date(editTransaction.date));
        setPaymentMethod(editTransaction.paymentMethod);
        setIsRecurring(!!editTransaction.isRecurring);
        setRecurringInterval(editTransaction.recurringIntervalDays === 7 ? 'weekly' : 'monthly');
        setIsSplit(!!editTransaction.isSplit);
        setSplitShareStr(editTransaction.splitShare?.toString() || '0');
      } else {
        setAmountStr('0');
        setSelectedCategoryId(null);
        setNote('');
        setSelectedDate(new Date());
        setPaymentMethod(defaultPaymentMethod);
        setIsRecurring(false);
        setIsSplit(false);
        setSplitShareStr('0');
      }
    }
  }, [visible, editTransaction, defaultPaymentMethod]);

  const handleKeyPress = useCallback((key: string) => {
    setAmountStr(prev => {
      if (prev === '0' && key !== '.') return key;
      if (key === '.' && prev.includes('.')) return prev;
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
      const newVal = prev + key;
      if (parseFloat(newVal) > 9999999) return prev;
      return newVal;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setAmountStr(prev => prev.length <= 1 ? '0' : prev.slice(0, -1));
  }, []);

  const amount = parseFloat(amountStr) || 0;
  const canSave = amount > 0 && selectedCategoryId !== null;

  const handleSave = () => {
    if (!canSave) return;
    const txData = {
      amount,
      categoryId: selectedCategoryId!,
      note,
      date: editTransaction ? selectedDate.getTime() : (isToday(selectedDate) ? Date.now() : startOfDay(selectedDate).getTime() + 12 * 60 * 60 * 1000),
      paymentMethod,
      isRecurring: isRecurring ? 1 : 0,
      recurringIntervalDays: isRecurring ? (recurringInterval === 'weekly' ? 7 : 30) : null,
      isSplit: isSplit ? 1 : 0,
      splitShare: isSplit ? (parseFloat(splitShareStr) || 0) : null,
    };

    let txId: number;
    if (editTransaction) {
      updateTransaction({ ...txData, id: editTransaction.id });
      txId = editTransaction.id;
    } else {
      txId = insertTransaction(txData);
    }
    onSaved(txId);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent testID="add-transaction-modal">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          {/* Drag handle */}
          <View style={styles.dragHandleWrapper}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity testID="close-sheet-btn" onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {editTransaction ? 'Edit Transaction' : 'Add Expense'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
            {/* Amount Display */}
            <View style={styles.amountSection}>
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>₹</Text>
              <Text testID="amount-display" style={[styles.amountText, { color: colors.text }]}>
                {amountStr}
              </Text>
            </View>

            {/* Date Picker */}
            <View style={[styles.dateRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <TouchableOpacity
                onPress={() => setSelectedDate(subDays(selectedDate, 1))}
                style={styles.dateArrow}
              >
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.dateLabelContainer}>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, 'dd MMM yyyy')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  const tomorrow = addDays(selectedDate, 1);
                  if (tomorrow <= new Date()) setSelectedDate(tomorrow);
                }}
                style={styles.dateArrow}
                disabled={isToday(selectedDate)}
              >
                <Ionicons name="chevron-forward" size={20} color={isToday(selectedDate) ? colors.border : colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Category Chips */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  testID={`category-chip-${cat.id}`}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  style={[
                    styles.chip,
                    { backgroundColor: selectedCategoryId === cat.id ? colors.primary + '18' : colors.surface },
                  ]}
                >
                  <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.chipText, {
                    color: selectedCategoryId === cat.id ? colors.primary : colors.text
                  }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Note */}
            <TextInput
              testID="note-input"
              placeholder="Add a note..."
              placeholderTextColor={colors.textSecondary}
              value={note}
              onChangeText={setNote}
              style={[styles.noteInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            />

            {/* Payment Method */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Payment Method</Text>
            <View style={styles.paymentRow}>
              {PAYMENT_METHODS.map(method => (
                <TouchableOpacity
                  key={method}
                  testID={`payment-${method}`}
                  onPress={() => setPaymentMethod(method)}
                  style={[
                    styles.paymentChip,
                    { backgroundColor: paymentMethod === method ? colors.primary : colors.surface },
                  ]}
                >
                  <Text style={[styles.paymentText, {
                    color: paymentMethod === method ? '#FFF' : colors.text,
                    fontWeight: paymentMethod === method ? '700' : '400',
                  }]}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Toggles with animation */}
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Recurring?</Text>
              <AnimatedToggle value={isRecurring} onToggle={() => setIsRecurring(!isRecurring)} colors={colors} />
            </View>
            {isRecurring && (
              <View style={styles.paymentRow}>
                {(['weekly', 'monthly'] as const).map(interval => (
                  <TouchableOpacity
                    key={interval}
                    testID={`recurring-${interval}`}
                    onPress={() => setRecurringInterval(interval)}
                    style={[
                      styles.paymentChip,
                      { backgroundColor: recurringInterval === interval ? colors.primary : colors.surface, flex: 1 },
                    ]}
                  >
                    <Text style={[styles.paymentText, {
                      color: recurringInterval === interval ? '#FFF' : colors.text,
                    }]}>{interval.charAt(0).toUpperCase() + interval.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Split?</Text>
              <AnimatedToggle value={isSplit} onToggle={() => setIsSplit(!isSplit)} colors={colors} />
            </View>
            {isSplit && (
              <TextInput
                testID="split-share-input"
                placeholder="Your share amount"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={splitShareStr === '0' ? '' : splitShareStr}
                onChangeText={setSplitShareStr}
                style={[styles.noteInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              />
            )}
          </ScrollView>

          {/* Numpad */}
          <CustomNumpad onKeyPress={handleKeyPress} onBackspace={handleBackspace} />

          {/* Save Button */}
          <TouchableOpacity
            testID="save-transaction-btn"
            onPress={handleSave}
            disabled={!canSave}
            style={[styles.saveBtn, { backgroundColor: canSave ? colors.primary : colors.border }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveBtnText, { color: canSave ? '#FFF' : colors.textSecondary }]}>
              {editTransaction ? 'Update' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '95%',
    flexDirection: 'column',
  },
  dragHandleWrapper: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  currencySymbol: {
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.regular,
    fontWeight: '300',
    marginRight: 4,
  },
  amountText: {
    fontSize: FontSize.display,
    fontFamily: FontFamily.extraBold,
    fontWeight: '800',
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dateArrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  dateLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    fontWeight: '600',
  },
  chipsRow: {
    marginBottom: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
    borderWidth: 0,
    marginRight: Spacing.sm,
  },
  chipEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
  },
  noteInput: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    marginTop: Spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  paymentChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
    borderWidth: 0,
    alignItems: 'center',
  },
  paymentText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  toggleLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  saveBtn: {
    marginHorizontal: Spacing.lg,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  saveBtnText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
});
