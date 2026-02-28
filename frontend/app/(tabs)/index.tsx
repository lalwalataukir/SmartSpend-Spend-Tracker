import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Spacing, FontSize, Radius, Shadows } from '../../src/constants/theme';
import {
  getRecentTransactions, getTotalForRange, getAllCategories, getAllBudgetsForMonth,
  getTotalForCategoryInRange, deleteTransaction, insertTransaction, getTransactionById,
  type TransactionWithCategory, type Category, type Budget,
} from '../../src/db/database';
import { formatCurrency, formatMonthYear, getTodayRange, getCurrentMonthRange, getMonthYearKey } from '../../src/utils/format';
import TransactionItem from '../../src/components/TransactionItem';
import AddTransactionSheet from '../../src/components/AddTransactionSheet';
import Snackbar from '../../src/components/Snackbar';

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [todayTotal, setTodayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<TransactionWithCategory[]>([]);
  const [budgetHealth, setBudgetHealth] = useState<Array<{ category: Category; spent: number; limit: number }>>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; undoData?: any }>({
    visible: false, message: '',
  });

  const loadData = useCallback(() => {
    const today = getTodayRange();
    const month = getCurrentMonthRange();
    setTodayTotal(getTotalForRange(today.start, today.end));
    setMonthTotal(getTotalForRange(month.start, month.end));
    setRecentTransactions(getRecentTransactions(10));

    const categories = getAllCategories();
    const monthKey = getMonthYearKey(new Date());
    const budgets = getAllBudgetsForMonth(monthKey);
    const health: Array<{ category: Category; spent: number; limit: number }> = [];
    for (const budget of budgets) {
      const cat = categories.find(c => c.id === budget.categoryId);
      if (cat) {
        const spent = getTotalForCategoryInRange(cat.id, month.start, month.end);
        health.push({ category: cat, spent, limit: budget.limitAmount });
      }
    }
    setBudgetHealth(health);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleDelete = (tx: TransactionWithCategory) => {
    const backup = getTransactionById(tx.id);
    deleteTransaction(tx.id);
    loadData();
    setSnackbar({ visible: true, message: 'Transaction deleted', undoData: backup });
  };

  const handleUndo = () => {
    if (snackbar.undoData) {
      const b = snackbar.undoData;
      insertTransaction({
        amount: b.amount, categoryId: b.categoryId, note: b.note, date: b.date,
        paymentMethod: b.paymentMethod, isRecurring: b.isRecurring,
        recurringIntervalDays: b.recurringIntervalDays, isSplit: b.isSplit, splitShare: b.splitShare,
      });
      loadData();
    }
    setSnackbar({ visible: false, message: '' });
  };

  const getBudgetColor = (pct: number) => {
    if (pct >= 100) return colors.danger;
    if (pct >= 80) return colors.warning;
    return colors.success;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} testID="home-screen">
      <View style={styles.header}>
        <View>
          <Text style={[styles.appTitle, { color: colors.primary }]}>SpendSmart</Text>
          <Text style={[styles.monthText, { color: colors.textSecondary }]}>{formatMonthYear(new Date())}</Text>
        </View>
        <TouchableOpacity testID="header-settings-btn" onPress={() => router.push('/settings')} style={[styles.settingsBtn, { backgroundColor: colors.surface }]}>
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]} testID="summary-card">
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Today</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(todayTotal)}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>This Month</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(monthTotal)}</Text>
            </View>
          </View>
        </View>

        {budgetHealth.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Budget Health</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {budgetHealth.map(({ category, spent, limit }) => {
                const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                return (
                  <View key={category.id} style={[styles.budgetChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={styles.budgetEmoji}>{category.emoji}</Text>
                    <Text style={[styles.budgetName, { color: colors.text }]} numberOfLines={1}>{category.name}</Text>
                    <View style={[styles.budgetBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.budgetFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: getBudgetColor(pct) }]} />
                    </View>
                    <Text style={[styles.budgetPct, { color: getBudgetColor(pct) }]}>{pct}%</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
            <TouchableOpacity testID="view-all-btn" onPress={() => router.push('/history')}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transactions yet.{'\n'}Tap + to add one.</Text>
            </View>
          ) : (
            recentTransactions.map(tx => (
              <TransactionItem key={tx.id} transaction={tx} onDelete={() => handleDelete(tx)} />
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity testID="fab-add-transaction" style={[styles.fab, { backgroundColor: colors.primary }, Shadows.lg]} activeOpacity={0.8} onPress={() => setShowAddSheet(true)}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <AddTransactionSheet visible={showAddSheet} onClose={() => setShowAddSheet(false)} onSaved={() => loadData()} />
      <Snackbar visible={snackbar.visible} message={snackbar.message} actionLabel="Undo" onAction={handleUndo} onDismiss={() => setSnackbar({ visible: false, message: '' })} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  appTitle: { fontSize: FontSize.xxl, fontWeight: '800' },
  monthText: { fontSize: FontSize.sm, marginTop: 2 },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  summaryCard: { borderRadius: Radius.lg, padding: Spacing.xl, marginTop: Spacing.md, ...Shadows.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, fontWeight: '500' },
  summaryAmount: { color: '#FFF', fontSize: FontSize.xxl, fontWeight: '800', marginTop: 4 },
  summaryDivider: { width: 1, height: 40 },
  section: { marginTop: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  viewAllText: { fontSize: FontSize.sm, fontWeight: '600' },
  budgetChip: { width: 120, padding: Spacing.md, borderRadius: Radius.md, marginRight: Spacing.sm, borderWidth: 0.5 },
  budgetEmoji: { fontSize: 20 },
  budgetName: { fontSize: FontSize.xs, fontWeight: '600', marginTop: 4 },
  budgetBar: { height: 4, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  budgetFill: { height: '100%', borderRadius: 2 },
  budgetPct: { fontSize: FontSize.xs, fontWeight: '700', marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyText: { textAlign: 'center', marginTop: Spacing.md, fontSize: FontSize.base, lineHeight: 22 },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
