# CLAUDE.md - Honeycutt Budget Planner

## Project Overview
A budget tracking application with debt payoff analytics. Built as both a web app (Vite) and an Electron desktop app. Users manage monthly bills, track credit card/loan balances with interest calculations, and view payoff projections.

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite 6
- **Desktop:** Electron 33 with electron-updater for auto-updates
- **Animation:** Framer Motion
- **Date handling:** date-fns + custom DateUtils (timezone-safe)
- **Build:** Vite (web), electron-builder (desktop)

## Commands
- `npm run dev` - Run Electron + Vite dev servers concurrently
- `npm run dev:renderer` - Run Vite dev server only (web)
- `npm run build` - Build web version (`vite build --outDir dist`)
- `npm run build:electron` - Build Electron version
- `npm run package` - Build and package Electron app (.exe portable)

## Project Structure
```
src/
├── App.tsx              - Root component, all state management, localStorage persistence
├── main.tsx             - React entry point with ErrorBoundary
├── types/index.ts       - All TypeScript interfaces (Bill, HistoryItem, PayInfo, BudgetData)
├── core/
│   ├── CalculationEngine.ts - Financial math (payoff, interest, currency formatting, cents-based precision)
│   └── DateUtils.ts         - Date parsing/formatting (timezone-safe, no UTC shifting)
├── components/
│   ├── Dashboard.tsx        - Main view: bill list, paid pane, credit accounts pane, month navigation
│   ├── Dashboard.css        - Dashboard layout and styling
│   ├── AddBillModal.tsx     - Add/edit bill form (supports balance tracking, credit accounts)
│   ├── WelcomeWizard.tsx    - First-time onboarding wizard
│   ├── HistoryModal.tsx     - Paid bills history grouped by month
│   ├── NewMonthModal.tsx    - Month transition dialog (handles unpaid bill decisions)
│   ├── SettingsModal.tsx    - App settings, payment methods, pay schedule
│   ├── PayInfoHeader.tsx    - Pay schedule display in header
│   ├── PayInfoModule.tsx    - Pay schedule entry form
│   ├── AmountInputModal.tsx - Quick payment amount input
│   ├── ConfirmationModal.tsx- Generic confirm dialog
│   ├── TutorialOverlay.tsx  - Tutorial/guide overlay
│   ├── SplashScreen.tsx     - Loading splash screen
│   ├── UpdateNotification.tsx - Auto-update notification
│   ├── ErrorBoundary.tsx    - React error boundary
│   └── VirtualizedList.tsx  - Optimized list rendering
├── styles/
│   └── design-system.css    - Global design tokens and CSS variables
electron/
├── main.ts              - Electron main process, auto-updater, window management
├── preload.ts           - IPC bridge (electronAPI)
└── services/
    └── BudgetDataService.ts - File-based budget data persistence for Electron
```

## Key Patterns
- **Path alias:** `@/` maps to `src/`
- **CSS:** Component-scoped CSS files alongside their TSX components
- **State:** Unidirectional — App.tsx owns all state, passes via props to Dashboard
- **Storage:** localStorage key `honeycutt_budget_data` (no backend)
- **ID generation:** Use `crypto.randomUUID()` for all bill/payinfo IDs
- **Date safety:** Always use `DateUtils.parseLocalDate()` — never `new Date("YYYY-MM-DD")` (UTC bug)
- **Money math:** Use cents internally for precision (see CalculationEngine pattern)
- **Build output:** `dist/` for web, `build-output/` for Electron packaged app

## Key Interfaces
- **Bill** — Core entity with `hasBalance` for debt tracking, `isCreditAccount` for persistent credit cards
- **HistoryItem** — Archived paid bill record
- **PayInfo** — Pay schedule (weekly/biweekly/semimonthly/monthly)
- **BudgetData** — Root data shape persisted to localStorage

## Data Flow
```
App.tsx (BudgetData state + localStorage)
  → Dashboard.tsx (bills, history, payInfos, activeMonth)
    → AddBillModal (creates/edits bills)
    → NewMonthModal (month transition, balance recalculation)
    → Credit Accounts Pane (persistent credit card view)
    → Paid Pane (paid bills for current month)
```

## Month Transition Logic
When user clicks "Start New Month" in Dashboard:
1. Unpaid bills are handled per user choice (skip, defer, etc.)
2. Balance-tracked bills recalculate: payment applied, interest accrued
3. Non-credit balance bills removed when balance hits $0
4. Credit accounts (`isCreditAccount: true`) persist even at $0 balance
5. All bills reset to unpaid, due dates advance one month
