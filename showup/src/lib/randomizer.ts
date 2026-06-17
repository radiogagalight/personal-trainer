/**
 * Pure randomization engine for randomized workout blocks.
 * Spec §13. Rules in priority order:
 *
 *   1. Equipment filter (hard) — exercise's required equipment ⊆ ownedEquipment.
 *   2. Target-area balance  — prefer selections with distinct targetAreas.
 *   3. No immediate repeat  — avoid exercises used in the most recent log
 *                              for the same workout.
 *   4. Duration fit         — prefer combinations summing to within ±10%
 *                              of block.targetDurationMin (if set).
 *   5. Graceful fallback    — if not satisfiable, relax in reverse priority
 *                              order (4 → 3 → 2). Rule 1 is never relaxed.
 *
 * The engine always returns a non-empty selection (when at least one
 * equipment-eligible exercise exists in the pool) and never throws.
 */

import type {
  Block,
  BlockExerciseRef,
  Equipment,
  Exercise,
  LogEntry,
  Settings,
} from '@/types';
import { equipmentMet } from '@/lib/equipment';

export type RandomFn = () => number;

export interface RandomizerOptions {
  /** Block being resolved. */
  block: Block;
  /** Hydrated exercise objects for `block.exercisePool` (any extras are ignored). */
  pool: Exercise[];
  /** Current settings (used for equipment + default per-set seconds). */
  settings: Settings;
  /** Most recent log entry for this same workout, or null. */
  recentLogForWorkout: LogEntry | null;
  /** Injected RNG for testability. Defaults to Math.random. */
  rng?: RandomFn;
}

/** Tracks which constraints had to be relaxed to find a selection. */
export interface RelaxationReport {
  durationFit: boolean;
  noRepeat: boolean;
  areaBalance: boolean;
}

export interface RandomizerResult {
  refs: BlockExerciseRef[];
  picked: Exercise[];
  relaxed: RelaxationReport;
  /** True iff the equipment filter left the pool empty. */
  unsatisfiable: boolean;
}

// ──────────────────────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: readonly T[], rng: RandomFn): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function equipmentOk(ex: Exercise, owned: Set<Equipment>): boolean {
  return equipmentMet(ex, owned);
}

function refFor(block: Block, ex: Exercise): BlockExerciseRef {
  return block.exercisePool.find((r) => r.exerciseId === ex.id) ?? {
    exerciseId: ex.id,
  };
}

function estimateRefSeconds(
  ref: BlockExerciseRef,
  ex: Exercise,
  defaultSetSec: number,
): number {
  const sets = Math.max(1, ref.targetSets ?? 1);
  const perSet =
    ref.targetDurationSec ?? ex.estimatedSecondsPerSet ?? defaultSetSec;
  const rest = Math.max(0, ref.restSecondsBetweenSets ?? 0);
  return sets * perSet + Math.max(0, sets - 1) * rest;
}

function combinationSeconds(
  block: Block,
  combo: Exercise[],
  defaultSetSec: number,
): number {
  const rounds = Math.max(1, block.rounds ?? 1);
  const innerSec = combo.reduce(
    (sum, ex) => sum + estimateRefSeconds(refFor(block, ex), ex, defaultSetSec),
    0,
  );
  return rounds * innerSec;
}

function combinationAreaCoverage(combo: Exercise[]): number {
  const set = new Set<string>();
  for (const ex of combo) for (const a of ex.targetAreas) set.add(a);
  return set.size;
}

function withinDurationBand(
  block: Block,
  combo: Exercise[],
  defaultSetSec: number,
): boolean {
  const target = block.targetDurationMin;
  if (target === undefined) return true;
  const targetSec = target * 60;
  const sec = combinationSeconds(block, combo, defaultSetSec);
  const band = targetSec * 0.1;
  return Math.abs(sec - targetSec) <= band;
}

/** Combinations of size k from arr (iterator-light, returns full list). */
function combinations<T>(arr: readonly T[], k: number): T[][] {
  if (k <= 0) return [[]];
  if (k > arr.length) return [];
  if (k === arr.length) return [arr.slice()];
  const out: T[][] = [];
  function recur(start: number, chosen: T[]) {
    if (chosen.length === k) {
      out.push(chosen.slice());
      return;
    }
    const need = k - chosen.length;
    for (let i = start; i <= arr.length - need; i++) {
      chosen.push(arr[i]);
      recur(i + 1, chosen);
      chosen.pop();
    }
  }
  recur(0, []);
  return out;
}

