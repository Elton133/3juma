/**
 * Browser Web Push (W3C Push API + VAPID).
 *
 * The `web-push` npm package does **not** run in the browser — it is the standard
 * Node library to **send** notifications (see `scripts/send-web-push.mjs`).
 * This module performs **subscription** on the client using the same VAPID **public** key.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAppServiceWorkerRegistration } from '@/lib/serviceWorkerRegistration';

const vapidPublicKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim();

export function isWebPushConfigured(): boolean {
  return vapidPublicKey.length > 0;
}

export function isPushApiSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

export type WebPushSubscribeResult =
  | { ok: true }
  | { ok: false; reason: 'not_configured' | 'not_supported' | 'no_sw' | 'permission_denied' | 'subscribe_failed'; detail?: string };

/**
 * Request notification permission, subscribe with VAPID, and store keys in Supabase.
 */
export async function subscribeWebPush(supabase: SupabaseClient, userId: string): Promise<WebPushSubscribeResult> {
  if (!isWebPushConfigured()) return { ok: false, reason: 'not_configured' };
  if (!isPushApiSupported()) return { ok: false, reason: 'not_supported' };

  const registration = getAppServiceWorkerRegistration();
  if (!registration) {
    return {
      ok: false,
      reason: 'no_sw',
      detail: 'Service worker not ready yet. Try again after the page loads, or use a production HTTPS build.',
    };
  }

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, reason: 'permission_denied' };

  try {
    const rawKey = urlBase64ToUint8Array(vapidPublicKey);
    const applicationServerKey = rawKey.buffer.slice(
      rawKey.byteOffset,
      rawKey.byteOffset + rawKey.byteLength
    ) as ArrayBuffer;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, reason: 'subscribe_failed', detail: 'Invalid subscription payload' };
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: 'endpoint' }
    );

    if (error) return { ok: false, reason: 'subscribe_failed', detail: error.message };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: 'subscribe_failed', detail: msg };
  }
}

/** Remove DB rows for this user and unsubscribe the current Push subscription locally. */
export async function removeAllWebPushForUser(supabase: SupabaseClient, userId: string): Promise<void> {
  const registration = getAppServiceWorkerRegistration();
  try {
    const sub = await registration?.pushManager.getSubscription();
    await supabase.from('push_subscriptions').delete().eq('user_id', userId);
    await sub?.unsubscribe();
  } catch {
    // best-effort on logout
  }
}
