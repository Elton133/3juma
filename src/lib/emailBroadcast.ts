import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type EmailAudience = 'all' | 'customers' | 'workers' | 'incomplete_workers';

export type EmailBroadcastInput = {
  audience: EmailAudience;
  subject: string;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export async function sendEmailBroadcast(
  input: EmailBroadcastInput,
): Promise<{ ok: boolean; error?: string; sent?: number; recipients?: number }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean;
    sent?: number;
    recipients?: number;
    error?: string;
  }>('send-email-broadcast', { body: input });

  if (error) return { ok: false, error: error.message };
  if (data?.error) return { ok: false, error: data.error };
  return { ok: true, sent: data?.sent ?? 0, recipients: data?.recipients ?? 0 };
}

