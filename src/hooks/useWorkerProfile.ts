import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import type { WorkerProfile, VerificationDocument, WorkerCertificate, PortfolioImage } from '@/types/profile';

// ─── Local-only mock state (when Supabase isn't configured) ──────────
const createEmptyProfile = (userId: string): WorkerProfile => ({
  id: crypto.randomUUID(),
  user_id: userId,
  trade: '',
  area: '',
  bio: '',
  profile_photo_url: null,
  ghana_card_id: null,
  gender: null,
  dob: null,
  years_experience: 0,
  specializations: [],
  verification_status: 'none',
  is_verified: false,
  verified_at: null,
  verified_by: null,
  rejection_notes: null,
  is_available: true,
  rating_avg: 0,
  jobs_completed: 0,
  strikes: 0,
  subscription_active: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export function useWorkerProfile(userId: string) {
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [certificates, setCertificates] = useState<WorkerCertificate[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── FETCH ───────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured() || !supabase) {
      // Local fallback
      const stored = localStorage.getItem(`3juma_worker_profile_${userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        setProfile(data.profile);
        setDocuments(data.documents || []);
        setCertificates(data.certificates || []);
        setPortfolio(data.portfolio || []);
      } else {
        setProfile(createEmptyProfile(userId));
      }
      setLoading(false);
      return;
    }

    try {
      let { data: prof, error: profErr } = await supabase
        .from('worker_profiles')
        .select('*, users:users!worker_profiles_user_id_fkey(full_name, email, phone)')
        .eq('user_id', userId)
        .maybeSingle();

      // Retry once if not found (trigger delay)
      if (!prof && !profErr) {
        await new Promise(r => setTimeout(r, 1000));
        const retry = await supabase
          .from('worker_profiles')
          .select('*, users:users!worker_profiles_user_id_fkey(full_name, email, phone)')
          .eq('user_id', userId)
          .maybeSingle();
        prof = retry.data;
      }

      if (profErr) throw profErr;
      if (prof) {
        setProfile({
          ...prof,
          full_name: prof.users?.full_name,
          email: prof.users?.email,
          phone: prof.users?.phone,
        } as WorkerProfile);

        const [docsRes, certsRes, portRes] = await Promise.all([
          supabase.from('verification_documents').select('*').eq('worker_id', prof.id),
          supabase.from('worker_certificates').select('*').eq('worker_id', prof.id),
          supabase.from('work_portfolio').select('*').eq('worker_id', prof.id).order('created_at', { ascending: false }),
        ]);

        setDocuments((docsRes.data || []) as VerificationDocument[]);
        setCertificates((certsRes.data || []) as WorkerCertificate[]);
        setPortfolio((portRes.data || []) as PortfolioImage[]);
      } else {
        setProfile(createEmptyProfile(userId));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ─── PERSIST locally (fallback) ──────────────────────────────
  const persistLocal = useCallback((p: WorkerProfile, d: VerificationDocument[], c: WorkerCertificate[], port: PortfolioImage[]) => {
    localStorage.setItem(`3juma_worker_profile_${userId}`, JSON.stringify({ profile: p, documents: d, certificates: c, portfolio: port }));
  }, [userId]);

  // ─── UPDATE PROFILE ──────────────────────────────────────────
  const updateProfile = useCallback(async (updates: Partial<WorkerProfile>) => {
    if (!profile) return;
    setSaving(true);
    setError(null);

    const updatedProfile = { ...profile, ...updates, updated_at: new Date().toISOString() };

    if (!isSupabaseConfigured() || !supabase) {
      setProfile(updatedProfile);
      persistLocal(updatedProfile, documents, certificates, portfolio);
      setSaving(false);
      return;
    }

    try {
      // 1. If name or phone changed, update the users table
      if (updates.full_name || updates.phone) {
        const userUpdates: any = {};
        if (updates.full_name) userUpdates.full_name = updates.full_name;
        if (updates.phone) userUpdates.phone = updates.phone;
        
        await supabase.from('users').update(userUpdates).eq('id', userId);
      }

      // 2. Update worker_profiles (remove joined fields first)
      const { full_name, email, phone, users, ...dbUpdates } = updatedProfile as any;
      const { data, error: err } = await supabase
        .from('worker_profiles')
        .upsert(dbUpdates, { onConflict: 'user_id' })
        .select('*, users:users!worker_profiles_user_id_fkey(full_name, email, phone)')
        .single();

      if (err) throw err;
      if (data) {
        setProfile({
          ...data,
          full_name: data.users?.full_name,
          email: data.users?.email,
          phone: data.users?.phone,
        } as WorkerProfile);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [profile, userId, documents, certificates, portfolio, persistLocal]);

  // ─── UPLOAD FILE (CLOUDINARY) ──────────────────────────────────
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      const res = await uploadToCloudinary(file);
      return res.secure_url;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  // ─── ADD VERIFICATION DOCUMENT ───────────────────────────────
  const addVerificationDoc = useCallback(async (type: VerificationDocument['document_type'], file: File) => {
    if (!profile) return;
    setSaving(true);
    setError(null);

    const url = await uploadFile(file);
    if (!url) { setSaving(false); return; }

    const doc: VerificationDocument = {
      id: crypto.randomUUID(),
      worker_id: profile.id,
      document_type: type,
      file_url: url,
      status: 'pending',
      admin_notes: null,
      reviewed_at: null,
      reviewed_by: null,
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured() || !supabase) {
      const newDocs = [...documents.filter(d => d.document_type !== type), doc];
      setDocuments(newDocs);
      persistLocal(profile, newDocs, certificates, portfolio);
      setSaving(false);
      return;
    }

    try {
      // Remove existing doc of same type
      await supabase.from('verification_documents').delete().eq('worker_id', profile.id).eq('document_type', type);
      const { error: err } = await supabase.from('verification_documents').insert(doc);
      if (err) throw err;
      setDocuments(prev => [...prev.filter(d => d.document_type !== type), doc]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [profile, documents, certificates, portfolio, uploadFile, persistLocal]);

  // ─── ADD CERTIFICATE ─────────────────────────────────────────
  const addCertificate = useCallback(async (name: string, file: File, issuedBy?: string, year?: number) => {
    if (!profile) return;
    setSaving(true);
    setError(null);

    const url = await uploadFile(file);
    if (!url) { setSaving(false); return; }

    const cert: WorkerCertificate = {
      id: crypto.randomUUID(),
      worker_id: profile.id,
      certificate_name: name,
      file_url: url,
      issued_by: issuedBy || null,
      year_obtained: year || null,
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured() || !supabase) {
      const newCerts = [...certificates, cert];
      setCertificates(newCerts);
      persistLocal(profile, documents, newCerts, portfolio);
      setSaving(false);
      return;
    }

    try {
      const { error: err } = await supabase.from('worker_certificates').insert(cert);
      if (err) throw err;
      setCertificates(prev => [...prev, cert]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [profile, documents, certificates, portfolio, uploadFile, persistLocal]);

  // ─── REMOVE CERTIFICATE ──────────────────────────────────────
  const removeCertificate = useCallback(async (certId: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      const newCerts = certificates.filter(c => c.id !== certId);
      setCertificates(newCerts);
      if (profile) persistLocal(profile, documents, newCerts, portfolio);
      return;
    }

    try {
      await supabase.from('worker_certificates').delete().eq('id', certId);
      setCertificates(prev => prev.filter(c => c.id !== certId));
    } catch (err: any) {
      setError(err.message);
    }
  }, [profile, documents, certificates, portfolio, persistLocal]);

  // ─── ADD PORTFOLIO IMAGE ─────────────────────────────────────
  const addPortfolioImage = useCallback(async (file: File, caption?: string) => {
    if (!profile) return;
    setSaving(true);
    setError(null);

    const url = await uploadFile(file);
    if (!url) { setSaving(false); return; }

    const img: PortfolioImage = {
      id: crypto.randomUUID(),
      worker_id: profile.id,
      image_url: url,
      caption: caption || '',
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured() || !supabase) {
      const newPort = [img, ...portfolio];
      setPortfolio(newPort);
      persistLocal(profile, documents, certificates, newPort);
      setSaving(false);
      return;
    }

    try {
      const { error: err } = await supabase.from('work_portfolio').insert(img);
      if (err) throw err;
      setPortfolio(prev => [img, ...prev]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [profile, documents, certificates, portfolio, uploadFile, persistLocal]);

  // ─── REMOVE PORTFOLIO IMAGE ──────────────────────────────────
  const removePortfolioImage = useCallback(async (imgId: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      const newPort = portfolio.filter(p => p.id !== imgId);
      setPortfolio(newPort);
      if (profile) persistLocal(profile, documents, certificates, newPort);
      return;
    }

    try {
      await supabase.from('work_portfolio').delete().eq('id', imgId);
      setPortfolio(prev => prev.filter(p => p.id !== imgId));
    } catch (err: any) {
      setError(err.message);
    }
  }, [profile, documents, certificates, portfolio, persistLocal]);

  // ─── SUBMIT FOR VERIFICATION ─────────────────────────────────
  const submitForVerification = useCallback(async () => {
    if (!profile) return;

    const ghanaFront = documents.find(d => d.document_type === 'ghana_card_front');
    const ghanaBack = documents.find(d => d.document_type === 'ghana_card_back');

    if (!ghanaFront || !ghanaBack) {
      setError('Please upload both front and back of your Ghana Card.');
      return;
    }

    if (!profile.trade || !profile.area) {
      setError('Please fill in your trade and area.');
      return;
    }

    await updateProfile({ verification_status: 'pending' });
  }, [profile, documents, updateProfile]);

  return {
    profile,
    documents,
    certificates,
    portfolio,
    loading,
    saving,
    error,
    updateProfile,
    addVerificationDoc,
    addCertificate,
    removeCertificate,
    addPortfolioImage,
    removePortfolioImage,
    submitForVerification,
    clearError: () => setError(null),
  };
}
