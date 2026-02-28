import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { Spacing, FontSize, Radius, Shadows, FontFamily } from '../constants/theme';
import { formatCurrency, formatTime } from '../utils/format';
import type { TransactionWithCategory } from '../db/database';

interface TransactionItemProps {
  transaction: TransactionWithCategory;
  index?: number;
  onPress?: () => void;
  onDelete?: () => void;
}

export default function TransactionItem({ transaction, index = 0, onPress, onDelete }: TransactionItemProps) {
  const { colors } = useTheme();

  const renderRightActions = () => {
    if (!onDelete) return null;
    return (
      <TouchableOpacity
        testID={`delete-transaction-${transaction.id}`}
        onPress={onDelete}
        style={styles.deleteAction}
        activeOpacity={0.8}
      >
        <Ionicons name="trash" size={22} color="#FFF" />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const content = (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
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
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(18)}>
      {content}
    </Animated.View>
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
    fontFamily: FontFamily.semiBold,
    fontWeight: '600',
  },
  note: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  amount: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
  time: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  deleteText: {
    color: '#FFF',
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semiBold,
    marginTop: 2,
  },
});
