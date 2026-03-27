import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const WorkerLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

      // The role check will be handled by the sync logic in useAuth
      // and the ProtectedRoute will handle the redirect if still wrong.
      // But we can add a small delay to allow sync to happen.
      setTimeout(() => {
        navigate('/worker/dashboard');
      }, 500);
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="glass rounded-[3rem] p-12 max-w-md w-full shadow-2xl border-white/40">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Zap className="w-8 h-8 text-white" />
          </div>
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
