# Personal Trainer PWA — Build Specification

> **For the builder (Cursor):** This is a **single-user, mobile-first Progressive Web App** — a personal workout companion. There is no multi-user system, no authentication, no accounts, and no backend server. One person uses this on their phone. Build it **offline-first**, store everything **locally on the device**, and keep the tone **warm and encouraging** throughout. Follow the phased plan in §3 — **build, run, and verify Phase 1 completely before starting Phase 2.** Do not attempt the whole spec in one pass.

---

## Table of Contents
1. Vision & Guiding Principles
2. Tech Stack & Hard Constraints
3. Phasing & Build Order
4. Screen / Navigation Map
5. Data Model (with schemas)
6. Seed Data Requirements
7. Exercise Library
8. Workout Builder
9. Plan & Calendar
10. Live Workout Player
11. History & Logging
12. Data Export / Import / Reset
13. Randomization Engine
14. Progression Engine
15. Gamification
16. Progress Tracking & Charts
17. Notifications & Reminders
18. Tone & Copy Guidelines
19. Empty States & Error Handling
20. Accessibility & Mobile UX
21. Settings
22. Non-Functional Requirements
23. Out of Scope
24. Acceptance Criteria (per phase)
25. Open Decisions for the User

---

## 1. Vision & Guiding Principles

A personal digital workout companion for someone at the **start of their fitness journey** who is already self-motivated. The app is a **flexible canvas with a kind, encouraging voice** — not a rigid program that pushes or judges.

Design principles, in priority order:

1. **Customizable above all.** The user molds the app to their wishes. Nothing is locked. Every exercise, workout, and plan can be created, edited, duplicated, or deleted — including seeded content.
2. **Supportive, never punishing.** Copy is warm and human. Missing a workout is met with encouragement, never guilt. No "you broke your streak" shame mechanics.
3. **Gentle by default.** No aggressive goals, no mandatory north-star target, no pressure to progress fast. The user sets the pace.
4. **Mobile-first.** Designed for one-handed phone use, portrait orientation. Desktop should not break but is not the priority.
5. **Offline-first.** Fully functional with no network connection. Data lives on the device.
6. **Equal treatment of workout types.** Strength, cardio, and yoga/mobility are first-class citizens — none is privileged in the data model or UI.

---

## 2. Tech Stack & Hard Constraints

**Stack:**
- **Framework:** React + Vite + TypeScript. (Next.js acceptable, but a static SPA is simpler and sufficient — there is no backend.)
- **PWA tooling:** `vite-plugin-pwa` (or equivalent) — generates `manifest.json` and the service worker. App must be installable and pass a Lighthouse PWA audit.
- **Storage:** **IndexedDB**, accessed via **Dexie.js**. All app data lives here.
- **State management:** Zustand (preferred) or React Context. Keep it simple.
- **Styling:** Tailwind CSS, mobile-first breakpoints.
- **Routing:** React Router (hash or history routing).
- **Charts:** Recharts (Phase 2).
- **Drag & drop:** `dnd-kit` for reordering blocks/exercises.
- **Date handling:** `date-fns`.

**Hard constraints — do not violate:**
- **No backend, no server, no API keys, no auth provider, no remote database.**
- **No third-party analytics or tracking.**
- All data is the user's and never leaves the device except via explicit user-initiated export (§12).
- The app must load and function with the network fully disabled after first install.
- Storage quota awareness: IndexedDB on iOS is limited; keep stored data lean (no embedded video/images — links only).

---

## 3. Phasing & Build Order

**Build Phase 1 fully, run it, and confirm it works before touching Phase 2.** Large specs degrade AI-assisted builds; the phase boundary is hard.

### Phase 1 — Core MVP (a genuinely usable app)
Exercise library, workout builder (fixed blocks), plan/calendar, today screen, live workout player, logging, history/journal, data export/import/reset, settings, light/dark theme.

**Build order within Phase 1:**
1. PWA scaffold — manifest, service worker, offline shell, install prompt.
2. IndexedDB / Dexie setup + schema (§5) + seed-data loader (§6).
3. Exercise Library — list, filter, detail, full CRUD.
4. Workout Builder — create/edit workouts with **fixed** blocks only.
5. Plan & Week Calendar + Today (home) screen.
6. Live Workout Player (fixed workouts) + inline logging.
7. History / Journal view + manual log entry.
8. Settings + Data Export / Import / Reset.
9. Light/dark theme + copy/tone pass.

