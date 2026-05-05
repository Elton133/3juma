import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type FunnelEventName =
  | 'signup_started'
  | 'signup_completed'
  | 'profile_started'
  | 'profile_completed'
  | 'booking_started'
  | 'booking_success'
  | 'worker_accepted'
  | 'worker_completed_job'
  | 'lead_capture_submitted';

type EventProps = Record<string, string | number | boolean | null | undefined>;

export async function trackEvent(eventName: FunnelEventName, props: EventProps = {}) {
  if (!isSupabaseConfigured() || !supabase) return;

  try {
    const { data: auth } = await supabase.auth.getUser();
    const payload = {
      event_name: eventName,
      user_id: auth.user?.id ?? null,
      session_id: getSessionId(),
      page_path: typeof window !== 'undefined' ? window.location.pathname : null,
      properties: props,
    };

    const { error } = await supabase.from('analytics_events').insert(payload);
    if (error && import.meta.env.DEV) {
      console.warn('[3juma analytics] event not recorded:', error.message);
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[3juma analytics] event failed:', err);
  }
}

function getSessionId() {
  if (typeof window === 'undefined') return null;
  const key = 'ejuma_session_id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.localStorage.setItem(key, value);
  return value;
}

