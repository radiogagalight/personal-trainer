/**
 * Local reminder scheduling using the in-page Notifications API + a
 * setTimeout-based scheduler. PWAs cannot reliably wake themselves from
 * a fully-closed state without push, so this provides best-effort daily
 * reminders while the page (or installed PWA) is open or has been
 * launched recently. We surface a graceful-fallback note when the
 * permission is denied or the API is unavailable.
 */

import type { Settings } from '@/types';

const SCHEDULE_KEY = 'showup:reminder-next';

let timer: number | null = null;

function nextDailyOccurrence(time: string): Date | null {
  const [hh, mm] = time.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

function clearScheduled() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

async function showNotification(title: string, body: string) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/icons/icon.svg',
        badge: '/icons/icon.svg',
        tag: 'showup-reminder',
        requireInteraction: false,
      });
      return;
    }
  } catch {
    /* fall through */
  }
  new Notification(title, { body, icon: '/icons/icon.svg' });
}

/**
 * Best-effort upgrade for the app-fully-closed case: register a Periodic
 * Background Sync where the platform supports it (installed PWA on Chrome /
 * Android). The browser decides the actual cadence; this is never guaranteed,
 * so the in-page scheduler and the Today screen remain the reliable paths.
 */
async function enablePeriodicReminder() {
  try {
    if (!('serviceWorker' in navigator)) return;
    const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration & {
      periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
    };
    if (!reg.periodicSync) return;
    let status: PermissionStatus | undefined;
    try {
      status = await navigator.permissions?.query({
        name: 'periodic-background-sync' as PermissionName,
      });
    } catch {
      status = undefined;
    }
    if (status && status.state !== 'granted') return;
    await reg.periodicSync.register('showup-daily-reminder', {
      minInterval: 24 * 60 * 60 * 1000,
    });
  } catch {
    /* best-effort — silently no-op where unsupported */
  }
}

async function disablePeriodicReminder() {
  try {
    if (!('serviceWorker' in navigator)) return;
    const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration & {
      periodicSync?: { unregister: (tag: string) => Promise<void> };
    };
    await reg.periodicSync?.unregister('showup-daily-reminder');
  } catch {
    /* ignore */
  }
}

export function rescheduleReminders(settings: Settings | null | undefined) {
  clearScheduled();
  if (!settings || !settings.remindersEnabled) {
    void disablePeriodicReminder();
    return;
  }
  void enablePeriodicReminder();
  const time = settings.reminderTime ?? '18:00';
  const next = nextDailyOccurrence(time);
  if (!next) return;
  const delay = next.getTime() - Date.now();
  if (delay <= 0 || delay > 0x7fffffff) return; // setTimeout cap
  localStorage.setItem(SCHEDULE_KEY, next.toISOString());
  timer = window.setTimeout(async () => {
    await showNotification(
      'Showup',
      'A small session beats none. Tap to start.',
    );
    rescheduleReminders(settings);
  }, delay);
}

export async function requestReminderPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied';
  if (
    Notification.permission === 'granted' ||
    Notification.permission === 'denied'
  ) {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

export function getReminderPermission():
  | NotificationPermission
  | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}
