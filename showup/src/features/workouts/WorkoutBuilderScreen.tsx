import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { strings } from '@/copy/strings';
import { ALL_TYPES, typeLabel } from '@/lib/format';
import { newId } from '@/lib/ids';
import { estimateBlockSeconds, estimateWorkoutMinutes } from '@/lib/duration';
import { prettyMinutes } from '@/lib/time';
import { listExercises } from '@/db/queries/exercises';
import {
  createWorkout,
  deleteWorkout,
  getWorkout,
  updateWorkout,
} from '@/db/queries/workouts';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Chip } from '@/ui/components/Chip';
import { Confirm } from '@/ui/components/Confirm';
import { Field, Select, TextArea, TextInput } from '@/ui/components/Field';
import { IconButton } from '@/ui/components/IconButton';
import {
  DragIcon,
  PlusIcon,
  TrashIcon,
} from '@/ui/components/Icons';
import { Container } from '@/ui/layout/Container';
import { ScreenHeader } from '@/ui/layout/ScreenHeader';
import { useUIStore } from '@/state/uiStore';
import { ExercisePicker } from './ExercisePicker';
import { BlockExerciseRow } from './BlockExerciseRow';
import type {
  Block,
  BlockExerciseRef,
  Exercise,
  ExerciseType,
  Workout,
} from '@/types';

interface Props {
  mode: 'new' | 'edit';
}

const blankBlock = (label = 'New block'): Block => ({
  id: newId(),
  label,
  mode: 'fixed',
  exercisePool: [],
  rounds: 1,
});

const blankDraft = (): Omit<Workout, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: '',
  type: 'strength',
  blocks: [blankBlock('Set A')],
  estimatedDuration: 0,
  notes: '',
});

