import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CATEGORIES } from '../constants/categories';

// Types
export interface Transaction {
  id: number;
  amount: number;
  categoryId: number;
  note: string;
  date: number;
  paymentMethod: string;
  isRecurring: number;
  recurringIntervalDays: number | null;
  isSplit: number;
  splitShare: number | null;
}

export interface Category {
  id: number;
  name: string;
  emoji: string;
  isDefault: number;
  colorHex: string;
}

export interface Budget {
  id: number;
  categoryId: number;
  limitAmount: number;
  monthYear: string;
}

export interface TransactionWithCategory extends Transaction {
  categoryName: string;
  categoryEmoji: string;
  categoryColor: string;
}

// Storage keys
const KEYS = {
  transactions: '@ss_transactions',
  categories: '@ss_categories',
  budgets: '@ss_budgets',
  nextTxId: '@ss_next_tx_id',
  nextCatId: '@ss_next_cat_id',
  nextBudgetId: '@ss_next_budget_id',
  initialized: '@ss_initialized',
};

// In-memory cache for fast reads
let txCache: Transaction[] = [];
let catCache: Category[] = [];
let budgetCache: Budget[] = [];
let nextTxId = 1;
let nextCatId = 13; // After 12 default categories
let nextBudgetId = 1;

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persist() {
  // Debounce writes to avoid excessive AsyncStorage calls
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(KEYS.transactions, JSON.stringify(txCache)),
        AsyncStorage.setItem(KEYS.categories, JSON.stringify(catCache)),
        AsyncStorage.setItem(KEYS.budgets, JSON.stringify(budgetCache)),
        AsyncStorage.setItem(KEYS.nextTxId, nextTxId.toString()),
        AsyncStorage.setItem(KEYS.nextCatId, nextCatId.toString()),
        AsyncStorage.setItem(KEYS.nextBudgetId, nextBudgetId.toString()),
      ]);
    } catch (e) {
      console.error('persist error:', e);
    }
  }, 100);
}

// Force immediate persist (used after critical writes)
async function persistNow() {
  if (persistTimer) clearTimeout(persistTimer);
  try {
    await Promise.all([
      AsyncStorage.setItem(KEYS.transactions, JSON.stringify(txCache)),
      AsyncStorage.setItem(KEYS.categories, JSON.stringify(catCache)),
      AsyncStorage.setItem(KEYS.budgets, JSON.stringify(budgetCache)),
      AsyncStorage.setItem(KEYS.nextTxId, nextTxId.toString()),
      AsyncStorage.setItem(KEYS.nextCatId, nextCatId.toString()),
      AsyncStorage.setItem(KEYS.nextBudgetId, nextBudgetId.toString()),
    ]);
  } catch (e) {
    console.error('persistNow error:', e);
  }
}

export async function initializeDatabase(): Promise<void> {
  try {
    const initialized = await AsyncStorage.getItem(KEYS.initialized);
    if (initialized) {
      // Load existing data
      const [txData, catData, budgetData, txIdStr, catIdStr, budgetIdStr] = await Promise.all([
        AsyncStorage.getItem(KEYS.transactions),
        AsyncStorage.getItem(KEYS.categories),
        AsyncStorage.getItem(KEYS.budgets),
        AsyncStorage.getItem(KEYS.nextTxId),
        AsyncStorage.getItem(KEYS.nextCatId),
        AsyncStorage.getItem(KEYS.nextBudgetId),
      ]);
      txCache = txData ? JSON.parse(txData) : [];
      catCache = catData ? JSON.parse(catData) : [];
      budgetCache = budgetData ? JSON.parse(budgetData) : [];
      nextTxId = txIdStr ? parseInt(txIdStr) : 1;
      nextCatId = catIdStr ? parseInt(catIdStr) : 13;
      nextBudgetId = budgetIdStr ? parseInt(budgetIdStr) : 1;
    } else {
      // Seed default categories
      catCache = DEFAULT_CATEGORIES.map(c => ({
        id: c.id, name: c.name, emoji: c.emoji, isDefault: c.isDefault, colorHex: c.colorHex,
      }));
      txCache = [];
      budgetCache = [];
      nextTxId = 1;
      nextCatId = 13;
      nextBudgetId = 1;
      await persist();
      await AsyncStorage.setItem(KEYS.initialized, 'true');
    }
  } catch (e) {
    console.error('DB init error:', e);
    // Fallback seed
    catCache = DEFAULT_CATEGORIES.map(c => ({
      id: c.id, name: c.name, emoji: c.emoji, isDefault: c.isDefault, colorHex: c.colorHex,
    }));
  }
}

function enrichTransaction(tx: Transaction): TransactionWithCategory {
  const cat = catCache.find(c => c.id === tx.categoryId);
  return {
    ...tx,
    categoryName: cat?.name || 'Unknown',
    categoryEmoji: cat?.emoji || '📦',
    categoryColor: cat?.colorHex || '#B2BEC3',
  };
}

// Transaction queries
export function getAllTransactions(): TransactionWithCategory[] {
  return [...txCache].sort((a, b) => b.date - a.date).map(enrichTransaction);
}

