import { describe, expect, it } from 'vitest';
import {
  detectAllPlateaus,
  detectPlateau,
  suggestDeload,
} from '@/lib/progression';
import type { LogEntry } from '@/types';

function entry(
  exerciseId: string,
  reps: number[],
  weight: number[] = [],
): LogEntry['loggedExercises'][number] {
  return {
    exerciseId,
    exerciseName: exerciseId,
    actualSets: reps.length,
    actualReps: reps,
    actualWeight: weight.length ? weight : undefined,
    skipped: false,
  };
}

function log(date: string, exercises: LogEntry['loggedExercises']): LogEntry {
  return {
    id: date,
    date,
    workoutId: 'w',
    workoutName: 'w',
    type: 'strength',
    loggedExercises: exercises,
    totalDurationMin: 30,
    wasModified: false,
    createdAt: date,
  };
}

describe('progression.detectPlateau', () => {
  it('returns null when too few sessions exist', () => {
    const logs = [log('2025-01-01', [entry('a', [10], [100])])];
    expect(detectPlateau(logs, 'a', 3)).toBeNull();
  });

  it('detects a flat plateau across N consecutive sessions', () => {
    const logs = [
      log('2025-01-15', [entry('a', [10, 10, 10], [100, 100, 100])]),
      log('2025-01-08', [entry('a', [10, 10, 10], [100, 100, 100])]),
      log('2025-01-01', [entry('a', [10, 10, 10], [100, 100, 100])]),
    ];
    const r = detectPlateau(logs, 'a', 3);
    expect(r).not.toBeNull();
    expect(r!.steadyReps).toBe(10);
    expect(r!.steadyWeight).toBe(100);
    expect(r!.suggestReps).toBe(11);
    expect(r!.suggestWeight).toBe(105);
  });

  it('does not flag a plateau when reps moved', () => {
    const logs = [
      log('2025-01-15', [entry('a', [12, 12], [100, 100])]),
      log('2025-01-08', [entry('a', [10, 10], [100, 100])]),
      log('2025-01-01', [entry('a', [10, 10], [100, 100])]),
    ];
    expect(detectPlateau(logs, 'a', 3)).toBeNull();
  });

  it('ignores skipped occurrences when counting consecutive sessions', () => {
    const logs = [
      log('2025-01-22', [{ exerciseId: 'a', exerciseName: 'a', skipped: true }]),
      log('2025-01-15', [entry('a', [10], [100])]),
      log('2025-01-08', [entry('a', [10], [100])]),
      log('2025-01-01', [entry('a', [10], [100])]),
    ];
    const r = detectPlateau(logs, 'a', 3);
    expect(r).not.toBeNull();
  });

  it('detectAllPlateaus surfaces every steady exercise', () => {
    const logs = [
      log('2025-01-15', [entry('a', [10], [50]), entry('b', [8], [40])]),
      log('2025-01-08', [entry('a', [10], [50]), entry('b', [8], [40])]),
      log('2025-01-01', [entry('a', [10], [50]), entry('b', [8], [40])]),
    ];
    const all = detectAllPlateaus(logs, 3);
    expect(all.map((p) => p.exerciseId).sort()).toEqual(['a', 'b']);
  });
});

describe('progression.suggestDeload', () => {
  it('returns null without enough consecutive consistent weeks', () => {
    expect(suggestDeload([], 4)).toBeNull();
  });

  it('triggers when ≥3 sessions for 4+ consecutive weeks', () => {
    const days: string[] = [];
    // 5 weeks of 3 sessions each, ending recently.
    const start = new Date();
    start.setDate(start.getDate() - 5 * 7);
    for (let w = 0; w < 5; w++) {
      for (let d = 0; d < 3; d++) {
        const dt = new Date(start);
        dt.setDate(start.getDate() + w * 7 + d);
        days.push(dt.toISOString());
      }
    }
    const logs = days.map((d) => log(d, [entry('x', [10])]));
    const r = suggestDeload(logs, 4);
    expect(r).not.toBeNull();
    expect(r!.weeksStreak).toBeGreaterThanOrEqual(4);
  });
});
