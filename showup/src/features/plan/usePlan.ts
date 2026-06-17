import { useEffect, useState } from 'react';
import { currentWeekAnchor, getPlan, updatePlan } from '@/db/queries/plans';
import { useSettingsStore } from '@/state/settingsStore';
import type { Plan } from '@/types';

export function useActivePlan(): {
  plan: Plan | null;
  reload: () => Promise<void>;
  saveWeeks: (weeks: Plan['weeks']) => Promise<void>;
} {
  const activePlanId = useSettingsStore((s) => s.settings?.activePlanId ?? null);
  const [plan, setPlan] = useState<Plan | null>(null);

  const reload = async () => {
    if (!activePlanId) {
      setPlan(null);
      return;
    }
    const p = await getPlan(activePlanId);
    if (p && !p.startDate) {
      // Legacy plan: anchor it to this week so it rolls forward from now on.
      const anchored = await updatePlan(p.id, { startDate: currentWeekAnchor() });
      setPlan(anchored ?? p);
      return;
    }
    setPlan(p ?? null);
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlanId]);

  const saveWeeks = async (weeks: Plan['weeks']) => {
    if (!plan) return;
    const next = await updatePlan(plan.id, { weeks });
    if (next) setPlan(next);
  };

  return { plan, reload, saveWeeks };
}
