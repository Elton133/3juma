import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, User } from 'lucide-react';
import { useAuth, type UserRole } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/routes';
import { friendlyAuthError } from '@/lib/authErrors';
import { trackEvent } from '@/lib/analytics';

const AuthEntry: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithGoogle } = useAuth();
  const initialRole = searchParams.get('role') === 'worker' ? 'worker' : 'customer';
  const [role, setRole] = useState<UserRole>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    void trackEvent('signup_started', { role, provider: 'google' });
    const { error: oauthError } = await signInWithGoogle(role === 'worker' ? 'worker' : undefined);
    if (oauthError) {
      setError(friendlyAuthError(oauthError.message));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full glass rounded-[3rem] p-8 md:p-10 border-white/40 shadow-2xl space-y-7">
        <div className="text-center">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Welcome to 3juma</h1>
          <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mt-2">Google-first sign in for a simpler launch</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`h-14 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all inline-flex items-center justify-center gap-2 ${
              role === 'customer' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 bg-white text-gray-500 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4" /> Customer
          </button>
          <button
            type="button"
            onClick={() => setRole('worker')}
            className={`h-14 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all inline-flex items-center justify-center gap-2 ${
              role === 'worker' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 bg-white text-gray-500 hover:text-gray-900'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Worker
          </button>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</div>}

        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={loading}
          className="w-full h-14 border-2 border-gray-200 bg-white text-gray-900 rounded-2xl font-black text-sm tracking-wide hover:border-gray-900 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.4H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.6z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z" />
            <path fill="#4CAF50" d="M24 44c5.1 0 9.8-2 13.1-5.2l-6-5.1C29 35.3 26.6 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.4H42V20H24v8h11.3c-.8 2.5-2.4 4.6-4.7 5.7l6 5.1C39.9 35.8 44 30.4 44 24c0-1.3-.1-2.4-.4-3.6z" />
          </svg>
          Continue as {role} with Google
        </button>

        <div className="rounded-3xl bg-gray-50 border border-gray-100 p-4 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email is backup only for now</p>
          <button
            type="button"
            onClick={() => navigate(role === 'worker' ? ROUTES.workerLogin : ROUTES.login)}
            className="mt-2 text-xs font-black text-gray-900 underline decoration-2 underline-offset-4"
          >
            Use email instead
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthEntry;

