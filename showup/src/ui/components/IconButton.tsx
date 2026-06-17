import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'page' | 'accent' | 'danger';
}

const tones = {
  default: 'text-ink hover:bg-surface-2',
  page: 'text-page hover:bg-page-soft/50',
  accent: 'text-accent hover:bg-accent-soft/40',
  danger: 'text-ruby hover:bg-ruby-soft/50',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, children, tone = 'default', className = '', type = 'button', ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  ),
);

IconButton.displayName = 'IconButton';
