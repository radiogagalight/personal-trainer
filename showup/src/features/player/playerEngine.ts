import type { Block, BlockExerciseRef, Workout } from '@/types';

export interface StepCursor {
  blockIndex: number;
  roundIndex: number; // 0-based
  exerciseIndex: number;
  setIndex: number; // 0-based within set count
}

export interface ResolvedStep {
  cursor: StepCursor;
  block: Block;
  ref: BlockExerciseRef;
  setCount: number;
  roundCount: number;
}

/** Apply a soft "lite" transform to a workout — never modifies the original. */
export function applyLiteMode(workout: Workout): Workout {
  return {
    ...workout,
    blocks: workout.blocks.map((b) => ({
      ...b,
      rounds: Math.max(1, Math.floor((b.rounds ?? 1) / 2) || 1),
      exercisePool: b.exercisePool.map((r) => ({
        ...r,
        targetSets: r.targetSets ? Math.max(1, r.targetSets - 1) : r.targetSets,
        targetDurationSec: r.targetDurationSec
          ? Math.max(10, Math.round(r.targetDurationSec * 0.7))
          : r.targetDurationSec,
      })),
    })),
  };
}

function setCountFor(ref: BlockExerciseRef): number {
  return Math.max(1, ref.targetSets ?? 1);
}

function isValidCursor(workout: Workout, c: StepCursor): boolean {
  const b = workout.blocks[c.blockIndex];
  if (!b) return false;
  const rounds = Math.max(1, b.rounds ?? 1);
  if (c.roundIndex >= rounds) return false;
  const r = b.exercisePool[c.exerciseIndex];
  if (!r) return false;
  if (c.setIndex >= setCountFor(r)) return false;
  return true;
}

export function resolveStep(
  workout: Workout,
  cursor: StepCursor,
): ResolvedStep | null {
  const block = workout.blocks[cursor.blockIndex];
  if (!block) return null;
  const ref = block.exercisePool[cursor.exerciseIndex];
  if (!ref) return null;
  return {
    cursor,
    block,
    ref,
    setCount: setCountFor(ref),
    roundCount: Math.max(1, block.rounds ?? 1),
  };
}

export function firstStep(workout: Workout): StepCursor | null {
  for (let bi = 0; bi < workout.blocks.length; bi++) {
    const b = workout.blocks[bi];
    if (!b.exercisePool.length) continue;
    return { blockIndex: bi, roundIndex: 0, exerciseIndex: 0, setIndex: 0 };
  }
  return null;
}

export function nextStep(
  workout: Workout,
  cursor: StepCursor,
): StepCursor | null {
  if (!isValidCursor(workout, cursor)) return null;
  const block = workout.blocks[cursor.blockIndex];
  const ref = block.exercisePool[cursor.exerciseIndex];
  const setCount = setCountFor(ref);

  // Next set?
  if (cursor.setIndex + 1 < setCount) {
    return { ...cursor, setIndex: cursor.setIndex + 1 };
  }

  // Next exercise within block?
  if (cursor.exerciseIndex + 1 < block.exercisePool.length) {
    return {
      ...cursor,
      exerciseIndex: cursor.exerciseIndex + 1,
      setIndex: 0,
    };
  }

  // Next round within block?
  const roundCount = Math.max(1, block.rounds ?? 1);
  if (cursor.roundIndex + 1 < roundCount) {
    return {
      ...cursor,
      roundIndex: cursor.roundIndex + 1,
      exerciseIndex: 0,
      setIndex: 0,
    };
  }

  // Next non-empty block.
  for (let bi = cursor.blockIndex + 1; bi < workout.blocks.length; bi++) {
    if (workout.blocks[bi].exercisePool.length > 0) {
      return { blockIndex: bi, roundIndex: 0, exerciseIndex: 0, setIndex: 0 };
    }
  }

  return null; // workout complete
}

/** Skip the rest of the current exercise (all remaining sets), jump to next exercise. */
export function skipExercise(
  workout: Workout,
  cursor: StepCursor,
): StepCursor | null {
  const block = workout.blocks[cursor.blockIndex];
  if (!block) return null;
  if (cursor.exerciseIndex + 1 < block.exercisePool.length) {
    return {
      ...cursor,
      exerciseIndex: cursor.exerciseIndex + 1,
      setIndex: 0,
    };
  }
  const roundCount = Math.max(1, block.rounds ?? 1);
  if (cursor.roundIndex + 1 < roundCount) {
    return {
      ...cursor,
      roundIndex: cursor.roundIndex + 1,
      exerciseIndex: 0,
      setIndex: 0,
    };
  }
  for (let bi = cursor.blockIndex + 1; bi < workout.blocks.length; bi++) {
    if (workout.blocks[bi].exercisePool.length > 0) {
      return { blockIndex: bi, roundIndex: 0, exerciseIndex: 0, setIndex: 0 };
    }
  }
  return null;
}
