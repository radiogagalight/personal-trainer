import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  body?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, body, icon, action }: EmptyStateProps) {
  return (
    <div className="empty-state-jewel flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-12 text-center backdrop-blur-sm">
      {icon && (
        <div className="icon-halo flex h-12 w-12 items-center justify-center rounded-2xl">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {body && <p className="max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
