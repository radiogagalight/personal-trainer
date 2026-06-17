import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  endOfDay,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns';

/** Showup: weeks always start on Monday. */
const WEEK_OPTS = { weekStartsOn: 1 } as const;

export function weekStart(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfWeek(d, WEEK_OPTS);
}

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function isoDateOnly(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/** 0..6 where 0 = Monday, 6 = Sunday. */
export function dayIndexInWeek(date: Date | string = new Date()): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const start = weekStart(d);
  return differenceInCalendarDays(startOfDay(d), startOfDay(start));
}

/** Always 7 entries; index 0 = Monday. */
export function weekDates(reference: Date | string = new Date()): Date[] {
  const start = weekStart(reference);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function shortDay(date: Date): string {
  return format(date, 'EEE');
}

export function longDay(date: Date): string {
  return format(date, 'EEEE');
}

export function monthDay(date: Date): string {
  return format(date, 'MMM d');
}

export function shortMonthYear(date: Date): string {
  return format(date, 'MMM yyyy');
}

export function prettyDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEE, MMM d');
}

export function prettyTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function prettyMinutes(min: number): string {
  if (min < 1) return '<1 min';
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const rem = Math.round(min % 60);
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

export function timeOfDayGreeting(date = new Date()): 'morning' | 'afternoon' | 'evening' {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  endOfDay,
  format,
  isSameDay,
  parseISO,
  startOfDay,
};
