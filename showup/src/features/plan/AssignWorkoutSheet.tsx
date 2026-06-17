import { useEffect, useState } from 'react';
import { listWorkouts } from '@/db/queries/workouts';
import { Sheet } from '@/ui/components/Sheet';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { StaticChip } from '@/ui/components/Chip';
import { EmptyState } from '@/ui/components/EmptyState';
import { strings } from '@/copy/strings';
import { prettyMinutes } from '@/lib/time';
import { typeAccentClass, typeLabel } from '@/lib/format';
import type { Workout } from '@/types';

interface AssignWorkoutSheetProps {
  open: boolean;
  onClose: () => void;
  onPick: (workoutId: string | null) => void;
  currentWorkoutId?: string | null;
}

export function AssignWorkoutSheet({
  open,
  onClose,
  onPick,
  currentWorkoutId,
}: AssignWorkoutSheetProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    if (open) void listWorkouts().then(setWorkouts);
  }, [open]);

  return (
    <Sheet open={open} onClose={onClose} title={strings.plan.assign} size="tall">
      <div className="flex flex-col gap-3">
        <Button
          variant={currentWorkoutId === null ? 'soft' : 'ghost'}
          fullWidth
          onClick={() => onPick(null)}
        >
          {strings.plan.rest}
        </Button>
        {workouts.length === 0 ? (
          <EmptyState
            title="No workouts yet"
            body="Build one in the Workouts tab, then come back to schedule it."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {workouts.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => onPick(w.id)}
                  className="w-full text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{w.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <StaticChip className={typeAccentClass(w.type)}>
                            {typeLabel[w.type]}
                          </StaticChip>
                          <StaticChip>
                            {prettyMinutes(w.estimatedDuration || 1)}
                          </StaticChip>
                          {currentWorkoutId === w.id && (
                            <StaticChip tone="page">Current</StaticChip>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
