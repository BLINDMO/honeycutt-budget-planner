# CLAUDE.md - Honeycutt Budget Planner

## Project Overview
A budget tracking application with debt payoff analytics. Built as both a web app (Vite) and an Electron desktop app.

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite 6
- **Desktop:** Electron 33
- **Animation:** Framer Motion
- **Date handling:** date-fns
- **Build:** Vite (web), electron-builder (desktop)

## Commands
- `npm run dev` - Run Electron + Vite dev servers concurrently
- `npm run dev:renderer` - Run Vite dev server only (web)
- `npm run build` - Build web version (`vite build --outDir dist`)
- `npm run build:electron` - Build Electron version
- `npm run package` - Build and package Electron app (.exe portable)

## Project Structure
- `src/App.tsx` - Main app component
- `src/main.tsx` - React entry point
- `src/core/` - Business logic (CalculationEngine, DateUtils)
- `src/components/` - React components (Dashboard, modals, wizards)
- `electron/main.ts` - Electron main process
- `vite.config.ts` - Vite config (port 5173, `@` alias to `src/`)

## Key Patterns
- Path alias: `@/` maps to `src/`
- CSS: Component-scoped CSS files (e.g., `Dashboard.css` alongside `Dashboard.tsx`)
- State: React state managed in App.tsx, passed via props
- Storage: localStorage for persistence (no backend)
- Build output: `dist/` for web, `build-output/` for Electron packaged app
