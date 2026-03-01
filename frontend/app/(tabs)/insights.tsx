import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, PanResponder, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../src/context/ThemeContext';
import { Spacing, FontSize, Radius, Shadows, FontFamily } from '../../src/constants/theme';
import { getTotalForRange, getCategorySpendingForRange, getDailySpendingForRange } from '../../src/db/database';
import { formatCurrency, formatMonthYear } from '../../src/utils/format';
import { subMonths, addMonths, startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import DonutChart from '../../src/components/DonutChart';
import EmptyState from '../../src/components/EmptyState';

export default function InsightsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthTotal, setMonthTotal] = useState(0);
  const [lastMonthTotal, setLastMonthTotal] = useState(0);
  const [dailyAvg, setDailyAvg] = useState(0);
  const [categorySpending, setCategorySpending] = useState<Array<{ categoryId: number; total: number; categoryName: string; categoryEmoji: string; categoryColor: string }>>([]);
  const [dailySpending, setDailySpending] = useState<Array<{ day: string; total: number }>>([]);
  const [chartMode, setChartMode] = useState<'daily' | 'weekly'>('daily');

  const goToPrevMonth = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(prev => subMonths(prev, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(prev => addMonths(prev, 1));
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) goToPrevMonth();
        else if (gestureState.dx < -50) goToNextMonth();
      },
    })
  ).current;

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
  const totalCategorySpend = categorySpending.reduce((sum, c) => sum + c.total, 0);

  const weeklySpending = React.useMemo(() => {
    if (dailySpending.length === 0) return [];
    const weeks: Array<{ label: string; total: number }> = [];
    let weekTotal = 0;
    let weekStart = '';
    dailySpending.forEach((d, i) => {
      if (i % 7 === 0) {
        if (i > 0) {
          weeks.push({ label: weekStart, total: weekTotal });
        }
        weekStart = format(parseISO(d.day), 'dd MMM');
        weekTotal = 0;
      }
      weekTotal += d.total;
    });
    if (weekStart) {
      weeks.push({ label: weekStart, total: weekTotal });
    }
    return weeks;
  }, [dailySpending]);

  const showWeeklyOption = dailySpending.length >= 28;
  const barData = chartMode === 'weekly' && showWeeklyOption
    ? weeklySpending.map(w => ({ key: w.label, total: w.total, label: w.label }))
    : dailySpending.map(d => ({ key: d.day, total: d.total, label: format(parseISO(d.day), 'd') }));
  const maxBarSpend = Math.max(...barData.map(d => d.total), 1);

  // Build nudges with metadata for styling
  const nudges: Array<{ text: string; icon: string; type: 'positive' | 'negative' | 'neutral' }> = [];
  if (categorySpending.length > 0) {
    const top = categorySpending[0];
    const pct = totalCategorySpend > 0 ? Math.round((top.total / totalCategorySpend) * 100) : 0;
    nudges.push({
      text: `${top.categoryEmoji} ${top.categoryName} is your top spend at ${pct}% of total.`,
      icon: '📊',
      type: 'neutral',
    });
  }
  if (monthDiff > 10) {
    nudges.push({
      text: `You're spending ${Math.abs(Math.round(monthDiff))}% more than last month.`,
      icon: '📈',
      type: 'negative',
    });
  } else if (monthDiff < -10) {
    nudges.push({
      text: `Great! You're spending ${Math.abs(Math.round(monthDiff))}% less than last month.`,
      icon: '✅',
      type: 'positive',
    });
  }
  if (dailySpending.length > 0) {
    const highest = dailySpending.reduce((max, d) => d.total > max.total ? d : max, dailySpending[0]);
    nudges.push({
      text: `Highest spend day: ${format(parseISO(highest.day), 'dd MMM')} (${formatCurrency(highest.total)})`,
      icon: '⚡',
      type: 'neutral',
    });
  }

  const getNudgeColors = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive': return { bg: colors.success + '12', border: colors.success + '30' };
      case 'negative': return { bg: colors.danger + '12', border: colors.danger + '30' };
      default: return { bg: colors.primary + '08', border: colors.primary + '20' };
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: insets.top }]} testID="insights-screen">
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: Math.max(insets.top, Spacing.lg) + Spacing.sm }]}><Text style={[styles.title, { color: colors.text }]}>Insights</Text></View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.monthSelector} {...panResponder.panHandlers}>
          <TouchableOpacity testID="prev-month-btn" onPress={goToPrevMonth}><Ionicons name="chevron-back" size={24} color={colors.primary} /></TouchableOpacity>
          <Text style={[styles.monthText, { color: colors.text }]}>{formatMonthYear(currentDate)}</Text>
          <TouchableOpacity testID="next-month-btn" onPress={goToNextMonth}><Ionicons name="chevron-forward" size={24} color={colors.primary} /></TouchableOpacity>
        </View>

        {/* Gradient Summary Card */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.summaryCard, Shadows.md]}
        >
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(monthTotal)}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryMini}>
              <Ionicons name={monthDiff >= 0 ? 'trending-up' : 'trending-down'} size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.diffText}>{monthDiff >= 0 ? '+' : ''}{Math.round(monthDiff)}% vs last month</Text>
            </View>
            <View style={styles.summaryMini}>
              <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.avgText}>{formatCurrency(dailyAvg)}/day</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Donut Chart */}
        <View style={[styles.card, { backgroundColor: colors.surface }, Shadows.sm]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Category Breakdown</Text>
          {categorySpending.length === 0 ? (
            <EmptyState
              icon="pie-chart-outline"
              title="No data yet"
              subtitle="Add some expenses to see your spending breakdown"
            />
          ) : (
            <DonutChart
              data={categorySpending.map(cat => ({
                value: cat.total,
                color: cat.categoryColor,
                label: cat.categoryName,
                emoji: cat.categoryEmoji,
              }))}
              total={totalCategorySpend}
            />
          )}
        </View>

        {/* Daily Spending Bar Chart */}
        <View style={[styles.card, { backgroundColor: colors.surface }, Shadows.sm]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {chartMode === 'weekly' && showWeeklyOption ? 'Weekly Spending' : 'Daily Spending'}
            </Text>
            {showWeeklyOption && (
              <View style={[styles.chartToggle, { backgroundColor: colors.border + '40' }]}>
                <TouchableOpacity
                  onPress={() => setChartMode('daily')}
                  style={[styles.chartToggleBtn, chartMode === 'daily' && { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.chartToggleText, { color: chartMode === 'daily' ? '#FFF' : colors.textSecondary }]}>Day</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setChartMode('weekly')}
                  style={[styles.chartToggleBtn, chartMode === 'weekly' && { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.chartToggleText, { color: chartMode === 'weekly' ? '#FFF' : colors.textSecondary }]}>Week</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {dailySpending.length === 0 ? (
            <EmptyState
              icon="stats-chart-outline"
              title="No data yet"
              subtitle="Your daily spending chart will appear here"
            />
          ) : (
            <View style={styles.dailyChart}>
              <View style={styles.dailyBars}>
                {barData.map((d) => (
                  <View key={d.key} style={styles.dailyBarWrapper}>
                    <View style={[styles.dailyBarTrack, { backgroundColor: colors.border }]}>
                      <LinearGradient
                        colors={[colors.gradientStart, colors.gradientEnd]}
                        style={[styles.dailyBarFill, { height: `${(d.total / maxBarSpend) * 100}%` }]}
                      />
                    </View>
                    <Text style={[styles.dailyLabel, { color: colors.textSecondary }]}>{d.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Spending Nudges */}
        {nudges.length > 0 && (
          <View style={styles.nudgesSection}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: Spacing.md }]}>Spending Nudges</Text>
            {nudges.map((nudge, i) => {
              const nudgeColors = getNudgeColors(nudge.type);
              return (
                <View
                  key={i}
                  style={[styles.nudgeCard, { backgroundColor: nudgeColors.bg, borderColor: nudgeColors.border }]}
                >
                  <Text style={styles.nudgeIcon}>{nudge.icon}</Text>
                  <Text style={[styles.nudgeText, { color: colors.text }]}>{nudge.text}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontFamily: FontFamily.extraBold, fontWeight: '800', letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, gap: Spacing.xl },
  monthText: { fontSize: FontSize.lg, fontFamily: FontFamily.bold, fontWeight: '700' },
  summaryCard: { borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg },
  summaryLabel: { fontSize: FontSize.sm, fontFamily: FontFamily.medium, color: 'rgba(255,255,255,0.7)' },
  summaryAmount: { fontSize: FontSize.xxxl, fontFamily: FontFamily.extraBold, fontWeight: '800', marginTop: 4, color: '#FFF' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  summaryMini: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  diffText: { fontSize: FontSize.sm, fontFamily: FontFamily.semiBold, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  avgText: { fontSize: FontSize.sm, fontFamily: FontFamily.regular, color: 'rgba(255,255,255,0.7)' },
  card: { borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  cardTitle: { fontSize: FontSize.lg, fontFamily: FontFamily.bold, fontWeight: '700' },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartToggle: { flexDirection: 'row', borderRadius: Radius.sm, padding: 2 },
  chartToggleBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm - 1 },
  chartToggleText: { fontSize: FontSize.xs, fontFamily: FontFamily.semiBold, fontWeight: '600' },
  dailyChart: { paddingTop: Spacing.sm },
  dailyBars: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 2 },
  dailyBarWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  dailyBarTrack: { width: '80%', flex: 1, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  dailyBarFill: { width: '100%', borderRadius: 4 },
  dailyLabel: { fontSize: 9, fontFamily: FontFamily.medium, marginTop: 3 },
  nudgesSection: { marginBottom: Spacing.lg },
  nudgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  nudgeIcon: { fontSize: 20 },
  nudgeText: { fontSize: FontSize.sm, fontFamily: FontFamily.medium, lineHeight: 20, flex: 1 },
});
