export interface DefaultCategory {
  id: number;
  name: string;
  emoji: string;
  isDefault: number;
  colorHex: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: 1, name: 'Food & Drinks', emoji: '🍔', isDefault: 1, colorHex: '#FF6B6B' },
  { id: 2, name: 'Transport', emoji: '🚗', isDefault: 1, colorHex: '#4ECDC4' },
  { id: 3, name: 'Shopping', emoji: '🛍️', isDefault: 1, colorHex: '#FFE66D' },
  { id: 4, name: 'Entertainment', emoji: '🎭', isDefault: 1, colorHex: '#A29BFE' },
  { id: 5, name: 'Health', emoji: '💊', isDefault: 1, colorHex: '#55EFC4' },
  { id: 6, name: 'Groceries', emoji: '🛒', isDefault: 1, colorHex: '#FDCB6E' },
  { id: 7, name: 'Rent & Utilities', emoji: '🏠', isDefault: 1, colorHex: '#74B9FF' },
  { id: 8, name: 'Education', emoji: '📚', isDefault: 1, colorHex: '#E17055' },
  { id: 9, name: 'Travel', emoji: '✈️', isDefault: 1, colorHex: '#00B894' },
  { id: 10, name: 'Subscriptions', emoji: '📱', isDefault: 1, colorHex: '#FD79A8' },
  { id: 11, name: 'Personal Care', emoji: '💅', isDefault: 1, colorHex: '#6C5CE7' },
  { id: 12, name: 'Others', emoji: '📦', isDefault: 1, colorHex: '#B2BEC3' },
];

export const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
