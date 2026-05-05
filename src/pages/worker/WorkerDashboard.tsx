import React, { useState, useEffect } from 'react';
import { Briefcase, Star, DollarSign, Zap, Clock, MapPin, Phone, Bell } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Briefcase01Icon, User03Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '@/hooks/useAuth';
import { TradeIcon } from '@/components/TradeIcon';
import { STATUS_CONFIG } from '@/data/constants';
import { supabase } from '@/lib/supabase';
import { isPushApiSupported, isWebPushConfigured, subscribeWebPush } from '@/lib/webPushClient';
import WorkerProfileSetup from '@/pages/worker/WorkerProfileSetup';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { useWorkerStats } from '@/hooks/useWorkerStats';
import type { ServiceRequest } from '@/types/payment';
import { trackEvent } from '@/lib/analytics';

function dialablePhone(job: ServiceRequest) {
  const raw = (job.customer_phone || job.guest_phone || '').trim();
  return raw.replace(/\s/g, '');
}

const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { requests, fetchRequests, updateStatus, error } = useServiceRequests(user?.id);
  const { stats } = useWorkerStats(user?.id);
  
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'history' | 'earnings' | 'profile'>('incoming');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [onboardingChecks, setOnboardingChecks] = useState({
    hasPhone: false,
    hasTrade: false,
    hasArea: false,
    hasGhanaFront: false,
    hasGhanaBack: false,
    verificationSubmitted: false,
  });

  useEffect(() => {
    if (user?.id) {
      fetchRequests('worker');
      const interval = setInterval(() => fetchRequests('worker'), 10000);
      return () => clearInterval(interval);
    }
  }, [user?.id, fetchRequests]);

  useEffect(() => {
    if (!supabase || !user?.id) {
      setOnboardingLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setOnboardingLoading(true);
      const { data: userRow } = await supabase.from('users').select('phone').eq('id', user.id).maybeSingle();
      const { data: workerProfile } = await supabase
        .from('worker_profiles')
        .select('id, trade, area, verification_status')
        .eq('user_id', user.id)
        .maybeSingle();

      let hasFront = false;
      let hasBack = false;
      if (workerProfile?.id) {
        const { data: docs } = await supabase
          .from('verification_documents')
          .select('document_type')
          .eq('worker_id', workerProfile.id);
        hasFront = !!docs?.some((d) => d.document_type === 'ghana_card_front');
        hasBack = !!docs?.some((d) => d.document_type === 'ghana_card_back');
      }

      if (!cancelled) {
        setOnboardingChecks({
          hasPhone: !!userRow?.phone,
          hasTrade: !!workerProfile?.trade && workerProfile.trade !== 'none',
          hasArea: !!workerProfile?.area && workerProfile.area !== 'none',
          hasGhanaFront: hasFront,
          hasGhanaBack: hasBack,
          verificationSubmitted:
            workerProfile?.verification_status === 'pending' || workerProfile?.verification_status === 'approved',
        });
        setOnboardingLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, requests.length]);

  const onboardingItems = [
    { label: 'Contact number', done: onboardingChecks.hasPhone },
    { label: 'Trade selected', done: onboardingChecks.hasTrade },
    { label: 'Area selected', done: onboardingChecks.hasArea },
    { label: 'Ghana card (front)', done: onboardingChecks.hasGhanaFront },
    { label: 'Ghana card (back)', done: onboardingChecks.hasGhanaBack },
    { label: 'Verification submitted', done: onboardingChecks.verificationSubmitted },
  ];
  const completedOnboarding = onboardingItems.filter((i) => i.done).length;
  const profileLocked = !onboardingLoading && completedOnboarding < onboardingItems.length;

  useEffect(() => {
    if (profileLocked && activeTab !== 'profile') {
      setActiveTab('profile');
    }
  }, [profileLocked, activeTab]);

  const handleEnableNotifications = async () => {
    setPushMessage(null);
    if (!supabase || !user?.id) return;
    if (!isWebPushConfigured()) {
      setPushMessage('Add VITE_VAPID_PUBLIC_KEY to .env (run npm run vapid:keys), then restart the app.');
      return;
    }
    if (!isPushApiSupported()) {
      setPushMessage('Push is not supported in this browser.');
      return;
    }
    const result = await subscribeWebPush(supabase, user.id);
    if (result.ok) {
      setNotificationsEnabled(true);
      setPushMessage(null);
      return;
    }
    const hints: Record<string, string> = {
      not_configured: 'Missing VITE_VAPID_PUBLIC_KEY.',
      not_supported: 'This browser does not support Web Push.',
      no_sw: 'Service worker not ready — wait a few seconds, use HTTPS, or run a production build.',
      permission_denied: 'Notifications are blocked. Enable them in browser settings for this site.',
      subscribe_failed: result.detail || 'Could not subscribe.',
    };
    setPushMessage(hints[result.reason] || 'Could not enable alerts.');
  };

  const handleRequestPayout = async () => {
    setPayoutLoading(true);
    // TODO: Implement actual payout request in Supabase
    setTimeout(() => {
      setPayoutLoading(false);
      alert('Payout request submitted successfully!');
    }, 2000);
  };

  const handleStatusUpdate = async (
    requestId: string,
    status: ServiceRequest['status'],
    opts?: { skipCustomerNotify?: boolean },
  ) => {
    const result = await updateStatus(requestId, status, {}, opts);
    if (result) {
      if (status === 'accepted') void trackEvent('worker_accepted', { service_request_id: requestId });
      if (status === 'completed') void trackEvent('worker_completed_job', { service_request_id: requestId });
      fetchRequests('worker');
    }
  };

  /** One tap for the worker: advance through internal steps without extra customer pushes. */
  const handleMarkJobComplete = async (job: ServiceRequest) => {
    const id = job.id;
    if (job.status === 'en_route') {
      const r1 = await updateStatus(id, 'arrived', {}, { skipCustomerNotify: true });
      if (!r1) return;
      const r2 = await updateStatus(id, 'in_progress', {}, { skipCustomerNotify: true });
      if (!r2) return;
      const r3 = await updateStatus(id, 'completed');
      if (r3) {
        void trackEvent('worker_completed_job', { service_request_id: id });
        fetchRequests('worker');
      }
      return;
    }
    if (job.status === 'arrived') {
      const r1 = await updateStatus(id, 'in_progress', {}, { skipCustomerNotify: true });
      if (!r1) return;
      const r2 = await updateStatus(id, 'completed');
      if (r2) {
        void trackEvent('worker_completed_job', { service_request_id: id });
        fetchRequests('worker');
      }
      return;
    }
    if (job.status === 'in_progress') {
      const r = await updateStatus(id, 'completed');
      if (r) {
        void trackEvent('worker_completed_job', { service_request_id: id });
        fetchRequests('worker');
      }
    }
  };

  const incomingJobs = requests.filter((j: ServiceRequest) => j.status === 'pending');
  const activeJobs = requests.filter((j: ServiceRequest) => ['accepted', 'en_route', 'in_progress', 'arrived'].includes(j.status));
  const completedJobs = requests.filter((j: ServiceRequest) => j.status === 'completed');

  const tabs = [
    { id: 'incoming' as const, label: 'Incoming', count: incomingJobs.length },
    { id: 'active' as const, label: 'Active', count: activeJobs.length },
    { id: 'history' as const, label: 'History', count: completedJobs.length },
    { id: 'earnings' as const, label: 'Earnings', count: null },
    { id: 'profile' as const, label: 'Profile', count: null },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-bold text-red-500 uppercase tracking-wider">
            {error}
          </div>
        )}
        
        {/* Profile Header */}
        <div className="glass rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-white/40 shadow-lg">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gray-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl">
              <HugeiconsIcon
                icon={user?.role === 'worker' ? Briefcase01Icon : User03Icon}
                size={40}
                strokeWidth={1.5}
                className="text-white"
              />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{user?.name || 'Worker'}</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Verified {user?.role}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex flex-col gap-2 max-w-xs">
              {!notificationsEnabled && (
                <button
                  type="button"
                  onClick={() => void handleEnableNotifications()}
                  className="flex items-center gap-2 px-5 py-3 bg-amber-50 text-amber-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-amber-100 hover:bg-amber-100 transition-colors w-fit"
                >
                  <Bell className="w-4 h-4" /> Web push alerts
                </button>
              )}
              {notificationsEnabled && (
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Push enabled — send from your backend with the web-push package.</p>
              )}
              {pushMessage && (
                <p className="text-[10px] font-bold text-amber-800 leading-snug">{pushMessage}</p>
              )}
            </div>
            <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-emerald-100 sm:ml-auto">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" /> Online
            </div>
          </div>
        </div>

        {/* Worker onboarding */}
        {profileLocked && (
          <div className="glass rounded-[2rem] p-6 border border-amber-100 bg-amber-50/70">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Complete your profile to receive jobs</p>
                <p className="text-sm font-bold text-amber-900 mt-2">
                  Progress: {completedOnboarding}/{onboardingItems.length} steps done
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="px-5 py-3 bg-amber-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-800 transition-colors"
              >
                Continue profile
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {onboardingItems.map((item) => (
                <div key={item.label} className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-amber-700 border border-amber-200'}`}>
                  {item.done ? '✓ ' : '○ '}
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {!profileLocked && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { l: 'Jobs Done', v: stats.jobsDone.toString(), Icon: Briefcase },
              { l: 'Rating', v: stats.rating.toFixed(1), Icon: Star },
              { l: 'Wallet', v: `₵${stats.walletBalance}`, Icon: DollarSign },
              { l: 'Rank', v: stats.rank, Icon: Zap },
            ].map((s, idx) => (
              <div key={idx} className="glass rounded-[2rem] p-6 text-center border-white/40 hover:scale-105 transition-transform">
                <s.Icon className="w-5 h-5 mx-auto mb-3 text-gray-300" />
                <p className="text-2xl font-black text-gray-900 tracking-tighter">{s.v}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={profileLocked && tab.id !== 'profile'}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-400 hover:text-gray-900'} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {tab.label}
              {tab.count !== null && <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'}`}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Job List */}
        <div className="space-y-4">
          {activeTab === 'incoming' && incomingJobs.map((job) => (
            <div key={job.id} className="glass rounded-[2rem] p-6 border-white/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <TradeIcon tradeId={job.trade} size={22} className="text-gray-900" />
                  <p className="font-black text-gray-900">{job.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location_text}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {(job.customer_phone || job.guest_phone) && (
                    <span className="flex items-center gap-1 text-gray-600">
                      <Phone className="w-3 h-3" /> {job.customer_phone || job.guest_phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                {dialablePhone(job) && (
                  <a
                    href={`tel:${dialablePhone(job)}`}
                    className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-black transition-colors inline-flex items-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call customer
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleStatusUpdate(job.id, 'cancelled')}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-colors"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate(job.id, 'accepted')}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'active' && activeJobs.map((job) => (
            <div key={job.id} className="glass rounded-[2rem] p-6 border-white/40">
              <div className="flex items-center justify-between mb-3">
                <p className="font-black text-gray-900">{job.description}</p>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_CONFIG[job.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-100 text-gray-500'}`}>
                  {STATUS_CONFIG[job.status as keyof typeof STATUS_CONFIG]?.label || job.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location_text}</span>
                {(job.customer_phone || job.guest_phone) ? (
                  <a href={`tel:${dialablePhone(job)}`} className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800">
                    <Phone className="w-3 h-3" /> {job.customer_phone || job.guest_phone}
                  </a>
                ) : (
                  <span className="text-amber-600 normal-case">No phone on file</span>
                )}
              </div>
              <p className="text-[9px] font-bold text-gray-400 mt-2 leading-snug">
                Customer alerts: job accepted, on the way, and completed — no extra taps needed to sync their app.
              </p>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                {dialablePhone(job) && (
                  <a
                    href={`tel:${dialablePhone(job)}`}
                    className="flex-1 min-w-[140px] py-3 bg-white border-2 border-gray-900 text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-gray-50 inline-flex items-center justify-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                )}
                {job.status === 'accepted' && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(job.id, 'en_route')}
                    className="flex-1 min-w-[140px] py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    On my way
                  </button>
                )}
                {['en_route', 'arrived', 'in_progress'].includes(job.status) && (
                  <button
                    type="button"
                    onClick={() => void handleMarkJobComplete(job)}
                    className="flex-1 min-w-[160px] py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600"
                  >
                    Mark job complete
                  </button>
                )}
              </div>
            </div>
          ))}

          {activeTab === 'history' && completedJobs.map((job) => (
            <div key={job.id} className="glass rounded-[2rem] p-6 border-white/40 opacity-70">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{job.description}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{job.location_text} • {new Date(job.created_at).toLocaleDateString()}</p>
                </div>
                <p className="font-black text-gray-900">Paid ₵{job.final_amount || '?'}</p>
              </div>
            </div>
          ))}

          {activeTab === 'earnings' && (
            <div className="glass rounded-[2.5rem] p-10 border-white/40 text-center space-y-8">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Total Earnings This Month</p>
                <p className="text-6xl font-black text-gray-900 tracking-tighter">₵{stats.monthlyEarnings}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-8 bg-gray-900 text-white rounded-[2rem] text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Wallet Balance</p>
                  <p className="text-3xl font-black">₵{stats.walletBalance}</p>
                  <button 
                    onClick={handleRequestPayout}
                    disabled={stats.walletBalance < 20 || payoutLoading}
                    className="w-full mt-6 py-4 bg-white text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl disabled:opacity-20 transition-all active:scale-[0.98]"
                  >
                    {payoutLoading ? 'Processing...' : 'Request Payout'}
                  </button>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-4 text-center">Minimum payout: ₵20.00</p>
                </div>
                
                <div className="grid grid-rows-2 gap-4">
                  <div className="p-6 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Payouts</p>
                    <p className="text-2xl font-black text-gray-900">₵1,240</p>
                  </div>
                  <div className="p-6 bg-amber-50 rounded-[1.5rem] border border-amber-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Pending</p>
                    <p className="text-2xl font-black text-gray-900">₵0</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <WorkerProfileSetup />
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
