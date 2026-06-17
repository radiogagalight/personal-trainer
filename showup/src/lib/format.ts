import type { Equipment, ExerciseType, BodyArea, Metric } from '@/types';

export const typeLabel: Record<ExerciseType, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  mobility: 'Mobility',
  yoga: 'Yoga',
  warmup: 'Warm-up',
  cooldown: 'Cool-down',
};

export const areaLabel: Record<BodyArea, string> = {
  'upper-push': 'Upper push',
  'upper-pull': 'Upper pull',
  lower: 'Lower body',
  core: 'Core',
  'full-body': 'Full body',
  cardio: 'Cardio',
  mobility: 'Mobility',
};

export const equipmentLabel: Record<Equipment, string> = {
  none: 'Bodyweight',
  dumbbells: 'Dumbbells',
  kettlebells: 'Kettlebells',
  bands: 'Bands',
  trx: 'TRX',
  mat: 'Mat',
};

export const metricLabel: Record<Metric, string> = {
  reps: 'Reps',
  sets: 'Sets',
  weight: 'Weight',
  duration: 'Duration',
  distance: 'Distance',
  rounds: 'Rounds',
};

export const ALL_TYPES: ExerciseType[] = [
  'strength',
  'cardio',
  'mobility',
  'yoga',
  'warmup',
  'cooldown',
];

export const ALL_AREAS: BodyArea[] = [
  'upper-push',
  'upper-pull',
  'lower',
  'core',
  'full-body',
  'cardio',
  'mobility',
];

export const ALL_EQUIPMENT: Equipment[] = [
  'none',
  'dumbbells',
  'kettlebells',
  'bands',
  'trx',
  'mat',
];

export function typeAccentClass(type: ExerciseType): string {
  switch (type) {
    case 'strength':
      return 'bg-accent-soft text-accent';
    case 'cardio':
      return 'bg-tertiary-soft text-tertiary';
    case 'mobility':
      return 'bg-secondary-soft text-secondary';
    case 'yoga':
      return 'bg-fuchsia-soft text-fuchsia';
    case 'warmup':
      return 'bg-amber-soft text-amber';
    case 'cooldown':
      return 'bg-ruby-soft/60 text-ruby';
  }
}

/** Subtle list-row wash keyed to exercise type (library, pickers). */
export function typeRowClass(type: ExerciseType): string {
  switch (type) {
    case 'strength':
      return 'border-accent/35 bg-accent-soft/45';
    case 'cardio':
      return 'border-tertiary/35 bg-tertiary-soft/45';
    case 'mobility':
      return 'border-secondary/35 bg-secondary-soft/45';
    case 'yoga':
      return 'border-fuchsia/35 bg-fuchsia-soft/45';
    case 'warmup':
      return 'border-amber/35 bg-amber-soft/45';
    case 'cooldown':
      return 'border-ruby/30 bg-ruby-soft/40';
  }
}

export function typeIconWrapClass(type: ExerciseType): string {
  switch (type) {
    case 'strength':
      return 'bg-accent/12 text-accent ring-1 ring-accent/25';
    case 'cardio':
      return 'bg-tertiary/12 text-tertiary ring-1 ring-tertiary/25';
    case 'mobility':
      return 'bg-secondary/12 text-secondary ring-1 ring-secondary/25';
    case 'yoga':
      return 'bg-fuchsia/12 text-fuchsia ring-1 ring-fuchsia/25';
    case 'warmup':
      return 'bg-amber/12 text-amber ring-1 ring-amber/25';
    case 'cooldown':
      return 'bg-ruby/12 text-ruby ring-1 ring-ruby/20';
  }
}

export function primaryTargetArea(exercise: {
  targetAreas: BodyArea[];
}): BodyArea | undefined {
  return exercise.targetAreas[0];
}
