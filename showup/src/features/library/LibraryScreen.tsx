import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { strings } from '@/copy/strings';
import {
  ALL_AREAS,
  ALL_EQUIPMENT,
  ALL_TYPES,
  areaLabel,
  equipmentLabel,
  primaryTargetArea,
  typeAccentClass,
  typeIconWrapClass,
  typeLabel,
  typeRowClass,
} from '@/lib/format';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Chip, StaticChip } from '@/ui/components/Chip';
import { EmptyState } from '@/ui/components/EmptyState';
import { TextInput } from '@/ui/components/Field';
import { IconButton } from '@/ui/components/IconButton';
import { BookIcon, PlusIcon, SettingsIcon } from '@/ui/components/Icons';
import { Container } from '@/ui/layout/Container';
import { ScreenHeader } from '@/ui/layout/ScreenHeader';
import { listExercises } from '@/db/queries/exercises';
import type { BodyArea, Equipment, Exercise, ExerciseType } from '@/types';

export function LibraryScreen() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [types, setTypes] = useState<ExerciseType[]>([]);
  const [areas, setAreas] = useState<BodyArea[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  useEffect(() => {
    void listExercises().then(setExercises);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q)) return false;
      if (types.length && !types.includes(e.type)) return false;
      if (areas.length && !areas.some((a) => e.targetAreas.includes(a))) {
        return false;
      }
      if (
        equipment.length &&
        !equipment.some((q2) => e.equipment.includes(q2))
      ) {
        return false;
      }
      return true;
    });
  }, [exercises, search, types, areas, equipment]);

  const toggle = <T,>(arr: T[], setter: (v: T[]) => void, v: T) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const activeFilterCount =
    types.length + areas.length + equipment.length + (search.trim() ? 1 : 0);

  const anyFilter = activeFilterCount > 0;

  const subtitle =
    exercises.length === 0
      ? undefined
      : filtered.length === exercises.length
        ? `${exercises.length} exercise${exercises.length === 1 ? '' : 's'}`
        : `${filtered.length} of ${exercises.length}`;

  return (
    <>
      <ScreenHeader
        title={strings.library.title}
        subtitle={subtitle}
        actions={
          <>
            <IconButton
              label={strings.settings.title}
              onClick={() => navigate('/settings')}
            >
              <SettingsIcon />
            </IconButton>
            <IconButton
              label={strings.library.new}
              tone="page"
              onClick={() => navigate('/library/new')}
            >
              <PlusIcon />
            </IconButton>
          </>
        }
      />
      <Container>
        <div className="flex flex-col gap-3">
          <TextInput
            type="search"
            inputMode="search"
            placeholder={strings.library.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={strings.library.search}
            className="border-page/30 bg-surface/90 shadow-[0_2px_12px_rgb(var(--color-page)/0.12)] focus-visible:ring-page/50"
          />

          <details
            className={`rounded-2xl border backdrop-blur-sm transition-colors ${
              anyFilter
                ? 'border-page/45 bg-page-soft/50'
                : 'border-border/70 bg-surface/60'
            }`}
          >
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-2">
                <span>{strings.library.filters}</span>
                {anyFilter ? (
                  <StaticChip tone="page" className="tabular-nums">
                    {strings.library.filtersActive(activeFilterCount)}
                  </StaticChip>
                ) : (
                  <span className="text-muted">{strings.library.filterTypes}</span>
                )}
              </span>
            </summary>
            <div className="flex flex-col gap-3 border-t border-border/50 px-4 pb-4 pt-3">
              <FilterGroup label={strings.library.filterTypes}>
                {ALL_TYPES.map((t) => (
                  <TypeFilterChip
                    key={t}
                    type={t}
                    active={types.includes(t)}
                    onClick={() => toggle(types, setTypes, t)}
                  />
                ))}
              </FilterGroup>
              <FilterGroup label={strings.library.filterAreas}>
                {ALL_AREAS.map((a) => (
                  <Chip
                    key={a}
                    active={areas.includes(a)}
                    onClick={() => toggle(areas, setAreas, a)}
                  >
                    {areaLabel[a]}
                  </Chip>
                ))}
              </FilterGroup>
              <FilterGroup label={strings.library.filterEquipment}>
                {ALL_EQUIPMENT.map((e) => (
                  <Chip
                    key={e}
                    active={equipment.includes(e)}
                    onClick={() => toggle(equipment, setEquipment, e)}
                  >
                    {equipmentLabel(e)}
                  </Chip>
                ))}
              </FilterGroup>
              {anyFilter ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTypes([]);
                    setAreas([]);
                    setEquipment([]);
                    setSearch('');
                  }}
                >
                  {strings.library.clearFilters}
                </Button>
              ) : null}
            </div>
          </details>

          {filtered.length === 0 ? (
            <EmptyState
              title={strings.library.empty}
              body={
                anyFilter
                  ? 'Clear filters or add a new exercise to grow your library.'
                  : 'Add your first exercise, or import the starter pack from Settings.'
              }
              icon={<BookIcon width={24} height={24} />}
              action={
                anyFilter ? (
                  <Button
                    variant="soft"
                    onClick={() => {
                      setTypes([]);
                      setAreas([]);
                      setEquipment([]);
                      setSearch('');
                    }}
                  >
                    {strings.library.clearFilters}
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/library/new')}>
                    {strings.library.new}
                  </Button>
                )
              }
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {filtered.map((e) => {
                const primary = primaryTargetArea(e);
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/library/${e.id}`)}
                      className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
                    >
                      <Card className={typeRowClass(e.type)}>
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${typeIconWrapClass(e.type)}`}
                            aria-hidden
                          >
                            {typeLabel[e.type].slice(0, 1)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-ink">
                              {e.name}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              <StaticChip className={typeAccentClass(e.type)}>
                                {typeLabel[e.type]}
                              </StaticChip>
                              {primary && (
                                <StaticChip tone="soft">
                                  {areaLabel[primary]}
                                </StaticChip>
                              )}
                              {e.equipment.slice(0, 2).map((eq) => (
                                <StaticChip key={eq}>
                                  {equipmentLabel(eq)}
                                </StaticChip>
                              ))}
                              {e.isCustom && (
                                <StaticChip tone="page">
                                  {strings.library.custom}
                                </StaticChip>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Container>
    </>
  );
}

function TypeFilterChip({
  type,
  active,
  onClick,
}: {
  type: ExerciseType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-9 items-center rounded-full px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? `${typeAccentClass(type)} shadow-soft`
          : 'border border-border/60 bg-surface/80 text-muted backdrop-blur-sm hover:border-page/35 hover:text-ink'
      }`}
    >
      {typeLabel[type]}
    </button>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
