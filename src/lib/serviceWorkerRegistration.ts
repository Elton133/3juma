/** Last service worker registration from vite-plugin-pwa (used for PushManager). */
let appSwRegistration: ServiceWorkerRegistration | null = null;

export function setAppServiceWorkerRegistration(reg: ServiceWorkerRegistration | undefined | null): void {
  appSwRegistration = reg ?? null;
}

export function getAppServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return appSwRegistration;
}
