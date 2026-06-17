import { useEffect, useMemo, useState } from 'react';
import { Sheet } from '@/ui/components/Sheet';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { StaticChip } from '@/ui/components/Chip';
import { EmptyState } from '@/ui/components/EmptyState';
import { strings } from '@/copy/strings';
import { equipmentLabel, typeAccentClass, typeLabel } from '@/lib/format';
import { listExercises } from '@/db/queries/exercises';
import { useSettingsStore } from '@/state/settingsStore';
import type { Exercise } from '@/types';

interface SwapSheetProps {
  open: boolean;
  onClose: () => void;
  current: Exercise;
  onPick: (next: Exercise) => void;
}

export function SwapSheet({ open, onClose, current, onPick }: SwapSheetProps) {
  const owned = useSettingsStore((s) => s.settings?.ownedEquipment ?? []);
  const [all, setAll] = useState<Exercise[]>([]);

  useEffect(() => {
    if (open) void listExercises().then(setAll);
  }, [open]);

  const candidates = useMemo(() => {
    return all.filter((e) => {
      if (e.id === current.id) return false;
      if (e.type !== current.type) return false;
      const areaOverlap = e.targetAreas.some((a) =>
        current.targetAreas.includes(a),
      );
      if (!areaOverlap) return false;
      const eqOk = e.equipment.every((eq) => owned.includes(eq));
      return eqOk;
    });
  }, [all, current, owned]);

  return (
    <Sheet open={open} onClose={onClose} title={strings.player.swapTitle} size="tall">
      {candidates.length === 0 ? (
        <EmptyState title={strings.player.swapEmpty} />
      ) : (
        <ul className="flex flex-col gap-2">
          {candidates.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onPick(e)}
                className="w-full text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{e.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <StaticChip className={typeAccentClass(e.type)}>
                          {typeLabel[e.type]}
                        </StaticChip>
                        {e.equipment.slice(0, 2).map((eq) => (
                          <StaticChip key={eq}>{equipmentLabel[eq]}</StaticChip>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-4">
        <Button variant="ghost" fullWidth onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Sheet>
  );
}
