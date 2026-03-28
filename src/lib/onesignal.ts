import OneSignal from 'react-onesignal';

const appId = (import.meta.env.VITE_ONESIGNAL_APP_ID || '').trim();

let initPromise: Promise<void> | null = null;

export const isOneSignalConfigured = () => !!appId;

export function initOneSignal(): void {
  if (!appId) {
    console.warn('[3juma] OneSignal disabled — add VITE_ONESIGNAL_APP_ID to .env');
    return;
  }
  if (initPromise !== null) return;

  const base = import.meta.env.BASE_URL;
  const scriptSrc = `${base.endsWith('/') ? base : `${base}/`}vendor-os-boot.js`;

  initPromise = OneSignal.init({
    appId,
    scriptSrc,
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
  } as Parameters<typeof OneSignal.init>[0]);
}

async function ensureOneSignalReady(): Promise<boolean> {
  if (!appId) return false;
  if (initPromise === null) initOneSignal();
  if (!initPromise) return false;
  try {
    await initPromise;
    return true;
  } catch (e) {
    console.error('[3juma] OneSignal init failed:', e);
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
