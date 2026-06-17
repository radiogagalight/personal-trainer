import { db } from '../client';
import type { Settings } from '@/types';

export const SETTINGS_ID = 'singleton' as const;

export const defaultSettings: Settings = {
  id: SETTINGS_ID,
  ownedEquipment: ['none', 'dumbbells', 'kettlebells', 'bands', 'trx', 'mat'],
  defaultRestSeconds: 60,
  weightUnit: 'lb',
  distanceUnit: 'mi',
  theme: 'system',
  activePlanId: null,
  remindersEnabled: false,
  reminderTime: '18:00',
  firstRunComplete: false,
  plateauThreshold: 3,
  snoozedSuggestions: {},
  dismissedChallenges: [],
};

export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.get(SETTINGS_ID);
  if (existing) return existing;
  await db.settings.put(defaultSettings);
  return defaultSettings;
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next: Settings = { ...current, ...patch, id: SETTINGS_ID };
  await db.settings.put(next);
  return next;
}
