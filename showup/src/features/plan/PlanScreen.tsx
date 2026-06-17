import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { strings } from '@/copy/strings';
import { addWeeks, dayIndexInWeek, prettyMinutes, weekDates } from '@/lib/time';
import {
  copyWeekForward,
  ensureWeek,
  getOrCreateWeek,
  planAnchor,
  resolveProgramWeek,
  setDay,
} from '@/db/queries/plans';
import { getWorkoutsByIds } from '@/db/queries/workouts';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { StaticChip } from '@/ui/components/Chip';
import { EmptyState } from '@/ui/components/EmptyState';
import { Field, TextArea } from '@/ui/components/Field';
import { IconButton } from '@/ui/components/IconButton';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PlayIcon,
} from '@/ui/components/Icons';
import { Container } from '@/ui/layout/Container';
import { ScreenHeader } from '@/ui/layout/ScreenHeader';
import { useActivePlan } from './usePlan';
import { useUIStore } from '@/state/uiStore';
import { AssignWorkoutSheet } from './AssignWorkoutSheet';
import { Sheet } from '@/ui/components/Sheet';
import { typeAccentClass, typeLabel } from '@/lib/format';
import { highlightCard } from '@/lib/palette';
import { format } from 'date-fns';
import type { Workout } from '@/types';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function PlanScreen() {
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);
  const { plan, saveWeeks } = useActivePlan();
  const [weekIndex, setWeekIndex] = useState(0);
  const [workoutsById, setWorkoutsById] = useState<Map<string, Workout>>(new Map());
  const [assignFor, setAssignFor] = useState<number | null>(null);
  const [notesFor, setNotesFor] = useState<number | null>(null);
  const initedRef = useRef(false);

  const currentProgramWeek = useMemo(
    () => (plan ? resolveProgramWeek(plan, new Date()).weekIndex : 0),
    [plan],
  );

  // Open on the program week that maps to the real current week.
  useEffect(() => {
    if (plan && !initedRef.current) {
      initedRef.current = true;
      setWeekIndex(currentProgramWeek);
    }
  }, [plan, currentProgramWeek]);

  useEffect(() => {
    if (!plan) return;
    const ids = plan.weeks.flatMap((w) =>
      w.days.map((d) => d.workoutId).filter((x): x is string => !!x),
    );
    void getWorkoutsByIds(Array.from(new Set(ids))).then((ws) =>
      setWorkoutsById(new Map(ws.map((w) => [w.id, w]))),
    );
  }, [plan]);

  const week = useMemo(
    () => (plan ? getOrCreateWeek(plan, weekIndex) : null),
    [plan, weekIndex],
  );

  const dates = useMemo(
    () => weekDates(plan ? addWeeks(planAnchor(plan), weekIndex) : new Date()),
    [plan, weekIndex],
  );
  const todayIdx = dayIndexInWeek(new Date());

  const onAssign = async (dayIndex: number, workoutId: string | null) => {
    if (!plan) return;
    const ensured = ensureWeek(plan, weekIndex);
    const next = setDay(ensured, weekIndex, dayIndex, { workoutId });
    await saveWeeks(next.weeks);
    setAssignFor(null);
  };

  const onCopyWeek = async () => {
    if (!plan) return;
    const next = copyWeekForward(plan, weekIndex);
    await saveWeeks(next.weeks);
    showToast(strings.plan.copyWeekDone, { tone: 'good' });
    setWeekIndex((i) => i + 1);
  };

  const onNoteSave = async (dayIndex: number, notes: string) => {
    if (!plan) return;
    const ensured = ensureWeek(plan, weekIndex);
    const next = setDay(ensured, weekIndex, dayIndex, { notes });
    await saveWeeks(next.weeks);
    setNotesFor(null);
  };

  if (!plan || !week) {
    return (
      <>
        <ScreenHeader title={strings.plan.title} />
        <Container>
          <EmptyState
            title={strings.empty.plan}
            body="When you add a plan, you’ll see your week here."
            icon={<CalendarIcon />}
          />
        </Container>
      </>
    );
  }

  return (
    <>
      <ScreenHeader
        title={strings.plan.title}
        subtitle={`${strings.plan.weekLabel(weekIndex)}${
          weekIndex === currentProgramWeek ? ' · this week' : ''
        }`}
        actions={
          <IconButton label={strings.plan.copyWeek} onClick={() => void onCopyWeek()}>
            <CopyIcon />
          </IconButton>
        }
      />
      <Container>
        <div className="mb-3 flex items-center justify-between">
          <IconButton
            label={strings.plan.prevWeek}
            onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
            disabled={weekIndex === 0}
          >
            <ChevronLeftIcon />
          </IconButton>
          <button
            type="button"
            className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted hover:text-ink"
            onClick={() => setWeekIndex(currentProgramWeek)}
          >
            {strings.plan.thisWeek}
          </button>
          <IconButton
            label={strings.plan.nextWeek}
            onClick={() => setWeekIndex((i) => i + 1)}
          >
            <ChevronRightIcon />
          </IconButton>
        </div>

        <ul className="flex flex-col gap-2">
          {week.days.map((d, idx) => {
            const w = d.workoutId ? workoutsById.get(d.workoutId) : undefined;
            const isToday = weekIndex === currentProgramWeek && idx === todayIdx;
            return (
              <li key={idx}>
                <Card
                  className={`!p-3 ${isToday ? highlightCard.page : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex w-12 shrink-0 flex-col items-center rounded-xl px-2 py-1 ${
                        w
                          ? typeAccentClass(w.type)
                          : 'bg-surface-2/80'
                      }`}
                    >
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
                        {DAY_LABELS[idx]}
                      </span>
                      <span className="text-base font-semibold text-ink">
                        {format(dates[idx], 'd')}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      {w ? (
                        <>
                          <p className="truncate font-semibold text-ink">{w.name}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <StaticChip className={typeAccentClass(w.type)}>
                              {typeLabel[w.type]}
                            </StaticChip>
                            <StaticChip>
                              {prettyMinutes(w.estimatedDuration || 1)}
                            </StaticChip>
                            {isToday && (
                              <StaticChip tone="page">{strings.plan.today}</StaticChip>
                            )}
                          </div>
                          {d.notes && (
                            <p className="mt-1 text-xs text-muted">{d.notes}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted">{strings.plan.rest}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {w && (
                        <IconButton
                          label={strings.workouts.start}
                          tone="page"
                          onClick={() => navigate(`/play/${w.id}`)}
                        >
                          <PlayIcon />
                        </IconButton>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAssignFor(idx)}
                      >
                        {w ? 'Change' : strings.plan.assign}
                      </Button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotesFor(idx)}
                    className="mt-2 text-xs text-muted underline-offset-2 hover:underline"
                  >
                    {d.notes ? 'Edit note' : 'Add note'}
                  </button>
                </Card>
              </li>
            );
          })}
        </ul>
      </Container>

      <AssignWorkoutSheet
        open={assignFor !== null}
        currentWorkoutId={
          assignFor !== null ? week.days[assignFor].workoutId : null
        }
        onClose={() => setAssignFor(null)}
        onPick={(id) => assignFor !== null && void onAssign(assignFor, id)}
      />

      {notesFor !== null && (
        <NoteSheet
          initial={week.days[notesFor].notes ?? ''}
          onClose={() => setNotesFor(null)}
          onSave={(t) => void onNoteSave(notesFor, t)}
        />
      )}
    </>
  );
}

function NoteSheet({
  initial,
  onSave,
  onClose,
}: {
  initial: string;
  onSave: (t: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <Sheet open onClose={onClose} title={strings.plan.note}>
      <div className="flex flex-col gap-3">
        <Field label="Note">
          <TextArea
            rows={4}
            value={text}
            placeholder={strings.plan.notePlaceholder}
            onChange={(e) => setText(e.target.value)}
          />
        </Field>
        <Button onClick={() => onSave(text)} fullWidth>
          Save note
        </Button>
      </div>
    </Sheet>
  );
}
