interface NumberStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  label?: string;
  ariaLabel?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix,
  label,
  ariaLabel,
}: NumberStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-xs uppercase tracking-wide text-muted">
          {label}
        </span>
      )}
      <div className="inline-flex items-stretch overflow-hidden rounded-2xl border border-border bg-surface">
        <button
          type="button"
          aria-label={`Decrease${ariaLabel ? ` ${ariaLabel}` : ''}`}
          className="h-11 w-11 text-lg text-muted hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onChange(clamp(value - step))}
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          aria-label={ariaLabel ?? label ?? 'number'}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(clamp(n));
            else onChange(min);
          }}
          className="w-16 border-x border-border bg-transparent text-center text-lg font-semibold text-ink focus-visible:outline-none"
        />
        <button
          type="button"
          aria-label={`Increase${ariaLabel ? ` ${ariaLabel}` : ''}`}
          className="h-11 w-11 text-lg text-muted hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onChange(clamp(value + step))}
        >
          +
        </button>
        {suffix && (
          <span className="self-center px-3 text-xs uppercase tracking-wide text-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
