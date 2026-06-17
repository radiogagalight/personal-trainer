import type { Equipment, Exercise } from '@/types';

/** True if the exercise's required equipment is satisfied by `owned`. */
export function equipmentMet(
  ex: Pick<Exercise, 'equipment'>,
  owned: Equipment[] | Set<Equipment>,
): boolean {
  if (!ex.equipment.length) return true; // bodyweight
  const set = owned instanceof Set ? owned : new Set(owned);
  return ex.equipment.every((e) => e === 'none' || set.has(e));
}

/** Equipment the exercise needs that the user doesn't currently own. */
export function missingEquipment(
  ex: Pick<Exercise, 'equipment'>,
  owned: Equipment[] | Set<Equipment>,
): Equipment[] {
  const set = owned instanceof Set ? owned : new Set(owned);
  return ex.equipment.filter((e) => e !== 'none' && !set.has(e));
}
