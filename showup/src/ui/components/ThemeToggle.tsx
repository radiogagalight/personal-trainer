import { strings } from '@/copy/strings';
import { useSettingsStore } from '@/state/settingsStore';
import { useThemeStore } from '@/state/themeStore';
import { IconButton } from './IconButton';
import { MoonIcon, SunIcon } from './Icons';

interface ThemeToggleProps {
  /** Lift above the bottom tab bar when tabs are visible. */
  aboveTabBar?: boolean;
}

export function ThemeToggle({ aboveTabBar = false }: ThemeToggleProps) {
  const resolved = useThemeStore((s) => s.resolved);
  const setTheme = useThemeStore((s) => s.setTheme);
  const update = useSettingsStore((s) => s.update);

  const isDark = resolved === 'dark';

  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    void update({ theme: next });
  };

  return (
    <IconButton
      label={isDark ? strings.themeToggle.toLight : strings.themeToggle.toDark}
      onClick={toggle}
      className={`fixed right-4 z-50 border border-border bg-surface/95 shadow-md backdrop-blur safe-x ${
        aboveTabBar
          ? 'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]'
          : 'bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] safe-bottom'
      }`}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  );
}
