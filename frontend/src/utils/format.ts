import { format, isToday, isYesterday, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatAmount(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount);
}

export function formatDate(epochMs: number): string {
  const date = new Date(epochMs);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd MMM yyyy');
}

export function formatTime(epochMs: number): string {
  return format(new Date(epochMs), 'hh:mm a');
}

export function formatDateGroup(epochMs: number): string {
  const date = new Date(epochMs);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, dd MMM');
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

export function getMonthYearKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

export function getTodayRange(): { start: number; end: number } {
  const now = new Date();
  return { start: startOfDay(now).getTime(), end: endOfDay(now).getTime() };
}

export function getCurrentMonthRange(): { start: number; end: number } {
  const now = new Date();
  return { start: startOfMonth(now).getTime(), end: endOfMonth(now).getTime() };
}

export function getLastMonthRange(): { start: number; end: number } {
  const lastMonth = subMonths(new Date(), 1);
  return { start: startOfMonth(lastMonth).getTime(), end: endOfMonth(lastMonth).getTime() };
}

export function formatDateForCSV(epochMs: number): string {
  return format(new Date(epochMs), 'yyyy-MM-dd');
}

export function formatTimeForCSV(epochMs: number): string {
  return format(new Date(epochMs), 'HH:mm');
}
