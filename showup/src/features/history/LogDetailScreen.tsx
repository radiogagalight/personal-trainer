import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { strings } from '@/copy/strings';
import { typeAccentClass, typeLabel } from '@/lib/format';
import { prettyMinutes } from '@/lib/time';
import { deleteLog, getLog } from '@/db/queries/logs';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { StaticChip } from '@/ui/components/Chip';
import { Confirm } from '@/ui/components/Confirm';
import { IconButton } from '@/ui/components/IconButton';
import { PencilIcon, TrashIcon } from '@/ui/components/Icons';
import { Container } from '@/ui/layout/Container';
import { ScreenHeader } from '@/ui/layout/ScreenHeader';
import { useUIStore } from '@/state/uiStore';
import { toSetArray } from '@/lib/logged';
import type { LogEntry } from '@/types';

export function LogDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);
  const [log, setLog] = useState<LogEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    void getLog(id).then((l) => setLog(l ?? null));
  }, [id]);

  if (!log) {
    return (
      <>
        <ScreenHeader title="Session" back />
        <Container>
          <p className="text-sm text-muted">Loading…</p>
        </Container>
      </>
    );
  }

  const onDelete = async () => {
    await deleteLog(log.id);
    showToast('Removed', { tone: 'default' });
    navigate(-1);
  };

  return (
    <>
      <ScreenHeader
        title={log.workoutName}
        back
        actions={
          <>
            <IconButton
              label={strings.history.edit}
              onClick={() => navigate(`/progress/manual?edit=${log.id}`)}
            >
              <PencilIcon />
            </IconButton>
            <IconButton
              label={strings.history.delete}
              tone="danger"
              onClick={() => setConfirmDelete(true)}
            >
              <TrashIcon />
            </IconButton>
          </>
        }
      />
      <Container>
        <Card className="mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <StaticChip className={typeAccentClass(log.type)}>
              {typeLabel[log.type]}
            </StaticChip>
            <StaticChip>{prettyMinutes(Math.max(1, log.totalDurationMin))}</StaticChip>
            <StaticChip>{format(parseISO(log.date), 'EEE, MMM d')}</StaticChip>
            {log.wasModified && <StaticChip tone="soft">Modified</StaticChip>}
          </div>
          {log.feelNote && (
            <p className="mt-3 text-sm text-muted">
              <span className="font-medium text-ink">{strings.history.feel}: </span>
              {log.feelNote}
            </p>
          )}
        </Card>

        <ul className="flex flex-col gap-2">
          {log.loggedExercises.map((e, i) => (
            <li key={`${e.exerciseId}-${i}`}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {e.exerciseName}
                      {e.substitutedFor && (
                        <span className="ml-2 text-xs font-normal text-muted">
                          · swapped in
                        </span>
                      )}
                    </p>
                    {e.skipped ? (
                      <p className="text-xs text-muted">Skipped</p>
                    ) : (
                      <Stats e={e} />
                    )}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <Button
          className="mt-4"
          fullWidth
          variant="ghost"
          onClick={() => navigate(`/progress/manual?edit=${log.id}`)}
        >
          {strings.history.edit}
        </Button>
      </Container>

      <Confirm
        open={confirmDelete}
        destructive
        title={strings.history.deleteConfirmTitle}
        body={strings.history.deleteConfirmBody}
        confirmLabel="Delete"
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

function Stats({ e }: { e: LogEntry['loggedExercises'][number] }) {
  const parts: string[] = [];
  if (e.actualSets) parts.push(`${e.actualSets} sets`);
  if (e.actualReps?.length) {
    parts.push(`reps ${e.actualReps.join(' · ')}`);
  }
  if (e.actualWeight?.length) {
    parts.push(`weight ${e.actualWeight.join(' · ')}`);
  }
  const durations = toSetArray(e.actualDurationSec);
  if (durations?.length) {
    parts.push(`${durations.map((d) => `${Math.round(d)}s`).join(' · ')}`);
  }
  const distances = toSetArray(e.actualDistance);
  if (distances?.length) {
    parts.push(`${distances.join(' · ')}`);
  }
  if (!parts.length) return null;
  return <p className="mt-0.5 text-xs text-muted">{parts.join(' · ')}</p>;
}
