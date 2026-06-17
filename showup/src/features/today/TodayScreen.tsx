import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { strings } from '@/copy/strings';
import {
  dayIndexInWeek,
  isoDateOnly,
  longDay,
  prettyMinutes,
  timeOfDayGreeting,
  weekDates,
} from '@/lib/time';
import { typeAccentClass, typeLabel } from '@/lib/format';
import { highlightCard } from '@/lib/palette';
import { useActivePlan } from '../plan/usePlan';
import { ensureWeek, resolveProgramWeek, setDay } from '@/db/queries/plans';
import { getWorkout } from '@/db/queries/workouts';
import { listLogs } from '@/db/queries/logs';
import {
  clearSnapshot,
  loadSnapshot,
  type SessionSnapshot,
} from '../player/sessionSnapshot';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { StaticChip } from '@/ui/components/Chip';
import { IconButton } from '@/ui/components/IconButton';
import {
  ChartIcon,
  DumbbellIcon,
  MoonIcon,
  PlayIcon,
  SettingsIcon,
  SparkleIcon,
} from '@/ui/components/Icons';
import { Container } from '@/ui/layout/Container';
import { ScreenHeader } from '@/ui/layout/ScreenHeader';
import { Sheet } from '@/ui/components/Sheet';
import { InstallPrompt } from './InstallPrompt';
import { SuggestionsCard } from './SuggestionsCard';
import { TodayHero } from './TodayHero';
import { WeekStrip, type WeekDayStatus } from './WeekStrip';
import { sessionIconWrapClass, sessionSurfaceClass } from './todayTheme';
import type { ExerciseType, LogEntry, Week, Workout } from '@/types';

const ROTATING_LINES = strings.greeting.line;

