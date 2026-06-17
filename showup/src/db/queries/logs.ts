import { db } from '../client';
import { newId, nowIso } from '@/lib/ids';
import type { LogEntry, LoggedExercise } from '@/types';

export async function listLogs(): Promise<LogEntry[]> {
  return db.logs.orderBy('date').reverse().toArray();
}

export async function getLog(id: string): Promise<LogEntry | undefined> {
  return db.logs.get(id);
}

export async function listLogsByWorkout(workoutId: string): Promise<LogEntry[]> {
  return db.logs.where('workoutId').equals(workoutId).reverse().sortBy('date');
}

export async function listLogsByDate(dateIso: string): Promise<LogEntry[]> {
  return db.logs.where('date').equals(dateIso).toArray();
}

export async function logsBetween(startIso: string, endIso: string): Promise<LogEntry[]> {
  return db.logs
    .where('date')
    .between(startIso, endIso, true, true)
    .toArray();
}

export type LogDraft = Omit<LogEntry, 'id' | 'createdAt'> & {
  loggedExercises: LoggedExercise[];
};

export async function createLog(draft: LogDraft): Promise<LogEntry> {
  const entry: LogEntry = {
    ...draft,
    id: newId(),
    createdAt: nowIso(),
  };
  await db.logs.put(entry);
  return entry;
}

export async function updateLog(
  id: string,
  patch: Partial<LogEntry>,
): Promise<LogEntry | undefined> {
  const cur = await db.logs.get(id);
  if (!cur) return undefined;
  const next: LogEntry = { ...cur, ...patch, id };
  await db.logs.put(next);
  return next;
}

export async function deleteLog(id: string): Promise<void> {
  await db.logs.delete(id);
}
