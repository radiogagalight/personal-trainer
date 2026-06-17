import { useRef, useState } from 'react';
import { strings } from '@/copy/strings';
import {
  ALL_EQUIPMENT,
  equipmentLabel,
  isBuiltInEquipment,
} from '@/lib/format';
import { useSettingsStore } from '@/state/settingsStore';
import { useThemeStore } from '@/state/themeStore';
import { useUIStore } from '@/state/uiStore';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Chip } from '@/ui/components/Chip';
import { Confirm } from '@/ui/components/Confirm';
import { Field, Select, TextInput } from '@/ui/components/Field';
import { NumberStepper } from '@/ui/components/NumberStepper';
import { Container } from '@/ui/layout/Container';
import { ScreenHeader } from '@/ui/layout/ScreenHeader';
import {
  downloadExport,
  fullReset,
  importBundleFromText,
} from '@/lib/storage';
import {
  getReminderPermission,
  requestReminderPermission,
  rescheduleReminders,
} from '@/lib/reminders';
import type {
  DistanceUnit,
  Equipment,
  Theme,
  WeightUnit,
} from '@/types';

export function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const setTheme = useThemeStore((s) => s.setTheme);
  const showToast = useUIStore((s) => s.showToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importing, setImporting] = useState(false);
  const [newEquipment, setNewEquipment] = useState('');

  if (!settings) {
    return (
      <>
        <ScreenHeader title={strings.settings.title} back />
        <Container>
          <p className="text-sm text-muted">Loading…</p>
        </Container>
      </>
    );
  }

  const toggleEq = (e: Equipment) => {
    const next = settings.ownedEquipment.includes(e)
      ? settings.ownedEquipment.filter((x) => x !== e)
      : [...settings.ownedEquipment, e];
    void update({ ownedEquipment: next });
  };

  // Custom equipment the user has added (anything that isn't a built-in kind).
  const customEquipment = settings.ownedEquipment.filter(
    (e) => !isBuiltInEquipment(e),
  );

  const addCustomEquipment = () => {
    const name = newEquipment.trim();
    if (!name) return;
    const norm = name.toLowerCase();
    // Typing the name of a built-in kind just enables that built-in chip.
    const builtin = ALL_EQUIPMENT.find(
      (e) => e === norm || equipmentLabel(e).toLowerCase() === norm,
    );
    if (builtin) {
      if (!settings.ownedEquipment.includes(builtin)) {
        void update({ ownedEquipment: [...settings.ownedEquipment, builtin] });
      }
      setNewEquipment('');
      return;
    }
    if (settings.ownedEquipment.some((e) => e.toLowerCase() === norm)) {
      showToast(strings.settings.equipmentExists, { tone: 'warn' });
      return;
    }
    void update({ ownedEquipment: [...settings.ownedEquipment, name] });
    showToast(strings.settings.equipmentAdded(name), { tone: 'good' });
    setNewEquipment('');
  };

  const onExport = async () => {
    try {
      const name = await downloadExport();
      showToast(`Saved ${name}`, { tone: 'good' });
    } catch (e) {
      console.error(e);
      showToast(strings.errors.unknown, { tone: 'warn' });
    }
  };

  const onImportPicked = async (file: File) => {
    const text = await file.text();
    setPendingImport(text);
  };

  const onImportConfirm = async () => {
    if (!pendingImport) return;
    setImporting(true);
    const result = await importBundleFromText(pendingImport);
    setImporting(false);
    setPendingImport(null);
    if (!result.ok) {
      showToast(strings.settings.importBadFile, { tone: 'warn' });
    } else {
      showToast(strings.settings.importDone, { tone: 'good' });
      setTimeout(() => window.location.reload(), 400);
    }
  };

  const onReset = async () => {
    await fullReset();
    showToast('Reset complete', { tone: 'good' });
    setConfirmReset(false);
    setTimeout(() => window.location.reload(), 400);
  };

  return (
    <>
      <ScreenHeader title={strings.settings.title} back />
      <Container>
        <div className="flex flex-col gap-4">
          <Card>
            <Field label={strings.settings.equipment} hint={strings.settings.equipmentHelp}>
              <div className="flex flex-wrap gap-1.5">
                {ALL_EQUIPMENT.map((e) => (
                  <Chip
                    key={e}
                    active={settings.ownedEquipment.includes(e)}
                    onClick={() => toggleEq(e)}
                  >
                    {equipmentLabel(e)}
                  </Chip>
                ))}
                {customEquipment.map((e) => (
                  <Chip
                    key={e}
                    active
                    onClick={() => toggleEq(e)}
                    aria-label={strings.settings.removeEquipmentLabel(
                      equipmentLabel(e),
                    )}
                    title={strings.settings.removeEquipmentLabel(
                      equipmentLabel(e),
                    )}
                  >
                    {equipmentLabel(e)}
                    <span aria-hidden className="ml-1.5 text-white/80">
                      ×
                    </span>
                  </Chip>
                ))}
              </div>
            </Field>
            <div className="mt-3 flex gap-2">
              <TextInput
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomEquipment();
                  }
                }}
                placeholder={strings.settings.addEquipmentPlaceholder}
                aria-label={strings.settings.addEquipmentPlaceholder}
                className="flex-1"
              />
              <Button
                variant="ghost"
                onClick={addCustomEquipment}
                disabled={!newEquipment.trim()}
              >
                {strings.settings.addEquipment}
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-4">
              <NumberStepper
                label={strings.settings.defaultRest}
                value={settings.defaultRestSeconds}
                onChange={(v) => void update({ defaultRestSeconds: v })}
                min={0}
                max={600}
                step={5}
                suffix="sec"
              />

              <Field label={strings.settings.weightUnit}>
                <Select
                  value={settings.weightUnit}
                  onChange={(v) => void update({ weightUnit: v as WeightUnit })}
                  options={[
                    { value: 'lb', label: 'Pounds (lb)' },
                    { value: 'kg', label: 'Kilograms (kg)' },
                  ]}
                />
              </Field>

              <Field label={strings.settings.distanceUnit}>
                <Select
                  value={settings.distanceUnit}
                  onChange={(v) =>
                    void update({ distanceUnit: v as DistanceUnit })
                  }
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
                      active={settings.theme === t}
                      onClick={() => {
                        void update({ theme: t });
                        setTheme(t);
                      }}
                    >
                      {strings.settings.themeOptions[t]}
                    </Chip>
                  ))}
                </div>
              </Field>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-3">
              <Field label={strings.settings.reminders} hint={strings.settings.remindersHelp}>
                <div className="flex gap-2">
                  <Chip
                    active={!settings.remindersEnabled}
                    onClick={async () => {
                      await update({ remindersEnabled: false });
                      rescheduleReminders({
                        ...settings,
                        remindersEnabled: false,
                      });
                    }}
                  >
                    {strings.reminders.off}
                  </Chip>
                  <Chip
                    active={settings.remindersEnabled}
                    onClick={async () => {
                      const perm = await requestReminderPermission();
                      if (perm !== 'granted') {
                        showToast(strings.reminders.denied, { tone: 'warn' });
                        return;
                      }
                      await update({ remindersEnabled: true });
                      rescheduleReminders({
                        ...settings,
                        remindersEnabled: true,
                      });
                    }}
                  >
                    {strings.reminders.on}
                  </Chip>
                </div>
              </Field>
              {settings.remindersEnabled && (
                <Field label={strings.settings.reminderTime}>
                  <TextInput
                    type="time"
                    value={settings.reminderTime ?? '18:00'}
                    onChange={async (e) => {
                      const time = e.target.value;
                      await update({ reminderTime: time });
                      rescheduleReminders({ ...settings, reminderTime: time });
                    }}
                  />
                </Field>
              )}
              {getReminderPermission() === 'unsupported' && (
                <p className="text-xs text-muted">
                  {strings.reminders.unsupported}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <Field label={strings.settings.plateau} hint={strings.settings.plateauHelp}>
              <NumberStepper
                value={settings.plateauThreshold}
                onChange={(v) => void update({ plateauThreshold: v })}
                min={1}
                max={10}
              />
            </Field>
          </Card>

          <Card>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
              {strings.settings.dataTitle}
            </h2>
            <div className="flex flex-col gap-2">
              <Button onClick={() => void onExport()}>
                {strings.settings.export}
              </Button>
              <p className="text-xs text-muted">{strings.settings.exportHelp}</p>

              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onImportPicked(file);
                  e.target.value = '';
                }}
              />
              <Button
                variant="ghost"
                onClick={() => fileRef.current?.click()}
                disabled={importing}
              >
                {importing ? strings.settings.importing : strings.settings.import}
              </Button>
              <p className="text-xs text-muted">{strings.settings.importHelp}</p>

              <Button
                variant="danger"
                onClick={() => setConfirmReset(true)}
                className="mt-2"
              >
                {strings.settings.reset}
              </Button>
              <p className="text-xs text-muted">{strings.settings.resetHelp}</p>
            </div>
          </Card>

          <Card>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
              {strings.settings.aboutTitle}
            </h2>
            <p className="text-sm text-muted">{strings.settings.aboutBody}</p>
            <p className="mt-2 text-xs text-muted">v0.1.0</p>
          </Card>
        </div>
      </Container>

      <Confirm
        open={pendingImport !== null}
        destructive
        title={strings.settings.importConfirmTitle}
        body={strings.settings.importConfirmBody}
        confirmLabel="Replace"
        onConfirm={() => void onImportConfirm()}
        onCancel={() => setPendingImport(null)}
      />

      <Confirm
        open={confirmReset}
        destructive
        title={strings.settings.resetConfirmTitle}
        body={strings.settings.resetConfirmBody}
        confirmLabel={strings.settings.resetGo}
        onConfirm={() => void onReset()}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  );
}
