/**
 * Personal-record detection (spec §15).
 *
 *   detectPRs(historicLogs, newLog)
 *     Compares each non-skipped exercise in `newLog` against the user's
 *     best historic values: max single-set weight, max single-set reps,
 *     longest duration, longest distance. Returns one PR record per
 *     exercise/category that was beaten.
 *
 * Pure — no DB access. Suitable for the post-session summary.
 */

import type { LogEntry, LoggedExercise } from '@/types';
import { bestSet } from '@/lib/logged';

export type PRCategory = 'weight' | 'reps' | 'duration' | 'distance';

export interface PRRecord {
  exerciseId: string;
  exerciseName: string;
  category: PRCategory;
  previous?: number;
  next: number;
}

function bestOf(entry: LoggedExercise, cat: PRCategory): number | undefined {
  switch (cat) {
    case 'weight':
      return entry.actualWeight?.length
        ? Math.max(...entry.actualWeight)
        : undefined;
    case 'reps':
      return entry.actualReps?.length
        ? Math.max(...entry.actualReps)
        : undefined;
    case 'duration':
      return bestSet(entry.actualDurationSec);
    case 'distance':
      return bestSet(entry.actualDistance);
  }
}

function historicBest(
  logs: LogEntry[],
  exerciseId: string,
  cat: PRCategory,
): number | undefined {
  let best: number | undefined;
  for (const l of logs) {
    for (const e of l.loggedExercises) {
      if (e.exerciseId !== exerciseId || e.skipped) continue;
      const v = bestOf(e, cat);
      if (v !== undefined && (best === undefined || v > best)) best = v;
    }
  }
  return best;
}

export function detectPRs(
  historicLogs: LogEntry[],
  newLog: LogEntry,
): PRRecord[] {
  const cats: PRCategory[] = ['weight', 'reps', 'duration', 'distance'];
  const out: PRRecord[] = [];
  for (const e of newLog.loggedExercises) {
    if (e.skipped) continue;
    for (const cat of cats) {
      const next = bestOf(e, cat);
      if (next === undefined || next <= 0) continue;
      const previous = historicBest(historicLogs, e.exerciseId, cat);
      if (previous === undefined || next > previous) {
        out.push({
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          category: cat,
          previous,
          next,
        });
      }
    }
  }
  return out;
}
