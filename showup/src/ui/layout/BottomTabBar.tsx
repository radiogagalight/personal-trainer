import { NavLink } from 'react-router-dom';
import { strings } from '@/copy/strings';
import {
  BookIcon,
  CalendarIcon,
  ChartIcon,
  DumbbellIcon,
  HomeIcon,
} from '../components/Icons';
import type { ReactNode } from 'react';
import { tabActiveClass, tabActiveWrapClass } from '@/lib/palette';

interface Tab {
  to: string;
  label: string;
  icon: ReactNode;
}

const tabs: Tab[] = [
  { to: '/today', label: strings.tabs.today, icon: <HomeIcon /> },
  { to: '/plan', label: strings.tabs.plan, icon: <CalendarIcon /> },
  { to: '/workouts', label: strings.tabs.workouts, icon: <DumbbellIcon /> },
  { to: '/library', label: strings.tabs.library, icon: <BookIcon /> },
  { to: '/progress', label: strings.tabs.progress, icon: <ChartIcon /> },
];

export function BottomTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-surface/90 backdrop-blur-md safe-bottom"
    >
      <div className="jewel-stripe opacity-90" aria-hidden />
      <ul className="mx-auto grid max-w-xl grid-cols-5 px-1 pt-1">
        {tabs.map((t, i) => (
          <li key={t.to}>
            <NavLink
              to={t.to}
              className={({ isActive }) =>
                `mx-0.5 flex flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? `${tabActiveClass[i]} ${tabActiveWrapClass[i]}`
                    : 'text-muted hover:bg-surface-2/80 hover:text-ink'
                }`
              }
            >
              {t.icon}
              <span>{t.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
