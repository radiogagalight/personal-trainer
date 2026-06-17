import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { strings } from '@/copy/strings';
import {
  ALL_AREAS,
  ALL_EQUIPMENT,
  ALL_TYPES,
  areaLabel,
  equipmentLabel,
  metricLabel,
  typeLabel,
} from '@/lib/format';
import {
  countReferencingWorkouts,
  createExercise,
  deleteExercise,
  duplicateExercise,
  getExercise,
  updateExercise,
} from '@/db/queries/exercises';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Chip } from '@/ui/components/Chip';
import { Confirm } from '@/ui/components/Confirm';
import { Field, Select, TextArea, TextInput } from '@/ui/components/Field';
import { IconButton } from '@/ui/components/IconButton';
import { CopyIcon, TrashIcon } from '@/ui/components/Icons';
import { NumberStepper } from '@/ui/components/NumberStepper';
import { Container } from '@/ui/layout/Container';
import { ScreenHeader } from '@/ui/layout/ScreenHeader';
import { useUIStore } from '@/state/uiStore';
import type {
  BodyArea,
  Equipment,
  Exercise,
  ExerciseType,
  Metric,
} from '@/types';

interface Props {
  mode: 'new' | 'edit';
}

const ALL_METRICS: Metric[] = [
  'sets',
  'reps',
  'weight',
  'duration',
  'distance',
  'rounds',
];

const blankExercise = (): Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: '',
  type: 'strength',
  targetAreas: [],
  equipment: ['none'],
  instructions: '',
  videoUrl: '',
  defaultMetrics: ['sets', 'reps'],
  estimatedSecondsPerSet: 45,
  isCustom: true,
});

export function ExerciseEditorScreen({ mode }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);

  const [draft, setDraft] = useState<
    Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>
  >(blankExercise());
  const [loading, setLoading] = useState(mode === 'edit');
  const [refCount, setRefCount] = useState<number>(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    let cancel = false;
    void (async () => {
      const ex = await getExercise(id);
      const refs = await countReferencingWorkouts(id);
      if (cancel) return;
      if (ex) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = ex;
        setDraft(rest);
      }
      setRefCount(refs);
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [id, mode]);

  const canSave = useMemo(
    () => draft.name.trim().length > 0 && draft.defaultMetrics.length > 0,
    [draft.name, draft.defaultMetrics.length],
  );

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const save = async () => {
    if (!canSave) return;
    if (mode === 'new') {
      const created = await createExercise({
        ...draft,
        isCustom: true,
      });
      showToast(`“${created.name}” saved`, { tone: 'good' });
      navigate(-1);
    } else if (id) {
      await updateExercise(id, draft);
      showToast(`“${draft.name}” saved`, { tone: 'good' });
      navigate(-1);
    }
  };

  const onDuplicate = async () => {
    if (!id) return;
    const copy = await duplicateExercise(id);
    if (copy) {
      showToast('Duplicated', { tone: 'good' });
      navigate(`/library/${copy.id}`, { replace: true });
    }
  };

  const onDelete = async () => {
    if (!id) return;
    await deleteExercise(id);
    showToast('Removed', { tone: 'default' });
    setConfirmDelete(false);
    navigate('/library', { replace: true });
  };

  return (
    <>
      <ScreenHeader
        title={mode === 'new' ? strings.library.new : draft.name || ' '}
        back
        actions={
          mode === 'edit' ? (
            <>
              <IconButton label={strings.workouts.duplicate} onClick={onDuplicate}>
                <CopyIcon />
              </IconButton>
              <IconButton
                label={strings.library.delete}
                tone="danger"
                onClick={() => setConfirmDelete(true)}
              >
                <TrashIcon />
              </IconButton>
            </>
          ) : null
        }
      />
      <Container>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <Card>
              <div className="flex flex-col gap-4">
                <Field label={strings.library.nameLabel}>
                  <TextInput
                    value={draft.name}
                    placeholder="e.g. Goblet squat"
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                  />
                </Field>

                <Field label={strings.library.typeLabel}>
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

                <Field label={strings.library.targetLabel}>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_AREAS.map((a) => (
                      <Chip
                        key={a}
                        active={draft.targetAreas.includes(a)}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            targetAreas: toggle<BodyArea>(
                              draft.targetAreas,
                              a,
                            ),
                          })
                        }
                      >
                        {areaLabel[a]}
                      </Chip>
                    ))}
                  </div>
                </Field>

                <Field label={strings.library.equipmentLabel}>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_EQUIPMENT.map((e) => (
                      <Chip
                        key={e}
                        active={draft.equipment.includes(e)}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            equipment: toggle<Equipment>(draft.equipment, e),
                          })
                        }
                      >
                        {equipmentLabel[e]}
                      </Chip>
                    ))}
                  </div>
                </Field>
              </div>
            </Card>

            <Card>
              <div className="flex flex-col gap-4">
                <Field label={strings.library.instructionsLabel}>
                  <TextArea
                    rows={5}
                    value={draft.instructions}
                    placeholder="A clear, friendly how-to. One or two paragraphs."
                    onChange={(e) =>
                      setDraft({ ...draft, instructions: e.target.value })
                    }
                  />
                </Field>

                <Field label={strings.library.videoLabel} hint="Optional. External link.">
                  <TextInput
                    type="url"
                    inputMode="url"
                    placeholder="https://…"
                    value={draft.videoUrl ?? ''}
                    onChange={(e) =>
                      setDraft({ ...draft, videoUrl: e.target.value })
                    }
                  />
                </Field>
              </div>
            </Card>

            <Card>
              <div className="flex flex-col gap-4">
                <Field label={strings.library.metricsLabel}>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_METRICS.map((m) => (
                      <Chip
                        key={m}
                        active={draft.defaultMetrics.includes(m)}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            defaultMetrics: toggle<Metric>(
                              draft.defaultMetrics,
                              m,
                            ),
                          })
                        }
                      >
                        {metricLabel[m]}
                      </Chip>
                    ))}
                  </div>
                </Field>

                <NumberStepper
                  label={strings.library.estimatedLabel}
                  value={draft.estimatedSecondsPerSet ?? 45}
                  onChange={(v) =>
                    setDraft({ ...draft, estimatedSecondsPerSet: v })
                  }
                  min={5}
                  max={3600}
                  step={5}
                  suffix="sec"
                />
              </div>
            </Card>

            <Button type="submit" size="lg" fullWidth disabled={!canSave}>
              {mode === 'new' ? 'Save exercise' : 'Save changes'}
            </Button>
          </form>
        )}
      </Container>

      <Confirm
        open={confirmDelete}
        destructive
        title={strings.library.deleteConfirmTitle}
        body={
          refCount > 0
            ? `${strings.library.deleteConfirmBody}\n\n${strings.library.deleteInUse(refCount)}`
            : strings.library.deleteConfirmBody
        }
        confirmLabel="Delete"
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
