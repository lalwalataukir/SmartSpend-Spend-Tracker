import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Spacing, FontSize, Radius, Shadows } from '../../src/constants/theme';
import {
  getAllTransactions, getTransactionsByDateRange, searchTransactions,
  deleteTransaction, insertTransaction, getTransactionById, getAllCategories,
  type TransactionWithCategory, type Category,
} from '../../src/db/database';
import { formatDateGroup, formatCurrency, getCurrentMonthRange, getLastMonthRange } from '../../src/utils/format';
import { startOfDay, endOfDay, format } from 'date-fns';
import TransactionItem from '../../src/components/TransactionItem';
import AddTransactionSheet from '../../src/components/AddTransactionSheet';
import Snackbar from '../../src/components/Snackbar';

type FilterType = 'all' | 'this_month' | 'last_month' | 'category';

interface GroupedTransactions {
  title: string;
  total: number;
  data: TransactionWithCategory[];
}

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editTransaction, setEditTransaction] = useState<any>(null);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; undoData?: any }>({
    visible: false, message: '',
  });

  const loadData = useCallback(() => {
    setCategories(getAllCategories(db));
    let txs: TransactionWithCategory[];
    if (searchQuery.trim()) {
      txs = searchTransactions(db, searchQuery.trim());
    } else if (activeFilter === 'this_month') {
      const range = getCurrentMonthRange();
      txs = getTransactionsByDateRange(db, range.start, range.end);
    } else if (activeFilter === 'last_month') {
      const range = getLastMonthRange();
      txs = getTransactionsByDateRange(db, range.start, range.end);
    } else if (activeFilter === 'category' && selectedCategoryId) {
      txs = getAllTransactions(db).filter(t => t.categoryId === selectedCategoryId);
    } else {
      txs = getAllTransactions(db);
    }
    setTransactions(txs);
  }, [db, searchQuery, activeFilter, selectedCategoryId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const groupedData: GroupedTransactions[] = React.useMemo(() => {
    const groups: Record<string, TransactionWithCategory[]> = {};
    for (const tx of transactions) {
      const key = format(new Date(tx.date), 'yyyy-MM-dd');
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, data]) => ({
        title: formatDateGroup(data[0].date),
        total: data.reduce((sum, t) => sum + t.amount, 0),
        data,
      }));
  }, [transactions]);

  const handleDelete = (tx: TransactionWithCategory) => {
    const backup = getTransactionById(db, tx.id);
    deleteTransaction(db, tx.id);
    loadData();
    setSnackbar({ visible: true, message: 'Transaction deleted', undoData: backup });
  };

  const handleUndo = () => {
    if (snackbar.undoData) {
      const b = snackbar.undoData;
      insertTransaction(db, {
        amount: b.amount, categoryId: b.categoryId, note: b.note, date: b.date,
        paymentMethod: b.paymentMethod, isRecurring: b.isRecurring,
        recurringIntervalDays: b.recurringIntervalDays, isSplit: b.isSplit, splitShare: b.splitShare,
      });
      loadData();
    }
    setSnackbar({ visible: false, message: '' });
  };

  const handleEdit = (tx: TransactionWithCategory) => {
    setEditTransaction(tx);
    setShowAddSheet(true);
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'category', label: 'Category' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} testID="history-screen">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>History</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          testID="search-input"
          placeholder="Search notes..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={(text) => { setSearchQuery(text); }}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            testID={`filter-${f.key}`}
            onPress={() => { setActiveFilter(f.key); setSelectedCategoryId(null); }}
            style={[
              styles.filterChip,
              { borderColor: activeFilter === f.key ? colors.primary : colors.border },
              activeFilter === f.key && { backgroundColor: colors.primary + '15' },
            ]}
          >
            <Text style={[styles.filterText, { color: activeFilter === f.key ? colors.primary : colors.text }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category Sub-filter */}
      {activeFilter === 'category' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              testID={`cat-filter-${cat.id}`}
              onPress={() => setSelectedCategoryId(cat.id)}
              style={[
                styles.filterChip,
                { borderColor: selectedCategoryId === cat.id ? colors.primary : colors.border },
                selectedCategoryId === cat.id && { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Text style={styles.filterEmoji}>{cat.emoji}</Text>
              <Text style={[styles.filterText, { color: selectedCategoryId === cat.id ? colors.primary : colors.text }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Transaction List */}
      {groupedData.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No transactions yet.{'\n'}Tap + to add one.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={groupedData}
          keyExtractor={item => item.id.toString()}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
              <Text style={[styles.sectionTotal, { color: colors.danger }]}>-{formatCurrency(section.total)}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <TransactionItem
                transaction={item}
                onPress={() => handleEdit(item)}
                onDelete={() => handleDelete(item)}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        testID="fab-add-history"
        style={[styles.fab, { backgroundColor: colors.primary }, Shadows.lg]}
        activeOpacity={0.8}
        onPress={() => { setEditTransaction(null); setShowAddSheet(true); }}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <AddTransactionSheet
        visible={showAddSheet}
        onClose={() => { setShowAddSheet(false); setEditTransaction(null); }}
        onSaved={() => loadData()}
        editTransaction={editTransaction}
      />

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        actionLabel="Undo"
        onAction={handleUndo}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSize.base,
    height: '100%',
  },
  filterRow: {
    maxHeight: 48,
    marginTop: Spacing.sm,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  filterEmoji: { fontSize: 14, marginRight: 4 },
  filterText: { fontSize: FontSize.sm, fontWeight: '500' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: '700' },
  sectionTotal: { fontSize: FontSize.sm, fontWeight: '600' },
  itemContainer: { paddingHorizontal: Spacing.lg },
  listContent: { paddingBottom: 100 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
  emptyText: { textAlign: 'center', marginTop: Spacing.lg, fontSize: FontSize.base, lineHeight: 22 },
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
});
