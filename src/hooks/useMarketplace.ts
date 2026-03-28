import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { calculateDistance } from '@/lib/utils';
import type { Worker } from '@/types/worker';

export function useMarketplace(trade: string, centerLat: number, centerLng: number, radiusKm: number) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchWorkers = useCallback(async () => {
    if (!trade || !isSupabaseConfigured() || !supabase) return;

    try {
      // Fetch workers with the given trade who are verified and available
      const { data, error: err } = await supabase
        .from('worker_profiles')
        .select(`
          id,
          trade,
          area,
          bio,
          profile_photo_url,
          rating_avg,
          jobs_completed,
          is_available,
          user_id,
          users:users!worker_profiles_user_id_fkey (
            full_name,
            phone
          )
        `)
        .eq('trade', trade)
        .eq('verification_status', 'approved')
        .eq('is_available', true);

      if (err) throw err;

      // Map to frontend Worker type (Supabase may return joined `users` as object or array)
      const mappedWorkers: Worker[] = (data || []).map((p: any) => {
        const u = p.users as { full_name?: string; phone?: string } | { full_name?: string; phone?: string }[] | null;
        const userRow = Array.isArray(u) ? u[0] : u;
        return {
        id: p.id,
        userId: p.user_id,
        name: userRow?.full_name || 'Professional',
        trade: p.trade,
        areaName: p.area || 'Accra',
        rating: p.rating_avg || 5.0,
        jobsCompleted: p.jobs_completed || 0,
        verified: p.verification_status === 'approved',
        available: p.is_available,
        strikes: p.strikes || 0,
        subscriptionActive: p.subscription_active || false,
        profilePhoto: p.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
        phone: userRow?.phone || '',
        // Mocking location nearby for now
        lat: centerLat + (Math.random() - 0.5) * 0.02,
        lng: centerLng + (Math.random() - 0.5) * 0.02,
      };
      });

      // Filter by radius
      const filtered = mappedWorkers.filter(w => 
        calculateDistance(centerLat, centerLng, w.lat, w.lng) <= radiusKm
      );

      setWorkers(filtered);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [trade, centerLat, centerLng, radiusKm]);

  useEffect(() => {
    fetchWorkers();
    
    // Efficient Polling - refresh every 30 seconds
    pollInterval.current = setInterval(fetchWorkers, 30000);
    
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [fetchWorkers]);

  return { workers, loading, error, refetch: fetchWorkers };
}
