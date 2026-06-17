import { describe, expect, it } from 'vitest';
import { detectPRs } from '@/lib/prs';
import type { LogEntry, LoggedExercise } from '@/types';

const baseLog = (
  date: string,
  ex: LoggedExercise[],
  id = date,
): LogEntry => ({
  id,
  date,
  workoutId: 'w',
  workoutName: 'w',
  type: 'strength',
  loggedExercises: ex,
  totalDurationMin: 30,
  wasModified: false,
  createdAt: date,
});

const ex = (
  id: string,
  patch: Partial<LoggedExercise> = {},
): LoggedExercise => ({
  exerciseId: id,
  exerciseName: id,
  skipped: false,
  ...patch,
});

describe('prs.detectPRs', () => {
  it('flags first-ever logged value as a PR', () => {
    const newLog = baseLog('2025-01-08', [
      ex('a', { actualWeight: [100, 100] }),
    ]);
    const prs = detectPRs([], newLog);
    expect(prs).toHaveLength(1);
    expect(prs[0]).toMatchObject({ exerciseId: 'a', category: 'weight', next: 100 });
  });

  it('does not flag a PR for an equal or lower value', () => {
    const history = [
      baseLog('2025-01-01', [ex('a', { actualWeight: [100, 100] })]),
    ];
    const newLog = baseLog('2025-01-08', [
      ex('a', { actualWeight: [100, 95] }),
    ]);
    expect(detectPRs(history, newLog)).toHaveLength(0);
  });

  it('flags max reps separately from weight', () => {
    const history = [
      baseLog('2025-01-01', [
        ex('a', { actualWeight: [100], actualReps: [10] }),
      ]),
    ];
    const newLog = baseLog('2025-01-08', [
      ex('a', { actualWeight: [100], actualReps: [12] }),
    ]);
    const prs = detectPRs(history, newLog);
    expect(prs).toHaveLength(1);
    expect(prs[0]).toMatchObject({ category: 'reps', next: 12 });
  });

  it('flags duration PR when applicable', () => {
    const history = [
      baseLog('2025-01-01', [ex('b', { actualDurationSec: [300] })]),
    ];
    const newLog = baseLog('2025-01-08', [
      ex('b', { actualDurationSec: [360] }),
    ]);
    const prs = detectPRs(history, newLog);
    expect(prs[0]).toMatchObject({ category: 'duration', next: 360 });
  });

  it('ignores skipped entries', () => {
    const newLog = baseLog('2025-01-08', [
      { exerciseId: 'a', exerciseName: 'a', skipped: true, actualWeight: [200] },
    ]);
    expect(detectPRs([], newLog)).toHaveLength(0);
  });
});
