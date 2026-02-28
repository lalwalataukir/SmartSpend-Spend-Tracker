import { type SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '../constants/categories';

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      isDefault INTEGER NOT NULL DEFAULT 0,
      colorHex TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      categoryId INTEGER NOT NULL,
      note TEXT DEFAULT '',
      date INTEGER NOT NULL,
      paymentMethod TEXT DEFAULT 'UPI',
      isRecurring INTEGER DEFAULT 0,
      recurringIntervalDays INTEGER,
      isSplit INTEGER DEFAULT 0,
      splitShare REAL,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoryId INTEGER NOT NULL,
      limitAmount REAL NOT NULL,
      monthYear TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(categoryId);
    CREATE INDEX IF NOT EXISTS idx_budgets_category_month ON budgets(categoryId, monthYear);
  `);

  // Seed default categories if empty
  const result = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (result && result.count === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      db.runSync(
        'INSERT INTO categories (id, name, emoji, isDefault, colorHex) VALUES (?, ?, ?, ?, ?)',
        [cat.id, cat.name, cat.emoji, cat.isDefault, cat.colorHex]
      );
    }
  }
}

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

// Transaction queries
export function getAllTransactions(db: SQLiteDatabase): TransactionWithCategory[] {
  return db.getAllSync<TransactionWithCategory>(
    `SELECT t.*, c.name as categoryName, c.emoji as categoryEmoji, c.colorHex as categoryColor 
     FROM transactions t LEFT JOIN categories c ON t.categoryId = c.id 
     ORDER BY t.date DESC`
  );
}

export function getTransactionsByDateRange(db: SQLiteDatabase, startMs: number, endMs: number): TransactionWithCategory[] {
  return db.getAllSync<TransactionWithCategory>(
    `SELECT t.*, c.name as categoryName, c.emoji as categoryEmoji, c.colorHex as categoryColor 
     FROM transactions t LEFT JOIN categories c ON t.categoryId = c.id 
     WHERE t.date BETWEEN ? AND ? ORDER BY t.date DESC`,
    [startMs, endMs]
  );
}

export function getRecentTransactions(db: SQLiteDatabase, limit: number): TransactionWithCategory[] {
  return db.getAllSync<TransactionWithCategory>(
    `SELECT t.*, c.name as categoryName, c.emoji as categoryEmoji, c.colorHex as categoryColor 
     FROM transactions t LEFT JOIN categories c ON t.categoryId = c.id 
     ORDER BY t.date DESC LIMIT ?`,
    [limit]
  );
}

export function getTotalForRange(db: SQLiteDatabase, startMs: number, endMs: number): number {
  const result = db.getFirstSync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM transactions WHERE date BETWEEN ? AND ?',
    [startMs, endMs]
  );
  return result?.total ?? 0;
}

export function getTotalForCategoryInRange(db: SQLiteDatabase, catId: number, startMs: number, endMs: number): number {
  const result = db.getFirstSync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM transactions WHERE categoryId = ? AND date BETWEEN ? AND ?',
    [catId, startMs, endMs]
  );
  return result?.total ?? 0;
}

export function searchTransactions(db: SQLiteDatabase, query: string): TransactionWithCategory[] {
  return db.getAllSync<TransactionWithCategory>(
    `SELECT t.*, c.name as categoryName, c.emoji as categoryEmoji, c.colorHex as categoryColor 
     FROM transactions t LEFT JOIN categories c ON t.categoryId = c.id 
     WHERE t.note LIKE ? ORDER BY t.date DESC`,
    [`%${query}%`]
  );
}

export function insertTransaction(db: SQLiteDatabase, t: Omit<Transaction, 'id'>): number {
  const result = db.runSync(
    `INSERT INTO transactions (amount, categoryId, note, date, paymentMethod, isRecurring, recurringIntervalDays, isSplit, splitShare) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [t.amount, t.categoryId, t.note, t.date, t.paymentMethod, t.isRecurring, t.recurringIntervalDays, t.isSplit, t.splitShare]
  );
  return result.lastInsertRowId;
}

export function updateTransaction(db: SQLiteDatabase, t: Transaction): void {
  db.runSync(
    `UPDATE transactions SET amount=?, categoryId=?, note=?, date=?, paymentMethod=?, isRecurring=?, recurringIntervalDays=?, isSplit=?, splitShare=? WHERE id=?`,
    [t.amount, t.categoryId, t.note, t.date, t.paymentMethod, t.isRecurring, t.recurringIntervalDays, t.isSplit, t.splitShare, t.id]
  );
}

