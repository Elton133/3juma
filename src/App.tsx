import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import InstallAppModal from '@/components/InstallAppModal';
import LandingPage from '@/pages/customer/LandingPage';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import WorkerLogin from '@/pages/worker/WorkerLogin';
import AdminLogin from '@/pages/admin/AdminLogin';
import { ROUTES } from '@/lib/routes';
import { getPostLoginPath } from '@/lib/postLoginRedirect';
import PageSeo from '@/components/PageSeo';

const MapView = lazy(() => import('@/pages/customer/MapView'));
const BookingView = lazy(() => import('@/pages/customer/BookingView'));
const TrackingView = lazy(() => import('@/pages/customer/TrackingView'));
const WorkerDashboard = lazy(() => import('@/pages/worker/WorkerDashboard'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));

const routeFallback = (
  <div className="min-h-[50vh] flex items-center justify-center bg-[#fafafa]">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading…</p>
  </div>
);

/** When a push notification is clicked, the SW may ask an open tab to navigate here (navigate() isn’t always available). */
function ServiceWorkerNavigationBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'NAVIGATE_TO' || typeof event.data.url !== 'string') return;
      try {
        const u = new URL(event.data.url);
        if (u.origin === window.location.origin) {
          navigate(`${u.pathname}${u.search}${u.hash}`);
        }
      } catch {
        /* ignore */
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [navigate]);
  return null;
}

const VerifyEmail = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      navigate(ROUTES.home, { replace: true });
      return;
    }

    let finished = false;
    const goNext = () => {
      if (finished) return;
      finished = true;
      void getPostLoginPath().then((path) => navigate(path, { replace: true }));
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) goNext();
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) goNext();
    });

    const fallback = setTimeout(goNext, 5000);
    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor font-black">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Email Verified!</h2>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Redirecting…</p>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PageSeo />
        <ServiceWorkerNavigationBridge />
        <div className="min-h-screen flex flex-col font-['Instrument_Sans'] selection:bg-gray-900 selection:text-white">
          <InstallAppModal />
          <Header />
          <main className="flex-1">
            <Suspense fallback={routeFallback}>
              <Routes>
                <Route path={ROUTES.login} element={<Login />} />
                <Route path={ROUTES.register} element={<Register />} />
                <Route path={ROUTES.forgotPassword} element={<ForgotPassword />} />
                <Route path={ROUTES.resetPassword} element={<ResetPassword />} />
                <Route path="/signup" element={<Navigate to={ROUTES.register} replace />} />
                <Route path={ROUTES.verify} element={<VerifyEmail />} />

                <Route path={ROUTES.home} element={<LandingPage />} />
                <Route path={ROUTES.search} element={<MapView />} />
                <Route path={ROUTES.booking} element={<BookingView />} />
                <Route path={ROUTES.tracking} element={<TrackingView />} />

                <Route path={ROUTES.workerLogin} element={<WorkerLogin />} />
                <Route
                  path={ROUTES.workerDashboard}
                  element={
                    <ProtectedRoute requiredRole="worker" loginPath={ROUTES.workerLogin}>
                      <WorkerDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path={ROUTES.adminLogin} element={<AdminLogin />} />
                <Route
                  path={ROUTES.adminDashboard}
                  element={
                    <ProtectedRoute requiredRole="admin" loginPath={ROUTES.adminLogin}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
