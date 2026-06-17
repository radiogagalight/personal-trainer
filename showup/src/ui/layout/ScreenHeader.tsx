import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '../components/Icons';
import { IconButton } from '../components/IconButton';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  actions?: ReactNode;
  large?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  back,
  actions,
  large,
}: ScreenHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-surface/85 backdrop-blur-md safe-top">
      <div className="mx-auto flex max-w-xl items-center gap-2 px-4 py-3">
        {back && (
          <IconButton label="Back" onClick={() => navigate(-1)}>
            <ArrowLeftIcon />
          </IconButton>
        )}
        <div className="min-w-0 flex-1">
          <h1
            className={
              large
                ? 'truncate text-2xl font-semibold text-ink'
                : 'truncate text-lg font-semibold text-ink'
            }
          >
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-sm text-muted">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <div className="jewel-stripe-page" aria-hidden />
    </header>
  );
}
