import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save, UserCircle, Phone, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/lib/routes';

const CustomerProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !supabase) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from('users').select('full_name, phone').eq('id', user.id).maybeSingle();
      if (!cancelled) {
        setFullName(data?.full_name || user.name || '');
        setPhone(data?.phone || user.phone || '');
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.name, user?.phone]);

  const handleSave = async () => {
    if (!user?.id || !supabase) return;
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from('users')
      .update({
        full_name: fullName.trim() || 'Customer',
        phone: phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg('Profile updated.');
    setTimeout(() => navigate(ROUTES.home), 700);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-12">
      <div className="max-w-lg mx-auto glass rounded-[2.5rem] p-8 border-white/40 shadow-xl space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Complete your profile</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
            Keep your contact details up to date
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Full Name</label>
          <div className="relative">
            <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 rounded-2xl font-bold outline-none transition-all"
              placeholder="Your full name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 rounded-2xl font-bold outline-none transition-all"
              placeholder="+233..."
            />
          </div>
        </div>

        {msg && <p className="text-xs font-bold text-emerald-600">{msg}</p>}

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Profile
        </button>
      </div>
    </div>
  );
};

export default CustomerProfile;

