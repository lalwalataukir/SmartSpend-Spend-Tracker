import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Spacing, FontSize, Radius } from '../../src/constants/theme';
import { getTotalForRange, getCategorySpendingForRange, getDailySpendingForRange } from '../../src/db/database';
import { formatCurrency, formatMonthYear } from '../../src/utils/format';
import { subMonths, addMonths, startOfMonth, endOfMonth, format, parseISO } from 'date-fns';

export default function InsightsScreen() {
  const { colors } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthTotal, setMonthTotal] = useState(0);
  const [lastMonthTotal, setLastMonthTotal] = useState(0);
  const [dailyAvg, setDailyAvg] = useState(0);
  const [categorySpending, setCategorySpending] = useState<Array<{ categoryId: number; total: number; categoryName: string; categoryEmoji: string; categoryColor: string }>>([]);
  const [dailySpending, setDailySpending] = useState<Array<{ day: string; total: number }>>([]);

  const loadData = useCallback(() => {
    const monthStart = startOfMonth(currentDate).getTime();
    const monthEnd = endOfMonth(currentDate).getTime();
    const prevMonthStart = startOfMonth(subMonths(currentDate, 1)).getTime();
    const prevMonthEnd = endOfMonth(subMonths(currentDate, 1)).getTime();

    const thisTotal = getTotalForRange(monthStart, monthEnd);
    const prevTotal = getTotalForRange(prevMonthStart, prevMonthEnd);
    setMonthTotal(thisTotal);
    setLastMonthTotal(prevTotal);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const today = new Date();
    const daysPassed = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear() ? today.getDate() : daysInMonth;
    setDailyAvg(daysPassed > 0 ? thisTotal / daysPassed : 0);
    setCategorySpending(getCategorySpendingForRange(monthStart, monthEnd));
    setDailySpending(getDailySpendingForRange(monthStart, monthEnd));
  }, [currentDate]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const monthDiff = lastMonthTotal > 0 ? ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
  const maxCategorySpend = Math.max(...categorySpending.map(c => c.total), 1);
  const maxDailySpend = Math.max(...dailySpending.map(d => d.total), 1);
  const totalCategorySpend = categorySpending.reduce((sum, c) => sum + c.total, 0);

  const nudges: string[] = [];
  if (categorySpending.length > 0) {
    const top = categorySpending[0];
    const pct = totalCategorySpend > 0 ? Math.round((top.total / totalCategorySpend) * 100) : 0;
    nudges.push(`${top.categoryEmoji} ${top.categoryName} is your top spend at ${pct}% of total.`);
  }
  if (monthDiff > 10) nudges.push(`You're spending ${Math.abs(Math.round(monthDiff))}% more than last month.`);
  else if (monthDiff < -10) nudges.push(`Great! You're spending ${Math.abs(Math.round(monthDiff))}% less than last month.`);
  if (dailySpending.length > 0) {
    const highest = dailySpending.reduce((max, d) => d.total > max.total ? d : max, dailySpending[0]);
    nudges.push(`Highest spend day: ${format(parseISO(highest.day), 'dd MMM')} (${formatCurrency(highest.total)})`);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} testID="insights-screen">
      <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>Insights</Text></View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.monthSelector}>
          <TouchableOpacity testID="prev-month-btn" onPress={() => setCurrentDate(subMonths(currentDate, 1))}><Ionicons name="chevron-back" size={24} color={colors.primary} /></TouchableOpacity>
          <Text style={[styles.monthText, { color: colors.text }]}>{formatMonthYear(currentDate)}</Text>
          <TouchableOpacity testID="next-month-btn" onPress={() => setCurrentDate(addMonths(currentDate, 1))}><Ionicons name="chevron-forward" size={24} color={colors.primary} /></TouchableOpacity>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Spent</Text>
          <Text style={[styles.summaryAmount, { color: colors.text }]}>{formatCurrency(monthTotal)}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryMini}>
              <Ionicons name={monthDiff >= 0 ? 'trending-up' : 'trending-down'} size={16} color={monthDiff >= 0 ? colors.danger : colors.success} />
              <Text style={[styles.diffText, { color: monthDiff >= 0 ? colors.danger : colors.success }]}>{monthDiff >= 0 ? '+' : ''}{Math.round(monthDiff)}% vs last month</Text>
            </View>
            <View style={styles.summaryMini}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.avgText, { color: colors.textSecondary }]}>{formatCurrency(dailyAvg)}/day</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Category Breakdown</Text>
          {categorySpending.length === 0 ? (<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No data for this month</Text>) : (
            categorySpending.map(cat => {
              const pct = totalCategorySpend > 0 ? Math.round((cat.total / totalCategorySpend) * 100) : 0;
              return (
                <View key={cat.categoryId} style={styles.barRow}>
                  <View style={styles.barLabel}><Text style={styles.barEmoji}>{cat.categoryEmoji}</Text><Text style={[styles.barName, { color: colors.text }]} numberOfLines={1}>{cat.categoryName}</Text></View>
                  <View style={styles.barContainer}>
                    <View style={[styles.barTrack, { backgroundColor: colors.border }]}><View style={[styles.barFill, { width: `${(cat.total / maxCategorySpend) * 100}%`, backgroundColor: cat.categoryColor }]} /></View>
                    <Text style={[styles.barAmount, { color: colors.text }]}>{formatCurrency(cat.total)}</Text>
                    <Text style={[styles.barPct, { color: colors.textSecondary }]}>{pct}%</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Daily Spending</Text>
          {dailySpending.length === 0 ? (<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No data for this month</Text>) : (
            <View style={styles.dailyChart}>
              <View style={styles.dailyBars}>
                {dailySpending.map((d) => (
                  <View key={d.day} style={styles.dailyBarWrapper}>
                    <View style={[styles.dailyBarTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.dailyBarFill, { height: `${(d.total / maxDailySpend) * 100}%`, backgroundColor: colors.primary }]} />
                    </View>
                    <Text style={[styles.dailyLabel, { color: colors.textSecondary }]}>{format(parseISO(d.day), 'd')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {nudges.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Spending Nudges</Text>
            {nudges.map((nudge, i) => (<View key={i} style={styles.nudgeRow}><Text style={[styles.nudgeText, { color: colors.text }]}>{nudge}</Text></View>))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: '800' },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, gap: Spacing.xl },
  monthText: { fontSize: FontSize.lg, fontWeight: '700' },
  summaryCard: { borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg },
  summaryLabel: { fontSize: FontSize.sm, fontWeight: '500' },
  summaryAmount: { fontSize: FontSize.xxxl, fontWeight: '800', marginTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  summaryMini: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  diffText: { fontSize: FontSize.sm, fontWeight: '600' },
  avgText: { fontSize: FontSize.sm },
  card: { borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md },
  emptyText: { textAlign: 'center', paddingVertical: Spacing.xl, fontSize: FontSize.base },
  barRow: { marginBottom: Spacing.md },
  barLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  barEmoji: { fontSize: 16, marginRight: 6 },
  barName: { fontSize: FontSize.sm, fontWeight: '500' },
  barContainer: { flexDirection: 'row', alignItems: 'center' },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barAmount: { fontSize: FontSize.sm, fontWeight: '600', marginLeft: Spacing.sm, width: 70, textAlign: 'right' },
  barPct: { fontSize: FontSize.xs, width: 36, textAlign: 'right' },
  dailyChart: { paddingTop: Spacing.sm },
  dailyBars: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 2 },
  dailyBarWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  dailyBarTrack: { width: '80%', flex: 1, borderRadius: 3, overflow: 'hidden', justifyContent: 'flex-end' },
  dailyBarFill: { width: '100%', borderRadius: 3 },
  dailyLabel: { fontSize: 8, marginTop: 2 },
  nudgeRow: { paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.15)' },
  nudgeText: { fontSize: FontSize.sm, lineHeight: 20 },
});
