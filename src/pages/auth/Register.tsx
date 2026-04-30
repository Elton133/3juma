import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { User, Briefcase, ChevronRight, Mail, Lock, UserCircle, ArrowLeft } from 'lucide-react';
import { useAuth, type UserRole } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/routes';
import { friendlyAuthError } from '@/lib/authErrors';

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedRole = searchParams.get('role') === 'worker' ? 'worker' : searchParams.get('role') === 'customer' ? 'customer' : null;
  const { signUp, signInWithGoogle } = useAuth();
  const [step, setStep] = useState(preselectedRole ? 2 : 1);
  const [role, setRole] = useState<UserRole | null>(preselectedRole as UserRole | null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleGoogleSignUp = async (selectedRole: UserRole) => {
    setLoading(true);
    setError(null);
    const { error: oauthError } = await signInWithGoogle(selectedRole);
    if (oauthError) {
      setError(friendlyAuthError(oauthError.message));
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: signUpError } = await signUp(formData.email, formData.password, {
      full_name: formData.fullName,
      role: role,
    });

    if (signUpError) {
      setError(friendlyAuthError(signUpError.message));
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
        <div className="max-w-md w-full glass rounded-[3rem] p-10 text-center shadow-2xl border-white/40">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <Mail className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-4">Check your email</h2>
          <p className="text-gray-500 font-medium leading-relaxed mb-8">
            We've sent a verification link to <span className="text-gray-900 font-bold">{formData.email}</span>. Please confirm your email to continue.
          </p>
          <Link to={ROUTES.home} className="inline-block w-full h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-xl hover:scale-[1.02] transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full">
        {step === 1 ? (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Join Ejuma</h1>
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Select your account type</p>
            </div>

            <div className="grid gap-4">
              <button 
                onClick={() => handleRoleSelect('customer')}
                className="glass group p-8 rounded-[2.5rem] border-white/40 text-left hover:border-gray-900 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all shadow-sm">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Customer</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1">I want to hire professionals</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-200 group-hover:text-gray-900 transition-colors" />
              </button>

              <button 
                onClick={() => handleRoleSelect('worker')}
                className="glass group p-8 rounded-[2.5rem] border-white/40 text-left hover:border-gray-900 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all shadow-sm">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Worker</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1">I want to provide services</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-200 group-hover:text-gray-900 transition-colors" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void handleGoogleSignUp('customer')}
                disabled={loading}
                className="h-14 bg-white border-2 border-gray-200 rounded-2xl text-xs font-black tracking-wide text-gray-900 hover:border-gray-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.4H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.6z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z" />
                  <path fill="#4CAF50" d="M24 44c5.1 0 9.8-2 13.1-5.2l-6-5.1C29 35.3 26.6 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.4H42V20H24v8h11.3c-.8 2.5-2.4 4.6-4.7 5.7l6 5.1C39.9 35.8 44 30.4 44 24c0-1.3-.1-2.4-.4-3.6z" />
                </svg>
                Google as Customer
              </button>
              <button
                type="button"
                onClick={() => void handleGoogleSignUp('worker')}
                disabled={loading}
                className="h-14 bg-white border-2 border-gray-200 rounded-2xl text-xs font-black tracking-wide text-gray-900 hover:border-gray-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.4H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.6z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z" />
                  <path fill="#4CAF50" d="M24 44c5.1 0 9.8-2 13.1-5.2l-6-5.1C29 35.3 26.6 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.4H42V20H24v8h11.3c-.8 2.5-2.4 4.6-4.7 5.7l6 5.1C39.9 35.8 44 30.4 44 24c0-1.3-.1-2.4-.4-3.6z" />
                </svg>
                Google as Worker
              </button>
            </div>

            <p className="text-center text-xs font-bold text-gray-400">
              Already have an account? <Link to={ROUTES.login} className="text-gray-900 hover:underline">Sign In</Link>
            </p>
          </div>
        ) : (
          <div className="glass rounded-[3rem] p-10 shadow-2xl border-white/40 space-y-8">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter">
                {role === 'worker' ? 'Worker' : 'Customer'} Details
              </h2>
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Create your secure account</p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-bold text-red-500 uppercase tracking-wider">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Full Name</label>
                <div className="relative">
                  <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input 
                    required
                    type="text" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="John Doe" 
                    className="w-full h-16 pl-14 pr-6 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-[1.5rem] text-gray-900 font-bold transition-all outline-none" 
                  />
                </div>
              </div>

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
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Password</label>
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

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input 
                    required
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="••••••••" 
                    className="w-full h-16 pl-14 pr-6 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-[1.5rem] text-gray-900 font-bold transition-all outline-none" 
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                {loading ? 'Creating Account...' : 'Continue'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
