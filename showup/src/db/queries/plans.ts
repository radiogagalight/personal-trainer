import { db } from '../client';
import { newId, nowIso } from '@/lib/ids';
import { differenceInCalendarDays, isoDateOnly, weekStart } from '@/lib/time';
import type { DaySlot, Plan, Week } from '@/types';

export const emptyDays = (): DaySlot[] =>
  Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i,
    workoutId: null,
  }));

export const emptyWeek = (weekIndex: number): Week => ({
  weekIndex,
  days: emptyDays(),
});

export async function listPlans(): Promise<Plan[]> {
  return db.plans.orderBy('updatedAt').reverse().toArray();
}

export async function getPlan(id: string): Promise<Plan | undefined> {
  return db.plans.get(id);
}

export type PlanDraft = Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>;

export async function createPlan(draft: PlanDraft): Promise<Plan> {
  const now = nowIso();
  const plan: Plan = {
    ...draft,
    id: newId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.plans.put(plan);
  return plan;
}

export async function updatePlan(
  id: string,
  patch: Partial<PlanDraft>,
): Promise<Plan | undefined> {
  const cur = await db.plans.get(id);
  if (!cur) return undefined;
  const next: Plan = { ...cur, ...patch, id, updatedAt: nowIso() };
  await db.plans.put(next);
  return next;
}

export async function deletePlan(id: string): Promise<void> {
  await db.plans.delete(id);
}

/** Ensure the plan has a week at the given index, creating intervening empty weeks. */
export function ensureWeek(plan: Plan, weekIndex: number): Plan {
  if (plan.weeks.some((w) => w.weekIndex === weekIndex)) return plan;
  const max = plan.weeks.reduce((m, w) => Math.max(m, w.weekIndex), -1);
  const next = [...plan.weeks];
  for (let i = max + 1; i <= weekIndex; i++) {
    next.push(emptyWeek(i));
  }
  return { ...plan, weeks: next };
}

export function getOrCreateWeek(plan: Plan, weekIndex: number): Week {
  const ensured = ensureWeek(plan, weekIndex);
  return ensured.weeks.find((w) => w.weekIndex === weekIndex) ?? emptyWeek(weekIndex);
}

export function setDay(
  plan: Plan,
  weekIndex: number,
  dayIndex: number,
  patch: Partial<DaySlot>,
): Plan {
  const ensured = ensureWeek(plan, weekIndex);
  return {
    ...ensured,
    weeks: ensured.weeks.map((w) =>
      w.weekIndex !== weekIndex
        ? w
        : {
            ...w,
            days: w.days.map((d) =>
              d.dayIndex !== dayIndex ? d : { ...d, ...patch },
            ),
          },
    ),
  };
}

/** The Monday that program week 0 begins (falls back to the current week). */
export function planAnchor(plan: Pick<Plan, 'startDate'>): Date {
  return weekStart(plan.startDate ?? new Date());
}

/** A fresh startDate value (this Monday) for anchoring a plan. */
export function currentWeekAnchor(): string {
  return isoDateOnly(weekStart(new Date()));
}

/** Highest defined week index in the plan (0 if none). */
export function maxWeekIndex(plan: Plan): number {
  return plan.weeks.reduce((m, w) => Math.max(m, w.weekIndex), 0);
}

/**
 * Which program-week index a real calendar date falls on, given the anchor.
 * Negative before the plan starts; can exceed the last defined week.
 */
export function programWeekOffset(
  plan: Pick<Plan, 'startDate'>,
  date: Date = new Date(),
): number {
  const days = differenceInCalendarDays(weekStart(date), planAnchor(plan));
  return Math.floor(days / 7);
}

/**
 * Resolve the program week to show for a real date. Clamps into the defined
 * range so a single-week plan repeats and a multi-week program holds on its
 * last week once it's complete (gentle — never goes blank mid-program).
 */
export function resolveProgramWeek(
  plan: Plan,
  date: Date = new Date(),
): { week: Week; weekIndex: number } {
  const clamped = Math.min(Math.max(0, programWeekOffset(plan, date)), maxWeekIndex(plan));
  return { week: getOrCreateWeek(plan, clamped), weekIndex: clamped };
}

export function copyWeekForward(plan: Plan, sourceWeekIndex: number): Plan {
  const source = plan.weeks.find((w) => w.weekIndex === sourceWeekIndex);
  if (!source) return plan;
  const targetIndex = sourceWeekIndex + 1;
  const cloned: Week = {
    weekIndex: targetIndex,
    days: source.days.map((d) => ({ ...d })),
  };
  const without = plan.weeks.filter((w) => w.weekIndex !== targetIndex);
  return {
    ...plan,
    weeks: [...without, cloned].sort((a, b) => a.weekIndex - b.weekIndex),
  };
}
