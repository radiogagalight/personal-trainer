import { db } from '../client';
import { newId, nowIso } from '@/lib/ids';
import type { BodyMetric } from '@/types';

export async function listMetrics(): Promise<BodyMetric[]> {
  return db.bodyMetrics.orderBy('date').reverse().toArray();
}

export async function createMetric(
  draft: Omit<BodyMetric, 'id'>,
): Promise<BodyMetric> {
  const m: BodyMetric = { ...draft, id: newId() };
  await db.bodyMetrics.put(m);
  return m;
}

export async function deleteMetric(id: string): Promise<void> {
  await db.bodyMetrics.delete(id);
}

export const isoNow = nowIso;
