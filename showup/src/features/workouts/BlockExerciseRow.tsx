import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { strings } from '@/copy/strings';
import { equipmentLabel } from '@/lib/format';
import { missingEquipment } from '@/lib/equipment';
import { useSettingsStore } from '@/state/settingsStore';
import { Card } from '@/ui/components/Card';
import { IconButton } from '@/ui/components/IconButton';
import { NumberStepper } from '@/ui/components/NumberStepper';
import { DragIcon, TrashIcon } from '@/ui/components/Icons';
import type { BlockExerciseRef, Exercise, Metric } from '@/types';

interface Props {
  blockId: string;
  row: BlockExerciseRef;
  exercise?: Exercise;
  onChange: (next: BlockExerciseRef) => void;
  onRemove: () => void;
}

function showMetric(metrics: Metric[] | undefined, m: Metric): boolean {
  return !!metrics?.includes(m);
}

export function BlockExerciseRow({
  blockId,
  row,
  exercise,
  onChange,
  onRemove,
}: Props) {
  const sortable = useSortable({ id: `${blockId}::${row.exerciseId}` });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  const metrics = exercise?.defaultMetrics ?? ['sets', 'reps'];
  const owned = useSettingsStore((s) => s.settings?.ownedEquipment);
  const missing =
    exercise && owned ? missingEquipment(exercise, owned) : [];

  return (
    <div ref={sortable.setNodeRef} style={style}>
      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1">
              <button
                type="button"
                aria-label="Drag to reorder"
                className="h-9 w-9 flex items-center justify-center text-muted hover:text-ink touch-none"
                {...sortable.attributes}
                {...sortable.listeners}
              >
                <DragIcon />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {exercise?.name ?? 'Missing exercise'}
                </p>
                {missing.length > 0 && (
                  <p className="mt-0.5 text-xs text-amber">
                    {strings.builder.equipmentMissing(
                      missing.map((m) => equipmentLabel(m)).join(', '),
                    )}
                  </p>
                )}
              </div>
            </div>
            <IconButton
              label={strings.builder.deleteExercise}
              tone="danger"
              onClick={onRemove}
            >
              <TrashIcon />
            </IconButton>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {showMetric(metrics, 'sets') && (
              <NumberStepper
                label={strings.builder.sets}
                value={row.targetSets ?? 3}
                onChange={(v) => onChange({ ...row, targetSets: v })}
                min={1}
                max={20}
              />
            )}
            {showMetric(metrics, 'reps') && (
              <NumberStepper
                label={strings.builder.reps}
                value={row.targetReps ?? 10}
                onChange={(v) => onChange({ ...row, targetReps: v })}
                min={1}
                max={100}
              />
            )}
            {showMetric(metrics, 'weight') && (
              <NumberStepper
                label={strings.builder.weight}
                value={row.targetWeight ?? 0}
                onChange={(v) => onChange({ ...row, targetWeight: v })}
                min={0}
                max={1000}
                step={5}
              />
            )}
            {showMetric(metrics, 'duration') && (
              <NumberStepper
                label={strings.builder.durationSec}
                value={row.targetDurationSec ?? 30}
                onChange={(v) => onChange({ ...row, targetDurationSec: v })}
                min={5}
                max={3600}
                step={5}
              />
            )}
            {showMetric(metrics, 'distance') && (
              <NumberStepper
                label={strings.builder.distance}
                value={row.targetDistance ?? 0}
                onChange={(v) => onChange({ ...row, targetDistance: v })}
                min={0}
                max={100}
                step={1}
              />
            )}
            <NumberStepper
              label={strings.builder.restSec}
              value={row.restSecondsBetweenSets ?? 60}
              onChange={(v) => onChange({ ...row, restSecondsBetweenSets: v })}
              min={0}
              max={600}
              step={5}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
