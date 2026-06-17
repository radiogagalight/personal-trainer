# Showup

A warm, offline-first personal workout companion PWA. Single user. No accounts. No cloud. Your data, on your device.

## Stack

- React 18 + Vite + TypeScript (strict)
- Tailwind CSS, hash router, Zustand
- Dexie.js / IndexedDB for all storage
- `@dnd-kit` for drag-and-drop
- `date-fns`, `uuid`
- `vite-plugin-pwa` for installability + offline
- Recharts (Phase 2)
- Vitest for the pure engines

## Run it

```bash
npm install
npm run dev          # http://localhost:4000
npm run build        # type-check + bundle into dist/
npm run preview      # serve the production bundle
npm test             # run unit tests
```

## Install on your phone (local dev)

1. Run `npm run dev -- --host` on your computer.
2. Open `http://<your-computer-ip>:4000` on your phone (same Wi-Fi).
3. In Safari (iOS) or Chrome (Android), tap **Share → Add to Home Screen**.

The service worker is enabled in dev mode so you can verify the offline shell.

## Project layout

```
src/
  copy/        all user-facing strings (one tone-audited place)
  ui/          tokens, base components, layout
  db/          Dexie schema + queries + seed loader
  state/       Zustand stores
  lib/         pure helpers + engines (duration, randomizer, etc.)
  features/    feature folders (today, plan, library, workouts, ...)
```

## Backups

Settings → Data → Export downloads a single JSON file containing your entire app state. Import restores it on this or any other device. Reset wipes everything and restores the seed content.

## Philosophy

This app is **gentle by default**. It celebrates showing up, never punishes missed days, and frames consistency as a trend rather than a fragile streak. Every string is reviewed against that tone.
