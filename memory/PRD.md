# SpendSmart - Product Requirements Document

## Overview
SpendSmart is an offline-first manual expense tracking mobile app built with React Native (Expo). All data is stored on-device using AsyncStorage.

## Architecture
- **Frontend**: Expo SDK 54, React Native, expo-router (file-based routing)
- **Storage**: AsyncStorage (in-memory cache + persistent storage)
- **Navigation**: Bottom tab navigation (4 tabs) + stack screens
- **Theme**: Light/Dark mode with system preference support
- **Currency**: INR (₹)

## Screens & Features

### 1. Home Tab (/)
- Daily summary card (Today + This Month totals)
- Budget health chips (horizontal scroll)
- Recent transactions list (last 10)
- FAB button to add transaction
- Delete transaction with undo snackbar

### 2. History Tab (/history)
- Search bar (search by note)
- Filter chips: All, This Month, Last Month, Category
- Date-grouped transaction list with daily totals
- Edit transaction (tap to open sheet)
- Delete transaction with undo
- FAB button to add transaction

### 3. Insights Tab (/insights)
- Month selector (prev/next navigation)
- Total spent with month-over-month comparison
- Daily average spend
- Category breakdown bar chart
- Daily spending bar chart
- Spending nudges (smart insights)

### 4. Settings Tab (/settings)
- Theme picker (System/Light/Dark)
- Default payment method (UPI/Cash/Card/Other)
- Manage Categories → /manage-categories
- Manage Budgets → /manage-budgets
- Export as CSV (Share sheet)
- App Version info
- Delete All Data (with "DELETE" confirmation)

### 5. Add Transaction Sheet (Modal)
- Custom numpad (no system keyboard for amounts)
- Amount display (48sp)
- Category chips (horizontal scroll, 12 defaults)
- Note text input
- Payment method selector
- Recurring toggle (weekly/monthly)
- Split toggle (with share amount input)
- Save/Update button

### 6. Manage Categories (/manage-categories)
- List all categories with emoji + color
- Add new category (name, emoji, color)
- Edit existing category
- Delete custom categories (defaults protected)

### 7. Manage Budgets (/manage-budgets)
- List all categories with budget progress bars
- Set/edit monthly budget limit per category
- Remove budget
- Budget health visualization (green/yellow/red)

## Data Model
- **Transaction**: id, amount, categoryId, note, date, paymentMethod, isRecurring, recurringIntervalDays, isSplit, splitShare
- **Category**: id, name, emoji, isDefault, colorHex
- **Budget**: id, categoryId, limitAmount, monthYear

## Default Categories (12)
Food & Drinks, Transport, Shopping, Entertainment, Health, Groceries, Rent & Utilities, Education, Travel, Subscriptions, Personal Care, Others

## Design System
- Primary: #1A56DB (blue)
- Background: #FFFFFF (light) / #121212 (dark)
- Card radius: 16px
- Bottom sheet radius: 24px (top corners)
- Touch targets: minimum 48px
- Font: System default
