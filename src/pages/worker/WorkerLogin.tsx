import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getPostLoginPath } from '@/lib/postLoginRedirect';
import { ROUTES } from '@/lib/routes';
import { supabase } from '@/lib/supabase';

const WorkerLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { error: loginError } = await login(email, password);
      
      if (loginError) {
        setError(loginError.message);
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
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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

        <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-8">
          Demo: worker@3juma.com / worker123
        </p>
      </div>
    </div>
  );
};

export default WorkerLogin;
