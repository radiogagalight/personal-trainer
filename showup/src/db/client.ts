import Dexie, { type Table } from 'dexie';
import type {
  Achievement,
  BodyMetric,
  Exercise,
  LogEntry,
  Plan,
  Settings,
  Workout,
} from '@/types';

export class ShowupDB extends Dexie {
  exercises!: Table<Exercise, string>;
  workouts!: Table<Workout, string>;
  plans!: Table<Plan, string>;
  logs!: Table<LogEntry, string>;
  settings!: Table<Settings, string>;
  bodyMetrics!: Table<BodyMetric, string>;
  achievements!: Table<Achievement, string>;

  constructor() {
    super('showup');

    // v1: Phase 1 tables
    this.version(1).stores({
      exercises:
        'id, name, type, *targetAreas, *equipment, isCustom, updatedAt',
      workouts: 'id, name, type, updatedAt',
      plans: 'id, name, updatedAt',
      logs: 'id, date, workoutId, type, createdAt',
      settings: 'id',
    });

    // v2: Phase 2 adds body metrics + achievements (additive, no migration).
    this.version(2).stores({
      exercises:
        'id, name, type, *targetAreas, *equipment, isCustom, updatedAt',
      workouts: 'id, name, type, updatedAt',
      plans: 'id, name, updatedAt',
      logs: 'id, date, workoutId, type, createdAt',
      settings: 'id',
      bodyMetrics: 'id, date, type',
      achievements: 'id, badgeKey, earnedAt',
    });

    // v3: per-set duration/distance. Same indexes; migrate legacy scalar
    // actualDurationSec/actualDistance into single-element arrays.
    this.version(3)
      .stores({
        exercises:
          'id, name, type, *targetAreas, *equipment, isCustom, updatedAt',
        workouts: 'id, name, type, updatedAt',
        plans: 'id, name, updatedAt',
        logs: 'id, date, workoutId, type, createdAt',
        settings: 'id',
        bodyMetrics: 'id, date, type',
        achievements: 'id, badgeKey, earnedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('logs')
          .toCollection()
          .modify((log: LogEntry) => {
            for (const e of log.loggedExercises ?? []) {
              const dur = e.actualDurationSec as unknown;
              if (typeof dur === 'number') {
                e.actualDurationSec = [dur];
              }
              const dist = e.actualDistance as unknown;
              if (typeof dist === 'number') {
                e.actualDistance = [dist];
              }
            }
          });
      });
  }
}

export const db = new ShowupDB();

/** Best-effort: ensure IndexedDB can open. Used at boot. */
export async function ensureDbOpen(): Promise<void> {
  if (db.isOpen()) return;
  await db.open();
}

/** Hard reset — used by Settings → Reset and by Import. */
export async function nukeDatabase(): Promise<void> {
  if (db.isOpen()) db.close();
  await Dexie.delete('showup');
  await db.open();
}
