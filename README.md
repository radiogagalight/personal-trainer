# Personal trainer (Showup)

The runnable app lives in **`showup/`** — a Vite + React PWA.

## Local preview

From this folder (repo root):

```bash
npm run install:app   # first time, or after dependency changes
npm run dev           # http://localhost:4000
```

Or from `showup/` directly:

```bash
cd showup
npm install
npm run dev
```

**Production build preview:** `npm run build` then `npm run preview`.

**Phone on same Wi‑Fi:** `cd showup && npm run dev -- --host`, then open the Network URL Vite prints (e.g. `http://192.168.x.x:4000`).

## Layout

- `showup/` — Showup app (source, `package.json`, dev server)
- `files/` — spec and seed JSON

See `showup/README.md` for stack details and project layout.
