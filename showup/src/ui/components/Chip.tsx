import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export function Chip({
  active = false,
  className = '',
  children,
  type = 'button',
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={`inline-flex h-9 items-center rounded-full px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? 'chip-active-solid text-white shadow-soft'
          : 'border border-border/60 bg-surface/80 text-muted backdrop-blur-sm hover:border-page/35 hover:text-ink'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

interface StaticChipProps {
  children: ReactNode;
  tone?:
    | 'default'
    | 'accent'
    | 'page'
    | 'secondary'
    | 'tertiary'
    | 'amber'
    | 'fuchsia'
    | 'ruby'
    | 'soft';
  className?: string;
}

export function StaticChip({
  children,
  tone = 'default',
  className = '',
}: StaticChipProps) {
  const tones = {
    default: 'border border-border/50 bg-surface-2/90 text-muted',
    page: 'border border-page/30 bg-page-soft text-page',
    accent: 'border border-accent/30 bg-accent-soft text-accent',
    secondary: 'border border-secondary/25 bg-secondary-soft text-secondary',
    tertiary: 'border border-tertiary/25 bg-tertiary-soft text-tertiary',
    amber: 'border border-amber/25 bg-amber-soft text-amber',
    fuchsia: 'border border-fuchsia/25 bg-fuchsia-soft text-fuchsia',
    ruby: 'border border-ruby/25 bg-ruby-soft text-ruby',
    soft: 'bg-surface-2 text-ink',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
