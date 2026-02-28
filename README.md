# 💰 SmartSpend — Spend Tracker

> Know where every rupee goes — in under 10 seconds.

SmartSpend is a fast, offline-first Android expense tracking app built with React Native (Expo). No bank sync, no sign-in required, no fluff. Just log what you spend and understand where your money goes.

---

## Screenshots

> Coming soon — UI in progress.

---

## Features

- **Quick Add** — Log a transaction in under 10 seconds with a custom numpad. Amount + category is all you need.
- **Transaction History** — Scrollable, searchable list of all your expenses grouped by date. Swipe to delete.
- **Category Breakdown** — 12 default categories (Food, Transport, Shopping, etc.) + add your own with a custom emoji and color.
- **Monthly Summary** — Total spent, daily average, and category-wise breakdown at a glance.
- **Budget Alerts** — Set monthly limits per category. Get notified at 80% and 100% usage.
- **Recurring Expenses** — Mark rent, subscriptions, and other repeating costs so they log automatically.
- **Search & Filter** — Filter by category, date range, or payment method (UPI, Cash, Card).
- **CSV Export** — Export your full transaction history and share it via any app.
- **Dark Mode** — Respects your system setting out of the box.
- **Offline First** — Works 100% without internet. All data stays on your device.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo) |
| Language | TypeScript |
| Local Storage | expo-sqlite + AsyncStorage |
| Navigation | React Navigation (Bottom Tabs) |
| Charts | Victory Native |
| Notifications | expo-notifications |
| Background Tasks | expo-task-manager |
| Styling | React Native StyleSheet + custom theme |

---

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or yarn
- [Expo Go](https://expo.dev/go) app on your Android phone (for previewing)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lalwalataukir/SmartSpend-Spend-Tracker.git
   cd SmartSpend-Spend-Tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Open on your phone**

   Scan the QR code shown in the terminal with your phone camera (iOS) or the Expo Go app (Android). The app will load instantly.

### Building an APK

To generate a production Android APK:

```bash
npm install -g eas-cli
eas build -p android
```

This uses Expo's cloud build service. Once complete, you'll get a downloadable `.apk` link.

---

## Project Structure

```
SmartSpend/
├── app/                  # Screens and navigation
│   ├── (tabs)/
│   │   ├── index.tsx     # Home screen
│   │   ├── history.tsx   # Transaction history
│   │   ├── insights.tsx  # Charts and summaries
│   │   └── settings.tsx  # App settings
├── components/           # Reusable UI components
│   ├── AddTransactionSheet.tsx
│   ├── TransactionItem.tsx
│   ├── CategoryPicker.tsx
│   └── NumPad.tsx
├── db/                   # SQLite database layer
│   ├── schema.ts
│   ├── transactions.ts
│   ├── categories.ts
│   └── budgets.ts
├── hooks/                # Custom React hooks
├── constants/            # Categories, colors, theme
└── utils/                # CSV export, date helpers
```

---

## Roadmap

- [x] Core transaction logging
- [x] Category management
- [x] Monthly summary & charts
- [x] Budget alerts
- [x] CSV export
- [ ] UPI SMS auto-detection
- [ ] Home screen widget
- [ ] Split expense tracking
- [ ] Cloud backup (optional)

---

## License

MIT — free to use, modify, and distribute.

---

Built with ❤️ and way too much curiosity about where money disappears to.
