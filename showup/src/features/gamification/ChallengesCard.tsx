import { useEffect, useMemo, useState } from 'react';
import { strings } from '@/copy/strings';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { useSettingsStore } from '@/state/settingsStore';
import { listLogs } from '@/db/queries/logs';
import { weekStart } from '@/lib/time';
import { parseISO } from 'date-fns';
import { challengeProgressClass } from '@/lib/palette';
import type { LogEntry } from '@/types';
import { grantBadge, hasBadge } from '@/db/queries/achievements';

type ChallengeKey = keyof typeof strings.challenges.catalog;

const CHALLENGE_KEYS = Object.keys(strings.challenges.catalog) as ChallengeKey[];

interface ChallengeProgress {
  key: ChallengeKey;
  done: number;
  target: number;
}

function computeProgress(key: ChallengeKey, logs: LogEntry[]): ChallengeProgress {
  const start = weekStart(new Date());
  const thisWeek = logs.filter((l) => parseISO(l.date) >= start);
  const target = strings.challenges.catalog[key].target;
  let done = 0;
  if (key === 'three-sessions-week') done = thisWeek.length;
  if (key === 'one-yoga-week')
    done = thisWeek.filter((l) => l.type === 'yoga').length;
  if (key === 'two-cardio-week')
    done = thisWeek.filter((l) => l.type === 'cardio').length;
  return { key, done: Math.min(done, target), target };
}

export function ChallengesCard() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const dismissed = settings?.dismissedChallenges ?? [];

  useEffect(() => {
    void listLogs().then(setLogs);
  }, []);

  const visible = useMemo(() => {
    const all = CHALLENGE_KEYS.filter((k) => !dismissed.includes(k));
    return all.slice(0, 2);
  }, [dismissed]);

  useEffect(() => {
    (async () => {
      for (const k of visible) {
        const p = computeProgress(k, logs);
        if (p.done >= p.target) {
          if (!(await hasBadge('first-challenge'))) {
            await grantBadge('first-challenge', strings.challenges.catalog[k].title);
          }
        }
      }
    })();
  }, [visible, logs]);

  const onDismiss = (k: ChallengeKey) => {
    void update({ dismissedChallenges: [...dismissed, k] });
  };

  if (visible.length === 0) return null;

  return (
    <Card>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        {strings.challenges.title}
      </h3>
      <ul className="flex flex-col gap-3">
        {visible.map((k, i) => {
          const entry = strings.challenges.catalog[k];
          const p = computeProgress(k, logs);
          const pct = p.target ? Math.round((p.done / p.target) * 100) : 0;
          const colors = challengeProgressClass[i % challengeProgressClass.length];
          return (
            <li
              key={k}
              className={`rounded-2xl px-3 py-2.5 ${colors.row}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{entry.title}</p>
                  <p className="text-xs text-muted">{entry.body}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${colors.badge}`}
                >
                  {strings.challenges.progress(p.done, p.target)}
                </span>
              </div>
              <div
                className={`mt-2 h-1.5 w-full overflow-hidden rounded-full ${colors.track}`}
              >
                <div
                  className={`h-full rounded-full transition-all ${colors.fill}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 text-right">
                <Button variant="ghost" size="sm" onClick={() => onDismiss(k)}>
                  {strings.challenges.dismiss}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
