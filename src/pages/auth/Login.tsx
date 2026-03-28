import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getPostLoginPath } from '@/lib/postLoginRedirect';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: loginError } = await login(formData.email, formData.password);

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    const path = await getPostLoginPath();
    navigate(path, { replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full glass rounded-[3rem] p-10 shadow-2xl border-white/40 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Welcome back</h1>
          <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Sign in to your account</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-bold text-red-500 uppercase tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com" 
                className="w-full h-16 pl-14 pr-6 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-[1.5rem] text-gray-900 font-bold transition-all outline-none" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
              <Link to="/forgot-password" className="text-[10px] font-black text-gray-400/50 uppercase tracking-widest hover:text-gray-900 transition-colors">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input 
                required
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••" 
                className="w-full h-16 pl-14 pr-6 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-[1.5rem] text-gray-900 font-bold transition-all outline-none" 
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs font-bold text-gray-400">
          New to Ejuma? <Link to="/register" className="text-gray-900 hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
