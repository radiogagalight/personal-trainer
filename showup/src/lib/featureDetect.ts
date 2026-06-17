/** Capability detection — every consumer must handle the `false` case. */

export const hasWakeLock = (): boolean =>
  typeof navigator !== 'undefined' && 'wakeLock' in navigator;

export const hasVibrate = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export const hasNotifications = (): boolean =>
  typeof window !== 'undefined' && 'Notification' in window;

export const notificationPermission = ():
  | 'default'
  | 'granted'
  | 'denied'
  | 'unsupported' => {
  if (!hasNotifications()) return 'unsupported';
  return Notification.permission;
};

export async function requestNotificationPermission(): Promise<
  'granted' | 'denied' | 'default' | 'unsupported'
> {
  if (!hasNotifications()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

export function vibrate(pattern: number | number[]): boolean {
  if (!hasVibrate()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

interface WakeLockHandle {
  release: () => Promise<void>;
}

export async function requestWakeLock(): Promise<WakeLockHandle | null> {
  if (!hasWakeLock()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sentinel = await (navigator as any).wakeLock.request('screen');
    return {
      release: async () => {
        try {
          await sentinel.release();
        } catch {
          /* ignore */
        }
      },
    };
  } catch {
    return null;
  }
}
