import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { strings } from '@/copy/strings';
import { typeAccentClass, typeLabel } from '@/lib/format';
import { prettyMinutes } from '@/lib/time';
import { duplicateWorkout, listWorkouts } from '@/db/queries/workouts';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { StaticChip } from '@/ui/components/Chip';
import { EmptyState } from '@/ui/components/EmptyState';
import { IconButton } from '@/ui/components/IconButton';
import {
  CopyIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
} from '@/ui/components/Icons';
import { Container } from '@/ui/layout/Container';
import { ScreenHeader } from '@/ui/layout/ScreenHeader';
import { useUIStore } from '@/state/uiStore';
import type { Workout } from '@/types';

export function WorkoutsListScreen() {
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const refresh = async () => setWorkouts(await listWorkouts());

  useEffect(() => {
    void refresh();
  }, []);

  const onDuplicate = async (id: string) => {
    const copy = await duplicateWorkout(id);
    if (copy) {
      showToast('Duplicated', { tone: 'good' });
      await refresh();
    }
  };

  return (
    <>
      <ScreenHeader
        title={strings.workouts.title}
        actions={
          <IconButton
            label={strings.workouts.new}
            tone="page"
            onClick={() => navigate('/workouts/new')}
          >
            <PlusIcon />
          </IconButton>
        }
      />
      <Container>
        {workouts.length === 0 ? (
          <EmptyState
            title={strings.empty.workouts}
            action={
              <Button onClick={() => navigate('/workouts/new')}>
                {strings.workouts.new}
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {workouts.map((w) => (
              <li key={w.id}>
                <Card>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-ink">
                          {w.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <StaticChip className={typeAccentClass(w.type)}>
                            {typeLabel[w.type]}
                          </StaticChip>
                          <StaticChip>
                            {prettyMinutes(w.estimatedDuration || 1)}
                          </StaticChip>
                          <StaticChip>
                            {w.blocks.length} block
                            {w.blocks.length === 1 ? '' : 's'}
                          </StaticChip>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        leading={<PlayIcon width={18} height={18} />}
                        onClick={() => navigate(`/play/${w.id}`)}
                      >
                        {strings.workouts.start}
                      </Button>
                      <Button
                        variant="ghost"
                        leading={<PencilIcon width={18} height={18} />}
                        onClick={() => navigate(`/workouts/${w.id}/edit`)}
                      >
                        {strings.workouts.edit}
                      </Button>
                      <Button
                        variant="ghost"
                        leading={<CopyIcon width={18} height={18} />}
                        onClick={() => void onDuplicate(w.id)}
                      >
                        {strings.workouts.duplicate}
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
