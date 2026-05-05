import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getPostLoginPath } from '@/lib/postLoginRedirect';
import { ROUTES } from '@/lib/routes';
import { supabase } from '@/lib/supabase';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setError('');

    const { error: loginError } = await login(email, password);

    if (loginError) {
      setError(loginError.message || 'Invalid credentials.');
      setLoading(false);
      return;
    }

    const path = await getPostLoginPath();
    if (path === ROUTES.adminDashboard) {
      navigate(path, { replace: true });
    } else {
      setError('This account is not an admin.');
      await supabase?.auth.signOut();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="glass rounded-[3rem] p-12 max-w-md w-full shadow-2xl border-white/40">
        <div className="text-center mb-10">
          <img src="/3juma.png" alt="3juma Logo" className="h-16 w-auto mx-auto mb-6 object-contain" />
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dispatch Center</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Admin access only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl text-sm text-red-600 font-bold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@3juma.com" className="w-full h-14 px-5 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold transition-all outline-none" required />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 pl-5 pr-14 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold transition-all outline-none"
                required
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

          <button type="submit" disabled={loading} className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl disabled:opacity-50 transition-all active:scale-[0.98]">
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>

        <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-8">
          Demo: admin@3juma.com / admin123
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
