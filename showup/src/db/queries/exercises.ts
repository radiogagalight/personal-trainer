import { db } from '../client';
import { newId, nowIso } from '@/lib/ids';
import type { Exercise } from '@/types';

export async function listExercises(): Promise<Exercise[]> {
  return db.exercises.orderBy('name').toArray();
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}

export async function getExercisesByIds(ids: string[]): Promise<Exercise[]> {
  if (!ids.length) return [];
  const rows = await db.exercises.bulkGet(ids);
  return rows.filter((r): r is Exercise => Boolean(r));
}

export type ExerciseDraft = Omit<
  Exercise,
  'id' | 'createdAt' | 'updatedAt' | 'isCustom'
> & {
  isCustom?: boolean;
};

export async function createExercise(draft: ExerciseDraft): Promise<Exercise> {
  const now = nowIso();
  const ex: Exercise = {
    ...draft,
    id: newId(),
    isCustom: draft.isCustom ?? true,
    createdAt: now,
    updatedAt: now,
  };
  await db.exercises.put(ex);
  return ex;
}

export async function updateExercise(
  id: string,
  patch: Partial<ExerciseDraft>,
): Promise<Exercise | undefined> {
  const cur = await db.exercises.get(id);
  if (!cur) return undefined;
  const next: Exercise = {
    ...cur,
    ...patch,
    id,
    updatedAt: nowIso(),
  };
  await db.exercises.put(next);
  return next;
}

export async function duplicateExercise(id: string): Promise<Exercise | undefined> {
  const cur = await db.exercises.get(id);
  if (!cur) return undefined;
  const now = nowIso();
  const copy: Exercise = {
    ...cur,
    id: newId(),
    name: `${cur.name} (copy)`,
    isCustom: true,
    createdAt: now,
    updatedAt: now,
  };
  await db.exercises.put(copy);
  return copy;
}

export async function deleteExercise(id: string): Promise<void> {
  await db.exercises.delete(id);
}

/**
 * Count how many workouts reference this exercise (across any block).
 * Used to warn the user before deletion.
 */
export async function countReferencingWorkouts(exerciseId: string): Promise<number> {
  const workouts = await db.workouts.toArray();
  return workouts.reduce(
    (n, w) =>
      n +
      (w.blocks.some((b) =>
        b.exercisePool.some((ref) => ref.exerciseId === exerciseId),
      )
        ? 1
        : 0),
    0,
  );
}
