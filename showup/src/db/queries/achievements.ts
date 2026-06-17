import { db } from '../client';
import { newId, nowIso } from '@/lib/ids';
import type { Achievement } from '@/types';

export async function listAchievements(): Promise<Achievement[]> {
  return db.achievements.orderBy('earnedAt').reverse().toArray();
}

export async function hasBadge(badgeKey: string): Promise<boolean> {
  const count = await db.achievements.where('badgeKey').equals(badgeKey).count();
  return count > 0;
}

export async function grantBadge(
  badgeKey: string,
  context?: string,
): Promise<Achievement | null> {
  if (await hasBadge(badgeKey)) return null;
  const ach: Achievement = {
    id: newId(),
    badgeKey,
    earnedAt: nowIso(),
    context,
  };
  await db.achievements.put(ach);
  return ach;
}
