import OneSignal from 'react-onesignal';

const appId = (import.meta.env.VITE_ONESIGNAL_APP_ID || '').trim();
const safariWebId = (import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID || '').trim();

let initPromise: Promise<void> | null = null;

export const isOneSignalConfigured = () => !!appId;

function absoluteAsset(path: string): string {
  if (typeof window === 'undefined') return path;
  const base = import.meta.env.BASE_URL;
  const root = base.endsWith('/') ? base : `${base}/`;
  return new URL(path.replace(/^\//, ''), window.location.origin + root).href;
}

/**
 * Run after load + microtask so the document, SW, and extensions settle.
 * JSONP to OneSignal still requires network access to *.onesignal.com (disable strict blockers if you see Timeout).
 */
export function initOneSignal(): void {
  if (!appId) {
    console.warn('[3juma] OneSignal disabled — add VITE_ONESIGNAL_APP_ID to .env');
    return;
  }
  if (initPromise !== null) return;

  initPromise = new Promise((resolve, reject) => {
    const run = () => {
      const scriptSrc = absoluteAsset('vendor-os-boot.js');
      const serviceWorkerPath = absoluteAsset('OneSignalSDKWorker.js');

      const initOptions: Parameters<typeof OneSignal.init>[0] = {
        appId,
        safari_web_id: safariWebId || undefined,
        scriptSrc,
        serviceWorkerPath,
        allowLocalhostAsSecureOrigin: true,
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: 'push',
                autoPrompt: false,
                delay: { pageViews: 1, timeDelay: 0 },
              },
            ],
          },
        },
      } as Parameters<typeof OneSignal.init>[0];

      if (import.meta.env.VITE_ONESIGNAL_NOTIFY_BELL === 'true') {
        (initOptions as Record<string, unknown>).notifyButton = { enable: true };
      }

      OneSignal.init(initOptions).then(resolve).catch(reject);
    };

    const schedule = () => queueMicrotask(run);

    if (typeof document === 'undefined') {
      reject(new Error('No document'));
      return;
    }
    if (document.readyState === 'complete') {
      requestAnimationFrame(() => requestAnimationFrame(schedule));
    } else {
      window.addEventListener('load', () => requestAnimationFrame(schedule), { once: true });
    }
  });

  initPromise.catch((e) => {
    console.error('[3juma] OneSignal init failed:', e);
    if (String(e?.message || e).includes('Timeout')) {
      console.warn(
        '[3juma] OneSignal: "Timeout" usually means a blocker stopped requests to onesignal.com, or the site URL is not allowed in the OneSignal dashboard. Allow *.onesignal.com / disable strict privacy extensions for this origin.'
      );
    }
  });
}

async function ensureOneSignalReady(): Promise<boolean> {
  if (!appId) return false;
  if (initPromise === null) initOneSignal();
  if (!initPromise) return false;
  try {
    await initPromise;
    return true;
  } catch {
    return false;
  }
}

/** Link this browser to your user (e.g. Supabase public.users id) and opt in to web push. */
export async function requestOneSignalPush(externalUserId?: string): Promise<boolean> {
  const ready = await ensureOneSignalReady();
  if (!ready) return false;

  try {
    if (externalUserId) await OneSignal.login(externalUserId);

    const granted = await OneSignal.Notifications.requestPermission();
    if (!granted) return false;

    try {
      await OneSignal.User.PushSubscription.optIn();
    } catch {
      // already subscribed or not required
    }

    const { optedIn, token } = OneSignal.User.PushSubscription;
    return optedIn === true || !!token;
  } catch (e) {
    console.error('[3juma] OneSignal push:', e);
    return false;
  }
}

export function logoutOneSignal(): void {
  if (!appId) return;
  void OneSignal.logout().catch(() => {});
}