export function deleteTransaction(db: SQLiteDatabase, id: number): void {
  db.runSync('DELETE FROM transactions WHERE id = ?', [id]);
}

export function getTransactionById(db: SQLiteDatabase, id: number): Transaction | null {
  return db.getFirstSync<Transaction>('SELECT * FROM transactions WHERE id = ?', [id]);
}

// Category queries
export function getAllCategories(db: SQLiteDatabase): Category[] {
  return db.getAllSync<Category>('SELECT * FROM categories ORDER BY id');
}

export function insertCategory(db: SQLiteDatabase, c: Omit<Category, 'id'>): number {
  const result = db.runSync(
    'INSERT INTO categories (name, emoji, isDefault, colorHex) VALUES (?, ?, ?, ?)',
    [c.name, c.emoji, c.isDefault, c.colorHex]
  );
  return result.lastInsertRowId;
}

export function updateCategory(db: SQLiteDatabase, c: Category): void {
  db.runSync('UPDATE categories SET name=?, emoji=?, colorHex=? WHERE id=?', [c.name, c.emoji, c.colorHex, c.id]);
}

export function deleteCategory(db: SQLiteDatabase, id: number): void {
  db.runSync('DELETE FROM categories WHERE id = ?', [id]);
}

// Budget queries
export function getBudgetForCategoryMonth(db: SQLiteDatabase, categoryId: number, monthYear: string): Budget | null {
  return db.getFirstSync<Budget>(
    'SELECT * FROM budgets WHERE categoryId = ? AND monthYear = ?',
    [categoryId, monthYear]
  );
}

export function getAllBudgetsForMonth(db: SQLiteDatabase, monthYear: string): Budget[] {
  return db.getAllSync<Budget>('SELECT * FROM budgets WHERE monthYear = ?', [monthYear]);
}

export function upsertBudget(db: SQLiteDatabase, categoryId: number, limitAmount: number, monthYear: string): void {
  const existing = getBudgetForCategoryMonth(db, categoryId, monthYear);
  if (existing) {
    db.runSync('UPDATE budgets SET limitAmount = ? WHERE id = ?', [limitAmount, existing.id]);
  } else {
    db.runSync('INSERT INTO budgets (categoryId, limitAmount, monthYear) VALUES (?, ?, ?)', [categoryId, limitAmount, monthYear]);
  }
}

export function deleteBudget(db: SQLiteDatabase, id: number): void {
  db.runSync('DELETE FROM budgets WHERE id = ?', [id]);
}

// Aggregation queries for insights
export function getCategorySpendingForRange(db: SQLiteDatabase, startMs: number, endMs: number): Array<{ categoryId: number; total: number; categoryName: string; categoryEmoji: string; categoryColor: string }> {
  return db.getAllSync(
    `SELECT t.categoryId, SUM(t.amount) as total, c.name as categoryName, c.emoji as categoryEmoji, c.colorHex as categoryColor
     FROM transactions t LEFT JOIN categories c ON t.categoryId = c.id
     WHERE t.date BETWEEN ? AND ?
     GROUP BY t.categoryId ORDER BY total DESC`,
    [startMs, endMs]
  );
}

export function getDailySpendingForRange(db: SQLiteDatabase, startMs: number, endMs: number): Array<{ day: string; total: number }> {
  return db.getAllSync(
    `SELECT strftime('%Y-%m-%d', date/1000, 'unixepoch') as day, SUM(amount) as total
     FROM transactions WHERE date BETWEEN ? AND ?
     GROUP BY day ORDER BY day`,
    [startMs, endMs]
  );
}

// Delete all data
export function deleteAllData(db: SQLiteDatabase): void {
  db.runSync('DELETE FROM transactions');
  db.runSync('DELETE FROM budgets');
  db.runSync('DELETE FROM categories');
  // Re-seed default categories
  for (const cat of DEFAULT_CATEGORIES) {
    db.runSync(
      'INSERT INTO categories (id, name, emoji, isDefault, colorHex) VALUES (?, ?, ?, ?, ?)',
      [cat.id, cat.name, cat.emoji, cat.isDefault, cat.colorHex]
    );
  }
}
