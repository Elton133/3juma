import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Worker } from '@/types/worker';

export function usePublicWorker(workerId: string) {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorker = useCallback(async () => {
    if (!workerId || !isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: err } = await supabase
        .from('worker_profiles')
        .select(`
          id,
          trade,
          bio,
          profile_photo_url,
          rating_avg,
          jobs_completed,
          is_available,
          user_id,
          area,
          users:users!worker_profiles_user_id_fkey (
            full_name,
            phone
          )
        `)
        .eq('id', workerId)
        .single();

      if (err) throw err;

      if (data) {
        const u = data.users as { full_name?: string; phone?: string } | { full_name?: string; phone?: string }[] | null;
        const userRow = Array.isArray(u) ? u[0] : u;
        setWorker({
          id: data.id,
          userId: data.user_id,
          name: userRow?.full_name || 'Professional',
          trade: data.trade,
          areaName: data.area || 'Accra',
          rating: data.rating_avg || 5.0,
          jobsCompleted: data.jobs_completed || 0,
          verified: true, // If we're showing them in marketplace, they're likely verified
          available: data.is_available,
          strikes: 0,
          subscriptionActive: true,
          profilePhoto: data.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
          phone: userRow?.phone || '',
          lat: 0, // Not needed for detail view normally
          lng: 0,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchWorker();
  }, [fetchWorker]);

  return { worker, loading, error };
}
