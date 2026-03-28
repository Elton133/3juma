import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { WorkerProfile, VerificationDocument, WorkerCertificate, PortfolioImage } from '@/types/profile';

interface PendingWorker {
  profile: WorkerProfile;
  documents: VerificationDocument[];
  certificates: WorkerCertificate[];
  portfolio: PortfolioImage[];
}

// ─── Mock data for when Supabase isn't configured ────────────
const createMockPendingWorkers = (): PendingWorker[] => {
  const stored = Object.keys(localStorage)
    .filter(k => k.startsWith('3juma_worker_profile_'))
    .map(k => {
      try {
        const data = JSON.parse(localStorage.getItem(k) || '{}');
        if (data.profile?.verification_status === 'pending') return data as PendingWorker;
        return null;
      } catch { return null; }
    })
    .filter(Boolean) as PendingWorker[];

  // If no local pending workers, create sample mock data
  if (stored.length === 0) {
    return [
      {
        profile: {
          id: 'mock-wp-1',
          user_id: 'w-1',
          trade: 'plumber',
          area: 'Accra Central',
          bio: 'Experienced plumber with 5 years of work in Accra.',
          profile_photo_url: 'https://i.pravatar.cc/150?img=11',
          ghana_card_id: null,
          gender: null,
          dob: null,
          years_experience: 5,
          specializations: [],
          verification_status: 'pending',
          is_verified: false,
          verified_at: null,
          verified_by: null,
          rejection_notes: null,
          is_available: true,
          rating_avg: 4.5,
          jobs_completed: 34,
          strikes: 0,
          subscription_active: true,
          full_name: 'Kwame Asante',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        documents: [
          { id: 'doc-1', worker_id: 'mock-wp-1', document_type: 'ghana_card_front', file_url: 'https://placehold.co/400x250/f3f4f6/9ca3af?text=Ghana+Card+Front', status: 'pending', admin_notes: null, reviewed_at: null, reviewed_by: null, created_at: new Date().toISOString() },
          { id: 'doc-2', worker_id: 'mock-wp-1', document_type: 'ghana_card_back', file_url: 'https://placehold.co/400x250/f3f4f6/9ca3af?text=Ghana+Card+Back', status: 'pending', admin_notes: null, reviewed_at: null, reviewed_by: null, created_at: new Date().toISOString() },
        ],
        certificates: [
          { id: 'cert-1', worker_id: 'mock-wp-1', certificate_name: 'Basic Plumbing Certificate', file_url: 'https://placehold.co/300x200/fffbeb/d97706?text=Certificate', issued_by: 'NVTI', year_obtained: 2020, created_at: new Date().toISOString() },
        ],
        portfolio: [
          { id: 'port-1', worker_id: 'mock-wp-1', image_url: 'https://placehold.co/300x200/ecfdf5/059669?text=Kitchen+Pipes', caption: 'Kitchen plumbing installation', created_at: new Date().toISOString() },
          { id: 'port-2', worker_id: 'mock-wp-1', image_url: 'https://placehold.co/300x200/ecfdf5/059669?text=Bathroom+Work', caption: 'Bathroom renovation', created_at: new Date().toISOString() },
        ],
      },
      {
        profile: {
          id: 'mock-wp-2',
          user_id: 'w-2',
          trade: 'electrician',
          area: 'East Legon',
          bio: 'Certified electrician specializing in residential wiring.',
          profile_photo_url: 'https://i.pravatar.cc/150?img=25',
          ghana_card_id: null,
          gender: null,
          dob: null,
          years_experience: 3,
          specializations: [],
          verification_status: 'pending',
          is_verified: false,
          verified_at: null,
          verified_by: null,
          rejection_notes: null,
          is_available: true,
          rating_avg: 0,
          jobs_completed: 0,
          strikes: 0,
          subscription_active: false,
          full_name: 'Ama Serwaa',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        documents: [
          { id: 'doc-3', worker_id: 'mock-wp-2', document_type: 'ghana_card_front', file_url: 'https://placehold.co/400x250/f3f4f6/9ca3af?text=Ghana+Card+Front', status: 'pending', admin_notes: null, reviewed_at: null, reviewed_by: null, created_at: new Date().toISOString() },
          { id: 'doc-4', worker_id: 'mock-wp-2', document_type: 'ghana_card_back', file_url: 'https://placehold.co/400x250/f3f4f6/9ca3af?text=Ghana+Card+Back', status: 'pending', admin_notes: null, reviewed_at: null, reviewed_by: null, created_at: new Date().toISOString() },
        ],
        certificates: [],
        portfolio: [
          { id: 'port-3', worker_id: 'mock-wp-2', image_url: 'https://placehold.co/300x200/eff6ff/2563eb?text=Wiring+Job', caption: 'House wiring project', created_at: new Date().toISOString() },
        ],
      },
    ];
  }

  return stored;
};

export function useAdminVerification() {
  const [pendingWorkers, setPendingWorkers] = useState<PendingWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured() || !supabase) {
      setPendingWorkers(createMockPendingWorkers());
      setLoading(false);
      return;
    }

    try {
      const { data: profiles, error: err } = await supabase
        .from('worker_profiles')
        .select('*, users!worker_profiles_user_id_fkey(full_name, email, phone)')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: true });

      if (err) throw err;

      const workers: PendingWorker[] = [];
      for (const prof of (profiles || [])) {
        const [docsRes, certsRes, portRes] = await Promise.all([
          supabase.from('verification_documents').select('*').eq('worker_id', prof.id),
          supabase.from('worker_certificates').select('*').eq('worker_id', prof.id),
          supabase.from('work_portfolio').select('*').eq('worker_id', prof.id),
        ]);

        workers.push({
          profile: { ...prof, full_name: prof.users?.full_name, email: prof.users?.email, phone: prof.users?.phone } as WorkerProfile,
          documents: (docsRes.data || []) as VerificationDocument[],
          certificates: (certsRes.data || []) as WorkerCertificate[],
          portfolio: (portRes.data || []) as PortfolioImage[],
        });
      }

      setPendingWorkers(workers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const approveWorker = useCallback(async (profileId: string) => {
    setProcessing(profileId);
    setError(null);

    if (!isSupabaseConfigured() || !supabase) {
      // Local: update stored profile
      setPendingWorkers(prev => prev.filter(w => w.profile.id !== profileId));
      const key = Object.keys(localStorage).find(k => {
        try { return JSON.parse(localStorage.getItem(k) || '{}').profile?.id === profileId; } catch { return false; }
      });
      if (key) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        data.profile.verification_status = 'approved';
        data.profile.is_verified = true;
        data.profile.verified_at = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(data));
      }
      setProcessing(null);
      return;
    }

    try {
      const { error: err } = await supabase
        .from('worker_profiles')
        .update({
          verification_status: 'approved',
          is_verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (err) throw err;

      await supabase
        .from('verification_documents')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('worker_id', profileId);

      setPendingWorkers(prev => prev.filter(w => w.profile.id !== profileId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  }, []);

  const rejectWorker = useCallback(async (profileId: string, notes: string) => {
    setProcessing(profileId);
    setError(null);

    if (!isSupabaseConfigured() || !supabase) {
      setPendingWorkers(prev => prev.filter(w => w.profile.id !== profileId));
      const key = Object.keys(localStorage).find(k => {
        try { return JSON.parse(localStorage.getItem(k) || '{}').profile?.id === profileId; } catch { return false; }
      });
      if (key) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        data.profile.verification_status = 'rejected';
        data.profile.rejection_notes = notes;
        localStorage.setItem(key, JSON.stringify(data));
      }
      setProcessing(null);
      return;
    }

    try {
      const { error: err } = await supabase
        .from('worker_profiles')
        .update({
          verification_status: 'rejected',
          rejection_notes: notes,
        })
        .eq('id', profileId);

      if (err) throw err;

      await supabase
        .from('verification_documents')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString(), admin_notes: notes })
        .eq('worker_id', profileId);

      setPendingWorkers(prev => prev.filter(w => w.profile.id !== profileId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  }, []);

  return {
    pendingWorkers,
    loading,
    processing,
    error,
    approveWorker,
    rejectWorker,
    refresh: fetchPending,
    clearError: () => setError(null),
  };
}
