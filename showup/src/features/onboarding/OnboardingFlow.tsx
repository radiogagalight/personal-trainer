import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { strings } from '@/copy/strings';
import { useSettingsStore } from '@/state/settingsStore';
import { useThemeStore } from '@/state/themeStore';
import { Button } from '@/ui/components/Button';
import { Chip } from '@/ui/components/Chip';
import { Card } from '@/ui/components/Card';
import { Field, Select } from '@/ui/components/Field';
import { ALL_EQUIPMENT, equipmentLabel } from '@/lib/format';
import type {
  DistanceUnit,
  Equipment,
  Theme,
  WeightUnit,
} from '@/types';
import { stepBarClass } from '@/lib/palette';
import { SparkleIcon } from '@/ui/components/Icons';

export function OnboardingFlow() {
  const navigate = useNavigate();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);
  const setTheme = useThemeStore((s) => s.setTheme);

  const [step, setStep] = useState(0);
  const [equipment, setEquipment] = useState<Equipment[]>(
    settings?.ownedEquipment ?? ['none', 'dumbbells', 'mat'],
  );
  const [weight, setWeight] = useState<WeightUnit>(settings?.weightUnit ?? 'lb');
  const [distance, setDistance] = useState<DistanceUnit>(
    settings?.distanceUnit ?? 'mi',
  );
  const [theme, setLocalTheme] = useState<Theme>(settings?.theme ?? 'system');
  const [reminders, setReminders] = useState<boolean>(false);

  const toggleEquipment = (e: Equipment) =>
    setEquipment((cur) =>
      cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e],
    );

  const finish = async () => {
    await updateSettings({
      ownedEquipment: equipment,
      weightUnit: weight,
      distanceUnit: distance,
      theme,
      remindersEnabled: reminders,
      firstRunComplete: true,
    });
    setTheme(theme);
    navigate('/today', { replace: true });
  };

  const titles = [
    strings.onboarding.step1Title,
    strings.onboarding.step2Title,
    strings.onboarding.step3Title,
    strings.onboarding.step4Title,
  ];
  const bodies = [
    strings.onboarding.step1Body,
    strings.onboarding.step2Body,
    strings.onboarding.step3Body,
    strings.onboarding.step4Body,
  ];

  return (
    <div
      className="app-canvas relative flex min-h-[100dvh] flex-col safe-top safe-bottom"
      data-page-accent="welcome"
    >
      <div className="page-ambient" aria-hidden />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
        <div className="flex items-center gap-2">
          <span className="icon-halo flex h-9 w-9 items-center justify-center rounded-xl">
            <SparkleIcon />
          </span>
          <span className="text-brand text-sm font-semibold uppercase tracking-wider">
            {strings.app.name}
          </span>
        </div>

        <div className="flex gap-1.5" aria-label="Step progress">
          {titles.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? stepBarClass[i] : 'bg-surface-2'
              }`}
            />
          ))}
        </div>

        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {titles[step]}
          </h1>
          <p className="mt-1 text-base text-muted">{bodies[step]}</p>
        </header>

        <Card className="flex-1">
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted">{strings.app.tagline}</p>
              <ul className="space-y-2 text-sm text-ink">
                <li>· {strings.tabs.library} — 50+ starter exercises you can edit.</li>
                <li>· {strings.tabs.workouts} — build sessions your way.</li>
                <li>· {strings.tabs.plan} — sketch a week. Adjust freely.</li>
                <li>· {strings.tabs.today} — your warm starting point.</li>
              </ul>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-wrap gap-2">
              {ALL_EQUIPMENT.map((e) => (
                <Chip
                  key={e}
                  active={equipment.includes(e)}
                  onClick={() => toggleEquipment(e)}
                >
                  {equipmentLabel[e]}
                </Chip>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <Field label={strings.settings.weightUnit}>
                <Select
                  value={weight}
                  onChange={(v) => setWeight(v as WeightUnit)}
                  options={[
                    { value: 'lb', label: 'Pounds (lb)' },
                    { value: 'kg', label: 'Kilograms (kg)' },
                  ]}
                />
              </Field>
              <Field label={strings.settings.distanceUnit}>
                <Select
                  value={distance}
                  onChange={(v) => setDistance(v as DistanceUnit)}
                  options={[
                    { value: 'mi', label: 'Miles (mi)' },
                    { value: 'km', label: 'Kilometres (km)' },
                  ]}
                />
              </Field>
              <Field label={strings.settings.theme}>
                <div className="flex gap-2">
                  {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                    <Chip
                      key={t}
                      active={theme === t}
                      onClick={() => {
                        setLocalTheme(t);
                        setTheme(t);
                      }}
                    >
                      {strings.settings.themeOptions[t]}
                    </Chip>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted">
                {strings.settings.remindersHelp}
              </p>
              <div className="flex gap-2">
                <Chip active={!reminders} onClick={() => setReminders(false)}>
                  Not yet
                </Chip>
                <Chip active={reminders} onClick={() => setReminders(true)}>
                  Sure, sounds good
                </Chip>
              </div>
            </div>
          )}
        </Card>

        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              {strings.onboarding.back}
            </Button>
          )}
          {step < titles.length - 1 ? (
            <Button fullWidth onClick={() => setStep((s) => s + 1)}>
              {strings.onboarding.next}
            </Button>
          ) : (
            <Button fullWidth onClick={finish}>
              {strings.onboarding.finish}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
