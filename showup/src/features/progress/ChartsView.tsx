import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO, startOfWeek, addWeeks } from 'date-fns';
import { strings } from '@/copy/strings';
import { typeLabel } from '@/lib/format';
import { listLogs } from '@/db/queries/logs';
import { listExercises } from '@/db/queries/exercises';
import { Chip } from '@/ui/components/Chip';
import { Select } from '@/ui/components/Field';
import { EmptyState } from '@/ui/components/EmptyState';
import { chartStroke } from '@/lib/palette';
import type { Exercise, ExerciseType, LogEntry } from '@/types';

type Range = 'week' | 'month' | 'all';

function withinRange(date: string, range: Range): boolean {
  const d = parseISO(date);
  const now = Date.now();
  const ageMs = now - d.getTime();
  if (range === 'week') return ageMs <= 1000 * 60 * 60 * 24 * 7;
  if (range === 'month') return ageMs <= 1000 * 60 * 60 * 24 * 31;
  return true;
}

export function ChartsView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [range, setRange] = useState<Range>('month');
  const [type, setType] = useState<ExerciseType | 'all'>('all');
  const [exId, setExId] = useState<string>('');

  useEffect(() => {
    void Promise.all([listLogs(), listExercises()]).then(([l, e]) => {
      setLogs(l);
      setExercises(e);
    });
  }, []);

  const filteredLogs = useMemo(
    () =>
      logs
        .filter((l) => withinRange(l.date, range))
        .filter((l) => (type === 'all' ? true : l.type === type)),
    [logs, range, type],
  );

  const consistencyByWeek = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of filteredLogs) {
      const w = format(startOfWeek(parseISO(l.date), { weekStartsOn: 1 }), 'MMM d');
      map.set(w, (map.get(w) ?? 0) + 1);
    }
    // Sort by date by using first weekday key as a tie-break (light approach).
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weeks: { name: string; sessions: number }[] = [];
    for (let i = range === 'week' ? 0 : range === 'month' ? -4 : -12; i <= 0; i++) {
      const k = format(addWeeks(start, i), 'MMM d');
      weeks.push({ name: k, sessions: map.get(k) ?? 0 });
    }
    return weeks;
  }, [filteredLogs, range]);

  const feelOverTime = useMemo(() => {
    return filteredLogs
      .filter((l) => l.feelRating)
      .slice()
      .reverse()
      .map((l) => ({
        date: format(parseISO(l.date), 'MMM d'),
        feel: l.feelRating ?? 0,
      }));
  }, [filteredLogs]);

  const exerciseSeries = useMemo(() => {
    if (!exId) return [];
    const rows: { date: string; weight?: number; reps?: number }[] = [];
    for (const l of filteredLogs.slice().reverse()) {
      const entry = l.loggedExercises.find((e) => e.exerciseId === exId);
      if (!entry) continue;
      const maxWeight = entry.actualWeight?.length
        ? Math.max(...entry.actualWeight)
        : undefined;
      const maxReps = entry.actualReps?.length
        ? Math.max(...entry.actualReps)
        : undefined;
      rows.push({
        date: format(parseISO(l.date), 'MMM d'),
        weight: maxWeight,
        reps: maxReps,
      });
    }
    return rows;
  }, [filteredLogs, exId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Chip active={range === 'week'} onClick={() => setRange('week')}>
          {strings.progress.rangeWeek}
        </Chip>
        <Chip active={range === 'month'} onClick={() => setRange('month')}>
          {strings.progress.rangeMonth}
        </Chip>
        <Chip active={range === 'all'} onClick={() => setRange('all')}>
          {strings.progress.rangeAll}
        </Chip>
      </div>

      <Select
        value={type}
        onChange={(v) => setType(v as ExerciseType | 'all')}
        options={[
          { value: 'all', label: 'All types' },
          { value: 'strength', label: typeLabel.strength },
          { value: 'cardio', label: typeLabel.cardio },
          { value: 'mobility', label: typeLabel.mobility },
          { value: 'yoga', label: typeLabel.yoga },
        ]}
      />

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {strings.progress.sectionConsistency}
        </h3>
        {consistencyByWeek.every((w) => w.sessions === 0) ? (
          <EmptyState title={strings.progress.noData} />
        ) : (
          <div className="h-44 w-full">
            <ResponsiveContainer>
              <BarChart data={consistencyByWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
                <XAxis dataKey="name" tick={{ fill: 'rgb(var(--color-muted))' }} />
                <YAxis allowDecimals={false} tick={{ fill: 'rgb(var(--color-muted))' }} />
                <Tooltip />
                <Bar dataKey="sessions" fill={chartStroke(0)} radius={6}>
                  {consistencyByWeek.map((_, i) => (
                    <Cell key={i} fill={chartStroke(i % 5)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {strings.progress.sectionFeel}
        </h3>
        {feelOverTime.length === 0 ? (
          <EmptyState title={strings.progress.noData} />
        ) : (
          <div className="h-44 w-full">
            <ResponsiveContainer>
              <LineChart data={feelOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
                <XAxis dataKey="date" tick={{ fill: 'rgb(var(--color-muted))' }} />
                <YAxis domain={[1, 5]} tick={{ fill: 'rgb(var(--color-muted))' }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="feel"
                  stroke={chartStroke(4)}
                  strokeWidth={2}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {strings.progress.sectionNumbers}
        </h3>
        <Select
          value={exId}
          onChange={setExId}
          options={[
            { value: '', label: strings.progress.pickExercise },
            ...exercises.map((e) => ({ value: e.id, label: e.name })),
          ]}
        />
        {exId && exerciseSeries.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{strings.progress.noData}</p>
        ) : null}
        {exId && exerciseSeries.length > 0 ? (
          <div className="mt-3 h-44 w-full">
            <ResponsiveContainer>
              <LineChart data={exerciseSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
                <XAxis dataKey="date" tick={{ fill: 'rgb(var(--color-muted))' }} />
                <YAxis tick={{ fill: 'rgb(var(--color-muted))' }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke={chartStroke(0)}
                  strokeWidth={2}
                  dot
                  name="Max weight"
                />
                <Line
                  type="monotone"
                  dataKey="reps"
                  stroke={chartStroke(2)}
                  strokeWidth={2}
                  dot
                  name="Max reps"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </section>
    </div>
  );
}
