import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getPostLoginPath } from '@/lib/postLoginRedirect';
import { ROUTES } from '@/lib/routes';
import { supabase } from '@/lib/supabase';
import { friendlyAuthError } from '@/lib/authErrors';

const WorkerLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, signInWithGoogle, user, isAuthenticated, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && user?.role === 'worker') {
      navigate(ROUTES.workerDashboard, { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    const { error: oauthError } = await signInWithGoogle();
    if (oauthError) {
      setError(friendlyAuthError(oauthError.message));
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { error: loginError } = await login(email, password);
      
      if (loginError) {
        setError(friendlyAuthError(loginError.message));
        setLoading(false);
        return;
      }

      const path = await getPostLoginPath();
      if (path === ROUTES.workerDashboard) {
        navigate(path, { replace: true });
      } else {
        setError('This portal is for workers only. Use the main sign-in for customer accounts.');
        await supabase?.auth.signOut();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? friendlyAuthError(err.message) : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="glass rounded-[3rem] p-12 max-w-md w-full shadow-2xl border-white/40">
        <div className="text-center mb-10">
          <img src="/3juma.png" alt="3juma Logo" className="h-16 w-auto mx-auto mb-6 object-contain" />
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Worker Portal</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Sign in to manage your dispatch</p>
        </div>
        {isAuthenticated && user && user.role !== 'worker' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
              You are signed in as {user.role}.
            </p>
            <button type="button" onClick={() => navigate(ROUTES.home)} className="mt-2 text-xs font-black text-amber-800 hover:underline">
              Go to customer portal
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl text-sm text-red-600 font-bold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="worker@3juma.com" className="w-full h-14 px-5 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold transition-all outline-none" required />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-14 px-5 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold transition-all outline-none" required />
          </div>

          <button type="submit" disabled={loading} className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl disabled:opacity-50 transition-all active:scale-[0.98]">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-gray-300">
            <span className="bg-white px-3">or</span>
          </div>
        </div>

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
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default WorkerLogin;
