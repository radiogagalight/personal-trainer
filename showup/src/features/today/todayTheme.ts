import type { ExerciseType } from '@/types';

/** Featured session card surface keyed by workout type. */
export const sessionSurfaceClass: Record<ExerciseType, string> = {
  strength: 'border-accent/45 bg-accent-soft/55 shadow-glow-accent',
  cardio: 'border-tertiary/45 bg-tertiary-soft/55 shadow-glow-tertiary',
  mobility: 'border-secondary/45 bg-secondary-soft/55 shadow-glow-secondary',
  yoga:
    'border-fuchsia/45 bg-fuchsia-soft/55 shadow-[0_8px_32px_rgb(var(--color-fuchsia)/0.2)]',
  warmup:
    'border-amber/45 bg-amber-soft/55 shadow-[0_8px_32px_rgb(var(--color-amber)/0.2)]',
  cooldown: 'border-ruby/40 bg-ruby-soft/40 shadow-[0_8px_32px_rgb(var(--color-ruby)/0.15)]',
};

export const sessionIconWrapClass: Record<ExerciseType, string> = {
  strength: 'bg-accent/15 text-accent',
  cardio: 'bg-tertiary/15 text-tertiary',
  mobility: 'bg-secondary/15 text-secondary',
  yoga: 'bg-fuchsia/15 text-fuchsia',
  warmup: 'bg-amber/15 text-amber',
  cooldown: 'bg-ruby/15 text-ruby',
};

export const greetingHeroClass = {
  morning: 'border-amber/40 bg-amber-soft/50 shadow-[0_12px_40px_rgb(var(--color-amber)/0.12)]',
  afternoon: 'border-tertiary/40 bg-tertiary-soft/50 shadow-glow-tertiary',
  evening: 'border-fuchsia/45 bg-fuchsia-soft/55 shadow-[0_12px_40px_rgb(var(--color-fuchsia)/0.14)]',
} as const;

export const greetingIconWrapClass = {
  morning: 'bg-amber-soft text-amber ring-1 ring-amber/25',
  afternoon: 'bg-tertiary-soft text-tertiary ring-1 ring-tertiary/25',
  evening: 'bg-fuchsia-soft text-fuchsia ring-1 ring-fuchsia/30',
} as const;
