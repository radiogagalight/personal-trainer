import { useEffect, useMemo, useState } from 'react';
import { Sheet } from '@/ui/components/Sheet';
import { TextInput } from '@/ui/components/Field';
import { Chip, StaticChip } from '@/ui/components/Chip';
import { Card } from '@/ui/components/Card';
import { EmptyState } from '@/ui/components/EmptyState';
import { strings } from '@/copy/strings';
import {
  ALL_TYPES,
  equipmentLabel,
  typeAccentClass,
  typeLabel,
} from '@/lib/format';
import { listExercises } from '@/db/queries/exercises';
import type { Exercise, ExerciseType } from '@/types';

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => void;
  excludeIds?: string[];
  restrictType?: ExerciseType;
  title?: string;
}

export function ExercisePicker({
  open,
  onClose,
  onPick,
  excludeIds = [],
  restrictType,
  title = 'Pick an exercise',
}: ExercisePickerProps) {
  const [all, setAll] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<ExerciseType | undefined>(restrictType);

  useEffect(() => {
    if (open) void listExercises().then(setAll);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((e) => {
      if (excludeIds.includes(e.id)) return false;
      if (type && e.type !== type) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, search, type, excludeIds]);

  return (
    <Sheet open={open} onClose={onClose} title={title} size="tall">
      <div className="flex flex-col gap-3">
        <TextInput
          type="search"
          inputMode="search"
          placeholder={strings.library.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        {!restrictType && (
          <div className="flex flex-wrap gap-1.5">
            <Chip active={type === undefined} onClick={() => setType(undefined)}>
              All
            </Chip>
            {ALL_TYPES.map((t) => (
              <Chip
                key={t}
                active={type === t}
                onClick={() => setType(type === t ? undefined : t)}
              >
                {typeLabel[t]}
              </Chip>
            ))}
          </div>
        )}
        {filtered.length === 0 ? (
          <EmptyState title="No matches" body="Try a different search or filter." />
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onPick(e)}
                  className="w-full text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{e.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <StaticChip className={typeAccentClass(e.type)}>
                            {typeLabel[e.type]}
                          </StaticChip>
                          {e.equipment.slice(0, 2).map((eq) => (
                            <StaticChip key={eq}>
                              {equipmentLabel[eq]}
                            </StaticChip>
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
      </div>
    </Sheet>
  );
}
