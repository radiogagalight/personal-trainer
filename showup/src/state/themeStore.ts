import { create } from 'zustand';
import type { Theme } from '@/types';

type Resolved = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  resolved: Resolved;
  setTheme: (t: Theme) => void;
  applySystem: () => void;
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(t: Theme): Resolved {
  if (t === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return t;
}

function applyToDocument(resolved: Resolved): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      'content',
      resolved === 'dark' ? '#0C0A18' : '#7C3AED',
    );
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolved: resolve('system'),
  setTheme: (t) => {
    const resolved = resolve(t);
    applyToDocument(resolved);
    set({ theme: t, resolved });
  },
  applySystem: () => {
    const { theme } = get();
    if (theme !== 'system') return;
    const resolved = resolve('system');
    applyToDocument(resolved);
    set({ resolved });
  },
}));

if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => useThemeStore.getState().applySystem());
}
