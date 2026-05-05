import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/routes';
import { supabase } from '@/lib/supabase';
import { getPostLoginPath } from '@/lib/postLoginRedirect';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'invalid'>('loading');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setPhase('invalid');
      return;
    }

    const markReady = () => setPhase('ready');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) {
        markReady();
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) markReady();
    });

    const fail = window.setTimeout(() => {
      if (!supabase) {
        setPhase('invalid');
        return;
      }
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) markReady();
        else setPhase('invalid');
      });
    }, 4000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(fail);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await updatePassword(password);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    const path = await getPostLoginPath();
    navigate(path, { replace: true });
  };

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-gray-900 animate-spin mx-auto" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opening reset link…</p>
        </div>
      </div>
    );
  }

  if (phase === 'invalid') {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full glass rounded-[3rem] p-10 text-center space-y-6">
          <p className="text-sm font-bold text-gray-700 leading-relaxed">
            This reset link is invalid or expired. Request a new one from the sign-in page.
          </p>
          <Link
            to={ROUTES.forgotPassword}
            className="inline-flex items-center justify-center w-full h-14 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
          >
            Request new link
          </Link>
          <Link to={ROUTES.login} className="block text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full glass rounded-[3rem] p-10 shadow-2xl border-white/40 space-y-8">
        <Link
          to={ROUTES.login}
          className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">New password</h1>
          <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Choose a strong password</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-bold text-red-500 uppercase tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">New password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-16 pl-14 pr-14 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-[1.5rem] text-gray-900 font-bold transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-900 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Confirm</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                required
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full h-16 pl-14 pr-14 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-[1.5rem] text-gray-900 font-bold transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((value) => !value)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-900 transition-colors"
                aria-label={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
