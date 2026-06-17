/** Jewel-tone helpers — maps UI surfaces to Tailwind token classes. */

export type WeekDayStatus = 'rest' | 'planned' | 'done' | 'missed';

export const tabActiveClass = [
  'text-tertiary',
  'text-amber',
  'text-ruby',
  'text-fuchsia',
  'text-secondary',
] as const;

export const tabActiveWrapClass = [
  'bg-tertiary/18 shadow-glow-tertiary',
  'bg-amber/18 shadow-[0_4px_20px_-4px_rgb(var(--color-amber)/0.5)]',
  'bg-ruby/18 shadow-[0_4px_20px_-4px_rgb(var(--color-ruby)/0.48)]',
  'bg-fuchsia/18 shadow-[0_4px_20px_-4px_rgb(var(--color-fuchsia)/0.48)]',
  'bg-secondary/18 shadow-glow-secondary',
] as const;

export const stepBarClass = [
  'bg-accent',
  'bg-tertiary',
  'bg-secondary',
  'bg-fuchsia',
] as const;

export const chartStroke = (index: number): string =>
  `rgb(var(--color-chart-${(index % 5) + 1}))`;

export const highlightCard = {
  page: 'border-page/55 bg-page-soft/60 shadow-glow-page',
  accent: 'border-accent/50 bg-accent-soft/55 shadow-glow-accent',
  secondary: 'border-secondary/55 bg-secondary-soft/60 shadow-glow-secondary',
  tertiary: 'border-tertiary/55 bg-tertiary-soft/60 shadow-glow-tertiary',
  amber:
    'border-amber/55 bg-amber-soft/60 shadow-[0_4px_24px_-4px_rgb(var(--color-amber)/0.42)]',
  fuchsia:
    'border-fuchsia/55 bg-fuchsia-soft/60 shadow-[0_4px_24px_-4px_rgb(var(--color-fuchsia)/0.42)]',
  ruby:
    'border-ruby/55 bg-ruby-soft/60 shadow-[0_4px_24px_-4px_rgb(var(--color-ruby)/0.4)]',
} as const;

/** Week strip cell — status wash + today ring. */
export function weekDayCellClass(status: WeekDayStatus, isToday: boolean): string {
  const wash: Record<WeekDayStatus, string> = {
    rest: 'bg-surface/75',
    planned: 'bg-page/18',
    done: 'bg-secondary/15',
    missed: 'bg-ruby/15',
  };
  const ring: Record<WeekDayStatus, string> = {
    rest: 'ring-tertiary/60',
    planned: 'ring-page',
    done: 'ring-secondary',
    missed: 'ring-ruby',
  };
  if (!isToday) return `${wash[status]} border border-transparent`;
  return `${wash[status]} ring-2 ${ring[status]} ring-offset-2 ring-offset-bg shadow-soft`;
}

export const weekDayLabelClass = (idx: number, isToday: boolean): string => {
  if (isToday) return 'text-page font-bold';
  const hues = [
    'text-tertiary/85',
    'text-tertiary/80',
    'text-secondary/80',
    'text-fuchsia/75',
    'text-amber/80',
    'text-ruby/70',
    'text-tertiary/75',
  ];
  return hues[idx % hues.length];
};

export const highlightLabel = {
  page: 'text-page',
  accent: 'text-accent',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  amber: 'text-amber',
  fuchsia: 'text-fuchsia',
  ruby: 'text-ruby',
} as const;

export type HighlightTone = keyof typeof highlightCard;

/** Per-challenge progress row (title bar + fill). */
export const challengeProgressClass = [
  {
    row: 'bg-secondary-soft/40',
    badge: 'bg-secondary/15 text-secondary',
    track: 'bg-secondary/15',
    fill: 'bg-secondary',
  },
  {
    row: 'bg-tertiary-soft/40',
    badge: 'bg-tertiary/15 text-tertiary',
    track: 'bg-tertiary/15',
    fill: 'bg-tertiary',
  },
  {
    row: 'bg-amber-soft/40',
    badge: 'bg-amber/15 text-amber',
    track: 'bg-amber/15',
    fill: 'bg-amber',
  },
] as const;

/** Selected feel-rating button (1–5). */
export const feelSelectedClass = [
  'border-ruby bg-ruby-soft text-ruby',
  'border-amber bg-amber-soft text-amber',
  'border-tertiary bg-tertiary-soft text-tertiary',
  'border-secondary bg-secondary-soft text-secondary',
  'border-fuchsia bg-fuchsia-soft text-fuchsia',
] as const;
