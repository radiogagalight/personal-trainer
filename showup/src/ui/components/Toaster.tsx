import { useUIStore } from '@/state/uiStore';

const toneClasses = {
  default:
    'border border-border/60 bg-ink text-white shadow-glow-page',
  good: 'bg-secondary text-white shadow-glow-secondary',
  warn: 'bg-amber text-ink shadow-[0_4px_24px_rgb(var(--color-amber)/0.35)]',
};

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 safe-bottom"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto max-w-sm rounded-2xl px-4 py-2.5 text-sm font-medium shadow-pop animate-slide-up ${toneClasses[t.tone]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
