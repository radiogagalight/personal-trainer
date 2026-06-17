import { create } from 'zustand';
import { getSettings, saveSettings } from '@/db/queries/settings';
import type { Settings } from '@/types';

interface SettingsState {
  loaded: boolean;
  settings: Settings | null;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  loaded: false,
  settings: null,
  load: async () => {
    const s = await getSettings();
    set({ settings: s, loaded: true });
  },
  update: async (patch) => {
    const cur = get().settings;
    if (!cur) {
      const next = await saveSettings(patch);
      set({ settings: next, loaded: true });
      return;
    }
    const optimistic = { ...cur, ...patch } as Settings;
    set({ settings: optimistic });
    const persisted = await saveSettings(patch);
    set({ settings: persisted });
  },
}));
