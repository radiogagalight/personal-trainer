/**
 * Helpers for reading per-set logged values.
 *
 * `actualDurationSec` and `actualDistance` are per-set arrays (like
 * `actualReps`/`actualWeight`). Older logs stored them as scalars; these
 * helpers tolerate both so history and PR/progression math stay correct
 * across the migration boundary.
 */

/** Normalize a possibly-legacy scalar value to a per-set array. */
export function toSetArray(
  v: number[] | number | undefined | null,
): number[] | undefined {
  if (v === undefined || v === null) return undefined;
  if (Array.isArray(v)) return v.length ? v : undefined;
  return [v];
}

/** Best (max) value across sets; tolerant of legacy scalars. */
export function bestSet(
  v: number[] | number | undefined | null,
): number | undefined {
  const a = toSetArray(v);
  return a && a.length ? Math.max(...a) : undefined;
}
