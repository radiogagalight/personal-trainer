/**
 * Persisted snapshot of an in-progress live session.
 *
 * The live player keeps its working state in React state; if the tab is
 * killed (iOS reclaiming memory, a reload, an accidental back-swipe) that
 * state would be lost. We mirror it to localStorage on every meaningful
 * change so the session can be resumed exactly where it left off.
 *
 * Only one active session is tracked at a time — starting a new one
 * overwrites the previous snapshot.
 */

import type { LoggedExercise, Workout } from '@/types';
import type { StepCursor } from './playerEngine';

const KEY = 'showup:active-session';
const VERSION = 1;

export interface SessionSnapshot {
  version: number;
  /** The route workout id this session was started from. */
  workoutId: string;
  /** The locked working copy (randomized resolved, lite applied, swaps applied). */
  workout: Workout;
  cursor: StepCursor;
  /** Map<exerciseId, LoggedExercise> serialized as entries. */
  logged: [string, LoggedExercise][];
  startedAt: number;
  lite: boolean;
  wasModified: boolean;
  savedAt: number;
}

export function saveSnapshot(
  s: Omit<SessionSnapshot, 'version' | 'savedAt'>,
): void {
  try {
    const snapshot: SessionSnapshot = {
      ...s,
      version: VERSION,
      savedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* storage full or unavailable — resume is best-effort */
  }
}

export function loadSnapshot(): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionSnapshot;
    if (parsed.version !== VERSION || !parsed.workout || !parsed.cursor) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSnapshot(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
