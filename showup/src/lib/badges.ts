/**
 * Post-session badge evaluation.
 * Returns the badge keys that should be granted for the just-completed log,
 * given the full history (including the new log).
 *
 * Trigger list (spec §15):
 *   first-workout
 *   first-strength / cardio / mobility / yoga
 *   sessions-10 / 25 / 50
 *   first-month — first session ≥ 30 days after the first ever
 *   first-custom-workout / first-edit-workout / first-challenge
 *     (granted elsewhere — by the builder & challenges card)
 */

import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { ExerciseType, LogEntry } from '@/types';

export type BadgeKey =
  | 'first-workout'
  | 'first-strength'
  | 'first-cardio'
  | 'first-mobility'
  | 'first-yoga'
  | 'sessions-10'
  | 'sessions-25'
  | 'sessions-50'
  | 'first-month'
  | 'first-custom-workout'
  | 'first-edit-workout'
  | 'first-challenge';

function firstTypeKey(t: ExerciseType): BadgeKey | null {
  switch (t) {
    case 'strength':
      return 'first-strength';
    case 'cardio':
      return 'first-cardio';
    case 'mobility':
      return 'first-mobility';
    case 'yoga':
      return 'first-yoga';
    case 'warmup':
    case 'cooldown':
      return null;
  }
}

export function evaluateBadges(
  allLogs: LogEntry[], // including the just-saved one
  saved: LogEntry,
): BadgeKey[] {
  const out: BadgeKey[] = [];
  const total = allLogs.length;

  if (total === 1) out.push('first-workout');

  const firstOfType = firstTypeKey(saved.type);
  if (firstOfType) {
    const countOfType = allLogs.filter((l) => l.type === saved.type).length;
    if (countOfType === 1) out.push(firstOfType);
  }

  if (total === 10) out.push('sessions-10');
  if (total === 25) out.push('sessions-25');
  if (total === 50) out.push('sessions-50');

  // First-month: this is the first session ≥30 calendar days after the very
  // first session. We avoid awarding it more than once by checking that the
  // second-most-recent log is < 30 days from the first.
  if (allLogs.length >= 2) {
    const sorted = allLogs
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    const first = parseISO(sorted[0].date);
    const newest = parseISO(saved.date);
    const prevNewest = parseISO(sorted[sorted.length - 2].date);
    const sinceFirst = differenceInCalendarDays(newest, first);
    const prevSinceFirst = differenceInCalendarDays(prevNewest, first);
    if (sinceFirst >= 30 && prevSinceFirst < 30) {
      out.push('first-month');
    }
  }

  return out;
}
