import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'auto' | 'tall' | 'full';
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  size = 'auto',
}: SheetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const heightClass =
    size === 'full'
      ? 'h-[100dvh] rounded-none'
      : size === 'tall'
        ? 'max-h-[90dvh]'
        : 'max-h-[80dvh]';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full max-w-xl rounded-t-3xl bg-surface shadow-pop animate-sheet-up safe-bottom ${heightClass} flex flex-col overflow-hidden`}
      >
        <div className="flex flex-col gap-1 border-b border-border px-5 pb-3 pt-4">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-border" />
          {title && (
            <h2 className="pt-2 text-lg font-semibold text-ink">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-muted">{description}</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
