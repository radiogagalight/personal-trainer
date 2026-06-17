import { db, nukeDatabase } from '@/db/client';
import { ensureSeed } from '@/db/seed/loadSeed';
import { defaultSettings, getSettings, saveSettings } from '@/db/queries/settings';
import { toSetArray } from '@/lib/logged';
import type { ExportBundle, LogEntry, Settings } from '@/types';

export const SCHEMA_VERSION = 1;

/** Tolerate legacy backups that stored duration/distance as scalars. */
function normalizeLogPerSet(log: LogEntry): LogEntry {
  return {
    ...log,
    loggedExercises: (log.loggedExercises ?? []).map((e) => ({
      ...e,
      actualDurationSec: toSetArray(e.actualDurationSec),
      actualDistance: toSetArray(e.actualDistance),
    })),
  };
}

export async function buildExportBundle(): Promise<ExportBundle> {
  const [exercises, workouts, plans, logs, settings, bodyMetrics, achievements] =
    await Promise.all([
      db.exercises.toArray(),
      db.workouts.toArray(),
      db.plans.toArray(),
      db.logs.toArray(),
      getSettings(),
      db.bodyMetrics.toArray().catch(() => []),
      db.achievements.toArray().catch(() => []),
    ]);

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'showup',
    exercises,
    workouts,
    plans,
    logs,
    settings,
    bodyMetrics,
    achievements,
  };
}

export async function downloadExport(): Promise<string> {
  const bundle = await buildExportBundle();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const filename = `showup-backup-${bundle.exportedAt.slice(0, 10)}.json`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

export type ImportResult =
  | { ok: true }
  | { ok: false; reason: string };

function validateBundle(input: unknown): input is ExportBundle {
  if (!input || typeof input !== 'object') return false;
  const b = input as Record<string, unknown>;
  if (b.app !== 'showup') return false;
  if (typeof b.schemaVersion !== 'number') return false;
  if (!Array.isArray(b.exercises)) return false;
  if (!Array.isArray(b.workouts)) return false;
  if (!Array.isArray(b.plans)) return false;
  if (!Array.isArray(b.logs)) return false;
  if (!b.settings || typeof b.settings !== 'object') return false;
  return true;
}

export async function importBundleFromText(text: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }
  if (!validateBundle(parsed)) {
    return { ok: false, reason: 'bad-shape' };
  }

  const bundle = parsed;

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

      await db.exercises.bulkPut(bundle.exercises);
      await db.workouts.bulkPut(bundle.workouts);
      await db.plans.bulkPut(bundle.plans);
      await db.logs.bulkPut(bundle.logs.map(normalizeLogPerSet));
      if (bundle.bodyMetrics?.length) {
        await db.bodyMetrics.bulkPut(bundle.bodyMetrics);
      }
      if (bundle.achievements?.length) {
        await db.achievements.bulkPut(bundle.achievements);
      }
      const settings: Settings = {
        ...defaultSettings,
        ...bundle.settings,
        id: 'singleton',
        firstRunComplete: true,
      };
      await db.settings.put(settings);
    },
  );

  return { ok: true };
}

export async function fullReset(): Promise<void> {
  await nukeDatabase();
  await db.settings.put({ ...defaultSettings });
  await ensureSeed();
  await saveSettings({ firstRunComplete: true });
}
