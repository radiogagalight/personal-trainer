import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { strings } from '@/copy/strings';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Container } from '@/ui/layout/Container';
import { Field, TextArea } from '@/ui/components/Field';
import { prettyMinutes } from '@/lib/time';
import { feelSelectedClass, highlightCard, highlightLabel } from '@/lib/palette';
import type { FeelRating, LogEntry } from '@/types';
import { updateLog } from '@/db/queries/logs';

interface SummaryScreenProps {
  log: LogEntry;
  newAchievements?: string[]; // titles of any granted badges
  prCount?: number;
}

export function SummaryScreen({ log, newAchievements = [], prCount = 0 }: SummaryScreenProps) {
  const navigate = useNavigate();
  const [feel, setFeel] = useState<FeelRating | undefined>(log.feelRating);
  const [note, setNote] = useState<string>(log.feelNote ?? '');

  const onSave = async () => {
    await updateLog(log.id, { feelRating: feel, feelNote: note || undefined });
    navigate('/today', { replace: true });
  };

  const exercisesDone = log.loggedExercises.filter((e) => !e.skipped).length;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg safe-top safe-bottom">
      <Container className="flex-1">
        <div className="mb-2 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-page">
            {strings.player.summaryTitle}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            {log.workoutName}
          </h1>
          <p className="mt-1 text-base text-muted">{strings.player.summaryBody}</p>
        </div>

        <Card className="my-4 !p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                {strings.player.summaryDuration}
              </p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {prettyMinutes(Math.max(1, log.totalDurationMin))}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                {strings.player.summaryExercises}
              </p>
              <p className="mt-1 text-2xl font-semibold text-ink">{exercisesDone}</p>
            </div>
          </div>
        </Card>

        {newAchievements.length > 0 && (
          <Card className={`mb-4 ${highlightCard.fuchsia}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${highlightLabel.fuchsia}`}>
              New milestone{newAchievements.length === 1 ? '' : 's'}
            </p>
            <ul className="mt-1 list-inside list-disc text-sm text-ink">
              {newAchievements.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Card>
        )}

        {prCount > 0 && (
          <Card className={`mb-4 ${highlightCard.tertiary}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${highlightLabel.tertiary}`}>
              Personal record{prCount === 1 ? '' : 's'}
            </p>
            <p className="mt-1 text-sm text-ink">
              You beat a previous best on {prCount} exercise{prCount === 1 ? '' : 's'}. Quietly excellent.
            </p>
          </Card>
        )}

        <Card className="!p-5">
          <p className="text-sm font-semibold text-ink">{strings.player.feelPrompt}</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {([1, 2, 3, 4, 5] as FeelRating[]).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setFeel(n)}
                className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  feel === n
                    ? feelSelectedClass[n - 1]
                    : 'border-border bg-surface text-muted hover:text-ink'
                }`}
              >
                <span className="text-xl">{['😪', '😅', '🙂', '😊', '⚡'][n - 1]}</span>
                {strings.player.feelLabels[n - 1]}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Field label={strings.player.feelNote}>
              <TextArea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Energy, soreness, mood — anything."
              />
            </Field>
          </div>
        </Card>
      </Container>

      <div className="sticky bottom-0 border-t border-border bg-bg/95 px-4 py-3 safe-bottom backdrop-blur">
        <Button size="lg" fullWidth onClick={() => void onSave()}>
          {strings.player.saveAndClose}
        </Button>
      </div>
    </div>
  );
}
