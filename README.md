# Honeycutt Budget Planner

A professional budget tracking desktop application with advanced debt payoff analytics.

## Features

- 🎨 **Premium UI** - Glassmorphism design with dark/light theme support
- 💰 **Bill Management** - Three-pane layout for organized tracking
- 📝 **Notes System** - Add reminders and notes to any bill
- 📊 **Payoff Calculator** - Calculate debt payoff timelines with interest
- 🔄 **Monthly Reset** - Automatic monthly bill reset with persistent balances
- 📤 **Export/Import** - Backup and restore your budget data

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Package application
npm run package
```

### Usage

1. **First Launch**: You'll see an animated splash screen with the Honeycutt logo
2. **Welcome Wizard**: Set up your initial bills with amounts, due dates, and balances
3. **Interactive Tutorial**: Learn how to use all features
4. **Dashboard**: Manage your bills across three panels:
   - **Left Panel**: Notes for each bill
   - **Center Panel**: Main bill list sorted by due date
   - **Right Panel**: Paid bills for the month

### Key Features

#### Payoff Calculator
For bills with balances (mortgages, loans, credit cards), click the ⓘ icon to:
- See your current payoff timeline
- Compare 1.5x and 2.0x payment scenarios
- Calculate interest savings

#### Notes
Click the + button next to any bill to add reminders or notes.

#### Tracking
- View total amount due
- See what's due in the next 2 weeks
- Track remaining bills for the month

## Tech Stack

- **Framework**: Electron + React + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with CSS Variables
- **Animations**: Framer Motion
- **Data Persistence**: JSON file storage

## Architecture

```
src/
├── components/         # React UI components
│   ├── Dashboard.tsx   # Main app interface
│   ├── SplashScreen.tsx
│   ├── WelcomeWizard.tsx
│   └── TutorialOverlay.tsx
├── core/              # Business logic
│   ├── CalculationEngine.ts
│   └── DateUtils.ts
├── styles/            # CSS design system
└── App.tsx           # Main application

electron/
├── main.ts           # Electron main process
├── preload.ts        # Secure IPC bridge
└── services/
    └── BudgetDataService.ts
```

## License

MIT License - Created for the Honeycutt family

---

**Built with ❤️ using modern web technologies**
