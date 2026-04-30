import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getPostLoginPath } from '@/lib/postLoginRedirect';
import { ROUTES } from '@/lib/routes';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, signInWithGoogle } = useAuth();
  
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

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error: oauthError } = await signInWithGoogle();
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
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
              <Link to={ROUTES.forgotPassword} className="text-[10px] font-black text-gray-400/50 uppercase tracking-widest hover:text-gray-900 transition-colors">Forgot?</Link>
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

        <div className="relative">
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

        <p className="text-center text-xs font-bold text-gray-400">
          New to Ejuma? <Link to={ROUTES.register} className="text-gray-900 hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
