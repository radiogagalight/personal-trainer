/// <reference lib="WebWorker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();

// Precache the build output (the manifest is injected here at build time).
precacheAndRoute(self.__WB_MANIFEST);

// Same-origin GET — stale-while-revalidate for static assets.
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    ['style', 'script', 'image', 'font'].includes(request.destination),
  new StaleWhileRevalidate({ cacheName: 'showup-static' }),
);

// SPA navigation fallback to cached index.html
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'showup-pages',
      networkTimeoutSeconds: 3,
    }),
    { allowlist: [/^\/(?!api).*/] },
  ),
);

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

// Best-effort daily reminder for installed PWAs that support Periodic
// Background Sync (the browser controls timing; this only fires where
// supported and permitted). The in-page scheduler remains the primary path.
self.addEventListener('periodicsync', (event: Event) => {
  const e = event as Event & { tag?: string; waitUntil: (p: Promise<unknown>) => void };
  if (e.tag === 'showup-daily-reminder') {
    e.waitUntil(
      self.registration.showNotification('Showup', {
        body: 'A small session beats none. Tap to start.',
        icon: '/icons/icon.svg',
        badge: '/icons/icon.svg',
        tag: 'showup-reminder',
      }),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find((c) => 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow('/');
    }),
  );
});
