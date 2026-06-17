import { useEffect, useState } from 'react';
import { strings } from '@/copy/strings';
import { Card } from '@/ui/components/Card';
import { StaticChip } from '@/ui/components/Chip';
import { listAchievements } from '@/db/queries/achievements';
import { TrophyIcon } from '@/ui/components/Icons';
import { format, parseISO } from 'date-fns';
import type { Achievement } from '@/types';

type BadgeKey = keyof typeof strings.achievements.catalog;

export function AchievementsCard() {
  const [items, setItems] = useState<Achievement[]>([]);
  useEffect(() => {
    void listAchievements().then(setItems);
  }, []);

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {strings.achievements.title}
        </h3>
        <TrophyIcon className="text-fuchsia" />
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted">
          Milestones land here as you go. Show up, and they’ll show up.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((a) => {
            const key = a.badgeKey as BadgeKey;
            const entry = strings.achievements.catalog[key];
            return (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-2xl bg-fuchsia-soft/30 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {entry?.title ?? a.badgeKey}
                  </p>
                  <p className="text-xs text-muted">
                    {entry?.body ?? a.context}
                  </p>
                </div>
                <StaticChip tone="fuchsia">
                  {format(parseISO(a.earnedAt), 'MMM d')}
                </StaticChip>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
