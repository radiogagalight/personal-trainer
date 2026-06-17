/**
 * Pure progression engine (spec §14).
 *
 *   detectPlateaus(logs, exerciseId, n)
 *     A plateau is N consecutive most-recent logs (across workouts)
 *     containing this exercise where the best set's reps AND weight
 *     are unchanged. We surface a *gentle* suggestion when the plateau
 *     is detected.
 *
 *   suggestDeload(logs, weeks)
 *     If the user has trained ≥3 times per week for `weeks` consecutive
 *     weeks, suggest an easier recovery week. Always optional.
 *
 * Suggestions are values, not actions — UI decides whether/how to show them
 * and whether the user dismisses or accepts.
 */

import type { LogEntry, LoggedExercise } from '@/types';
import { bestSet } from '@/lib/logged';
import { parseISO, startOfWeek } from 'date-fns';

export interface PlateauSuggestion {
  kind: 'plateau';
  exerciseId: string;
  exerciseName: string;
  /** Steady reps target observed across the last N sessions. */
  steadyReps?: number;
  /** Steady weight observed. */
  steadyWeight?: number;
  /** Steady duration observed. */
  steadyDurationSec?: number;
  /** Recommended next-step delta — always a small, friendly nudge. */
  suggestReps?: number;
  suggestWeight?: number;
}

export interface DeloadSuggestion {
  kind: 'deload';
  weeksStreak: number;
}

function summariseLogged(e: LoggedExercise): {
  bestReps?: number;
  bestWeight?: number;
  bestDurationSec?: number;
} {
  return {
    bestReps: e.actualReps?.length ? Math.max(...e.actualReps) : undefined,
    bestWeight: e.actualWeight?.length ? Math.max(...e.actualWeight) : undefined,
    bestDurationSec: bestSet(e.actualDurationSec),
  };
}

export function detectPlateau(
  logs: LogEntry[],
  exerciseId: string,
  n: number,
): PlateauSuggestion | null {
  const occurrences = logs
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((l) => ({
      log: l,
      entry: l.loggedExercises.find(
        (e) => e.exerciseId === exerciseId && !e.skipped,
      ),
    }))
    .filter((x) => x.entry)
    .slice(0, n);

  if (occurrences.length < n) return null;

  const summaries = occurrences.map((o) => summariseLogged(o.entry!));
  const first = summaries[0];

  const steadyReps = first.bestReps;
  const steadyWeight = first.bestWeight;
  const steadyDuration = first.bestDurationSec;

  const allSame = summaries.every(
    (s) =>
      s.bestReps === steadyReps &&
      s.bestWeight === steadyWeight &&
      s.bestDurationSec === steadyDuration,
  );
  if (!allSame) return null;

  const exerciseName = occurrences[0].entry!.exerciseName;

  return {
    kind: 'plateau',
    exerciseId,
    exerciseName,
    steadyReps,
    steadyWeight,
    steadyDurationSec: steadyDuration,
    suggestReps:
      steadyReps !== undefined && steadyReps > 0 ? steadyReps + 1 : undefined,
    suggestWeight:
      steadyWeight !== undefined && steadyWeight > 0
        ? Math.round(steadyWeight * 1.05)
        : undefined,
  };
}

export function detectAllPlateaus(
  logs: LogEntry[],
  n: number,
): PlateauSuggestion[] {
  const ids = new Set<string>();
  for (const l of logs) {
    for (const e of l.loggedExercises) {
      if (!e.skipped) ids.add(e.exerciseId);
    }
  }
  const out: PlateauSuggestion[] = [];
  for (const id of ids) {
    const s = detectPlateau(logs, id, n);
    if (s) out.push(s);
  }
  return out;
}

export function suggestDeload(
  logs: LogEntry[],
  threshold: number = 4,
): DeloadSuggestion | null {
  if (logs.length === 0) return null;
  // Count sessions per ISO week (Monday start).
  const byWeek = new Map<string, number>();
  for (const l of logs) {
    const k = startOfWeek(parseISO(l.date), { weekStartsOn: 1 }).toISOString();
    byWeek.set(k, (byWeek.get(k) ?? 0) + 1);
  }
  const weeks = Array.from(byWeek.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1));
  let streak = 0;
  for (const [, count] of weeks) {
    if (count >= 3) streak++;
    else break;
  }
  if (streak >= threshold) {
    return { kind: 'deload', weeksStreak: streak };
  }
  return null;
}
