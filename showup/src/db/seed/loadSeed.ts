import { db } from '../client';
import { newId, nowIso } from '@/lib/ids';
import { estimateWorkoutMinutes } from '@/lib/duration';
import { getSettings, saveSettings, defaultSettings } from '../queries/settings';
import { currentWeekAnchor } from '../queries/plans';
import type {
  Block,
  BlockExerciseRef,
  Exercise,
  Plan,
  Workout,
} from '@/types';
import rawSeed from './exercises.json';

interface RawSeedExercise {
  name: string;
  type: Exercise['type'];
  targetAreas: Exercise['targetAreas'];
  equipment: Exercise['equipment'];
  instructions: string;
  videoUrl?: string;
  defaultMetrics: Exercise['defaultMetrics'];
  estimatedSecondsPerSet: number;
  isCustom: boolean;
}

interface RawSeedFile {
  schemaVersion: number;
  exercises: RawSeedExercise[];
}

const seed = rawSeed as RawSeedFile;

function hydrateExercises(): Exercise[] {
  const now = nowIso();
  return seed.exercises.map((e) => ({
    ...e,
    id: newId(),
    isCustom: false,
    createdAt: now,
    updatedAt: now,
  }));
}

function findByName(exercises: Exercise[], name: string): Exercise {
  const hit = exercises.find((e) => e.name === name);
  if (!hit) throw new Error(`Seed: exercise "${name}" not found`);
  return hit;
}

function ref(
  exercises: Exercise[],
  name: string,
  partial: Omit<BlockExerciseRef, 'exerciseId'>,
): BlockExerciseRef {
  return { exerciseId: findByName(exercises, name).id, ...partial };
}

function fixedBlock(label: string, refs: BlockExerciseRef[]): Block {
  return {
    id: newId(),
    label,
    mode: 'fixed',
    exercisePool: refs,
    rounds: 1,
  };
}

function buildSeedWorkouts(exercises: Exercise[]): Workout[] {
  const now = nowIso();

  // 1. Strength — three fixed Set A/B/C blocks (Phase 2 turns these randomized).
  const strength: Workout = {
    id: newId(),
    name: 'Full-body strength',
    type: 'strength',
    blocks: [
      fixedBlock('Warm-up', [
        ref(exercises, 'Marching in Place', { targetDurationSec: 60, targetSets: 1 }),
        ref(exercises, 'Arm Circles', { targetDurationSec: 30, targetSets: 1 }),
        ref(exercises, "World's Greatest Stretch", { targetSets: 1, targetReps: 6 }),
      ]),
      fixedBlock('Set A — push', [
        ref(exercises, 'Push-Up', {
          targetSets: 3,
          targetReps: 10,
          restSecondsBetweenSets: 60,
        }),
        ref(exercises, 'Standing Dumbbell Shoulder Press', {
          targetSets: 3,
          targetReps: 10,
          restSecondsBetweenSets: 60,
        }),
        ref(exercises, 'Plank', {
          targetSets: 3,
          targetDurationSec: 30,
          restSecondsBetweenSets: 45,
        }),
      ]),
      fixedBlock('Set B — pull', [
        ref(exercises, 'Dumbbell Bent-Over Row', {
          targetSets: 3,
          targetReps: 10,
          restSecondsBetweenSets: 60,
        }),
        ref(exercises, 'Resistance Band Pull-Apart', {
          targetSets: 3,
          targetReps: 12,
          restSecondsBetweenSets: 45,
        }),
        ref(exercises, 'Dumbbell Biceps Curl', {
          targetSets: 3,
          targetReps: 10,
          restSecondsBetweenSets: 45,
        }),
      ]),
      fixedBlock('Set C — legs', [
        ref(exercises, 'Goblet Squat', {
          targetSets: 3,
          targetReps: 10,
          restSecondsBetweenSets: 75,
        }),
        ref(exercises, 'Dumbbell Reverse Lunge', {
          targetSets: 3,
          targetReps: 10,
          restSecondsBetweenSets: 60,
        }),
        ref(exercises, 'Glute Bridge', {
          targetSets: 3,
          targetReps: 12,
          restSecondsBetweenSets: 45,
        }),
      ]),
      fixedBlock('Cool-down', [
        ref(exercises, 'Standing Hamstring Stretch', { targetDurationSec: 40 }),
        ref(exercises, 'Chest Doorway Stretch', { targetDurationSec: 40 }),
        ref(exercises, 'Deep Breathing Cooldown', { targetDurationSec: 60 }),
      ]),
    ],
    estimatedDuration: 0,
    notes: 'A balanced full-body session. Adjust weights and reps to fit you.',
    createdAt: now,
    updatedAt: now,
  };

  // 2. Cardio — Warm-up / Cardio / Cool-down
  const cardio: Workout = {
    id: newId(),
    name: 'Steady cardio',
    type: 'cardio',
    blocks: [
      fixedBlock('Warm-up', [
        ref(exercises, 'Marching in Place', { targetDurationSec: 60 }),
        ref(exercises, 'Leg Swings', { targetDurationSec: 40 }),
      ]),
      fixedBlock('Cardio', [
        ref(exercises, 'Steady-State Walk or Jog', {
          targetDurationSec: 1500,
        }),
      ]),
      fixedBlock('Cool-down', [
        ref(exercises, 'Standing Quad Stretch', { targetDurationSec: 40 }),
        ref(exercises, 'Figure-Four Stretch', { targetDurationSec: 45 }),
        ref(exercises, 'Deep Breathing Cooldown', { targetDurationSec: 60 }),
      ]),
    ],
    estimatedDuration: 0,
    createdAt: now,
    updatedAt: now,
  };

  // 3. Yoga / mobility flow
  const yoga: Workout = {
    id: newId(),
    name: 'Gentle yoga flow',
    type: 'yoga',
    blocks: [
      fixedBlock('Open', [
        ref(exercises, 'Cat-Cow', { targetSets: 1, targetReps: 10 }),
        ref(exercises, "Child's Pose", { targetDurationSec: 45 }),
      ]),
      fixedBlock('Flow', [
        ref(exercises, 'Downward Dog', { targetDurationSec: 40 }),
        ref(exercises, 'Cobra Pose', { targetDurationSec: 40 }),
        ref(exercises, 'Warrior II', { targetDurationSec: 45 }),
        ref(exercises, 'Bridge Pose', { targetDurationSec: 40 }),
      ]),
      fixedBlock('Close', [
        ref(exercises, 'Seated Forward Fold', { targetDurationSec: 45 }),
        ref(exercises, 'Lying Spinal Twist', { targetDurationSec: 45 }),
        ref(exercises, 'Deep Breathing Cooldown', { targetDurationSec: 60 }),
      ]),
    ],
    estimatedDuration: 0,
    createdAt: now,
    updatedAt: now,
  };

  return [strength, cardio, yoga];
}

