import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

interface LabelProps {
  label: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function Field({ label, hint, children, htmlFor }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function TextInput({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={`h-11 rounded-2xl border border-border bg-surface px-3 text-base text-ink shadow-soft placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    />
  );
}

export function TextArea({
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      className={`min-h-[88px] rounded-2xl border border-border bg-surface px-3 py-2.5 text-base text-ink shadow-soft placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    />
  );
}

interface SelectProps
  extends Omit<InputHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export function Select({ value, onChange, options, className = '', ...rest }: SelectProps) {
  return (
    <select
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-11 rounded-2xl border border-border bg-surface px-3 text-base text-ink shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
