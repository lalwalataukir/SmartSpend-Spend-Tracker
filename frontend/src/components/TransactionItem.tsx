import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Spacing, FontSize, Radius, Shadows } from '../constants/theme';
import { formatCurrency, formatTime } from '../utils/format';
import type { TransactionWithCategory } from '../db/database';

interface TransactionItemProps {
  transaction: TransactionWithCategory;
  onPress?: () => void;
  onDelete?: () => void;
}

export default function TransactionItem({ transaction, onPress, onDelete }: TransactionItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      testID={`transaction-item-${transaction.id}`}
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.container, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: transaction.categoryColor + '20' }]}>
        <Text style={styles.emoji}>{transaction.categoryEmoji}</Text>
      </View>
      <View style={styles.details}>
        <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
          {transaction.categoryName}
        </Text>
        <Text style={[styles.note, { color: colors.textSecondary }]} numberOfLines={1}>
          {transaction.note || transaction.paymentMethod}
          {transaction.isRecurring ? ' 🔄' : ''}
        </Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: colors.danger }]}>
          -{formatCurrency(transaction.amount)}
        </Text>
        <Text style={[styles.time, { color: colors.textSecondary }]}>
          {formatTime(transaction.date)}
        </Text>
      </View>
      {onDelete && (
        <TouchableOpacity
          testID={`delete-transaction-${transaction.id}`}
          onPress={onDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 0.5,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  details: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  categoryName: {
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  note: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  amount: {
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  time: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  deleteBtn: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
});
