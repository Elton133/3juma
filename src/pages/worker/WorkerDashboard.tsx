import React, { useState, useEffect } from 'react';
import { Briefcase, Star, DollarSign, Zap, Clock, CheckCircle, Navigation, MapPin, Phone, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { generateMockWorkers } from '@/data/mock-workers';
import { generateMockJobs } from '@/data/mock-jobs';
import { getTradeName, getTradeIcon } from '@/lib/utils';
import { STATUS_CONFIG } from '@/data/constants';
import type { Job } from '@/types/job';
import { requestNotificationPermission } from '@/lib/firebase';

const allWorkers = generateMockWorkers();

const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'history' | 'earnings'>('incoming');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    setJobs(generateMockJobs(allWorkers));
  }, []);

  const handleEnableNotifications = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      setNotificationsEnabled(true);
      // TODO: Send token to Supabase backend
    }
  };

  const incomingJobs = jobs.filter((j) => j.status === 'pending').slice(0, 5);
  const activeJobs = jobs.filter((j) => ['confirmed', 'en_route', 'in_progress'].includes(j.status)).slice(0, 5);
  const completedJobs = jobs.filter((j) => j.status === 'completed').slice(0, 10);

  const tabs = [
    { id: 'incoming' as const, label: 'Incoming', count: incomingJobs.length },
    { id: 'active' as const, label: 'Active', count: activeJobs.length },
    { id: 'history' as const, label: 'History', count: completedJobs.length },
    { id: 'earnings' as const, label: 'Earnings', count: null },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="glass rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-white/40 shadow-lg">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gray-900 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-2xl">👤</div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{user?.name || 'Worker'}</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Vetted Professional</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!notificationsEnabled && (
              <button onClick={handleEnableNotifications} className="flex items-center gap-2 px-5 py-3 bg-amber-50 text-amber-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-amber-100 hover:bg-amber-100 transition-colors">
                <Bell className="w-4 h-4" /> Enable Alerts
              </button>
            )}
            <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-emerald-100">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" /> Online
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { l: 'Jobs Done', v: '154', Icon: Briefcase },
            { l: 'Rating', v: '4.9', Icon: Star },
            { l: 'Wallet', v: '₵840', Icon: DollarSign },
            { l: 'Rank', v: 'Top 1%', Icon: Zap },
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
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.locationText}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-6 py-3 border-2 border-gray-200 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-colors">Decline</button>
                <button className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-colors">Accept</button>
              </div>
            </div>
          ))}

          {activeTab === 'active' && activeJobs.map((job) => (
            <div key={job.id} className="glass rounded-[2rem] p-6 border-white/40">
              <div className="flex items-center justify-between mb-3">
                <p className="font-black text-gray-900">{job.description}</p>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_CONFIG[job.status].color}`}>{STATUS_CONFIG[job.status].label}</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.locationText}</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {job.customerPhone}</span>
              </div>
            </div>
          ))}

          {activeTab === 'history' && completedJobs.map((job) => (
            <div key={job.id} className="glass rounded-[2rem] p-6 border-white/40 opacity-70">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{job.description}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{job.locationText} • {job.createdAt.toLocaleDateString()}</p>
                </div>
                <p className="font-black text-gray-900">₵{job.amount}</p>
              </div>
            </div>
          ))}

          {activeTab === 'earnings' && (
            <div className="glass rounded-[2.5rem] p-10 border-white/40 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Total Earnings This Month</p>
              <p className="text-6xl font-black text-gray-900 tracking-tighter">₵2,840</p>
              <p className="text-xs font-bold text-emerald-500 mt-4">+12% from last month</p>
              <div className="grid grid-cols-3 gap-4 mt-10">
                {[
                  { l: 'Completed', v: '23' },
                  { l: 'Cancelled', v: '2' },
                  { l: 'Avg. Per Job', v: '₵123' },
                ].map((s, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-xl font-black text-gray-900 tracking-tight">{s.v}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
