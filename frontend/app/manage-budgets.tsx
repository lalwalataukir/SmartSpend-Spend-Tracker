import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { Spacing, FontSize, Radius } from '../src/constants/theme';
import { getAllCategories, getAllBudgetsForMonth, upsertBudget, deleteBudget, getTotalForCategoryInRange, type Category, type Budget } from '../src/db/database';
import { formatCurrency, getMonthYearKey, getCurrentMonthRange, formatMonthYear } from '../src/utils/format';

export default function ManageBudgetsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spending, setSpending] = useState<Map<number, number>>(new Map());
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');

  const monthKey = getMonthYearKey(new Date());
  const monthRange = getCurrentMonthRange();

  const loadData = useCallback(() => {
    const cats = getAllCategories();
    setCategories(cats);
    setBudgets(getAllBudgetsForMonth(monthKey));
    const spendMap = new Map<number, number>();
    for (const cat of cats) { spendMap.set(cat.id, getTotalForCategoryInRange(cat.id, monthRange.start, monthRange.end)); }
    setSpending(spendMap);
  }, [monthKey]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const openSetBudget = (cat: Category) => {
    setSelectedCategory(cat);
    const existing = budgets.find(b => b.categoryId === cat.id);
    setBudgetAmount(existing ? existing.limitAmount.toString() : '');
    setShowModal(true);
  };

  const handleSaveBudget = () => {
    if (!selectedCategory || !budgetAmount.trim()) return;
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) return;
    upsertBudget(selectedCategory.id, amount, monthKey);
    setShowModal(false); loadData();
  };

  const handleRemoveBudget = (catId: number) => {
    const budget = budgets.find(b => b.categoryId === catId);
    if (budget) { deleteBudget(budget.id); loadData(); }
  };

  const getBudgetColor = (pct: number) => {
    if (pct >= 100) return colors.danger;
    if (pct >= 80) return colors.warning;
    return colors.success;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} testID="manage-budgets-screen">
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Manage Budgets</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{formatMonthYear(new Date())}</Text>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {categories.map(cat => {
          const budget = budgets.find(b => b.categoryId === cat.id);
          const spent = spending.get(cat.id) || 0;
          const pct = budget ? Math.round((spent / budget.limitAmount) * 100) : 0;
          return (
            <View key={cat.id} style={[styles.catRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.catIcon, { backgroundColor: cat.colorHex + '20' }]}><Text style={styles.catEmoji}>{cat.emoji}</Text></View>
              <View style={styles.catInfo}>
                <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                {budget ? (
                  <>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}><View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: getBudgetColor(pct) }]} /></View>
                    <Text style={[styles.budgetText, { color: colors.textSecondary }]}>{formatCurrency(spent)} of {formatCurrency(budget.limitAmount)} ({pct}%)</Text>
                  </>
                ) : (<Text style={[styles.noBudgetText, { color: colors.textSecondary }]}>No budget set</Text>)}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity testID={`set-budget-${cat.id}`} onPress={() => openSetBudget(cat)} style={[styles.actionBtn, { backgroundColor: colors.primary + '10' }]}><Ionicons name={budget ? 'pencil' : 'add'} size={18} color={colors.primary} /></TouchableOpacity>
                {budget && (<TouchableOpacity testID={`remove-budget-${cat.id}`} onPress={() => handleRemoveBudget(cat.id)} style={[styles.actionBtn, { backgroundColor: colors.danger + '10' }]}><Ionicons name="close" size={18} color={colors.danger} /></TouchableOpacity>)}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="fade" testID="budget-modal">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedCategory ? `Budget for ${selectedCategory.emoji} ${selectedCategory.name}` : 'Set Budget'}</Text>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Monthly limit (₹)</Text>
            <TextInput testID="budget-amount-input" value={budgetAmount} onChangeText={setBudgetAmount} placeholder="e.g. 5000" placeholderTextColor={colors.textSecondary} keyboardType="decimal-pad" style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} />
            <View style={styles.modalActions}>
              <TouchableOpacity testID="cancel-budget-btn" onPress={() => setShowModal(false)} style={[styles.modalBtn, { backgroundColor: colors.surface }]}><Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity testID="save-budget-btn" onPress={handleSaveBudget} disabled={!budgetAmount.trim() || parseFloat(budgetAmount) <= 0} style={[styles.modalBtn, { backgroundColor: budgetAmount.trim() && parseFloat(budgetAmount) > 0 ? colors.primary : colors.border }]}><Text style={[styles.modalBtnText, { color: '#FFF' }]}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: '800', marginLeft: Spacing.sm },
  subtitle: { fontSize: FontSize.sm, marginLeft: Spacing.sm, marginTop: 2 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  catRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.sm, borderWidth: 0.5 },
  catIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 22 },
  catInfo: { flex: 1, marginLeft: Spacing.md },
  catName: { fontSize: FontSize.base, fontWeight: '600' },
  progressBar: { height: 6, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  budgetText: { fontSize: FontSize.xs, marginTop: 4 },
  noBudgetText: { fontSize: FontSize.sm, marginTop: 4 },
  actions: { flexDirection: 'row', gap: Spacing.xs },
  actionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modal: { width: '100%', borderRadius: Radius.lg, padding: Spacing.xl },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', marginBottom: Spacing.md },
  modalLabel: { fontSize: FontSize.sm, marginBottom: Spacing.sm },
  input: { height: 52, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.lg, fontSize: FontSize.xl },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  modalBtn: { flex: 1, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: FontSize.base, fontWeight: '700' },
});
