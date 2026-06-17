/**
 * Domain types — mirror spec §5 exactly.
 * Optional fields use `?`. All ids are uuid v4. Timestamps are ISO 8601.
 */

export type ExerciseType =
  | 'strength'
  | 'cardio'
  | 'mobility'
  | 'yoga'
  | 'warmup'
  | 'cooldown';

export type Equipment =
  | 'none'
  | 'dumbbells'
  | 'kettlebells'
  | 'bands'
  | 'trx'
  | 'mat';

export type BodyArea =
  | 'upper-push'
  | 'upper-pull'
  | 'lower'
  | 'core'
  | 'full-body'
  | 'cardio'
  | 'mobility';

export type Metric =
  | 'reps'
  | 'sets'
  | 'weight'
  | 'duration'
  | 'distance'
  | 'rounds';

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  targetAreas: BodyArea[];
  equipment: Equipment[];
  instructions: string;
  videoUrl?: string;
  defaultMetrics: Metric[];
  estimatedSecondsPerSet?: number;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockExerciseRef {
  exerciseId: string;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  targetDurationSec?: number;
  targetDistance?: number;
  restSecondsBetweenSets?: number;
}

export type BlockMode = 'fixed' | 'randomized';

export interface Block {
  id: string;
  label: string;
  mode: BlockMode;
  exercisePool: BlockExerciseRef[];
  selectionCount?: number;
  targetDurationMin?: number;
  rounds?: number;
}

export interface Workout {
  id: string;
  name: string;
  type: ExerciseType;
  blocks: Block[];
  estimatedDuration: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DaySlot {
  dayIndex: number; // 0 = Monday … 6 = Sunday
  workoutId: string | null;
  label?: string;
  notes?: string;
}

export interface Week {
  weekIndex: number;
  days: DaySlot[]; // length 7
}

export interface Plan {
  id: string;
  name: string;
  weeks: Week[];
  /**
   * ISO date of the Monday that program week 0 begins. Anchors the plan to
   * the real calendar so multi-week programs roll forward week to week.
   * Optional for backward-compat; treated as the current week when absent.
   */
  startDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoggedExercise {
  exerciseId: string;
  exerciseName: string;
  actualSets?: number;
  actualReps?: number[];
  actualWeight?: number[];
  actualDurationSec?: number[]; // per-set (legacy logs may hold a scalar)
  actualDistance?: number[]; // per-set (legacy logs may hold a scalar)
  skipped: boolean;
  substitutedFor?: string;
}

export type FeelRating = 1 | 2 | 3 | 4 | 5;

export interface LogEntry {
  id: string;
  date: string; // ISO date
  workoutId?: string;
  workoutName: string;
  type: ExerciseType;
  loggedExercises: LoggedExercise[];
  totalDurationMin: number;
  feelRating?: FeelRating;
  feelNote?: string;
  wasModified: boolean;
  createdAt: string;
}

export interface BodyMetric {
  id: string;
  date: string;
  type: 'weight' | 'measurement' | 'note';
  label?: string;
  value?: number;
  unit?: string;
  note?: string;
}

export interface Achievement {
  id: string;
  badgeKey: string;
  earnedAt: string;
  context?: string;
}

export type WeightUnit = 'lb' | 'kg';
export type DistanceUnit = 'mi' | 'km';
export type Theme = 'light' | 'dark' | 'system';

export interface Settings {
  id: 'singleton';
  ownedEquipment: Equipment[];
  defaultRestSeconds: number;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  theme: Theme;
  activePlanId: string | null;
  remindersEnabled: boolean;
  reminderTime?: string; // "HH:mm"
  firstRunComplete: boolean;
  plateauThreshold: number; // N consecutive sessions, default 3
  /** Per-exercise suggestion snooze timestamps (ISO). Phase 2. */
  snoozedSuggestions?: Record<string, string>;
  /** Set of dismissed challenge keys. Phase 2. */
  dismissedChallenges?: string[];
}

/** A versioned export bundle for backups. */
export interface ExportBundle {
  schemaVersion: number;
  exportedAt: string;
  app: 'showup';
  exercises: Exercise[];
  workouts: Workout[];
  plans: Plan[];
  logs: LogEntry[];
  settings: Settings;
  bodyMetrics?: BodyMetric[];
  achievements?: Achievement[];
}