const COMBINATION_CAP = 500; // safety net so we never explode

// ──────────────────────────────────────────────────────────────────────────
// main
// ──────────────────────────────────────────────────────────────────────────

export function selectForBlock(opts: RandomizerOptions): RandomizerResult {
  const { block, pool, settings, recentLogForWorkout } = opts;
  const rng = opts.rng ?? Math.random;
  const defaultSetSec = 45;

  const owned = new Set<Equipment>(settings.ownedEquipment);
  const referencedIds = new Set(block.exercisePool.map((r) => r.exerciseId));

  const candidates = pool.filter(
    (ex) => referencedIds.has(ex.id) && equipmentOk(ex, owned),
  );

  if (candidates.length === 0) {
    return {
      refs: [],
      picked: [],
      relaxed: { durationFit: false, noRepeat: false, areaBalance: false },
      unsatisfiable: true,
    };
  }

  const k = Math.min(
    Math.max(1, block.selectionCount ?? candidates.length),
    candidates.length,
  );

  const recentlyUsed = new Set<string>(
    (recentLogForWorkout?.loggedExercises ?? []).map((l) => l.exerciseId),
  );

  // Enumerate combinations (capped) and score them under the active relaxations.
  const tryFind = (
    relaxBalance: boolean,
    relaxRepeat: boolean,
    relaxDuration: boolean,
  ): Exercise[] | null => {
    const combos = combinations(shuffle(candidates, rng), k);
    if (combos.length === 0) return null;
    const limited = combos.slice(0, COMBINATION_CAP);

    let best: { combo: Exercise[]; score: number } | null = null;

    for (const combo of limited) {
      // Hard rules under current relaxation profile:
      if (!relaxRepeat && combo.every((c) => recentlyUsed.has(c.id))) {
        if (candidates.length > k) continue; // alternatives exist
      }
      if (
        !relaxRepeat &&
        combo.some((c) => recentlyUsed.has(c.id)) &&
        candidates.filter((c) => !recentlyUsed.has(c.id)).length >= k
      ) {
        continue;
      }
      if (!relaxDuration && !withinDurationBand(block, combo, defaultSetSec)) {
        continue;
      }

      const coverage = combinationAreaCoverage(combo);
      const sec = combinationSeconds(block, combo, defaultSetSec);
      const target = (block.targetDurationMin ?? 0) * 60;
      const durationPenalty = target
        ? Math.abs(sec - target) / Math.max(target, 1)
        : 0;
      const overlap = combo.reduce(
        (n, c) => n + (recentlyUsed.has(c.id) ? 1 : 0),
        0,
      );

      const score =
        (relaxBalance ? 0 : coverage * 100) -
        (relaxRepeat ? 0 : overlap * 25) -
        (relaxDuration ? 0 : durationPenalty * 50) +
        rng();

      if (!best || score > best.score) {
        best = { combo, score };
      }
    }

    return best?.combo ?? null;
  };

  // Try strictest first, then relax in reverse priority: 4 → 3 → 2.
  const relaxationLevels: [boolean, boolean, boolean, RelaxationReport][] = [
    [false, false, false, { durationFit: false, noRepeat: false, areaBalance: false }],
    [false, false, true,  { durationFit: true,  noRepeat: false, areaBalance: false }],
    [false, true,  true,  { durationFit: true,  noRepeat: true,  areaBalance: false }],
    [true,  true,  true,  { durationFit: true,  noRepeat: true,  areaBalance: true }],
  ];

  for (const [bal, rep, dur, report] of relaxationLevels) {
    const found = tryFind(bal, rep, dur);
    if (found && found.length === k) {
      return {
        refs: found.map((ex) => refFor(block, ex)),
        picked: found,
        relaxed: report,
        unsatisfiable: false,
      };
    }
  }

  // Ultimate fallback: random subset.
  const fallback = shuffle(candidates, rng).slice(0, k);
  return {
    refs: fallback.map((ex) => refFor(block, ex)),
    picked: fallback,
    relaxed: { durationFit: true, noRepeat: true, areaBalance: true },
    unsatisfiable: false,
  };
}
