import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function useReviews() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReview = useCallback(async (reviewData: {
    service_request_id: string;
    reviewer_id: string;
    reviewee_id: string;
    rating: number;
    comment: string;
  }) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return true;
    }

    try {
      const { error: err } = await supabase
        .from('reviews')
        .insert({
          ...reviewData,
          created_at: new Date().toISOString(),
        });

      if (err) throw err;
      
      // Update worker's average rating (Normally handled by a Supabase function/trigger)
      // For now we assume the backend handles it or we'll let it be.

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitReview, loading, error };
}
