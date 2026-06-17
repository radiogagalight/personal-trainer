import { db } from '../client';
import { newId, nowIso } from '@/lib/ids';
import { estimateWorkoutMinutes } from '@/lib/duration';
import type { Block, Workout } from '@/types';

export async function listWorkouts(): Promise<Workout[]> {
  return db.workouts.orderBy('updatedAt').reverse().toArray();
}

export async function getWorkout(id: string): Promise<Workout | undefined> {
  return db.workouts.get(id);
}

export async function getWorkoutsByIds(ids: string[]): Promise<Workout[]> {
  if (!ids.length) return [];
  const rows = await db.workouts.bulkGet(ids);
  return rows.filter((r): r is Workout => Boolean(r));
}

export type WorkoutDraft = Omit<
  Workout,
  'id' | 'createdAt' | 'updatedAt' | 'estimatedDuration'
> & {
  estimatedDuration?: number;
};

async function withRecomputedDuration(
  workout: Workout,
  override?: number,
): Promise<Workout> {
  if (typeof override === 'number' && override > 0) {
    return { ...workout, estimatedDuration: Math.round(override) };
  }
  const ids = Array.from(
    new Set(
      workout.blocks.flatMap((b) => b.exercisePool.map((r) => r.exerciseId)),
    ),
  );
  const exercises = ids.length
    ? ((await db.exercises.bulkGet(ids)).filter(Boolean) as import('@/types').Exercise[])
    : [];
  const minutes = estimateWorkoutMinutes(workout, exercises);
  return { ...workout, estimatedDuration: minutes };
}

export async function createWorkout(draft: WorkoutDraft): Promise<Workout> {
  const now = nowIso();
  const base: Workout = {
    ...draft,
    id: newId(),
    estimatedDuration: draft.estimatedDuration ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  const ready = await withRecomputedDuration(base, draft.estimatedDuration);
  await db.workouts.put(ready);
  return ready;
}

export async function updateWorkout(
  id: string,
  patch: Partial<WorkoutDraft>,
): Promise<Workout | undefined> {
  const cur = await db.workouts.get(id);
  if (!cur) return undefined;
  const merged: Workout = {
    ...cur,
    ...patch,
    id,
    updatedAt: nowIso(),
    estimatedDuration: patch.estimatedDuration ?? cur.estimatedDuration,
  };
  const ready = await withRecomputedDuration(merged, patch.estimatedDuration);
  await db.workouts.put(ready);
  return ready;
}

export async function duplicateWorkout(id: string): Promise<Workout | undefined> {
  const cur = await db.workouts.get(id);
  if (!cur) return undefined;
  const now = nowIso();
  const cloneBlocks: Block[] = cur.blocks.map((b) => ({
    ...b,
    id: newId(),
    exercisePool: b.exercisePool.map((ref) => ({ ...ref })),
  }));
  const copy: Workout = {
    ...cur,
    id: newId(),
    name: `${cur.name} (copy)`,
    blocks: cloneBlocks,
    createdAt: now,
    updatedAt: now,
  };
  await db.workouts.put(copy);
  return copy;
}

export async function deleteWorkout(id: string): Promise<void> {
  await db.workouts.delete(id);
}

export async function recomputeAllDurations(): Promise<void> {
  const workouts = await db.workouts.toArray();
  for (const w of workouts) {
    const ready = await withRecomputedDuration(w);
    await db.workouts.put(ready);
  }
}
