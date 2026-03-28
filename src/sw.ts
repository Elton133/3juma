/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null } | string>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('install', (event: ExtendableEvent) => {
  const p = self.skipWaiting();
  event.waitUntil(p instanceof Promise ? p : Promise.resolve());
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('push', (event: PushEvent) => {
  let title = '3juma';
  let body = 'You have a new update';
  let openUrl = '/';

  try {
    if (event.data) {
      const parsed = event.data.json() as { title?: string; body?: string; url?: string };
      if (parsed.title) title = parsed.title;
      if (parsed.body) body = parsed.body;
      if (parsed.url) openUrl = parsed.url;
    }
  } catch {
    const text = event.data?.text();
    if (text) body = text;
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: openUrl },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data as { url?: string } | undefined;
  const path = data?.url && data.url.startsWith('/') ? data.url : '/';
  const url = new URL(path, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const c of clientList) {
        if (c.url.startsWith(self.location.origin) && 'focus' in c) {
          void (c as WindowClient).focus();
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
