import { useEffect, useState } from 'react';
import { strings } from '@/copy/strings';
import { useSettingsStore } from '@/state/settingsStore';
import { listLogs } from '@/db/queries/logs';
import { listWorkouts, updateWorkout } from '@/db/queries/workouts';
import {
  detectAllPlateaus,
  suggestDeload,
  type PlateauSuggestion,
  type DeloadSuggestion,
} from '@/lib/progression';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { IconButton } from '@/ui/components/IconButton';
import { XIcon } from '@/ui/components/Icons';
import { useUIStore } from '@/state/uiStore';
import { highlightCard, highlightLabel } from '@/lib/palette';
import type { Workout } from '@/types';

export function SuggestionsCard() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const showToast = useUIStore((s) => s.showToast);
  const [plateaus, setPlateaus] = useState<PlateauSuggestion[]>([]);
  const [deload, setDeload] = useState<DeloadSuggestion | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    void (async () => {
      const [logs, ws] = await Promise.all([listLogs(), listWorkouts()]);
      setWorkouts(ws);
      const n = settings?.plateauThreshold ?? 3;
      setPlateaus(detectAllPlateaus(logs, n));
      setDeload(suggestDeload(logs, 4));
    })();
  }, [settings?.plateauThreshold]);

  const snoozed = settings?.snoozedSuggestions ?? {};

  const visiblePlateaus = plateaus
    .filter((p) => {
      const snoozedAt = snoozed[p.exerciseId];
      if (!snoozedAt) return true;
      const days = (Date.now() - new Date(snoozedAt).getTime()) / 86_400_000;
      return days > 7; // re-surface after a week
    })
    .slice(0, 1);

  const onSnooze = (exerciseId: string) => {
    const next = { ...snoozed, [exerciseId]: new Date().toISOString() };
    void update({ snoozedSuggestions: next });
  };

  const onAccept = async (s: PlateauSuggestion) => {
    // Bump the target on every workout that references this exercise.
    let touched = 0;
    for (const w of workouts) {
      let changed = false;
      const blocks = w.blocks.map((b) => ({
        ...b,
        exercisePool: b.exercisePool.map((r) => {
          if (r.exerciseId !== s.exerciseId) return r;
          changed = true;
          const next = { ...r };
          if (s.suggestReps !== undefined && r.targetReps !== undefined) {
            next.targetReps = s.suggestReps;
          }
          if (s.suggestWeight !== undefined && r.targetWeight !== undefined) {
            next.targetWeight = s.suggestWeight;
          }
          return next;
        }),
      }));
      if (changed) {
        await updateWorkout(w.id, { blocks });
        touched++;
      }
    }
    onSnooze(s.exerciseId);
    showToast(
      touched > 0
        ? `Bumped ${s.exerciseName} target in ${touched} workout${touched === 1 ? '' : 's'}`
        : 'Saved',
      { tone: 'good' },
    );
  };

  if (visiblePlateaus.length === 0 && !deload) return null;

  return (
    <div className="mt-4 flex flex-col gap-3">
      {visiblePlateaus.map((s) => (
        <Card
          key={s.exerciseId}
          className="border-secondary bg-secondary-soft/30"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                {strings.suggestion.plateauTitle}
              </p>
              <p className="mt-1 text-sm text-ink">
                {strings.suggestion.plateauBody(s.exerciseName)}
              </p>
            </div>
            <IconButton
              label={strings.suggestion.plateauDismiss}
              onClick={() => onSnooze(s.exerciseId)}
            >
              <XIcon />
            </IconButton>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => void onAccept(s)}>
              {strings.suggestion.plateauAccept}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSnooze(s.exerciseId)}
            >
              {strings.suggestion.plateauDismiss}
            </Button>
          </div>
        </Card>
      ))}
      {deload && (
        <Card className={highlightCard.amber}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${highlightLabel.amber}`}>
            {strings.suggestion.deloadTitle}
          </p>
          <p className="mt-1 text-sm text-ink">{strings.suggestion.deloadBody}</p>
        </Card>
      )}
    </div>
  );
}
