import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { strings } from '@/copy/strings';
import { typeAccentClass, typeLabel } from '@/lib/format';
import { prettyMinutes, shortMonthYear } from '@/lib/time';
import { listLogs } from '@/db/queries/logs';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Chip, StaticChip } from '@/ui/components/Chip';
import { EmptyState } from '@/ui/components/EmptyState';
import { IconButton } from '@/ui/components/IconButton';
import { ChartIcon, PlusIcon } from '@/ui/components/Icons';
import { Container } from '@/ui/layout/Container';
import { ScreenHeader } from '@/ui/layout/ScreenHeader';
import type { LogEntry } from '@/types';

const FEEL_EMOJI = ['😪', '😅', '🙂', '😊', '⚡'];

export function JournalScreen() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    void listLogs().then(setLogs);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    for (const l of logs) {
      const key = shortMonthYear(parseISO(l.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return map;
  }, [logs]);

  return (
    <>
      <ScreenHeader
        title={strings.history.title}
        actions={
          <>
            <IconButton
              label="Charts"
              onClick={() => navigate('/progress/charts')}
            >
              <ChartIcon />
            </IconButton>
            <IconButton
              label={strings.history.newManual}
              tone="page"
              onClick={() => navigate('/progress/manual')}
            >
              <PlusIcon />
            </IconButton>
          </>
        }
      />
      <Container>
        <div className="mb-3 flex gap-2">
          <Chip active>{strings.history.title}</Chip>
          <Chip
            active={false}
            onClick={() => navigate('/progress/charts')}
          >
            Charts
          </Chip>
        </div>

        {logs.length === 0 ? (
          <EmptyState
            title={strings.empty.history}
            action={
              <Button onClick={() => navigate('/progress/manual')}>
                {strings.history.newManual}
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-5">
            {Array.from(grouped.entries()).map(([month, items]) => (
              <section key={month}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {month}
                </h3>
                <ul className="flex flex-col gap-2">
                  {items.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/progress/log/${l.id}`)}
                        className="w-full text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Card>
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-ink">
                                {l.workoutName}
                              </p>
                              <p className="text-xs text-muted">
                                {format(parseISO(l.date), 'EEE, MMM d · h:mm a')} ·{' '}
                                {prettyMinutes(Math.max(1, l.totalDurationMin))}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {l.feelRating && (
                                <span
                                  aria-label={`Felt ${l.feelRating}/5`}
                                  className="text-xl"
                                >
                                  {FEEL_EMOJI[l.feelRating - 1]}
                                </span>
                              )}
                              <StaticChip className={typeAccentClass(l.type)}>
                                {typeLabel[l.type]}
                              </StaticChip>
                            </div>
                          </div>
                        </Card>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
