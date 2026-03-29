import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/** Fire-and-forget; never blocks booking if the function is missing or misconfigured. */
function logDev(warn: string, err: unknown) {
  if (import.meta.env.DEV) console.warn(`[3juma] ${warn}`, err);
}

/** After a new service_request row — notifies the worker (if they have push enabled). */
export async function triggerWorkerNewJobPush(serviceRequestId: string): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) return;
  const { error } = await supabase.functions.invoke('send-app-push', {
    body: { kind: 'worker_new_job', serviceRequestId },
  });
  if (error) logDev('send-app-push worker_new_job', error.message);
}

/** After worker updates job status — notifies the customer (if they enabled push). */
export async function triggerCustomerJobUpdatePush(
  serviceRequestId: string,
  status: string,
): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) return;
  const { error } = await supabase.functions.invoke('send-app-push', {
    body: { kind: 'customer_job_update', serviceRequestId, status },
  });
  if (error) logDev('send-app-push customer_job_update', error.message);
}

export type MarketingPushInput = {
  title: string;
  body: string;
  url?: string;
  /** If omitted, all users with at least one push subscription receive the message. */
  userIds?: string[];
};

/** Admin-only: general / retention / “rate us” style campaigns. */
export async function triggerMarketingPush(
  input: MarketingPushInput,
): Promise<{ ok: boolean; error?: string; sent?: number }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }
  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean;
    sent?: number;
    error?: string;
  }>('send-app-push', {
    body: {
      kind: 'marketing',
      title: input.title,
      body: input.body,
      url: input.url ?? '/',
      userIds: input.userIds,
    },
  });
  if (error) return { ok: false, error: error.message };
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { ok: false, error: String(data.error) };
  }
  const sent = data && typeof data === 'object' && 'sent' in data ? Number((data as { sent: number }).sent) : 0;
  return { ok: true, sent };
}
