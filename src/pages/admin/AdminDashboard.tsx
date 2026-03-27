import React, { useState, useEffect } from 'react';
import { Navigation, Users, TrendingUp, MapPin, Clock, Phone, Star, Shield, Eye, Filter, Search, Bell, CheckCircle, X as XIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { generateMockWorkers } from '@/data/mock-workers';
import { generateMockJobs } from '@/data/mock-jobs';
import { getTradeName, getTradeIcon } from '@/lib/utils';
import { TRADES, STATUS_CONFIG } from '@/data/constants';
import type { Worker } from '@/types/worker';
import type { Job } from '@/types/job';

const allWorkers = generateMockWorkers();

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'jobs' | 'workers' | 'analytics'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [workerSearch, setWorkerSearch] = useState('');

  useEffect(() => {
    setJobs(generateMockJobs(allWorkers));
  }, []);

  const filteredJobs = jobFilter === 'all' ? jobs : jobs.filter((j) => j.status === jobFilter);

  const filteredWorkers = workerSearch
    ? allWorkers.filter((w) => w.name.toLowerCase().includes(workerSearch.toLowerCase()) || getTradeName(w.trade).toLowerCase().includes(workerSearch.toLowerCase()))
    : allWorkers.slice(0, 20);

  const stats = {
    activeJobs: jobs.filter((j) => ['pending', 'confirmed', 'en_route', 'in_progress'].includes(j.status)).length,
    onlineWorkers: allWorkers.filter((w) => w.available).length,
    totalWorkers: allWorkers.length,
    completedToday: jobs.filter((j) => j.status === 'completed').length,
    revenue: jobs.filter((j) => j.status === 'completed').reduce((sum, j) => sum + j.amount, 0),
  };

  const tabs = [
    { id: 'jobs' as const, label: 'Live Dispatch' },
    { id: 'workers' as const, label: 'Fleet Management' },
    { id: 'analytics' as const, label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-baseline justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Command Center</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Welcome, {user?.name || 'Dispatcher'}</p>
          </div>
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" /> Live Monitoring
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { l: 'Active Dispatches', v: stats.activeJobs, Icon: Navigation, color: 'text-blue-500' },
            { l: 'Fleet Online', v: `${stats.onlineWorkers}/${stats.totalWorkers}`, Icon: Users, color: 'text-emerald-500' },
            { l: 'Completed Today', v: stats.completedToday, Icon: CheckCircle, color: 'text-purple-500' },
            { l: 'Revenue', v: `₵${stats.revenue.toLocaleString()}`, Icon: TrendingUp, color: 'text-amber-500' },
          ].map((s, i) => (
            <div key={i} className="glass rounded-[2rem] p-6 border-white/40">
              <s.Icon className={`w-6 h-6 ${s.color} mb-4`} />
              <p className="text-3xl font-black text-gray-900 tracking-tighter">{s.v}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-400 hover:text-gray-900'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {['all', 'pending', 'confirmed', 'en_route', 'in_progress', 'completed', 'cancelled'].map((f) => (
                <button key={f} onClick={() => setJobFilter(f)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap ${jobFilter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400 hover:text-gray-900'}`}>
                  {f === 'all' ? 'All' : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label || f}
                </button>
              ))}
            </div>

            {filteredJobs.map((job) => (
              <div key={job.id} className="glass rounded-[2rem] p-6 border-white/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-lg">{getTradeIcon(job.trade)}</span>
                    <p className="font-black text-gray-900 truncate">{job.description}</p>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${STATUS_CONFIG[job.status].color}`}>{STATUS_CONFIG[job.status].label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.locationText}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1">Customer: {job.customerName}</span>
                    <span className="flex items-center gap-1">Worker: {job.workerName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-black text-gray-900">₵{job.amount}</span>
                  <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><Eye className="w-4 h-4 text-gray-400" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'workers' && (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={workerSearch} onChange={(e) => setWorkerSearch(e.target.value)} placeholder="Search workers..." className="w-full h-12 pl-12 pr-4 bg-white border-2 border-gray-100 focus:border-gray-900 rounded-2xl text-gray-900 font-bold transition-all outline-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkers.map((worker) => (
                <div key={worker.id} className="glass rounded-[2rem] p-5 border-white/40">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={worker.profilePhoto} alt={worker.name} className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-gray-900 truncate">{worker.name}</p>
                        {worker.verified && <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{getTradeIcon(worker.trade)} {getTradeName(worker.trade)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> {worker.rating.toFixed(1)}</span>
                    <span>{worker.jobsCompleted} jobs</span>
                    <span className={`px-2 py-0.5 rounded-lg ${worker.available ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {worker.available ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  {worker.strikes > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                      <AlertCircle className="w-3 h-3" /> {worker.strikes} strike{worker.strikes > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="glass rounded-[2.5rem] p-10 border-white/40 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Monthly Gross Volume</p>
              <p className="text-7xl font-black text-gray-900 tracking-tighter">₵{(stats.revenue * 4).toLocaleString()}</p>
              <p className="text-xs font-bold text-emerald-500 mt-4">+18% from last month</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { l: 'Avg. Job Value', v: `₵${Math.round(stats.revenue / (stats.completedToday || 1))}` },
                { l: 'Completion Rate', v: '94%' },
                { l: 'Avg. Response', v: '18 mins' },
                { l: 'Customer Rating', v: '4.8/5' },
              ].map((s, i) => (
                <div key={i} className="glass rounded-[2rem] p-6 text-center border-white/40">
                  <p className="text-2xl font-black text-gray-900 tracking-tighter">{s.v}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="glass rounded-[2.5rem] p-8 border-white/40">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Jobs by Trade</p>
              <div className="space-y-4">
                {TRADES.map((trade) => {
                  const count = jobs.filter((j) => j.trade === trade.id).length;
                  const percentage = jobs.length > 0 ? (count / jobs.length) * 100 : 0;
                  return (
                    <div key={trade.id} className="flex items-center gap-4">
                      <span className="w-8 text-xl text-center">{trade.icon}</span>
                      <span className="w-28 text-xs font-bold text-gray-900 truncate">{trade.name}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: trade.color }} />
                      </div>
                      <span className="text-xs font-black text-gray-900 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
