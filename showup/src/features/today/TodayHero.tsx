import { format } from 'date-fns';
import { MoonIcon, SparkleIcon, SunIcon } from '@/ui/components/Icons';
import { greetingHeroClass, greetingIconWrapClass } from './todayTheme';

interface TodayHeroProps {
  greeting: string;
  tagline: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}

const timeIcon = {
  morning: SunIcon,
  afternoon: SparkleIcon,
  evening: MoonIcon,
} as const;

export function TodayHero({ greeting, tagline, timeOfDay }: TodayHeroProps) {
  const Icon = timeIcon[timeOfDay];
  const now = new Date();

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border p-5 animate-fade-in ${greetingHeroClass[timeOfDay]}`}
    >
      <div className="relative flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${greetingIconWrapClass[timeOfDay]}`}
          aria-hidden
        >
          <Icon width={24} height={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {format(now, 'EEEE · MMM d')}
          </p>
          <h2 className="text-brand mt-1 text-2xl font-semibold tracking-tight">
            {greeting}
          </h2>
          <p className="mt-1 text-base leading-relaxed text-muted">{tagline}</p>
        </div>
      </div>
    </section>
  );
}
