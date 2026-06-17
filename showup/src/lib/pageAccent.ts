/** Route → page accent jewel (drives --color-page on the shell). */

export type PageAccentId =
  | 'today'
  | 'plan'
  | 'workouts'
  | 'library'
  | 'progress'
  | 'settings'
  | 'welcome';

export function resolvePageAccent(pathname: string): PageAccentId {
  if (pathname.startsWith('/welcome')) return 'welcome';
  if (pathname.startsWith('/today')) return 'today';
  if (pathname.startsWith('/plan')) return 'plan';
  if (pathname.startsWith('/workouts') || pathname.startsWith('/play')) {
    return 'workouts';
  }
  if (pathname.startsWith('/library')) return 'library';
  if (pathname.startsWith('/progress')) return 'progress';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'today';
}
