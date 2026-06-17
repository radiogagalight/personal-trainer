import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { CheckIcon } from '@/ui/components/Icons';

import { weekDayCellClass, weekDayLabelClass, type WeekDayStatus } from '@/lib/palette';

export type { WeekDayStatus };

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface WeekStripProps {
  dates: Date[];
  todayIndex: number;
  statuses: WeekDayStatus[];
}

export function WeekStrip({ dates, todayIndex, statuses }: WeekStripProps) {
  return (
    <div
      className="flex gap-1"
      role="list"
      aria-label="This week at a glance"
    >
      {dates.map((date, idx) => {
        const status = statuses[idx] ?? 'rest';
        const isToday = idx === todayIndex;
        const dayNum = format(date, 'd');

        let dot: ReactNode = (
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-border" aria-hidden />
        );
        if (status === 'planned') {
          dot = (
            <span
              className="mt-1.5 h-1.5 w-1.5 rounded-full bg-page"
              aria-hidden
            />
          );
        } else if (status === 'done') {
          dot = (
            <span
              className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-white"
              aria-hidden
            >
              <CheckIcon width={10} height={10} strokeWidth={2.5} />
            </span>
          );
        } else if (status === 'missed') {
          dot = (
            <span
              className="mt-1.5 h-1.5 w-1.5 rounded-full bg-ruby/70"
              aria-hidden
            />
          );
        }

        return (
          <div
            key={idx}
            role="listitem"
            className={`flex min-w-0 flex-1 flex-col items-center rounded-2xl py-2 transition-colors ${weekDayCellClass(status, isToday)}`}
            aria-current={isToday ? 'date' : undefined}
          >
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide ${weekDayLabelClass(idx, isToday)}`}
            >
              {DAY_LABELS[idx]}
            </span>
            <span
              className={`mt-0.5 text-sm font-semibold tabular-nums ${
                isToday ? 'text-ink' : 'text-ink/90'
              }`}
            >
              {dayNum}
            </span>
            {dot}
          </div>
        );
      })}
    </div>
  );
}