### Phase 2 — Engagement layer
Randomization engine, progression nudges, gamification (badges / PRs / challenges), progress charts, body metrics, scheduled reminders.

**Build order within Phase 2:**
1. Randomization engine (§13) + randomized blocks in the builder + player.
2. Progression engine (§14).
3. Gamification — badges, PR detection, challenges (§15).
4. Progress charts + body metrics (§16).
5. Notifications & reminders (§17).

---

## 4. Screen / Navigation Map

Primary navigation is a **bottom tab bar** (mobile pattern). Five tabs:

1. **Today** — home screen. Shows today's planned workout (or rest-day message), a warm greeting line, a "Start Workout" button, and a quick glance at recent activity.
2. **Plan** — week calendar view; assign workouts to days, navigate weeks, copy weeks forward.
3. **Workouts** — list of saved workouts; entry point to the Workout Builder.
4. **Library** — exercise library; browse, filter, CRUD exercises.
5. **Progress** — history/journal in Phase 1; adds charts, badges, and metrics in Phase 2.

**Modal / pushed screens (not tabs):**
- Workout Builder (create/edit).
- Exercise Editor (create/edit).
- Live Workout Player (full-screen, takes over UI).
- Workout Summary (post-session).
- Settings.
- Log Entry detail / manual log editor.

---

## 5. Data Model (with schemas)

All entities live in IndexedDB via Dexie. IDs are UUID v4 strings. Timestamps are ISO 8601 strings. Below, `?` marks optional fields.

### 5.1 Exercise — the atomic unit
```ts
type ExerciseType = 'strength' | 'cardio' | 'mobility' | 'yoga' | 'warmup' | 'cooldown';
type Equipment   = 'none' | 'dumbbells' | 'kettlebells' | 'bands' | 'trx' | 'mat';
type BodyArea    = 'upper-push' | 'upper-pull' | 'lower' | 'core' | 'full-body' | 'cardio' | 'mobility';
type Metric      = 'reps' | 'sets' | 'weight' | 'duration' | 'distance' | 'rounds';

interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  targetAreas: BodyArea[];
  equipment: Equipment[];        // equipment required; [] or ['none'] = bodyweight
  instructions: string;          // plain text, multi-line allowed
  videoUrl?: string;             // optional external link
  defaultMetrics: Metric[];      // which fields this exercise logs
  estimatedSecondsPerSet?: number; // used by the randomization duration math
  isCustom: boolean;             // true if user-created (seeded = false)
  createdAt: string;
  updatedAt: string;
}
```

### 5.2 Workout — a reusable session
```ts
interface Workout {
  id: string;
  name: string;
  type: ExerciseType;            // primary type; informational
  blocks: Block[];               // ordered
  estimatedDuration: number;     // minutes, auto-computed, user-overridable
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 5.3 Block — a section within a workout
Supports both the strength A/B/C example and the cardio warm-up/exercise/cool-down example.
```ts
interface BlockExerciseRef {
  exerciseId: string;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  targetDurationSec?: number;
  targetDistance?: number;
  restSecondsBetweenSets?: number;
}

