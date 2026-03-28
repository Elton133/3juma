import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function useWorkerStats(workerId?: string) {
  const [stats, setStats] = useState({
    jobsDone: 0,
    rating: 5.0,
    walletBalance: 0,
    monthlyEarnings: 0,
    rank: 'Pro',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!workerId || !isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error: profileErr } = await supabase
        .from('worker_profiles')
        .select('rating_avg, jobs_completed')
        .eq('user_id', workerId)
        .single();

      if (profileErr) throw profileErr;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: requests, error: reqErr } = await supabase
        .from('service_requests')
        .select('id')
        .eq('worker_id', workerId);

      if (reqErr) throw reqErr;

      const requestIds = (requests ?? []).map((r) => r.id);
      let monthlyEarnings = 0;

      if (requestIds.length > 0) {
        const { data: payments, error: payErr } = await supabase
          .from('payments')
          .select('amount')
          .in('service_request_id', requestIds)
          .eq('status', 'completed')
          .gte('created_at', startOfMonth.toISOString());

        if (payErr) throw payErr;
        monthlyEarnings = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
      }

      setStats({
        jobsDone: profile?.jobs_completed || 0,
        rating: Number(profile?.rating_avg) || 5.0,
        walletBalance: 0,
        monthlyEarnings,
        rank: (profile?.jobs_completed || 0) > 50 ? 'Elite' : 'Pro',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load stats';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
