import React, { useState, useEffect } from 'react';
import { Briefcase, Star, DollarSign, Zap, Clock, MapPin, Phone, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getTradeIcon } from '@/lib/utils';
import { STATUS_CONFIG } from '@/data/constants';
import { requestOneSignalPush } from '@/lib/onesignal';
import WorkerProfileSetup from '@/pages/worker/WorkerProfileSetup';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { useWorkerStats } from '@/hooks/useWorkerStats';
import type { ServiceRequest } from '@/types/payment';

const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { requests, fetchRequests, updateStatus, error } = useServiceRequests(user?.id);
  const { stats } = useWorkerStats(user?.id);
  
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'history' | 'earnings' | 'profile'>('incoming');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchRequests('worker');
      const interval = setInterval(() => fetchRequests('worker'), 10000);
      return () => clearInterval(interval);
    }
  }, [user?.id, fetchRequests]);

  const handleEnableNotifications = async () => {
    const ok = await requestOneSignalPush(user?.id);
    if (ok) setNotificationsEnabled(true);
  };

  const handleRequestPayout = async () => {
    setPayoutLoading(true);
    // TODO: Implement actual payout request in Supabase
    setTimeout(() => {
      setPayoutLoading(false);
      alert('Payout request submitted successfully!');
    }, 2000);
  };

  const handleStatusUpdate = async (requestId: string, status: ServiceRequest['status']) => {
    const result = await updateStatus(requestId, status);
    if (result) {
      fetchRequests('worker');
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
            <div className="w-20 h-20 bg-gray-900 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-2xl">
              {user?.role === 'worker' ? '🛠️' : '👤'}
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{user?.name || 'Worker'}</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Verified {user?.role}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex flex-col gap-2">
              {!notificationsEnabled && (
                <button onClick={handleEnableNotifications} className="flex items-center gap-2 px-5 py-3 bg-amber-50 text-amber-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-amber-100 hover:bg-amber-100 transition-colors w-fit">
                  <Bell className="w-4 h-4" /> Enable Alerts
                </button>
              )}
              <div
                className="onesignal-customlink-container min-h-[44px] flex items-center"
                aria-label="Notification subscription"
              />
            </div>
            <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-emerald-100 sm:ml-auto">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" /> Online
            </div>
          </div>
        </div>

        {/* Stats */}
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

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-400 hover:text-gray-900'}`}>
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
                  <span className="text-lg">{getTradeIcon(job.trade)}</span>
                  <p className="font-black text-gray-900">{job.description}</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location_text}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleStatusUpdate(job.id, 'cancelled')}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-colors"
                >
                  Decline
                </button>
                <button 
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
              <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location_text}</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {job.customer_phone}</span>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                {job.status === 'accepted' && (
                  <button onClick={() => handleStatusUpdate(job.id, 'en_route')} className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Start Trip</button>
                )}
                {job.status === 'en_route' && (
                  <button onClick={() => handleStatusUpdate(job.id, 'arrived')} className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Mark Arrived</button>
                )}
                {job.status === 'arrived' && (
                  <button onClick={() => handleStatusUpdate(job.id, 'in_progress')} className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Start Work</button>
                )}
                {job.status === 'in_progress' && (
                  <button onClick={() => handleStatusUpdate(job.id, 'completed')} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Mark Completed</button>
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