export function getTransactionsByDateRange(startMs: number, endMs: number): TransactionWithCategory[] {
  return txCache
    .filter(t => t.date >= startMs && t.date <= endMs)
    .sort((a, b) => b.date - a.date)
    .map(enrichTransaction);
}

export function getRecentTransactions(limit: number): TransactionWithCategory[] {
  return [...txCache].sort((a, b) => b.date - a.date).slice(0, limit).map(enrichTransaction);
}

export function getTotalForRange(startMs: number, endMs: number): number {
  return txCache
    .filter(t => t.date >= startMs && t.date <= endMs)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalForCategoryInRange(catId: number, startMs: number, endMs: number): number {
  return txCache
    .filter(t => t.categoryId === catId && t.date >= startMs && t.date <= endMs)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function searchTransactions(query: string): TransactionWithCategory[] {
  const q = query.toLowerCase();
  return txCache
    .filter(t => {
      const note = (t.note || '').toLowerCase();
      const cat = catCache.find(c => c.id === t.categoryId);
      const categoryName = (cat?.name || '').toLowerCase();
      return note.includes(q) || categoryName.includes(q);
    })
    .sort((a, b) => b.date - a.date)
    .map(enrichTransaction);
}

export function insertTransaction(t: Omit<Transaction, 'id'>): number {
  const id = nextTxId++;
  txCache.push({ ...t, id });
  persist();
  return id;
}

export function updateTransaction(t: Transaction): void {
  const idx = txCache.findIndex(tx => tx.id === t.id);
  if (idx >= 0) txCache[idx] = t;
  persist();
}

export function deleteTransaction(id: number): void {
  txCache = txCache.filter(t => t.id !== id);
  persist();
}

export function getTransactionById(id: number): Transaction | null {
  return txCache.find(t => t.id === id) || null;
}

export function getTransactionCountForCategory(categoryId: number): number {
  return txCache.filter(t => t.categoryId === categoryId).length;
}

// Category queries
export function getAllCategories(): Category[] {
  return [...catCache].sort((a, b) => a.id - b.id);
}

export function insertCategory(c: Omit<Category, 'id'>): number {
  const id = nextCatId++;
  catCache.push({ ...c, id });
  persist();
  return id;
}

export function updateCategory(c: Category): void {
  const idx = catCache.findIndex(cat => cat.id === c.id);
  if (idx >= 0) catCache[idx] = c;
  persist();
}

export function deleteCategory(id: number): void {
  catCache = catCache.filter(c => c.id !== id);
  persist();
}

// Budget queries
export function getBudgetForCategoryMonth(categoryId: number, monthYear: string): Budget | null {
  return budgetCache.find(b => b.categoryId === categoryId && b.monthYear === monthYear) || null;
}

export function getAllBudgetsForMonth(monthYear: string): Budget[] {
  return budgetCache.filter(b => b.monthYear === monthYear);
}

export function upsertBudget(categoryId: number, limitAmount: number, monthYear: string): void {
  const existing = budgetCache.find(b => b.categoryId === categoryId && b.monthYear === monthYear);
  if (existing) {
    existing.limitAmount = limitAmount;
  } else {
    budgetCache.push({ id: nextBudgetId++, categoryId, limitAmount, monthYear });
  }
  persist();
}

export function deleteBudget(id: number): void {
  budgetCache = budgetCache.filter(b => b.id !== id);
  persist();
}

// Aggregation queries
export function getCategorySpendingForRange(startMs: number, endMs: number): Array<{
  categoryId: number; total: number; categoryName: string; categoryEmoji: string; categoryColor: string;
}> {
  const filtered = txCache.filter(t => t.date >= startMs && t.date <= endMs);
  const groupMap = new Map<number, number>();
  for (const t of filtered) {
    groupMap.set(t.categoryId, (groupMap.get(t.categoryId) || 0) + t.amount);
  }
  return Array.from(groupMap.entries())
    .map(([categoryId, total]) => {
      const cat = catCache.find(c => c.id === categoryId);
      return {
        categoryId, total,
        categoryName: cat?.name || 'Unknown',
        categoryEmoji: cat?.emoji || '📦',
        categoryColor: cat?.colorHex || '#B2BEC3',
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function getDailySpendingForRange(startMs: number, endMs: number): Array<{ day: string; total: number }> {
  const filtered = txCache.filter(t => t.date >= startMs && t.date <= endMs);
  const dayMap = new Map<string, number>();
  for (const t of filtered) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dayMap.set(key, (dayMap.get(key) || 0) + t.amount);
  }
  return Array.from(dayMap.entries())
    .map(([day, total]) => ({ day, total }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

// Delete all data
export async function deleteAllData(): Promise<void> {
  txCache = [];
  budgetCache = [];
  catCache = DEFAULT_CATEGORIES.map(c => ({
    id: c.id, name: c.name, emoji: c.emoji, isDefault: c.isDefault, colorHex: c.colorHex,
  }));
  nextTxId = 1;
  nextCatId = 13;
  nextBudgetId = 1;
  await persistNow();
}
