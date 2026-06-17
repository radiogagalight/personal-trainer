import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { strings } from '@/copy/strings';
import { nowIso } from '@/lib/ids';
import { prettyMinutes, prettyTime } from '@/lib/time';
import { requestWakeLock } from '@/lib/featureDetect';
import { typeAccentClass, typeLabel, equipmentLabel } from '@/lib/format';
import { missingEquipment } from '@/lib/equipment';
import { getExercisesByIds } from '@/db/queries/exercises';
import { createLog } from '@/db/queries/logs';
import { getWorkout } from '@/db/queries/workouts';
import { getSettings } from '@/db/queries/settings';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Chip, StaticChip } from '@/ui/components/Chip';
import { Confirm } from '@/ui/components/Confirm';
import { IconButton } from '@/ui/components/IconButton';
import {
  ChevronLeftIcon,
  XIcon,
} from '@/ui/components/Icons';
import { Container } from '@/ui/layout/Container';
import { Spinner } from '@/ui/components/Spinner';
import {
  applyLiteMode,
  firstStep,
  nextStep,
  resolveStep,
  skipExercise,
  type StepCursor,
} from './playerEngine';
import { RestTimer } from './RestTimer';
import { DurationTimer } from './DurationTimer';
import { SwapSheet } from './SwapSheet';
import { SummaryScreen } from './SummaryScreen';
import { clearSnapshot, loadSnapshot, saveSnapshot } from './sessionSnapshot';
import { selectForBlock } from '@/lib/randomizer';
import { listLogs, listLogsByWorkout } from '@/db/queries/logs';
import { listExercises } from '@/db/queries/exercises';
import { detectPRs, type PRRecord } from '@/lib/prs';
import { evaluateBadges } from '@/lib/badges';
import { grantBadge } from '@/db/queries/achievements';
import { strings as appStrings } from '@/copy/strings';
import type {
  BlockExerciseRef,
  Exercise,
  LogEntry,
  LoggedExercise,
  Settings,
  Workout,
} from '@/types';

type Phase = 'loading' | 'preview' | 'exercise' | 'rest' | 'finished';

interface ActualState {
  reps?: number;
  weight?: number;
  durationSec?: number;
  distance?: number;
}

