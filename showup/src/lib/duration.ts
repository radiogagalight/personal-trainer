import type {
  Block,
  BlockExerciseRef,
  Exercise,
  Workout,
} from '@/types';

const DEFAULT_SET_SECONDS = 45;

function exerciseSeconds(
  ref: BlockExerciseRef,
  exercise: Exercise | undefined,
): number {
  const sets = Math.max(1, ref.targetSets ?? 1);
  const perSet =
    ref.targetDurationSec ??
    exercise?.estimatedSecondsPerSet ??
    DEFAULT_SET_SECONDS;
  const rest = Math.max(0, ref.restSecondsBetweenSets ?? 0);
  return sets * perSet + Math.max(0, sets - 1) * rest;
}

export function estimateBlockSeconds(
  block: Block,
  byId: Map<string, Exercise>,
): number {
  const rounds = Math.max(1, block.rounds ?? 1);
  const pool = block.mode === 'randomized' && block.selectionCount
    ? block.exercisePool.slice(0, block.selectionCount)
    : block.exercisePool;
  const inner = pool.reduce(
    (sum, ref) => sum + exerciseSeconds(ref, byId.get(ref.exerciseId)),
    0,
  );
  return rounds * inner;
}

export function estimateWorkoutMinutes(
  workout: Pick<Workout, 'blocks'>,
  exercises: Exercise[] | Map<string, Exercise>,
): number {
  const byId =
    exercises instanceof Map
      ? exercises
      : new Map(exercises.map((e) => [e.id, e]));
  const seconds = workout.blocks.reduce(
    (sum, b) => sum + estimateBlockSeconds(b, byId),
    0,
  );
  return Math.round(seconds / 60);
}
