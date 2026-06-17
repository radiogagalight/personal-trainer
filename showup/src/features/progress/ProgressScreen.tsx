import { useNavigate } from 'react-router-dom';
import { strings } from '@/copy/strings';
import { Card } from '@/ui/components/Card';
import { Chip } from '@/ui/components/Chip';
import { Container } from '@/ui/layout/Container';
import { ScreenHeader } from '@/ui/layout/ScreenHeader';
import { ChartsView } from './ChartsView';
import { MetricsCard } from './MetricsCard';
import { AchievementsCard } from '../gamification/AchievementsCard';
import { ChallengesCard } from '../gamification/ChallengesCard';

export function ProgressScreen() {
  const navigate = useNavigate();
  return (
    <>
      <ScreenHeader title={strings.progress.title} />
      <Container>
        <div className="mb-3 flex gap-2">
          <Chip active={false} onClick={() => navigate('/progress')}>
            {strings.history.journalTab}
          </Chip>
          <Chip active>{strings.history.chartsTab}</Chip>
        </div>

        <div className="flex flex-col gap-4">
          <ChallengesCard />
          <AchievementsCard />
          <Card>
            <ChartsView />
          </Card>
          <MetricsCard />
        </div>
      </Container>
    </>
  );
}
