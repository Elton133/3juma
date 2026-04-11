/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null } | string>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

function resolveOpenUrl(raw: string | undefined, origin: string): string {
  if (!raw?.trim()) return `${origin}/`;
  const t = raw.trim();
  try {
    if (t.startsWith('http://') || t.startsWith('https://')) {
      const u = new URL(t);
      const base = new URL(origin);
      if (u.origin === base.origin) return u.href;
      return `${origin}${u.pathname}${u.search}${u.hash}`;
    }
    const path = t.startsWith('/') ? t : `/${t}`;
    return new URL(path, origin).href;
  } catch {
    return `${origin}/`;
  }
}

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
  let title = 'Ejuma';
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

  const href = resolveOpenUrl(openUrl, self.location.origin);

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: href },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = (event.notification.data as { url?: string } | undefined)?.url;
  const openUrl = resolveOpenUrl(raw, self.location.origin);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      for (const c of clientList) {
        if (c.url.startsWith(self.location.origin) && 'focus' in c) {
          const wc = c as WindowClient;
          await wc.focus();
          type NavigateClient = WindowClient & { navigate?: (url: string) => Promise<WindowClient | null> };
          const nav = (wc as NavigateClient).navigate;
          if (typeof nav === 'function') {
            try {
              await nav.call(wc, openUrl);
              return;
            } catch {
              /* fall through to message + openWindow */
            }
          }
          wc.postMessage({ type: 'NAVIGATE_TO', url: openUrl });
          return;
        }
      }
      await self.clients.openWindow(openUrl);
    }),
  );
});
