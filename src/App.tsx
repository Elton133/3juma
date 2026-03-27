import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/pages/customer/LandingPage';
import MapView from '@/pages/customer/MapView';
import BookingView from '@/pages/customer/BookingView';
import TrackingView from '@/pages/customer/TrackingView';
import WorkerLogin from '@/pages/worker/WorkerLogin';
import WorkerDashboard from '@/pages/worker/WorkerDashboard';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col font-['Instrument_Sans'] selection:bg-gray-900 selection:text-white">
          <Header />
          <main className="flex-1">
            <Routes>
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
