import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leading?: ReactNode;
  trailing?: ReactNode;
  fullWidth?: boolean;
}

const base =
  'inline-flex select-none items-center justify-center gap-2 font-medium tracking-tight transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none';

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl',
  md: 'h-11 px-4 text-base rounded-2xl',
  lg: 'h-14 px-6 text-base rounded-2xl',
};

const variants: Record<Variant, string> = {
  primary: 'btn-primary-solid text-white',
  secondary: 'btn-secondary-solid text-white hover:brightness-110',
  soft:
    'border border-page/35 bg-page-soft/65 text-page hover:bg-page-soft',
  ghost:
    'bg-transparent text-ink hover:bg-surface-2 dark:hover:bg-surface-2',
  danger: 'bg-ruby text-white shadow-soft hover:brightness-110',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      leading,
      trailing,
      fullWidth,
      className = '',
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {leading}
      {children}
      {trailing}
    </button>
  ),
);

Button.displayName = 'Button';