interface Block {
  id: string;
  label: string;                 // "Warm-up", "Set A", "Cool-down"
  mode: 'fixed' | 'randomized';
  exercisePool: BlockExerciseRef[]; // fixed: used in order; randomized: drawn from
  selectionCount?: number;       // randomized only: how many to draw
  targetDurationMin?: number;    // optional duration target for this block
  rounds?: number;               // optional repeat count, default 1
}
```

### 5.4 Plan — day-by-day, week-by-week schedule
```ts
interface DaySlot {
  dayIndex: number;              // 0-6 (Mon-Sun)
  workoutId: string | null;      // null = rest day
  label?: string;
  notes?: string;
}
interface Week { weekIndex: number; days: DaySlot[]; }  // exactly 7 days
interface Plan {
  id: string;
  name: string;
  weeks: Week[];
  createdAt: string;
  updatedAt: string;
}
```
The app supports one active plan at a time (a `Settings.activePlanId`), but storing multiple plans is allowed.

### 5.5 LogEntry — a completed session (the historical record)
```ts
interface LoggedExercise {
  exerciseId: string;
  exerciseName: string;          // denormalized snapshot (survives later edits/deletes)
  actualSets?: number;
  actualReps?: number[];         // per-set reps
  actualWeight?: number[];       // per-set weight
  actualDurationSec?: number;
  actualDistance?: number;
  skipped: boolean;
  substitutedFor?: string;       // original exerciseId if swapped
}
interface LogEntry {
  id: string;
  date: string;                  // ISO; defaults to session date, editable
  workoutId?: string;            // may be absent for ad-hoc/manual logs
  workoutName: string;           // denormalized snapshot
  type: ExerciseType;
  loggedExercises: LoggedExercise[];
  totalDurationMin: number;
  feelRating?: 1 | 2 | 3 | 4 | 5;
  feelNote?: string;
  wasModified: boolean;          // swap/skip/early-end occurred
  createdAt: string;
}
```

### 5.6 BodyMetric — Phase 2
```ts
interface BodyMetric {
  id: string;
  date: string;
  type: 'weight' | 'measurement' | 'note';
  label?: string;                // e.g. "waist" for measurements
  value?: number;
  unit?: string;
  note?: string;
}
```

### 5.7 Achievement — Phase 2
```ts
interface Achievement {
  id: string;
  badgeKey: string;              // identifies which badge
  earnedAt: string;
  context?: string;              // e.g. "First yoga session"
}
```

### 5.8 Settings — singleton record
```ts
interface Settings {
  ownedEquipment: Equipment[];
  defaultRestSeconds: number;
  weightUnit: 'lb' | 'kg';
  distanceUnit: 'mi' | 'km';
  theme: 'light' | 'dark' | 'system';
  activePlanId: string | null;
  remindersEnabled: boolean;
  reminderTime?: string;         // "18:00"
  firstRunComplete: boolean;
}
```

---

## 6. Seed Data Requirements

The app ships with starter content so it is useful on first launch. **All seed content is fully editable and deletable by the user** (`isCustom: false` but no protection).

- **Seed exercise library: 45–60 exercises**, restricted to the user's equipment — **bodyweight/mat, dumbbells/kettlebells, resistance bands, TRX.** No barbell, machine, or gym-only movements. Distribute roughly evenly across the six types (strength, cardio, mobility, yoga, warmup, cooldown). Every exercise needs real `instructions` text and a sensible `estimatedSecondsPerSet`.
- **2–3 seed workouts** demonstrating the patterns:
  - A **strength** workout with three blocks ("Set A/B/C"); in Phase 2 these become randomized blocks.
  - A **cardio** workout with three fixed blocks: Warm-up → Cardio → Cool-down.
  - A **yoga/mobility** flow.
- **One seed plan**: a single week with 4–5 workout days and 2–3 rest days.

> **Note to user:** I can generate the full seed exercise library as a ready-to-import JSON file separately — see §25.

---

## 7. Exercise Library

- Browsable list with **filters**: type, target area, equipment, and a text search by name.
- Each exercise has a **detail view**: instructions, target areas, equipment, video link (opens externally), and which metrics it logs.
- **Full CRUD**: add, edit, duplicate, delete — including seeded exercises.
- Deleting an exercise that is referenced by a workout must **warn** the user and either block deletion or convert the reference gracefully (the workout keeps the denormalized name but flags the exercise as missing).
- New custom exercises default `isCustom: true`.

---

## 8. Workout Builder

The heart of the customization story.

- Create a workout: name, type, then add **blocks**.
- Each block: a `label`, a `mode` (**fixed** in Phase 1; **randomized** unlocked in Phase 2), an exercise pool, optional `targetDurationMin`, optional `rounds`.
- For each exercise in a block, set targets: sets, reps, weight, duration, distance, rest between sets — only the fields relevant to that exercise's `defaultMetrics` are shown.
- **Drag-and-drop** reordering of blocks and of exercises within a block.
- A **running estimated duration** is displayed and updates live, so the user can build toward a target (e.g. a 60-minute strength session of three ~20-minute blocks).
- **Duplicate workout** — clone any workout as a starting point.
- Validation: a workout needs a name and at least one block with at least one exercise before it can be saved.

**Patterns the builder must support:**
- *Strength:* a workout with blocks "Set A", "Set B", "Set C" — in Phase 2 each is a randomized block drawing 3 exercises from a pool, balanced across body areas, sized so all three total ~60 minutes.
- *Cardio:* a workout with three fixed blocks — "Warm-up", "Cardio", "Cool-down".

---

## 9. Plan & Calendar

- **Week view** is the primary planning surface (user trains 4–5 days/week).
- Assign a workout to any day, or leave it a rest day. Add an optional per-day note.
- Plans span multiple weeks; the user can **copy a week forward** as a template for the next.
- Navigate between weeks; the current week and today are visually marked.
- **Today (home) screen** surfaces today's assigned workout with a prominent "Start Workout" button, a warm greeting line, and a small recent-activity glance. Rest days show an encouraging rest-day message — rest is framed as part of training, not absence of it.
- **Missed-workout handling (critical):** if a planned day passes without a logged session, the app does **not** punish. It quietly offers to (a) reschedule the workout to another day, (b) do a shorter "lite" version now, or (c) simply move on. No streak-shaming, no red warnings. Consistency is always shown as a *trend*, never a fragile chain that "breaks."

---

## 10. Live Workout Player

A full-screen mode that guides the user through a session set by set.

- Steps through blocks → rounds → exercises → sets in order.
- Each exercise screen shows: name, instructions, video link, target reps/weight/duration, and current set number.
- **Rest timer** between sets: counts down, with an audible chime and a vibration cue (`navigator.vibrate`); rest length comes from the exercise/block or `Settings.defaultRestSeconds`, and is **adjustable on the fly** (+/- buttons).
- **Duration timer** for time-based exercises (cardio intervals, yoga holds): count-up or count-down as appropriate.
- **Inline logging:** the user confirms or edits actuals (reps/weight/duration/distance) per set as they go. Targets pre-fill the fields.
- **Mid-workout flexibility (critical):**
  - **Swap** — replace the current exercise with an equivalent (same type, overlapping target area, allowed equipment). The swap is recorded (`substitutedFor`).
  - **Skip** — skip an exercise; recorded as `skipped: true`.
  - **End early** — finish the session now; everything done so far is logged, and the summary frames it positively ("You showed up — that counts.").
- **Lite mode:** offered at session start (and when picking up a missed workout) — generates a shortened version: fewer `rounds`, lower `selectionCount`, or trimmed sets.
- **Keep-awake:** request a screen wake lock during an active session (`navigator.wakeLock`), with graceful fallback if unsupported.
- **On completion:** a brief, warm summary (duration, exercises done, any PRs in Phase 2) and an optional `feel` check-in — a 1–5 rating plus an optional note on energy/soreness/mood.

---

## 11. History & Logging

- Every completed session writes a **LogEntry** (§5.5).
- **Journal / history view:** a reverse-chronological scrollable list, distinct from charts. Each row shows date, workout name, type, duration, and feel rating. Tap to see the full breakdown of what was done.
- Entries are **editable** after the fact.
- **Manual log entry:** the user can add a session that was done off-app (pick type, name, exercises, duration, date).
- Denormalized names (`workoutName`, `exerciseName`) ensure history stays readable even if the source workout/exercise is later edited or deleted.

---

## 12. Data Export / Import / Reset

This is the user's only backup mechanism — **include it in Phase 1.**

- **Export:** one tap produces a downloadable JSON file containing the **entire app state** — library, workouts, plans, logs, settings, and (Phase 2) metrics and achievements. Filename includes a date stamp.
- **Import:** restore from a previously exported JSON file. Show a **confirmation step** describing what will happen (replace vs. merge — default to *replace*, clearly stated).
- **Reset:** a clearly-labelled, confirm-gated option in Settings to wipe all data and restore seed content.
- The export format should be **versioned** (`schemaVersion` field) so future imports can migrate.

---

## 13. Randomization Engine (Phase 2)

The highest-risk component — implement these rules **explicitly**, do not improvise.

When a workout containing a **randomized block** is started, for each such block draw `selectionCount` exercises from `exercisePool` subject to these constraints, in priority order:

1. **Equipment filter (hard):** only exercises whose required equipment is a subset of `Settings.ownedEquipment`.
2. **Target-area balance:** prefer a selection that covers *distinct* `targetAreas` — avoid multiple exercises hitting the same area unless the pool can't satisfy it.
3. **No immediate repeat:** avoid exercises used in the *most recent* LogEntry for the same workout, when the pool is large enough to allow alternatives.
4. **Duration fit:** if the block has `targetDurationMin`, prefer a combination whose summed estimated time (`estimatedSecondsPerSet` × sets × rounds) lands within **±10%** of target.
5. **Graceful fallback:** if all constraints can't be met (small pool), relax them in **reverse priority order** (4 → 3 → 2). Constraint 1 is never relaxed. The engine must **always return a valid, non-empty selection** and never hard-fail.

The drawn selection must be **previewable before the session starts**, with a **"re-roll"** action to draw again. Once the user starts, the selection is locked for that session and recorded in the LogEntry.

---

## 14. Progression Engine (Phase 2)

The user sets their own plan; the app **nudges, never forces.**

- **Plateau detection:** when an exercise has been logged at the same targets for **N consecutive sessions** (default N = 3, configurable), the app surfaces a **gentle suggestion** — e.g. "You've been steady on this — want to try +1–2 reps next time?" or "+a little weight?".
- The suggestion is always **dismissible** and never blocks anything. Accepting it updates the workout's targets; dismissing it does nothing and doesn't re-nag immediately.
- **Deload suggestion:** after several consecutive weeks of consistent training (default 4+), the app may suggest an easier "recovery" week. Always a suggestion, never automatic.
- **No suggestion is ever framed as a demand, a deadline, or a failure.** Language is curious and optional ("want to try…?"), never prescriptive ("you should…").

---

## 15. Gamification (Phase 2)

Chosen styles: **badges & milestone achievements** and **challenges & personal records.** **No XP/levels. No fragile streaks.**

- **Badges / milestones** — awarded for meaningful, attainable moments: first workout; first session of each type; 10 / 25 / 50 sessions; first month active; first custom workout created; first time editing a workout; completing a self-set challenge. Celebrate **effort and consistency**, not just performance numbers.
- **Personal records (PRs)** — auto-detected per exercise (most reps, most weight, longest duration/distance) from LogEntries. Surfaced warmly in the post-session summary when beaten.
- **Challenges** — lightweight, opt-in, dismissible mini-goals the user can accept (e.g. "train 3 times this week", "try a yoga session this week"). Never stacked into pressure; at most one or two visible at a time.
- All celebration copy is **genuine and warm** — confetti-light, not gimmicky. Since there is no north-star goal, badges and PRs *are* the reward structure; make them feel earned and personal.

---

## 16. Progress Tracking & Charts (Phase 2)

Track all three data dimensions **equally**: numbers, consistency, and how-you-feel.

- **By type:** separate progress views for strength, cardio, mobility/yoga.
- **Numbers:** per-exercise line charts of weight / reps / duration / distance over time.
- **Consistency:** week-over-week and month-over-month session counts, shown as an **encouraging trend** — a calendar fill and a simple bar chart. Never a punishable streak.
- **Feel:** chart `feelRating` over time, ideally alongside training volume, so the user can see energy/soreness patterns.
- **Body metrics:** optional logging and charting of bodyweight/measurements (§5.6).
- **Time-range toggles:** week / month / all-time.

---

## 17. Notifications & Reminders (Phase 2)

> **Builder note — important:** True web *push* (notifications delivered while the app is fully closed) requires a server with VAPID keys, which conflicts with the **no-backend** constraint. On iOS, web push additionally requires the PWA to be installed to the Home Screen and is historically unreliable (subscriptions can silently drop).
>
> **Therefore: implement local *scheduled* reminders, not server push.** Use the Notifications API to fire a local notification at the user's chosen reminder time while the app's service worker is alive / the app is backgrounded. Treat it as **best-effort**.

- A toggle in Settings + a preferred reminder time.
- Always provide an **in-app reminder fallback**: the Today screen itself is the reliable nudge.
- Request notification permission **contextually** (when the user enables reminders), never on first load.
- Reminder copy is warm and pressure-free ("Ready when you are — today's session is waiting.").

---

## 18. Tone & Copy Guidelines

Tone is a feature, not decoration. Every user-facing string should be reviewed against these rules:

- **Warm, human, encouraging.** Talk to the user like a kind friend who believes in them.
- **Never guilt, shame, or scold.** No "you failed", no "you missed", no red alarm language for missed workouts.
- **Celebrate showing up**, not just performance. Effort counts.
- **Gentle, optional, curious** phrasing for all suggestions ("want to try…?" not "you should…").
- **Empty states are opportunities**, not dead ends — invite the next action warmly.
- Keep it concise; warmth doesn't mean wordy.

Provide all copy through a single strings file/module so tone can be audited and adjusted in one place.

---

## 19. Empty States & Error Handling

- **First run:** a brief, friendly onboarding — confirm owned equipment, units, theme, and reminder preference; then land on Today with seed content already in place. Set `firstRunComplete`.
- **Empty library / workouts / plan / history:** each shows an encouraging message and a clear primary action ("Create your first workout").
- **Storage errors:** if IndexedDB is unavailable or a quota error occurs, show a clear, non-alarming message and (if possible) suggest exporting data. Never lose data silently.
- **Import errors:** validate the JSON; on a bad file, explain what's wrong and leave existing data untouched.
- **Missing references:** a workout referencing a deleted exercise shows a clear "exercise no longer available" state with an option to swap or remove it.
- **Unsupported APIs:** wake lock, vibration, and notifications must all degrade gracefully when unavailable.

---

## 20. Accessibility & Mobile UX

- Touch targets ≥ 44×44 px.
- Sufficient color contrast in both light and dark themes (WCAG AA).
- Semantic HTML and ARIA labels for interactive controls; the live player should be usable with a screen reader.
- Respect `prefers-reduced-motion` — tone down animations/confetti.
- Designed primarily for **portrait** orientation; must not break in landscape.
- Timers and key controls reachable one-handed (lower half of the screen).
- All destructive actions (delete, reset, import-replace) are **confirm-gated**.

---

## 21. Settings

- Owned equipment (drives library filtering and randomization).
- Default rest time.
- Units — weight (lb/kg) and distance (mi/km).
- Theme — light / dark / system.
- Reminders — on/off + time (Phase 2).
- Data — Export, Import, Reset (§12).
- Progression sensitivity — the `N` plateau threshold (Phase 2).

---

## 22. Non-Functional Requirements

- **Performance:** Today screen interactive in under ~2s on a mid-range phone. Smooth 60fps scrolling and drag-and-drop.
- **Offline:** every feature except opening external video links works fully offline.
- **Resilience:** data survives app updates; schema migrations handled via Dexie versioning.
- **Code quality:** TypeScript strict mode; data layer (Dexie queries) separated from UI components; the randomization and progression engines are **pure, unit-testable functions** with no UI coupling.
- **Installability:** passes a Lighthouse PWA audit; provides an "Add to Home Screen" prompt.

---

## 23. Out of Scope

Explicitly **not** included: user accounts / multi-user, cloud sync, social or sharing features, in-app video hosting (external links only), nutrition / calorie tracking, wearable or Health-API integration, server-side push notifications, any mandatory north-star goal system, and AI-generated workout coaching.

---

## 24. Acceptance Criteria

### Phase 1 is done when:
- [ ] The app installs as a PWA and fully functions with the network disabled.
- [ ] Seed library (45–60 exercises) and seed workouts/plan load on first run.
- [ ] The user can create, edit, duplicate, and delete exercises and workouts.
- [ ] The Workout Builder shows a live duration estimate and supports drag-and-drop reordering.
- [ ] The user can build a week plan and see today's workout on the Today screen.
- [ ] The Live Player guides a fixed workout set-by-set with working rest timers, and supports swap / skip / end-early.
- [ ] Completed sessions are logged and viewable in the journal; manual entries can be added.
- [ ] A missed planned workout produces an encouraging reschedule/lite/move-on prompt — no punishment.
- [ ] Export produces a complete JSON backup; import restores it; reset works.
- [ ] Light and dark themes both work; tone pass complete.

### Phase 2 is done when:
- [ ] Randomized blocks draw exercises per the §13 rules, with preview and re-roll.
- [ ] Plateau detection surfaces gentle, dismissible progression suggestions.
- [ ] Badges, auto-detected PRs, and opt-in challenges all work.
- [ ] Progress charts cover numbers, consistency, and feel, with week/month/all-time toggles.
- [ ] Body metrics can be logged and charted.
- [ ] Local scheduled reminders work where supported and degrade gracefully where they don't.

---

## 25. Open Decisions for the User

A few choices to confirm before or during the build — sensible defaults are noted:

1. **Seed exercise library** — I can generate the full 45–60-exercise starter library as a ready-to-import JSON file so Cursor builds against real data. *(Recommended — just ask.)*
2. **Import behavior** — default is *replace all*. Confirm, or switch to *merge*.
3. **Plateau threshold N** — default 3 sessions. Adjustable in Settings.
4. **Week start day** — default Monday.
5. **App name & icon** — pick a name and an icon style for the manifest.
