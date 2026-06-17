import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { resolvePageAccent } from '@/lib/pageAccent';
import { ThemeToggle } from '../components/ThemeToggle';
import { BottomTabBar } from './BottomTabBar';
import { Toaster } from '../components/Toaster';

interface AppShellProps {
  children: ReactNode;
  hideTabs?: boolean;
}

export function AppShell({ children, hideTabs = false }: AppShellProps) {
  const { pathname } = useLocation();
  const pageAccent = resolvePageAccent(pathname);

  return (
    <div
      className="app-canvas relative flex min-h-[100dvh] flex-col"
      data-page-accent={pageAccent}
    >
      <div className="page-ambient" aria-hidden />
      <main className={`relative z-10 flex-1 ${hideTabs ? '' : 'pb-24'}`}>
        {children}
      </main>
      <ThemeToggle aboveTabBar={!hideTabs} />
      {!hideTabs && <BottomTabBar />}
      <Toaster />
    </div>
  );
}