const MISSED_DISMISS_KEY = 'showup:missed-dismissed';
function dismissedMisses(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(MISSED_DISMISS_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}
function dismissMiss(key: string) {
  const s = dismissedMisses();
  s.add(key);
  try {
    localStorage.setItem(MISSED_DISMISS_KEY, JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
}

export function TodayScreen() {
  const navigate = useNavigate();
  const { plan, saveWeeks } = useActivePlan();
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [weekStatuses, setWeekStatuses] = useState<WeekDayStatus[]>(
    () => Array(7).fill('rest') as WeekDayStatus[],
  );
  const [missed, setMissed] = useState<{
    day: number;
    workoutId: string;
    name: string;
  } | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [programWeek, setProgramWeek] = useState<Week | null>(null);
  const [programWeekIndex, setProgramWeekIndex] = useState(0);
  const [resume, setResume] = useState<SessionSnapshot | null>(null);

  const timeOfDay = useMemo(() => timeOfDayGreeting(), []);

  const greeting = useMemo(() => {
    if (timeOfDay === 'morning') return strings.greeting.morning();
    if (timeOfDay === 'afternoon') return strings.greeting.afternoon();
    return strings.greeting.evening();
  }, [timeOfDay]);

  const line = useMemo(
    () => ROTATING_LINES[Math.floor(Math.random() * ROTATING_LINES.length)],
    [],
  );

  const weekDatesList = useMemo(() => weekDates(new Date()), []);
  const todayIdx = useMemo(() => dayIndexInWeek(new Date()), []);

  useEffect(() => {
    setResume(loadSnapshot());
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const logs = await listLogs();
      if (cancel) return;
      setRecentLogs(logs.slice(0, 5));

      const logsByDate = new Set(logs.map((l) => isoDateOnly(l.date)));
      const dates = weekDates(new Date());
      const todayDay = dayIndexInWeek(new Date());

      if (!plan) {
        setWeekStatuses(Array(7).fill('rest') as WeekDayStatus[]);
        setProgramWeek(null);
        setTodayWorkout(null);
        setMissed(null);
        return;
      }

      const { week, weekIndex } = resolveProgramWeek(plan, new Date());
      if (cancel) return;
      setProgramWeek(week);
      setProgramWeekIndex(weekIndex);

      const statuses: WeekDayStatus[] = dates.map((d, idx) => {
        const slot = week.days[idx];
        if (!slot?.workoutId) return 'rest';
        if (logsByDate.has(isoDateOnly(d))) return 'done';
        if (idx < todayDay) return 'missed';
        return 'planned';
      });
      if (!cancel) setWeekStatuses(statuses);

      const slot = week.days[todayDay];
      if (slot?.workoutId) {
        const w = await getWorkout(slot.workoutId);
        if (!cancel) setTodayWorkout(w ?? null);
      } else if (!cancel) {
        setTodayWorkout(null);
      }

      // Quietly surface the earliest still-missed planned day — no auto-popup.
      const dismissed = dismissedMisses();
      let found: { day: number; workoutId: string; name: string } | null = null;
      for (let d = 0; d < todayDay; d++) {
        const ws = week.days[d];
        if (!ws?.workoutId) continue;
        if (logsByDate.has(isoDateOnly(dates[d]))) continue;
        if (dismissed.has(`${isoDateOnly(dates[d])}-${ws.workoutId}`)) continue;
        const mw = await getWorkout(ws.workoutId);
        if (cancel) return;
        found = {
          day: d,
          workoutId: ws.workoutId,
          name: mw?.name ?? 'your session',
        };
        break;
      }
      if (!cancel) setMissed(found);
    })();
    return () => {
      cancel = true;
    };
  }, [plan]);

  const startToday = () => {
    if (todayWorkout) navigate(`/play/${todayWorkout.id}`);
  };

  const missedKey = missed
    ? `${isoDateOnly(weekDatesList[missed.day])}-${missed.workoutId}`
    : '';

  const onDismissMissed = () => {
    if (missedKey) dismissMiss(missedKey);
    setMissed(null);
    setRescheduleOpen(false);
  };

  const openRescheduleDays = useMemo(() => {
    if (!missed || !programWeek) return [] as number[];
    return programWeek.days
      .map((d, i) => ({ d, i }))
      .filter(({ d, i }) => i >= todayIdx && i !== missed.day && !d.workoutId)
      .map(({ i }) => i);
  }, [missed, programWeek, todayIdx]);

  const onReschedule = async (targetDay: number) => {
    if (!plan || !missed) return;
    let next = ensureWeek(plan, programWeekIndex);
    next = setDay(next, programWeekIndex, missed.day, { workoutId: null });
    next = setDay(next, programWeekIndex, targetDay, {
      workoutId: missed.workoutId,
    });
    await saveWeeks(next.weeks);
    setRescheduleOpen(false);
    setMissed(null);
  };

  const dismissResume = () => {
    clearSnapshot();
    setResume(null);
  };

  const sessionsThisWeek = weekStatuses.filter(
    (s) => s === 'done' || s === 'planned' || s === 'missed',
  ).length;
  const completedThisWeek = weekStatuses.filter((s) => s === 'done').length;

  return (
    <>
      <ScreenHeader
        title={strings.app.name}
        actions={
          <>
            <IconButton
              label={strings.tabs.progress}
              onClick={() => navigate('/progress/charts')}
            >
              <ChartIcon />
            </IconButton>
            <IconButton
              label={strings.settings.title}
              onClick={() => navigate('/settings')}
            >
              <SettingsIcon />
            </IconButton>
          </>
        }
      />
      <Container className="pb-2">
        <div className="flex flex-col gap-5">
          <TodayHero greeting={greeting} tagline={line} timeOfDay={timeOfDay} />

          {resume && (
            <ResumeBanner
              snapshot={resume}
              onResume={() => navigate(`/play/${resume.workoutId}`)}
              onDiscard={dismissResume}
            />
          )}

          {plan && (
            <section>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
                  This week
                </h3>
                {sessionsThisWeek > 0 && (
                  <p className="text-xs font-medium text-muted">
                    <span className="tabular-nums text-secondary">
                      {completedThisWeek}
                    </span>
                    <span className="text-muted/80">
                      {' '}
                      / {sessionsThisWeek} done
                    </span>
                  </p>
                )}
              </div>
              <WeekStrip
                dates={weekDatesList}
                todayIndex={todayIdx}
                statuses={weekStatuses}
              />
            </section>
          )}

          {todayWorkout ? (
            <FeaturedWorkoutCard workout={todayWorkout} onStart={startToday} />
          ) : plan ? (
            <RestDayCard
              title={strings.today.restDayTitle}
              body={strings.today.restDayBody}
              onPlan={() => navigate('/plan')}
              onLog={() => navigate('/progress/manual')}
              logLabel={strings.today.logSomething}
            />
          ) : (
            <EmptyDayCard
              title={strings.today.nothingPlannedTitle}
              body={strings.today.nothingPlannedBody}
              onPlan={() => navigate('/plan')}
              onLog={() => navigate('/progress/manual')}
              logLabel={strings.today.logSomething}
            />
          )}

          {missed && (
            <MissedCard
              name={missed.name}
              onDoNow={() => navigate(`/play/${missed.workoutId}`)}
              onLite={() => navigate(`/play/${missed.workoutId}?lite=1`)}
              onPickDay={() => setRescheduleOpen(true)}
              onDismiss={onDismissMissed}
            />
          )}

          <SuggestionsCard />
          <InstallPrompt ready={recentLogs.length > 0} />

          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
                {strings.today.recentTitle}
              </h3>
              {recentLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/progress')}
                  className="text-xs font-medium text-page hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  See all
                </button>
              )}
            </div>
            {recentLogs.length === 0 ? (
              <Card className="border-dashed border-border/80 bg-surface-2/50 !p-6 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-page-soft text-page">
                  <SparkleIcon width={20} height={20} />
                </div>
                <p className="text-sm text-muted">{strings.today.recentEmpty}</p>
              </Card>
            ) : (
              <ul className="flex flex-col gap-2">
                {recentLogs.map((l) => (
                  <li key={l.id}>
                    <RecentLogRow log={l} onOpen={() => navigate(`/progress/log/${l.id}`)} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Container>

      <Sheet
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title={strings.plan.missed.pickDayTitle}
      >
        <div className="flex flex-col gap-2 pt-2">
          {openRescheduleDays.length === 0 ? (
            <p className="text-sm text-muted">{strings.plan.missed.noOpenDays}</p>
          ) : (
            openRescheduleDays.map((i) => (
              <Button
                key={i}
                variant="soft"
                onClick={() => void onReschedule(i)}
              >
                {i === todayIdx ? strings.plan.today : longDay(weekDatesList[i])}
              </Button>
            ))
          )}
        </div>
      </Sheet>
    </>
  );
}

function FeaturedWorkoutCard({
  workout,
  onStart,
}: {
  workout: Workout;
  onStart: () => void;
}) {
  const surface = sessionSurfaceClass[workout.type];
  const iconWrap = sessionIconWrapClass[workout.type];

  return (
    <Card padded={false} className={`overflow-hidden !p-0 ${surface}`}>
      <div className="h-1 bg-page" aria-hidden />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconWrap}`}
            aria-hidden
          >
            <DumbbellIcon width={28} height={28} strokeWidth={1.6} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {strings.tabs.today}
            </p>
            <p className="mt-0.5 truncate text-xl font-semibold tracking-tight text-ink">
              {workout.name}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <StaticChip className={typeAccentClass(workout.type)}>
                {typeLabel[workout.type]}
              </StaticChip>
              <StaticChip>
                {prettyMinutes(workout.estimatedDuration || 1)}
              </StaticChip>
              <StaticChip>
                {workout.blocks.length} block
                {workout.blocks.length === 1 ? '' : 's'}
              </StaticChip>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <Button
            size="lg"
            fullWidth
            leading={<PlayIcon width={18} height={18} />}
            onClick={onStart}
          >
            {strings.today.startWorkout}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RestDayCard({
  title,
  body,
  onPlan,
  onLog,
  logLabel,
}: {
  title: string;
  body: string;
  onPlan: () => void;
  onLog: () => void;
  logLabel: string;
}) {
  return (
    <Card className={`!p-5 ${highlightCard.secondary}`}>
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 text-secondary"
          aria-hidden
        >
          <MoonIcon width={24} height={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
            {title}
          </p>
          <p className="mt-2 text-base leading-relaxed text-ink">{body}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ghost" onClick={onPlan}>
          Open plan
        </Button>
        <Button variant="soft" onClick={onLog}>
          {logLabel}
        </Button>
      </div>
    </Card>
  );
}

function EmptyDayCard({
  title,
  body,
  onPlan,
  onLog,
  logLabel,
}: {
  title: string;
  body: string;
  onPlan: () => void;
  onLog: () => void;
  logLabel: string;
}) {
  return (
    <Card className="border-dashed border-border/90 bg-surface-2/40 !p-5">
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-page-soft text-page"
          aria-hidden
        >
          <SparkleIcon width={24} height={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-ink">{title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ghost" onClick={onPlan}>
          Open plan
        </Button>
        <Button variant="soft" onClick={onLog}>
          {logLabel}
        </Button>
      </div>
    </Card>
  );
}

function ResumeBanner({
  snapshot,
  onResume,
  onDiscard,
}: {
  snapshot: SessionSnapshot;
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <Card className={`!p-5 ${highlightCard.page}`}>
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-page-soft text-page"
          aria-hidden
        >
          <PlayIcon width={24} height={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-page">
            {strings.today.resumeTitle}
          </p>
          <p className="mt-1 text-base leading-relaxed text-ink">
            {strings.today.resumeBody(snapshot.workout.name)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={onResume} leading={<PlayIcon width={18} height={18} />}>
          {strings.today.resume}
        </Button>
        <Button variant="ghost" onClick={onDiscard}>
          {strings.today.discardResume}
        </Button>
      </div>
    </Card>
  );
}

function MissedCard({
  name,
  onDoNow,
  onLite,
  onPickDay,
  onDismiss,
}: {
  name: string;
  onDoNow: () => void;
  onLite: () => void;
  onPickDay: () => void;
  onDismiss: () => void;
}) {
  return (
    <Card className="border-amber/30 bg-amber-soft/30 !p-5">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber/15 text-amber"
          aria-hidden
        >
          <SparkleIcon width={20} height={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            {strings.plan.missed.heading(name)}
          </p>
          <p className="mt-1 text-sm text-muted">{strings.plan.missed.body}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" size="sm" onClick={onDoNow}>
          {strings.plan.missed.doNow}
        </Button>
        <Button variant="soft" size="sm" onClick={onLite}>
          {strings.plan.missed.lite}
        </Button>
        <Button variant="ghost" size="sm" onClick={onPickDay}>
          {strings.plan.missed.pickDay}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          {strings.plan.missed.notNow}
        </Button>
      </div>
    </Card>
  );
}

function RecentLogRow({
  log,
  onOpen,
}: {
  log: LogEntry;
  onOpen: () => void;
}) {
  const accentBar = typeBarClass(log.type);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="card-surface flex overflow-hidden rounded-2xl transition-[box-shadow,transform] group-hover:shadow-pop group-active:scale-[0.99]">
        <div className={`w-1 shrink-0 ${accentBar}`} aria-hidden />
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{log.workoutName}</p>
            <p className="mt-0.5 text-xs text-muted">
              {format(parseISO(log.date), 'EEE, MMM d')} ·{' '}
              {prettyMinutes(Math.max(1, log.totalDurationMin))}
            </p>
          </div>
          <StaticChip className={typeAccentClass(log.type)}>
            {typeLabel[log.type]}
          </StaticChip>
        </div>
      </div>
    </button>
  );
}

function typeBarClass(type: ExerciseType): string {
  switch (type) {
    case 'strength':
      return 'bg-accent';
    case 'cardio':
      return 'bg-tertiary';
    case 'mobility':
      return 'bg-secondary';
    case 'yoga':
      return 'bg-fuchsia';
    case 'warmup':
      return 'bg-amber';
    case 'cooldown':
      return 'bg-tertiary/70';
    default:
      return 'bg-border';
  }
}
