# SmartSpend — Spend Tracker

An offline-first expense tracking app built with React Native (Expo) that runs on web via Metro bundler.

## Project Structure

```
SmartSpend/
├── frontend/           # React Native / Expo app
│   ├── app/            # Expo Router screens & navigation
│   │   ├── (tabs)/     # Tab screens: home, history, insights, settings
│   │   ├── _layout.tsx # Root layout with ThemeProvider & OnboardingFlow
│   │   ├── manage-budgets.tsx
│   │   └── manage-categories.tsx
│   ├── src/            # Application source
│   │   ├── components/ # Reusable UI components
│   │   ├── constants/  # Categories, colors, theme
│   │   ├── context/    # ThemeContext
│   │   ├── db/         # SQLite database layer (expo-sqlite)
│   │   └── utils/      # CSV export, date helpers
│   ├── metro.config.js # Metro bundler configuration
│   ├── app.json        # Expo config (web bundler: metro, output: static)
│   └── package.json    # Dependencies (Expo 54, React Native 0.81)
├── backend/            # FastAPI backend (minimal — not used by frontend)
│   ├── server.py       # FastAPI with MongoDB status check routes
│   └── requirements.txt
└── README.md
```

## Tech Stack

- **Framework**: React Native (Expo 54) with expo-router
- **Web**: Metro bundler (static output)
- **Local Storage**: expo-sqlite + AsyncStorage
- **Navigation**: React Navigation (custom floating tab bar)
- **Charts**: react-native-svg (DonutChart)
- **Animations**: react-native-reanimated
- **Typography**: Inter (Google Fonts via expo-font)

## Running the App

### Frontend (Web)
```bash
cd frontend && npm run web
```
Runs on port 5000 at http://localhost:5000

### Backend (optional, not connected to frontend)
```bash
cd backend && uvicorn server:app --host localhost --port 8000
```
Requires `MONGO_URL` and `DB_NAME` environment variables.

## Workflow

- **Start application**: `cd frontend && npm run web` → port 5000 (webview)

## Deployment

Configured as static site:
- Build: `cd frontend && npx expo export --platform web --output-dir dist`
- Public dir: `frontend/dist`

## Notes

- The app is fully offline-first; the backend is a separate scaffold not connected to the frontend
- The backend requires MongoDB (`MONGO_URL`, `DB_NAME` env vars) which are not set up in this Replit
- All data is stored locally via expo-sqlite on device