function buildSeedPlan(workouts: Workout[]): Plan {
  const strength = workouts.find((w) => w.type === 'strength')!;
  const cardio = workouts.find((w) => w.type === 'cardio')!;
  const yoga = workouts.find((w) => w.type === 'yoga')!;
  const now = nowIso();
  return {
    id: newId(),
    name: 'Starter week',
    startDate: currentWeekAnchor(),
    weeks: [
      {
        weekIndex: 0,
        days: [
          { dayIndex: 0, workoutId: strength.id }, // Mon
          { dayIndex: 1, workoutId: yoga.id }, // Tue
          { dayIndex: 2, workoutId: null }, // Wed
          { dayIndex: 3, workoutId: cardio.id }, // Thu
          { dayIndex: 4, workoutId: strength.id }, // Fri
          { dayIndex: 5, workoutId: yoga.id }, // Sat
          { dayIndex: 6, workoutId: null }, // Sun
        ],
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Idempotent — runs on every boot, but only actually seeds on first run
 * (firstRunComplete=false AND no existing data). Updating activePlanId
 * always happens after seeding.
 */
export async function ensureSeed(): Promise<void> {
  const settings = await getSettings();
  if (settings.firstRunComplete) return;

  const existing = await db.exercises.count();
  if (existing > 0) {
    // Defensive: a prior partial seed succeeded but onboarding never finished.
    // Leave existing data alone, just mark first run complete-ish behavior to settings only.
    return;
  }

  const exercises = hydrateExercises();
  const workouts = buildSeedWorkouts(exercises);
  const plan = buildSeedPlan(workouts);

  await db.transaction(
    'rw',
    [db.exercises, db.workouts, db.plans, db.settings],
    async () => {
      await db.exercises.bulkPut(exercises);
      // Compute durations after seed exercises exist
      for (const w of workouts) {
        const ids = Array.from(
          new Set(
            w.blocks.flatMap((b) => b.exercisePool.map((r) => r.exerciseId)),
          ),
        );
        const exs = (await db.exercises.bulkGet(ids)).filter(
          Boolean,
        ) as Exercise[];
        w.estimatedDuration = estimateWorkoutMinutes(w, exs);
      }
      await db.workouts.bulkPut(workouts);
      await db.plans.put(plan);
      await saveSettings({ activePlanId: plan.id });
    },
  );
}

/** Used by Reset → reseed flow. */
export async function reseedFromScratch(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.exercises,
      db.workouts,
      db.plans,
      db.logs,
      db.settings,
      db.bodyMetrics,
      db.achievements,
    ],
    async () => {
      await db.exercises.clear();
      await db.workouts.clear();
      await db.plans.clear();
      await db.logs.clear();
      await db.bodyMetrics.clear();
      await db.achievements.clear();
      await db.settings.put({ ...defaultSettings });
    },
  );
  await ensureSeed();
  await saveSettings({ firstRunComplete: true });
}
