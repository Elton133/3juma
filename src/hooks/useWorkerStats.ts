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
      // 1. Fetch profile for aggregate stats
      const { data: profile, error: profileErr } = await supabase
        .from('worker_profiles')
        .select('rating_avg, jobs_completed, wallet_balance')
        .eq('user_id', workerId)
        .single();

      if (profileErr) throw profileErr;

      // 2. Fetch monthly earnings (simple sum of completed payments in current month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: payments, error: payErr } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      if (payErr) throw payErr;

      const monthlyEarnings = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      setStats({
        jobsDone: profile?.jobs_completed || 0,
        rating: profile?.rating_avg || 5.0,
        walletBalance: profile?.wallet_balance || 0,
        monthlyEarnings: monthlyEarnings,
        rank: (profile?.jobs_completed || 0) > 50 ? 'Elite' : 'Pro',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
