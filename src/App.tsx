import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/pages/customer/LandingPage';
import MapView from '@/pages/customer/MapView';
import BookingView from '@/pages/customer/BookingView';
import TrackingView from '@/pages/customer/TrackingView';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import WorkerLogin from '@/pages/worker/WorkerLogin';
import WorkerDashboard from '@/pages/worker/WorkerDashboard';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';

const VerifyEmail = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      navigate('/', { replace: true });
      return;
    }

    let finished = false;
    const goHome = () => {
      if (finished) return;
      finished = true;
      navigate('/', { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) goHome();
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) goHome();
    });

    const fallback = setTimeout(goHome, 5000);
    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor font-black"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Email Verified!</h2>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Redirecting you to home...</p>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col font-['Instrument_Sans'] selection:bg-gray-900 selection:text-white">
          <Header />
          <main className="flex-1">
            <Routes>
              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/signup" element={<Navigate to="/register" replace />} />
              <Route path="/verify" element={<VerifyEmail />} />

              {/* Customer */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/search" element={<MapView />} />
              <Route path="/booking" element={<BookingView />} />
              <Route path="/tracking" element={<TrackingView />} />

              {/* Worker */}
              <Route path="/worker" element={<WorkerLogin />} />
              <Route path="/worker/dashboard" element={
                <ProtectedRoute requiredRole="worker" loginPath="/worker">
                  <WorkerDashboard />
                </ProtectedRoute>
              } />

              {/* Admin */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requiredRole="admin" loginPath="/admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
