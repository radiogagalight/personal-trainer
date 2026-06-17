import { describe, expect, it } from 'vitest';
import { selectForBlock } from '@/lib/randomizer';
import { defaultSettings } from '@/db/queries/settings';
import type {
  Block,
  BlockExerciseRef,
  BodyArea,
  Equipment,
  Exercise,
  LogEntry,
  Metric,
  Settings,
} from '@/types';

/** Seeded LCG so tests are deterministic. */
function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function exercise(
  overrides: Partial<Exercise> & Pick<Exercise, 'id' | 'name'>,
): Exercise {
  return {
    type: 'strength',
    targetAreas: ['core'] as BodyArea[],
    equipment: [] as Equipment[],
    instructions: '',
    defaultMetrics: ['sets', 'reps'] as Metric[],
    estimatedSecondsPerSet: 60,
    isCustom: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function block(
  refs: BlockExerciseRef[],
  overrides: Partial<Block> = {},
): Block {
  return {
    id: 'b1',
    label: 'Test block',
    mode: 'randomized',
    exercisePool: refs,
    selectionCount: 3,
    rounds: 1,
    ...overrides,
  };
}

function ref(
  id: string,
  patch: Omit<BlockExerciseRef, 'exerciseId'> = {},
): BlockExerciseRef {
  return { exerciseId: id, targetSets: 3, ...patch };
}

function withOwned(...owned: Equipment[]): Settings {
  return { ...defaultSettings, ownedEquipment: owned };
}

function logFor(workoutId: string, ids: string[]): LogEntry {
  return {
    id: 'l',
    date: '2025-01-01T00:00:00Z',
    workoutId,
    workoutName: 'w',
    type: 'strength',
    loggedExercises: ids.map((eid) => ({
      exerciseId: eid,
      exerciseName: eid,
      skipped: false,
    })),
    totalDurationMin: 30,
    wasModified: false,
    createdAt: '2025-01-01T00:00:00Z',
  };
}

describe('randomizer.selectForBlock', () => {
  const rng = () => seededRng(42)();

  it('returns exactly selectionCount when pool is large enough', () => {
    const pool: Exercise[] = ['a', 'b', 'c', 'd', 'e'].map((id) =>
      exercise({ id, name: id, targetAreas: ['core'] }),
    );
    const b = block(pool.map((e) => ref(e.id)), { selectionCount: 3 });
    const r = selectForBlock({
      block: b,
      pool,
      settings: defaultSettings,
      recentLogForWorkout: null,
      rng: seededRng(7),
    });
    expect(r.refs).toHaveLength(3);
    expect(r.unsatisfiable).toBe(false);
  });

  it('honours the equipment hard filter (rule 1, never relaxed)', () => {
    const pool: Exercise[] = [
      exercise({ id: 'a', name: 'a', equipment: ['none'] }),
      exercise({ id: 'b', name: 'b', equipment: ['kettlebells'] }),
      exercise({ id: 'c', name: 'c', equipment: ['dumbbells'] }),
    ];
    const b = block(pool.map((e) => ref(e.id)), { selectionCount: 2 });
    const r = selectForBlock({
      block: b,
      pool,
      settings: withOwned('none', 'dumbbells'),
      recentLogForWorkout: null,
      rng,
    });
    expect(r.refs.map((ref_) => ref_.exerciseId).sort()).toEqual(['a', 'c']);
  });

  it('returns unsatisfiable when no exercise survives the equipment filter', () => {
    const pool: Exercise[] = [
      exercise({ id: 'a', name: 'a', equipment: ['trx'] }),
      exercise({ id: 'b', name: 'b', equipment: ['bands'] }),
    ];
    const b = block(pool.map((e) => ref(e.id)));
    const r = selectForBlock({
      block: b,
      pool,
      settings: withOwned('none'),
      recentLogForWorkout: null,
      rng,
    });
    expect(r.unsatisfiable).toBe(true);
    expect(r.refs).toHaveLength(0);
  });

  it('prefers covering distinct target areas when possible', () => {
    const pool: Exercise[] = [
      exercise({ id: 'a', name: 'a', targetAreas: ['core'] }),
      exercise({ id: 'b', name: 'b', targetAreas: ['core'] }),
      exercise({ id: 'c', name: 'c', targetAreas: ['lower'] }),
      exercise({ id: 'd', name: 'd', targetAreas: ['upper-push'] }),
    ];
    const b = block(pool.map((e) => ref(e.id)), { selectionCount: 3 });
    const r = selectForBlock({
      block: b,
      pool,
      settings: defaultSettings,
      recentLogForWorkout: null,
      rng: seededRng(123),
    });
    const areas = new Set(r.picked.flatMap((p) => p.targetAreas));
    expect(areas.size).toBeGreaterThanOrEqual(3);
    expect(r.relaxed.areaBalance).toBe(false);
  });

  it('avoids exercises used in the most recent log when pool is large enough', () => {
    const pool: Exercise[] = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) =>
      exercise({ id, name: id, targetAreas: ['core'] }),
    );
    const b = block(pool.map((e) => ref(e.id)), { selectionCount: 2 });
    const last = logFor('w', ['a', 'b']);
    const r = selectForBlock({
      block: b,
      pool,
      settings: defaultSettings,
      recentLogForWorkout: last,
      rng: seededRng(5),
    });
    expect(r.refs.every((rf) => !['a', 'b'].includes(rf.exerciseId))).toBe(true);
    expect(r.relaxed.noRepeat).toBe(false);
  });

  it('relaxes repeat avoidance when the pool is too small to avoid it', () => {
    const pool: Exercise[] = ['a', 'b'].map((id) =>
      exercise({ id, name: id, targetAreas: ['core'] }),
    );
    const b = block(pool.map((e) => ref(e.id)), { selectionCount: 2 });
    const last = logFor('w', ['a', 'b']);
    const r = selectForBlock({
      block: b,
      pool,
      settings: defaultSettings,
      recentLogForWorkout: last,
      rng,
    });
    expect(r.refs).toHaveLength(2);
    expect(r.unsatisfiable).toBe(false);
  });

  it('respects ±10% duration band when targetDurationMin is set', () => {
    const pool: Exercise[] = ['a', 'b', 'c', 'd'].map((id, i) =>
      exercise({
        id,
        name: id,
        estimatedSecondsPerSet: 30 + i * 30, // 30, 60, 90, 120
        targetAreas: ['core'],
      }),
    );
    const b = block(
      pool.map((e) => ref(e.id, { targetSets: 1 })),
      { selectionCount: 2, targetDurationMin: 3, rounds: 1 }, // 180s ± 18s
    );
    const r = selectForBlock({
      block: b,
      pool,
      settings: defaultSettings,
      recentLogForWorkout: null,
      rng: seededRng(99),
    });
    expect(r.refs).toHaveLength(2);
    expect(r.relaxed.durationFit).toBe(false);
  });

  it('never hard-fails — even with an impossible duration target', () => {
    const pool: Exercise[] = ['a', 'b'].map((id) =>
      exercise({ id, name: id, estimatedSecondsPerSet: 10, targetAreas: ['core'] }),
    );
    const b = block(pool.map((e) => ref(e.id, { targetSets: 1 })), {
      selectionCount: 2,
      targetDurationMin: 60, // requires 3600s; total is ~20s
    });
    const r = selectForBlock({
      block: b,
      pool,
      settings: defaultSettings,
      recentLogForWorkout: null,
      rng,
    });
    expect(r.refs).toHaveLength(2);
    expect(r.unsatisfiable).toBe(false);
    expect(r.relaxed.durationFit).toBe(true);
  });

  it('clamps selectionCount to the available candidates', () => {
    const pool: Exercise[] = ['a', 'b'].map((id) =>
      exercise({ id, name: id, targetAreas: ['core'] }),
    );
    const b = block(pool.map((e) => ref(e.id)), { selectionCount: 5 });
    const r = selectForBlock({
      block: b,
      pool,
      settings: defaultSettings,
      recentLogForWorkout: null,
      rng,
    });
    expect(r.refs).toHaveLength(2);
  });
});
