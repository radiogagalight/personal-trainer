import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ensureDbOpen } from './db/client';
import { ensureSeed } from './db/seed/loadSeed';
import { useSettingsStore } from './state/settingsStore';
import { useThemeStore } from './state/themeStore';
import { rescheduleReminders } from './lib/reminders';
import { AppShell } from './ui/layout/AppShell';
import { Spinner } from './ui/components/Spinner';
import { ThemeToggle } from './ui/components/ThemeToggle';
import { OnboardingFlow } from './features/onboarding/OnboardingFlow';
import { TodayScreen } from './features/today/TodayScreen';
import { PlanScreen } from './features/plan/PlanScreen';
import { WorkoutsListScreen } from './features/workouts/WorkoutsListScreen';
import { WorkoutBuilderScreen } from './features/workouts/WorkoutBuilderScreen';
import { LibraryScreen } from './features/library/LibraryScreen';
import { ExerciseEditorScreen } from './features/library/ExerciseEditorScreen';
import { LivePlayerScreen } from './features/player/LivePlayerScreen';
import { JournalScreen } from './features/history/JournalScreen';
import { ManualLogScreen } from './features/history/ManualLogScreen';
import { LogDetailScreen } from './features/history/LogDetailScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { ProgressScreen } from './features/progress/ProgressScreen';

export function App() {
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadSettings = useSettingsStore((s) => s.load);
  const settings = useSettingsStore((s) => s.settings);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await ensureDbOpen();
        await ensureSeed();
        await loadSettings();
        if (mounted) setBooting(false);
      } catch (e) {
        console.error('Boot failed', e);
        if (mounted) {
          setError(e instanceof Error ? e.message : String(e));
          setBooting(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadSettings]);

  useEffect(() => {
    if (settings) setTheme(settings.theme);
  }, [settings, setTheme]);

  useEffect(() => {
    rescheduleReminders(settings);
  }, [
    settings?.remindersEnabled,
    settings?.reminderTime,
    settings,
  ]);

  if (booting) {
    return (
      <div className="app-canvas relative flex min-h-[100dvh] items-center justify-center">
        <ThemeToggle />
        <Spinner size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-canvas relative flex min-h-[100dvh] items-center justify-center px-6">
        <ThemeToggle />
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-xl font-semibold text-ink">
            Local storage isn’t available
          </h1>
          <p className="text-sm text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
  <>
    <HashRouter>
      <Routes>
        {settings && !settings.firstRunComplete ? (
          <>
            <Route
              path="/welcome"
              element={
                <>
                  <ThemeToggle />
                  <OnboardingFlow />
                </>
              }
            />
            <Route path="*" element={<Navigate to="/welcome" replace />} />
          </>
        ) : (
          <>
            <Route
              path="/today"
              element={
                <AppShell>
                  <TodayScreen />
                </AppShell>
              }
            />
            <Route
              path="/plan"
              element={
                <AppShell>
                  <PlanScreen />
                </AppShell>
              }
            />
            <Route
              path="/workouts"
              element={
                <AppShell>
                  <WorkoutsListScreen />
                </AppShell>
              }
            />
            <Route
              path="/workouts/new"
              element={
                <AppShell hideTabs>
                  <WorkoutBuilderScreen mode="new" />
                </AppShell>
              }
            />
            <Route
              path="/workouts/:id/edit"
              element={
                <AppShell hideTabs>
                  <WorkoutBuilderScreen mode="edit" />
                </AppShell>
              }
            />
            <Route
              path="/library"
              element={
                <AppShell>
                  <LibraryScreen />
                </AppShell>
              }
            />
            <Route
              path="/library/new"
              element={
                <AppShell hideTabs>
                  <ExerciseEditorScreen mode="new" />
                </AppShell>
              }
            />
            <Route
              path="/library/:id"
              element={
                <AppShell hideTabs>
                  <ExerciseEditorScreen mode="edit" />
                </AppShell>
              }
            />
            <Route
              path="/play/:workoutId"
              element={
                <AppShell hideTabs>
                  <LivePlayerScreen />
                </AppShell>
              }
            />
            <Route
              path="/progress"
              element={
                <AppShell>
                  <JournalScreen />
                </AppShell>
              }
            />
            <Route
              path="/progress/charts"
              element={
                <AppShell>
                  <ProgressScreen />
                </AppShell>
              }
            />
            <Route
              path="/progress/log/:id"
              element={
                <AppShell hideTabs>
                  <LogDetailScreen />
                </AppShell>
              }
            />
            <Route
              path="/progress/manual"
              element={
                <AppShell hideTabs>
                  <ManualLogScreen />
                </AppShell>
              }
            />
            <Route
              path="/settings"
              element={
                <AppShell hideTabs>
                  <SettingsScreen />
                </AppShell>
              }
            />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </>
        )}
      </Routes>
    </HashRouter>
  </>
  );
}
