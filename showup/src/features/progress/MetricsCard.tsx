import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { strings } from '@/copy/strings';
import {
  createMetric,
  deleteMetric,
  listMetrics,
} from '@/db/queries/metrics';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Field, Select, TextInput } from '@/ui/components/Field';
import { IconButton } from '@/ui/components/IconButton';
import { PlusIcon, TrashIcon } from '@/ui/components/Icons';
import { Sheet } from '@/ui/components/Sheet';
import { useSettingsStore } from '@/state/settingsStore';
import { chartStroke } from '@/lib/palette';
import type { BodyMetric } from '@/types';

const todayIso = () => new Date().toISOString();

export function MetricsCard() {
  const [items, setItems] = useState<BodyMetric[]>([]);
  const [open, setOpen] = useState(false);
  const settings = useSettingsStore((s) => s.settings);
  const weightUnit = settings?.weightUnit ?? 'lb';

  const refresh = async () => setItems(await listMetrics());

  useEffect(() => {
    void refresh();
  }, []);

  const weightSeries = useMemo(() => {
    return items
      .filter(
        (m): m is BodyMetric & { value: number } =>
          m.type === 'weight' && typeof m.value === 'number',
      )
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((m) => ({
        date: format(parseISO(m.date), 'MMM d'),
        weight: m.value,
      }));
  }, [items]);

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {strings.progress.sectionMetrics}
          </h3>
          <Button
            variant="soft"
            size="sm"
            leading={<PlusIcon width={16} height={16} />}
            onClick={() => setOpen(true)}
          >
            {strings.progress.addMetric}
          </Button>
        </div>

        {weightSeries.length >= 2 && (
          <div className="mt-3 h-32 w-full">
            <ResponsiveContainer>
              <LineChart data={weightSeries}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgb(var(--color-muted))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: 'rgb(var(--color-muted))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke={chartStroke(1)}
                  strokeWidth={2}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {items.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{strings.progress.noData}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {items.slice(0, 8).map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-2xl bg-surface-2/60 px-3 py-2"
              >
                <div>
                  <p className="text-sm text-ink">
                    <span className="font-medium">
                      {m.label ?? m.type}
                    </span>
                    {m.value !== undefined && (
                      <span className="ml-2 tabular-nums text-muted">
                        {m.value}
                        {m.unit ?? ''}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {format(parseISO(m.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <IconButton
                  label="Remove"
                  tone="danger"
                  onClick={async () => {
                    await deleteMetric(m.id);
                    void refresh();
                  }}
                >
                  <TrashIcon />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AddMetricSheet
        open={open}
        onClose={() => setOpen(false)}
        defaultUnit={weightUnit}
        onAdd={async (m) => {
          await createMetric(m);
          await refresh();
          setOpen(false);
        }}
      />
    </>
  );
}

interface AddMetricSheetProps {
  open: boolean;
  onClose: () => void;
  defaultUnit: string;
  onAdd: (m: Omit<BodyMetric, 'id'>) => void | Promise<void>;
}

function AddMetricSheet({ open, onClose, defaultUnit, onAdd }: AddMetricSheetProps) {
  const [type, setType] = useState<BodyMetric['type']>('weight');
  const [label, setLabel] = useState('Weight');
  const [value, setValue] = useState<string>('');
  const [unit, setUnit] = useState<string>(defaultUnit);
  const [note, setNote] = useState('');

  return (
    <Sheet open={open} onClose={onClose} title="Add measurement">
      <div className="flex flex-col gap-3">
        <Field label="Type">
          <Select
            value={type}
            onChange={(v) => {
              const t = v as BodyMetric['type'];
              setType(t);
              if (t === 'weight') setLabel('Weight');
              if (t === 'measurement') setLabel('');
              if (t === 'note') setLabel('Note');
            }}
            options={[
              { value: 'weight', label: 'Bodyweight' },
              { value: 'measurement', label: 'Measurement' },
              { value: 'note', label: 'Note' },
            ]}
          />
        </Field>
        {type === 'measurement' && (
          <Field label="Label">
            <TextInput
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. waist"
            />
          </Field>
        )}
        {type !== 'note' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Value">
              <TextInput
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </Field>
            <Field label="Unit">
              <TextInput
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="lb / cm / etc"
              />
            </Field>
          </div>
        )}
        <Field label="Note">
          <TextInput
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
          />
        </Field>
        <Button
          onClick={() =>
            void onAdd({
              date: todayIso(),
              type,
              label: label || undefined,
              value: value === '' ? undefined : Number(value),
              unit: type === 'note' ? undefined : unit,
              note: note || undefined,
            })
          }
          fullWidth
        >
          Save
        </Button>
      </div>
    </Sheet>
  );
}
