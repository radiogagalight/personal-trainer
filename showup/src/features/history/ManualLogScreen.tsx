import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { strings } from '@/copy/strings';
import { ALL_TYPES, typeLabel } from '@/lib/format';
import { listExercises } from '@/db/queries/exercises';
import { listWorkouts } from '@/db/queries/workouts';
import { createLog, getLog, updateLog } from '@/db/queries/logs';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Field, Select, TextInput } from '@/ui/components/Field';
import { IconButton } from '@/ui/components/IconButton';
import { Container } from '@/ui/layout/Container';
import { ScreenHeader } from '@/ui/layout/ScreenHeader';
import { useUIStore } from '@/state/uiStore';
import { PlusIcon, TrashIcon } from '@/ui/components/Icons';
import { ExercisePicker } from '@/features/workouts/ExercisePicker';
import { NumberStepper } from '@/ui/components/NumberStepper';
import type {
  Exercise,
  ExerciseType,
  LoggedExercise,
  Workout,
} from '@/types';

interface Draft {
  date: string;
  workoutId?: string;
  workoutName: string;
  type: ExerciseType;
  totalDurationMin: number;
  feelNote: string;
  loggedExercises: LoggedExercise[];
}

const todayDateInput = () => format(new Date(), 'yyyy-MM-dd');

const blankDraft = (): Draft => ({
  date: todayDateInput(),
  workoutName: 'Ad-hoc session',
  type: 'strength',
  totalDurationMin: 30,
  feelNote: '',
  loggedExercises: [],
});