export function WorkoutBuilderScreen({ mode }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);

  const [draft, setDraft] = useState<
    Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>
  >(blankDraft());
  const [loading, setLoading] = useState(mode === 'edit');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pickerBlockId, setPickerBlockId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [durationOverride, setDurationOverride] = useState<number | null>(null);

  useEffect(() => {
    void listExercises().then(setExercises);
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    let cancel = false;
    void (async () => {
      const w = await getWorkout(id);
      if (!cancel && w) {
        const {
          id: _id,
          createdAt: _c,
          updatedAt: _u,
          ...rest
        } = w;
        setDraft(rest);
        setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id, mode]);

  const exById = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  );

  const computedMinutes = useMemo(
    () => estimateWorkoutMinutes(draft, exById),
    [draft, exById],
  );

  const totalMinutes = durationOverride ?? computedMinutes;

  const canSave =
    draft.name.trim().length > 0 &&
    draft.blocks.length > 0 &&
    draft.blocks.every((b) => b.exercisePool.length > 0);

  const updateBlock = (blockId: string, patch: Partial<Block>) =>
    setDraft({
      ...draft,
      blocks: draft.blocks.map((b) =>
        b.id !== blockId ? b : { ...b, ...patch },
      ),
    });

  const addBlock = () =>
    setDraft({
      ...draft,
      blocks: [...draft.blocks, blankBlock(`Block ${draft.blocks.length + 1}`)],
    });

  const removeBlock = (blockId: string) =>
    setDraft({
      ...draft,
      blocks: draft.blocks.filter((b) => b.id !== blockId),
    });

  const addExerciseToBlock = (blockId: string, ex: Exercise) => {
    setDraft({
      ...draft,
      blocks: draft.blocks.map((b) =>
        b.id !== blockId
          ? b
          : {
              ...b,
              exercisePool: [
                ...b.exercisePool,
                {
                  exerciseId: ex.id,
                  targetSets: ex.defaultMetrics.includes('sets') ? 3 : undefined,
                  targetReps: ex.defaultMetrics.includes('reps') ? 10 : undefined,
                  targetDurationSec: ex.defaultMetrics.includes('duration')
                    ? 30
                    : undefined,
                  targetWeight: ex.defaultMetrics.includes('weight')
                    ? 0
                    : undefined,
                  targetDistance: ex.defaultMetrics.includes('distance')
                    ? 0
                    : undefined,
                  restSecondsBetweenSets: 60,
                },
              ],
            },
      ),
    });
  };

  const replaceRef = (
    blockId: string,
    exId: string,
    patch: BlockExerciseRef,
  ) =>
    setDraft({
      ...draft,
      blocks: draft.blocks.map((b) =>
        b.id !== blockId
          ? b
          : {
              ...b,
              exercisePool: b.exercisePool.map((r) =>
                r.exerciseId === exId ? patch : r,
              ),
            },
      ),
    });

  const removeRef = (blockId: string, exId: string) =>
    setDraft({
      ...draft,
      blocks: draft.blocks.map((b) =>
        b.id !== blockId
          ? b
          : {
              ...b,
              exercisePool: b.exercisePool.filter(
                (r) => r.exerciseId !== exId,
              ),
            },
      ),
    });

  const blockSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const onDragEndBlocks = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = draft.blocks.map((b) => b.id);
    const from = ids.indexOf(String(e.active.id));
    const to = ids.indexOf(String(e.over.id));
    if (from < 0 || to < 0) return;
    setDraft({ ...draft, blocks: arrayMove(draft.blocks, from, to) });
  };

  const onDragEndExercises = (blockId: string) => (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const block = draft.blocks.find((b) => b.id === blockId);
    if (!block) return;
    const ids = block.exercisePool.map((r) => `${blockId}::${r.exerciseId}`);
    const from = ids.indexOf(String(e.active.id));
    const to = ids.indexOf(String(e.over.id));
    if (from < 0 || to < 0) return;
    updateBlock(blockId, {
      exercisePool: arrayMove(block.exercisePool, from, to),
    });
  };

  const save = async () => {
    if (!canSave) return;
    const payload = {
      ...draft,
      estimatedDuration:
        durationOverride !== null && durationOverride > 0
          ? durationOverride
          : undefined,
    };
    if (mode === 'new') {
      await createWorkout(payload);
    } else if (id) {
      await updateWorkout(id, payload);
    }
    showToast(strings.builder.saved, { tone: 'good' });
    navigate(-1);
  };

  const onDelete = async () => {
    if (!id) return;
    await deleteWorkout(id);
    showToast('Workout removed', { tone: 'default' });
    setConfirmDelete(false);
    navigate('/workouts', { replace: true });
  };

  return (
    <>
      <ScreenHeader
        title={mode === 'new' ? 'New workout' : draft.name || ' '}
        back
        actions={
          mode === 'edit' ? (
            <IconButton
              label="Delete workout"
              tone="danger"
              onClick={() => setConfirmDelete(true)}
            >
              <TrashIcon />
            </IconButton>
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
                <Field label={strings.builder.nameLabel}>
                  <TextInput
                    value={draft.name}
                    placeholder={strings.builder.namePlaceholder}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                  />
                </Field>

                <Field label={strings.builder.typeLabel}>
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

                <Field label={strings.builder.notesLabel}>
                  <TextArea
                    rows={2}
                    value={draft.notes ?? ''}
                    placeholder="Optional"
                    onChange={(e) =>
                      setDraft({ ...draft, notes: e.target.value })
                    }
                  />
                </Field>
              </div>
            </Card>

            <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-xs uppercase tracking-wide text-muted">
                      {strings.builder.estimateLabel}
                    </span>
                    <span className="text-xl font-semibold text-ink">
                      {prettyMinutes(Math.max(1, totalMinutes))}
                    </span>
                  </div>
                  <div className="w-28 shrink-0">
                    <Field label={strings.builder.estimateOverride}>
                      <TextInput
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="—"
                        className="w-full"
                        value={durationOverride ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '') setDurationOverride(null);
                          else {
                            const n = Number(v);
                            if (Number.isFinite(n) && n >= 0)
                              setDurationOverride(n);
                          }
                        }}
                      />
                    </Field>
                  </div>
                </div>
                {durationOverride !== null ? (
                  <span className="text-xs text-muted">
                    computed: {prettyMinutes(Math.max(1, computedMinutes))}
                  </span>
                ) : null}
              </div>
            </Card>

            <DndContext
              sensors={blockSensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEndBlocks}
            >
              <SortableContext
                items={draft.blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-3">
                  {draft.blocks.map((b) => (
                    <SortableBlock
                      key={b.id}
                      block={b}
                      blockSeconds={estimateBlockSeconds(b, exById)}
                      onUpdate={(patch) => updateBlock(b.id, patch)}
                      onRemove={() => removeBlock(b.id)}
                      onAddExercise={() => setPickerBlockId(b.id)}
                      onReorderExercises={onDragEndExercises(b.id)}
                      onChangeRef={(exId, patch) =>
                        replaceRef(b.id, exId, patch)
                      }
                      onRemoveRef={(exId) => removeRef(b.id, exId)}
                      exById={exById}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <Button
              variant="ghost"
              leading={<PlusIcon width={18} height={18} />}
              onClick={addBlock}
              type="button"
            >
              {strings.builder.addBlock}
            </Button>

            {!canSave && (
              <p className="text-center text-sm text-muted">
                {draft.name.trim() ? strings.builder.needBlock : strings.builder.needName}
              </p>
            )}

            <Button type="submit" size="lg" fullWidth disabled={!canSave}>
              Save workout
            </Button>
          </form>
        )}
      </Container>

      <ExercisePicker
        open={pickerBlockId !== null}
        onClose={() => setPickerBlockId(null)}
        excludeIds={
          pickerBlockId
            ? (draft.blocks
                .find((b) => b.id === pickerBlockId)
                ?.exercisePool.map((r) => r.exerciseId) ?? [])
            : []
        }
        onPick={(ex) => {
          if (pickerBlockId) addExerciseToBlock(pickerBlockId, ex);
          setPickerBlockId(null);
        }}
      />

      <Confirm
        open={confirmDelete}
        destructive
        title="Delete this workout?"
        body="It’ll be removed from your workouts. Existing logs are unaffected."
        confirmLabel="Delete"
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

interface SortableBlockProps {
  block: Block;
  blockSeconds: number;
  onUpdate: (patch: Partial<Block>) => void;
  onRemove: () => void;
  onAddExercise: () => void;
  onReorderExercises: (e: DragEndEvent) => void;
  onChangeRef: (exId: string, patch: BlockExerciseRef) => void;
  onRemoveRef: (exId: string) => void;
  exById: Map<string, Exercise>;
}

function SortableBlock({
  block,
  blockSeconds,
  onUpdate,
  onRemove,
  onAddExercise,
  onReorderExercises,
  onChangeRef,
  onRemoveRef,
  exById,
}: SortableBlockProps) {
  const sortable = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };
  const exSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  return (
    <div ref={sortable.setNodeRef} style={style}>
      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <button
              type="button"
              aria-label="Drag block"
              className="h-9 w-9 flex items-center justify-center text-muted hover:text-ink touch-none"
              {...sortable.attributes}
              {...sortable.listeners}
            >
              <DragIcon />
            </button>
            <TextInput
              aria-label={strings.builder.blockLabel}
              value={block.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder={strings.builder.blockLabel}
              className="flex-1"
            />
            <IconButton
              label={strings.builder.deleteBlock}
              tone="danger"
              onClick={onRemove}
            >
              <TrashIcon />
            </IconButton>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Chip
              active={block.mode === 'fixed'}
              onClick={() => onUpdate({ mode: 'fixed' })}
            >
              {strings.builder.fixed}
            </Chip>
            <Chip
              active={block.mode === 'randomized'}
              onClick={() => onUpdate({ mode: 'randomized' })}
              title="Available in Phase 2"
            >
              {strings.builder.randomized}
            </Chip>
            <span className="ml-auto rounded-full bg-surface-2 px-2.5 py-1 text-xs">
              ~{Math.max(1, Math.round(blockSeconds / 60))} min
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs uppercase tracking-wide text-muted">
                {strings.builder.rounds}
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={block.rounds ?? 1}
                min={1}
                max={20}
                onChange={(e) =>
                  onUpdate({ rounds: Math.max(1, Number(e.target.value || 1)) })
                }
                className="mt-1 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            {block.mode === 'randomized' && (
              <div>
                <span className="text-xs uppercase tracking-wide text-muted">
                  {strings.builder.selectionCount}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={block.selectionCount ?? Math.max(1, block.exercisePool.length)}
                  min={1}
                  onChange={(e) =>
                    onUpdate({
                      selectionCount: Math.max(1, Number(e.target.value || 1)),
                    })
                  }
                  className="mt-1 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}
            <div className={block.mode === 'randomized' ? 'col-span-2' : 'col-span-1'}>
              <span className="text-xs uppercase tracking-wide text-muted">
                {strings.builder.targetDuration}
              </span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="optional"
                value={block.targetDurationMin ?? ''}
                min={0}
                onChange={(e) =>
                  onUpdate({
                    targetDurationMin:
                      e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                className="mt-1 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <DndContext
            sensors={exSensors}
            collisionDetection={closestCenter}
            onDragEnd={onReorderExercises}
          >
            <SortableContext
              items={block.exercisePool.map(
                (r) => `${block.id}::${r.exerciseId}`,
              )}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {block.exercisePool.map((r) => (
                  <BlockExerciseRow
                    key={r.exerciseId}
                    blockId={block.id}
                    row={r}
                    exercise={exById.get(r.exerciseId)}
                    onChange={(next) => onChangeRef(r.exerciseId, next)}
                    onRemove={() => onRemoveRef(r.exerciseId)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            type="button"
            variant="soft"
            leading={<PlusIcon width={18} height={18} />}
            onClick={onAddExercise}
          >
            {strings.builder.addExercise}
          </Button>
        </div>
      </Card>
    </div>
  );
}
