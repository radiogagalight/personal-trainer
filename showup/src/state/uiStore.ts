import { create } from 'zustand';
import { newId } from '@/lib/ids';

export interface Toast {
  id: string;
  message: string;
  tone: 'default' | 'good' | 'warn';
  ttl: number;
}

interface UIState {
  toasts: Toast[];
  showToast: (
    message: string,
    opts?: { tone?: Toast['tone']; ttl?: number },
  ) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  showToast: (message, opts = {}) => {
    const t: Toast = {
      id: newId(),
      message,
      tone: opts.tone ?? 'default',
      ttl: opts.ttl ?? 2800,
    };
    set({ toasts: [...get().toasts, t] });
    setTimeout(() => get().dismissToast(t.id), t.ttl);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