export function ManualLogScreen() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const editId = search.get('edit');
  const showToast = useUIStore((s) => s.showToast);

  const [draft, setDraft] = useState<Draft>(blankDraft());
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loaded, setLoaded] = useState(!editId);

  useEffect(() => {
    void Promise.all([listWorkouts(), listExercises()]).then(([w, e]) => {
      setWorkouts(w);
      setExercises(e);
    });
  }, []);

  useEffect(() => {
    if (!editId) return;
    let cancel = false;
    void (async () => {
      const l = await getLog(editId);
      if (cancel || !l) return;
      setDraft({
        date: l.date.slice(0, 10),
        workoutId: l.workoutId,
        workoutName: l.workoutName,
        type: l.type,
        totalDurationMin: l.totalDurationMin,
        feelNote: l.feelNote ?? '',
        loggedExercises: l.loggedExercises,
      });
      setLoaded(true);
    })();
    return () => {
      cancel = true;
    };
  }, [editId]);

  const exById = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  );

  const onAddExercise = (ex: Exercise) => {
    setDraft({
      ...draft,
      loggedExercises: [
        ...draft.loggedExercises,
        {
          exerciseId: ex.id,
          exerciseName: ex.name,
          skipped: false,
          actualSets: ex.defaultMetrics.includes('sets') ? 3 : undefined,
          actualReps: ex.defaultMetrics.includes('reps') ? [10, 10, 10] : undefined,
          actualWeight: ex.defaultMetrics.includes('weight') ? [0, 0, 0] : undefined,
          actualDurationSec: ex.defaultMetrics.includes('duration') ? [30] : undefined,
          actualDistance: ex.defaultMetrics.includes('distance') ? [0] : undefined,
        },
      ],
    });
    setPickerOpen(false);
  };

  const updateLogged = (idx: number, patch: Partial<LoggedExercise>) =>
    setDraft({
      ...draft,
      loggedExercises: draft.loggedExercises.map((e, i) =>
        i !== idx ? e : { ...e, ...patch },
      ),
    });

  const removeLogged = (idx: number) =>
    setDraft({
      ...draft,
      loggedExercises: draft.loggedExercises.filter((_, i) => i !== idx),
    });

  const onSave = async () => {
    const dateIso = new Date(draft.date).toISOString();
    if (editId) {
      await updateLog(editId, {
        date: dateIso,
        workoutId: draft.workoutId,
        workoutName: draft.workoutName,
        type: draft.type,
        totalDurationMin: draft.totalDurationMin,
        feelNote: draft.feelNote || undefined,
        loggedExercises: draft.loggedExercises,
        wasModified: true,
      });
    } else {
      await createLog({
        date: dateIso,
        workoutId: draft.workoutId,
        workoutName: draft.workoutName,
        type: draft.type,
        totalDurationMin: draft.totalDurationMin,
        feelNote: draft.feelNote || undefined,
        loggedExercises: draft.loggedExercises,
        wasModified: false,
      });
    }
    showToast(strings.history.saved, { tone: 'good' });
    navigate(-1);
  };

  if (!loaded) {
    return (
      <>
        <ScreenHeader title="Loading" back />
        <Container>
          <p className="text-sm text-muted">Loading…</p>
        </Container>
      </>
    );
  }

  return (
    <>
      <ScreenHeader title={editId ? 'Edit session' : 'Log session'} back />
      <Container>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void onSave();
          }}
        >
          <Card>
            <div className="flex flex-col gap-4">
              <Field label={strings.history.dateLabel}>
                <TextInput
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              </Field>

              <Field label={strings.history.nameLabel}>
                <Select
                  value={draft.workoutId ?? '__custom'}
                  onChange={(v) => {
                    if (v === '__custom') {
                      setDraft({
                        ...draft,
                        workoutId: undefined,
                        workoutName: draft.workoutName || 'Ad-hoc session',
                      });
                    } else {
                      const w = workouts.find((x) => x.id === v);
                      setDraft({
                        ...draft,
                        workoutId: v,
                        workoutName: w?.name ?? draft.workoutName,
                        type: w?.type ?? draft.type,
                      });
                    }
                  }}
                  options={[
                    { value: '__custom', label: 'Ad-hoc session' },
                    ...workouts.map((w) => ({ value: w.id, label: w.name })),
                  ]}
                />
              </Field>

              {!draft.workoutId && (
                <Field label="Session name">
                  <TextInput
                    value={draft.workoutName}
                    onChange={(e) =>
                      setDraft({ ...draft, workoutName: e.target.value })
                    }
                  />
                </Field>
              )}

              <Field label={strings.history.typeLabel}>
                <Select
                  value={draft.type}
                  onChange={(v) =>
                    setDraft({ ...draft, type: v as ExerciseType })
                  }
                  options={ALL_TYPES.map((t) => ({
                    value: t,
                    label: typeLabel[t],
                  }))}
                />
              </Field>

              <NumberStepper
                label={strings.history.durationLabel}
                value={draft.totalDurationMin}
                onChange={(v) => setDraft({ ...draft, totalDurationMin: v })}
                min={1}
                max={600}
                step={5}
              />

              <Field label={strings.history.feel}>
                <TextInput
                  value={draft.feelNote}
                  placeholder="Optional"
                  onChange={(e) =>
                    setDraft({ ...draft, feelNote: e.target.value })
                  }
                />
              </Field>
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Exercises
            </h3>
            <Button
              variant="soft"
              size="sm"
              leading={<PlusIcon width={16} height={16} />}
              onClick={() => setPickerOpen(true)}
              type="button"
            >
              {strings.history.addExercise}
            </Button>
          </div>

          <ul className="flex flex-col gap-2">
            {draft.loggedExercises.map((e, idx) => {
              const ex = exById.get(e.exerciseId);
              const metrics = ex?.defaultMetrics ?? ['sets', 'reps'];
              return (
                <li key={`${e.exerciseId}-${idx}`}>
                  <Card>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-ink">{e.exerciseName}</p>
                      <IconButton
                        label="Remove"
                        tone="danger"
                        onClick={() => removeLogged(idx)}
                      >
                        <TrashIcon />
                      </IconButton>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {metrics.includes('sets') && (
                        <NumberStepper
                          label="Sets"
                          value={e.actualSets ?? 0}
                          onChange={(v) => updateLogged(idx, { actualSets: v })}
                          min={0}
                          max={50}
                        />
                      )}
                      {metrics.includes('reps') && (
                        <NumberStepper
                          label="Reps avg"
                          value={Math.round(
                            (e.actualReps?.reduce((s, n) => s + n, 0) ?? 0) /
                              Math.max(1, e.actualReps?.length ?? 1),
                          )}
                          onChange={(v) =>
                            updateLogged(idx, {
                              actualReps: Array.from(
                                { length: Math.max(1, e.actualSets ?? 1) },
                                () => v,
                              ),
                            })
                          }
                          min={0}
                          max={500}
                        />
                      )}
                      {metrics.includes('weight') && (
                        <NumberStepper
                          label="Weight"
                          value={Math.round(
                            (e.actualWeight?.reduce((s, n) => s + n, 0) ?? 0) /
                              Math.max(1, e.actualWeight?.length ?? 1),
                          )}
                          onChange={(v) =>
                            updateLogged(idx, {
                              actualWeight: Array.from(
                                { length: Math.max(1, e.actualSets ?? 1) },
                                () => v,
                              ),
                            })
                          }
                          min={0}
                          max={2000}
                          step={5}
                        />
                      )}
                      {metrics.includes('duration') && (
                        <NumberStepper
                          label="Duration (s)"
                          value={Math.round(
                            (e.actualDurationSec?.reduce((s, n) => s + n, 0) ?? 0) /
                              Math.max(1, e.actualDurationSec?.length ?? 1),
                          )}
                          onChange={(v) =>
                            updateLogged(idx, {
                              actualDurationSec: Array.from(
                                { length: Math.max(1, e.actualSets ?? 1) },
                                () => v,
                              ),
                            })
                          }
                          min={0}
                          max={36000}
                          step={5}
                        />
                      )}
                      {metrics.includes('distance') && (
                        <NumberStepper
                          label="Distance"
                          value={Math.round(
                            (e.actualDistance?.reduce((s, n) => s + n, 0) ?? 0) /
                              Math.max(1, e.actualDistance?.length ?? 1),
                          )}
                          onChange={(v) =>
                            updateLogged(idx, {
                              actualDistance: Array.from(
                                { length: Math.max(1, e.actualSets ?? 1) },
                                () => v,
                              ),
                            })
                          }
                          min={0}
                          max={500}
                          step={1}
                        />
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          <Button type="submit" size="lg" fullWidth>
            Save session
          </Button>
        </form>
      </Container>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={onAddExercise}
      />
    </>
  );
}