export function LivePlayerScreen() {
  const { workoutId } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('loading');
  const [original, setOriginal] = useState<Workout | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Map<string, Exercise>>(new Map());
  const [settings, setSettings] = useState<Settings | null>(null);
  const [cursor, setCursor] = useState<StepCursor | null>(null);
  const [liteIntent, setLiteIntent] = useState(search.get('lite') === '1');
  const [actual, setActual] = useState<ActualState>({});
  const [restSeconds, setRestSeconds] = useState(60);
  const [lastLog, setLastLog] = useState<LogEntry | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [logged, setLogged] = useState<Map<string, LoggedExercise>>(new Map());
  const [rolledByBlock, setRolledByBlock] = useState<Map<string, BlockExerciseRef[]>>(new Map());
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [savedLog, setSavedLog] = useState<{
    id: string;
    name: string;
    type: Workout['type'];
    durationMin: number;
    entries: LoggedExercise[];
    prs: PRRecord[];
    newBadgeTitles: string[];
  } | null>(null);
  const startedAt = useRef<number | null>(null);
  const wakeRef = useRef<{ release: () => Promise<void> } | null>(null);
  const wasModifiedRef = useRef<boolean>(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!workoutId) return;
      const [w, s, all] = await Promise.all([
        getWorkout(workoutId),
        getSettings(),
        listExercises(),
      ]);
      const snap = loadSnapshot();
      const resumable = snap && snap.workoutId === workoutId ? snap : null;
      if (!w && !resumable) {
        navigate('/today', { replace: true });
        return;
      }
      if (cancel) return;
      setSettings(s);
      setAllExercises(all);
      const last = (await listLogsByWorkout(workoutId))[0] ?? null;
      if (cancel) return;
      setLastLog(last);

      // Resume an in-progress session exactly where it left off.
      if (resumable) {
        const locked = resumable.workout;
        const ids = new Set(
          locked.blocks.flatMap((b) => b.exercisePool.map((r) => r.exerciseId)),
        );
        setOriginal(w ?? locked);
        setWorkout(locked);
        setExercises(new Map(all.filter((e) => ids.has(e.id)).map((e) => [e.id, e])));
        setLogged(new Map(resumable.logged));
        setLiteIntent(resumable.lite);
        setCursor(resumable.cursor);
        startedAt.current = resumable.startedAt;
        wasModifiedRef.current = resumable.wasModified;
        setPhase('exercise');
        return;
      }

      const ids = Array.from(
        new Set(w!.blocks.flatMap((b) => b.exercisePool.map((r) => r.exerciseId))),
      );
      const exs = await getExercisesByIds(ids);
      if (cancel) return;
      setOriginal(w!);
      setWorkout(w!);
      setExercises(new Map(exs.map((e) => [e.id, e])));

      // Pre-roll any randomized blocks for the preview.
      const randomized = w!.blocks.filter((b) => b.mode === 'randomized');
      if (randomized.length > 0) {
        const map = new Map<string, BlockExerciseRef[]>();
        for (const b of randomized) {
          const pool = b.exercisePool
            .map((r) => all.find((e) => e.id === r.exerciseId))
            .filter((e): e is Exercise => !!e);
          const res = selectForBlock({
            block: b,
            pool,
            settings: s,
            recentLogForWorkout: last,
          });
          map.set(b.id, res.refs);
        }
        if (!cancel) setRolledByBlock(map);
      }
      setPhase('preview');
    })();
    return () => {
      cancel = true;
      void wakeRef.current?.release();
    };
  }, [workoutId, navigate]);

  // Persist the live session so a reload / app-kill can resume it.
  useEffect(() => {
    if ((phase === 'exercise' || phase === 'rest') && workout && cursor && workoutId) {
      saveSnapshot({
        workoutId,
        workout,
        cursor,
        logged: Array.from(logged.entries()),
        startedAt: startedAt.current ?? Date.now(),
        lite: liteIntent,
        wasModified: wasModifiedRef.current,
      });
    }
  }, [phase, workout, cursor, logged, workoutId, liteIntent]);

  const rerollBlock = (blockId: string) => {
    if (!original || !settings) return;
    const b = original.blocks.find((x) => x.id === blockId);
    if (!b) return;
    const pool = b.exercisePool
      .map((r) => allExercises.find((e) => e.id === r.exerciseId))
      .filter((e): e is Exercise => !!e);
    // Reuse the most-recent log so re-rolls still honor the no-immediate-repeat rule.
    const res = selectForBlock({
      block: b,
      pool,
      settings,
      recentLogForWorkout: lastLog,
    });
    const next = new Map(rolledByBlock);
    next.set(blockId, res.refs);
    setRolledByBlock(next);
  };

  /** Apply any rolled randomized-block selections to a working workout copy. */
  const lockInRandomized = (w: Workout): Workout => {
    if (rolledByBlock.size === 0) return w;
    return {
      ...w,
      blocks: w.blocks.map((b) => {
        if (b.mode !== 'randomized') return b;
        const rolled = rolledByBlock.get(b.id);
        if (!rolled) return b;
        return {
          ...b,
          mode: 'fixed',
          exercisePool: rolled,
        };
      }),
    };
  };

  const resolved = useMemo(
    () => (workout && cursor ? resolveStep(workout, cursor) : null),
    [workout, cursor],
  );

  const currentExerciseId = resolved?.ref.exerciseId;
  const currentExercise = currentExerciseId
    ? exercises.get(currentExerciseId)
    : undefined;

  // Pre-fill actuals when a new step lands
  useEffect(() => {
    if (!resolved || !currentExercise) return;
    const r = resolved.ref;
    const previous = logged.get(r.exerciseId);
    setActual({
      reps:
        previous?.actualReps?.[resolved.cursor.setIndex] ??
        r.targetReps,
      weight:
        previous?.actualWeight?.[resolved.cursor.setIndex] ??
        r.targetWeight,
      durationSec:
        previous?.actualDurationSec?.[resolved.cursor.setIndex] ??
        r.targetDurationSec,
      distance:
        previous?.actualDistance?.[resolved.cursor.setIndex] ??
        r.targetDistance,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved?.cursor.blockIndex, resolved?.cursor.roundIndex, resolved?.cursor.exerciseIndex, resolved?.cursor.setIndex, currentExerciseId]);

  // Lock screen wake when playing; re-acquire after tab becomes visible again
  useEffect(() => {
    const active = phase === 'exercise' || phase === 'rest';
    if (active) {
      void (async () => {
        wakeRef.current = await requestWakeLock();
      })();
      const onVis = async () => {
        if (document.visibilityState === 'visible') {
          wakeRef.current = await requestWakeLock();
        }
      };
      document.addEventListener('visibilitychange', onVis);
      return () => {
        document.removeEventListener('visibilitychange', onVis);
        void wakeRef.current?.release();
        wakeRef.current = null;
      };
    }
    void wakeRef.current?.release();
    wakeRef.current = null;
    return undefined;
  }, [phase]);

  const startSession = (lite: boolean) => {
    if (!original) return;
    const locked = lockInRandomized(original);
    const next = lite ? applyLiteMode(locked) : locked;
    setWorkout(next);
    // Ensure the exercises map covers any newly-resolved randomized picks.
    const ids = new Set(next.blocks.flatMap((b) => b.exercisePool.map((r) => r.exerciseId)));
    setExercises((cur) => {
      const m = new Map(cur);
      for (const id of ids) {
        if (!m.has(id)) {
          const found = allExercises.find((e) => e.id === id);
          if (found) m.set(id, found);
        }
      }
      return m;
    });
    const c = firstStep(next);
    if (!c) {
      navigate('/today', { replace: true });
      return;
    }
    setCursor(c);
    startedAt.current = Date.now();
    setPhase('exercise');
  };

  const recordCurrentSet = () => {
    if (!resolved || !currentExercise) return;
    const r = resolved.ref;
    const ex = currentExercise;
    const cur = logged.get(r.exerciseId) ?? {
      exerciseId: ex.id,
      exerciseName: ex.name,
      actualSets: 0,
      actualReps: [],
      actualWeight: [],
      skipped: false,
    };
    const reps = [...(cur.actualReps ?? [])];
    const weights = [...(cur.actualWeight ?? [])];
    const durations = [...(cur.actualDurationSec ?? [])];
    const distances = [...(cur.actualDistance ?? [])];
    const idx = resolved.cursor.setIndex;
    if (ex.defaultMetrics.includes('reps') && actual.reps !== undefined) {
      reps[idx] = actual.reps;
    }
    if (ex.defaultMetrics.includes('weight') && actual.weight !== undefined) {
      weights[idx] = actual.weight;
    }
    if (ex.defaultMetrics.includes('duration') && actual.durationSec !== undefined) {
      durations[idx] = actual.durationSec;
    }
    if (ex.defaultMetrics.includes('distance') && actual.distance !== undefined) {
      distances[idx] = actual.distance;
    }
    const next: LoggedExercise = {
      ...cur,
      actualSets: Math.max(cur.actualSets ?? 0, idx + 1),
      actualReps: reps.length ? reps : undefined,
      actualWeight: weights.length ? weights : undefined,
      actualDurationSec: durations.length ? durations : undefined,
      actualDistance: distances.length ? distances : undefined,
      substitutedFor: cur.substitutedFor,
    };
    const m = new Map(logged);
    m.set(r.exerciseId, next);
    setLogged(m);
  };

  const advance = () => {
    if (!workout || !cursor || !resolved) return;
    recordCurrentSet();
    const finishedRef = resolved.ref;
    const isLastSetOfExercise =
      resolved.cursor.setIndex + 1 >= resolved.setCount;
    const next = nextStep(workout, cursor);
    if (!next) {
      void finish();
      return;
    }
    // Rest between sets falls back to the default; rest between exercises,
    // rounds, or blocks only when the finished exercise defines one (so
    // flows like yoga/cool-downs aren't padded with unwanted rests).
    const rest = isLastSetOfExercise
      ? finishedRef.restSecondsBetweenSets ?? 0
      : finishedRef.restSecondsBetweenSets ?? settings?.defaultRestSeconds ?? 60;
    setCursor(next);
    if (rest > 0) {
      setRestSeconds(rest);
      setPhase('rest');
    } else {
      setPhase('exercise');
    }
  };

  const onRestDone = () => setPhase('exercise');

  const handleSkip = () => {
    if (!workout || !cursor) return;
    wasModifiedRef.current = true;
    const cur = logged.get(cursor && resolved ? resolved.ref.exerciseId : '');
    const m = new Map(logged);
    if (resolved && currentExercise) {
      m.set(resolved.ref.exerciseId, {
        exerciseId: currentExercise.id,
        exerciseName: currentExercise.name,
        skipped: true,
        actualSets: cur?.actualSets ?? 0,
        actualReps: cur?.actualReps,
        actualWeight: cur?.actualWeight,
      });
    }
    setLogged(m);
    const next = skipExercise(workout, cursor);
    if (!next) {
      void finish();
      return;
    }
    setCursor(next);
    setPhase('exercise');
  };

  const handleSwap = (replacement: Exercise) => {
    if (!resolved || !currentExercise) return;
    wasModifiedRef.current = true;
    setExercises((m) => {
      const next = new Map(m);
      next.set(replacement.id, replacement);
      return next;
    });
    // Replace the ref's exerciseId in the running workout copy.
    setWorkout((w) => {
      if (!w || !cursor) return w;
      const blocks = w.blocks.map((b, bi) =>
        bi !== cursor.blockIndex
          ? b
          : {
              ...b,
              exercisePool: b.exercisePool.map((r, ei) =>
                ei !== cursor.exerciseIndex
                  ? r
                  : { ...r, exerciseId: replacement.id },
              ),
            },
      );
      return { ...w, blocks };
    });
    // Move logged entry over so substitutedFor is captured
    const m = new Map(logged);
    const original = m.get(currentExercise.id);
    m.delete(currentExercise.id);
    m.set(replacement.id, {
      exerciseId: replacement.id,
      exerciseName: replacement.name,
      skipped: false,
      actualSets: original?.actualSets,
      actualReps: original?.actualReps,
      actualWeight: original?.actualWeight,
      actualDurationSec: original?.actualDurationSec,
      actualDistance: original?.actualDistance,
      substitutedFor: currentExercise.id,
    });
    setLogged(m);
    setSwapOpen(false);
  };

  const finish = async () => {
    if (!original || !workout || !cursor) {
      clearSnapshot();
      navigate('/today', { replace: true });
      return;
    }
    const startMs = startedAt.current ?? Date.now();
    const durationMin = Math.max(
      1,
      Math.round((Date.now() - startMs) / 60000),
    );
    const entries: LoggedExercise[] = [];
    const seen = new Set<string>();
    for (const b of workout.blocks) {
      for (const r of b.exercisePool) {
        if (seen.has(r.exerciseId)) continue;
        seen.add(r.exerciseId);
        const found = logged.get(r.exerciseId);
        if (found) entries.push(found);
      }
    }
    const log = await createLog({
      date: nowIso(),
      workoutId: original.id,
      workoutName: original.name,
      type: original.type,
      loggedExercises: entries,
      totalDurationMin: durationMin,
      wasModified: wasModifiedRef.current,
    });
    clearSnapshot();
    // PRs (compare against pre-existing history; exclude the new log)
    const history = await listLogs();
    const pre = history.filter((l) => l.id !== log.id);
    const prs = detectPRs(pre, log);
    // Badges
    const granted = evaluateBadges(history, log);
    const newBadgeTitles: string[] = [];
    for (const key of granted) {
      const entry = appStrings.achievements.catalog[
        key as keyof typeof appStrings.achievements.catalog
      ];
      const title = entry?.title ?? key;
      const result = await grantBadge(key, log.id);
      if (result) newBadgeTitles.push(title);
    }
    setSavedLog({
      id: log.id,
      name: log.workoutName,
      type: log.type,
      durationMin: log.totalDurationMin,
      entries: log.loggedExercises,
      prs,
      newBadgeTitles,
    });
    setPhase('finished');
  };

  if (phase === 'loading' || !workout) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg">
        <Spinner size={28} />
      </div>
    );
  }

  if (phase === 'preview') {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-bg safe-top safe-bottom">
        <header className="flex items-center gap-2 px-4 pt-3">
          <IconButton label="Back" onClick={() => navigate(-1)}>
            <ChevronLeftIcon />
          </IconButton>
          <span className="text-sm font-medium text-muted">Start workout</span>
        </header>
        <Container className="flex-1">
          <h1 className="text-2xl font-semibold text-ink">{original?.name}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {original && (
              <StaticChip className={typeAccentClass(original.type)}>
                {typeLabel[original.type]}
              </StaticChip>
            )}
            {original && (
              <StaticChip>
                {prettyMinutes(original.estimatedDuration || 1)}
              </StaticChip>
            )}
            <StaticChip>
              {original?.blocks.length} block{original?.blocks.length === 1 ? '' : 's'}
            </StaticChip>
          </div>

          <Card className="mt-4">
            <p className="text-sm font-semibold text-ink">{strings.player.liteMode}</p>
            <p className="mt-1 text-sm text-muted">
              {strings.player.liteModeDesc}
            </p>
            <div className="mt-2 flex gap-2">
              <Chip active={!liteIntent} onClick={() => setLiteIntent(false)}>
                Standard
              </Chip>
              <Chip active={liteIntent} onClick={() => setLiteIntent(true)}>
                Lite
              </Chip>
            </div>
          </Card>

          <div className="mt-6 flex flex-col gap-3">
            {original?.blocks.map((b, i) => {
              const isRandom = b.mode === 'randomized';
              const refs = isRandom
                ? (rolledByBlock.get(b.id) ?? b.exercisePool)
                : b.exercisePool;
              return (
                <Card key={b.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted">
                        Block {i + 1}
                        {isRandom ? ` · ${strings.player.randomizedPreview}` : ''}
                      </p>
                      <p className="font-semibold text-ink">{b.label}</p>
                    </div>
                    {isRandom && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => rerollBlock(b.id)}
                      >
                        {strings.player.reroll}
                      </Button>
                    )}
                  </div>
                  <ul className="mt-2 text-sm text-muted">
                    {refs.map((r) => {
                      const ex =
                        exercises.get(r.exerciseId) ??
                        allExercises.find((e) => e.id === r.exerciseId);
                      const missing =
                        ex && settings
                          ? missingEquipment(ex, settings.ownedEquipment)
                          : [];
                      return (
                        <li key={r.exerciseId}>
                          · {ex?.name ?? '—'}
                          {missing.length > 0 && (
                            <span className="mt-0.5 block pl-3 text-xs text-amber">
                              {strings.player.equipmentMissing(
                                missing.map((m) => equipmentLabel[m]).join(', '),
                              )}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              );
            })}
          </div>
        </Container>
        <div className="sticky bottom-0 border-t border-border bg-bg/95 px-4 py-3 safe-bottom backdrop-blur">
          <Button size="lg" fullWidth onClick={() => startSession(liteIntent)}>
            {liteIntent ? strings.player.startLite : strings.player.start}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'finished' && savedLog) {
    return (
      <SummaryScreen
        log={{
          id: savedLog.id,
          date: nowIso(),
          workoutId: original?.id ?? '',
          workoutName: savedLog.name,
          type: savedLog.type,
          loggedExercises: savedLog.entries,
          totalDurationMin: savedLog.durationMin,
          wasModified: wasModifiedRef.current,
          createdAt: nowIso(),
        }}
        newAchievements={savedLog.newBadgeTitles}
        prCount={savedLog.prs.length}
      />
    );
  }

  if (!resolved || !currentExercise) {
    return null;
  }

  // exercise / rest UI
  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg safe-top safe-bottom">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <IconButton label={strings.player.endEarly} onClick={() => setConfirmEnd(true)}>
          <XIcon />
        </IconButton>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs uppercase tracking-wide text-muted">
            {resolved.block.label}
            {resolved.roundCount > 1
              ? ` · ${strings.player.roundOf(resolved.cursor.roundIndex + 1, resolved.roundCount)}`
              : ''}
          </p>
          <p className="truncate text-sm font-semibold text-ink">
            {currentExercise.name}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-md">
          {phase === 'rest' ? (
            <RestTimer
              key={`${resolved.ref.exerciseId}-${resolved.cursor.setIndex}`}
              seconds={restSeconds}
              onDone={onRestDone}
              onSkip={onRestDone}
            />
          ) : (
            <ExerciseStep
              setLabel={strings.player.setOf(
                resolved.cursor.setIndex + 1,
                resolved.setCount,
              )}
              exercise={currentExercise}
              targetRef={resolved.ref}
              actual={actual}
              setActual={setActual}
              onDurationComplete={(s) => {
                setActual((a) => ({ ...a, durationSec: s }));
              }}
            />
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 flex flex-col gap-2 border-t border-border bg-bg/95 px-4 py-3 safe-bottom backdrop-blur">
        {phase === 'exercise' && (
          <>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSwapOpen(true)}>
                {strings.player.swap}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                {strings.player.skip}
              </Button>
              <span className="ml-auto self-center text-xs text-muted">
                {strings.player.setOf(
                  resolved.cursor.setIndex + 1,
                  resolved.setCount,
                )}
              </span>
            </div>
            <Button size="lg" fullWidth onClick={advance}>
              {strings.player.done}
            </Button>
          </>
        )}
        {phase === 'rest' && (
          <p className="text-center text-xs text-muted">
            Up next: set{' '}
            {resolved.cursor.setIndex + 1} of {resolved.setCount}
          </p>
        )}
      </footer>

      <Confirm
        open={confirmEnd}
        destructive
        title={strings.player.endEarlyTitle}
        body={strings.player.endEarlyBody}
        confirmLabel={strings.player.endNow}
        cancelLabel={strings.player.keepGoing}
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          setConfirmEnd(false);
          wasModifiedRef.current = true;
          void finish();
        }}
      />

      <SwapSheet
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        current={currentExercise}
        onPick={handleSwap}
      />
    </div>
  );
}

interface ExerciseStepProps {
  setLabel: string;
  exercise: Exercise;
  targetRef: import('@/types').BlockExerciseRef;
  actual: ActualState;
  setActual: (a: ActualState | ((prev: ActualState) => ActualState)) => void;
  onDurationComplete: (s: number) => void;
}

function ExerciseStep({
  setLabel,
  exercise,
  targetRef: bex,
  actual,
  setActual,
  onDurationComplete,
}: ExerciseStepProps) {
  const isDurationBased = exercise.defaultMetrics.includes('duration');
  return (
    <div className="flex flex-col gap-4 py-2">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-page">
          {setLabel}
        </span>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {exercise.name}
        </h2>
        <p className="mt-2 whitespace-pre-line text-sm text-muted">
          {exercise.instructions}
        </p>
        {exercise.videoUrl && (
          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-page underline-offset-2 hover:underline"
          >
            Watch a video ↗
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {bex.targetReps !== undefined && (
          <StaticChip>Target: {bex.targetReps} reps</StaticChip>
        )}
        {bex.targetWeight !== undefined && bex.targetWeight > 0 && (
          <StaticChip>Target weight: {bex.targetWeight}</StaticChip>
        )}
        {bex.targetDurationSec !== undefined && (
          <StaticChip>Target: {prettyTime(bex.targetDurationSec)}</StaticChip>
        )}
        {bex.targetDistance !== undefined && bex.targetDistance > 0 && (
          <StaticChip>Distance: {bex.targetDistance}</StaticChip>
        )}
      </div>

      <Card>
        <div className="flex flex-col gap-3">
          {isDurationBased ? (
            <DurationTimer
              targetSec={bex.targetDurationSec}
              onComplete={onDurationComplete}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {exercise.defaultMetrics.includes('reps') && (
                <NumberField
                  label={strings.player.actualReps}
                  value={actual.reps}
                  onChange={(v) => setActual((a) => ({ ...a, reps: v }))}
                />
              )}
              {exercise.defaultMetrics.includes('weight') && (
                <NumberField
                  label={strings.player.actualWeight}
                  value={actual.weight}
                  onChange={(v) => setActual((a) => ({ ...a, weight: v }))}
                />
              )}
              {exercise.defaultMetrics.includes('distance') && (
                <NumberField
                  label={strings.player.actualDistance}
                  value={actual.distance}
                  onChange={(v) => setActual((a) => ({ ...a, distance: v }))}
                />
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="h-14 rounded-2xl border border-border bg-surface px-4 text-center text-2xl font-semibold tabular-nums text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}
