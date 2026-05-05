import React, { useState, useEffect, useCallback } from 'react';
import { Navigation, Users, TrendingUp, MapPin, Clock, Star, Shield, Eye, Search, CheckCircle, AlertCircle, Award, Image as ImageIcon, Bell, Send, Phone, RefreshCw, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getTradeName } from '@/lib/utils';
import { TradeIcon } from '@/components/TradeIcon';
import { TRADES, STATUS_CONFIG } from '@/data/constants';
import type { Worker } from '@/types/worker';
import { useAdminVerification } from '@/hooks/useAdminVerification';
import { triggerMarketingPush } from '@/lib/appPushTriggers';
import { sendEmailBroadcast, type EmailAudience } from '@/lib/emailBroadcast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type AdminJob = {
  id: string;
  customerName: string;
  customerPhone: string;
  workerName: string;
  trade: string;
  description: string;
  locationText: string;
  status: string;
  createdAt: Date;
  amount: number;
};

type Lead = {
  id: string;
  name: string | null;
  phone: string;
  trade: string | null;
  area: string | null;
  note: string | null;
  status: string;
  created_at: string;
};

type AnalyticsRow = {
  event_name: string;
  created_at: string;
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'jobs' | 'workers' | 'analytics' | 'leads' | 'verification' | 'email' | 'push'>('jobs');
  const { pendingWorkers, processing, approveWorker, rejectWorker } = useAdminVerification();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsRow[]>([]);
  const [loadingLiveData, setLoadingLiveData] = useState(true);
  const [liveDataError, setLiveDataError] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [workerSearch, setWorkerSearch] = useState('');
  const [pushTitle, setPushTitle] = useState('3juma');
  const [pushBody, setPushBody] = useState('');
  const [pushUrl, setPushUrl] = useState('/');
  const [pushBusy, setPushBusy] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [emailAudience, setEmailAudience] = useState<EmailAudience>('all');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailCtaLabel, setEmailCtaLabel] = useState('Open 3juma');
  const [emailCtaUrl, setEmailCtaUrl] = useState('/');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchLiveData = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setLiveDataError('Supabase is not configured, so admin live data cannot load.');
      setLoadingLiveData(false);
      return;
    }

    setLoadingLiveData(true);
    setLiveDataError(null);

    try {
      const [jobsRes, workersRes, leadsRes, analyticsRes] = await Promise.all([
        supabase
          .from('service_requests')
          .select(`
            id, trade, description, location_text, status, created_at, estimated_amount, final_amount, guest_name, guest_phone,
            customer:users!service_requests_customer_id_fkey(full_name, phone),
            worker:users!service_requests_worker_id_fkey(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('worker_profiles')
          .select('*, users!worker_profiles_user_id_fkey(full_name, phone)')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('analytics_events').select('event_name, created_at').order('created_at', { ascending: false }).limit(500),
      ]);

      if (jobsRes.error) throw jobsRes.error;
      if (workersRes.error) throw workersRes.error;
      if (leadsRes.error) throw leadsRes.error;
      if (analyticsRes.error) throw analyticsRes.error;

      setJobs(
        (jobsRes.data || []).map((row: any) => ({
          id: row.id,
          trade: row.trade,
          description: row.description,
          locationText: row.location_text,
          status: row.status,
          createdAt: new Date(row.created_at),
          amount: Number(row.final_amount || row.estimated_amount || 20),
          customerName: row.customer?.full_name || row.guest_name || 'Guest customer',
          customerPhone: row.customer?.phone || row.guest_phone || '',
          workerName: row.worker?.full_name || 'Unassigned',
        }))
      );

      setWorkers(
        (workersRes.data || []).map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          name: row.users?.full_name || 'Unnamed worker',
          trade: row.trade,
          areaName: row.area,
          lat: 0,
          lng: 0,
          rating: Number(row.rating_avg || 0),
          jobsCompleted: Number(row.jobs_completed || 0),
          verified: Boolean(row.is_verified),
          available: Boolean(row.is_available),
          strikes: Number(row.strikes || 0),
          subscriptionActive: Boolean(row.subscription_active),
          profilePhoto: row.profile_photo_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(row.users?.full_name || 'Worker')}`,
          phone: row.users?.phone || '',
          bio: row.bio || '',
          yearsExperience: Number(row.years_experience || 0),
        }))
      );
      setLeads((leadsRes.data || []) as Lead[]);
      setAnalyticsEvents((analyticsRes.data || []) as AnalyticsRow[]);
    } catch (err) {
      setLiveDataError(err instanceof Error ? err.message : 'Failed to load admin data.');
    } finally {
      setLoadingLiveData(false);
    }
  }, []);

  useEffect(() => {
    void fetchLiveData();
  }, [fetchLiveData]);

  const filteredJobs = jobFilter === 'all' ? jobs : jobs.filter((j) => j.status === jobFilter);

  const filteredWorkers = workerSearch
    ? workers.filter((w) => w.name.toLowerCase().includes(workerSearch.toLowerCase()) || getTradeName(w.trade).toLowerCase().includes(workerSearch.toLowerCase()))
    : workers.slice(0, 20);

  const stats = {
    activeJobs: jobs.filter((j) => ['pending', 'accepted', 'en_route', 'in_progress'].includes(j.status)).length,
    onlineWorkers: workers.filter((w) => w.available).length,
    totalWorkers: workers.length,
    completedToday: jobs.filter((j) => j.status === 'completed' && j.createdAt.toDateString() === new Date().toDateString()).length,
    revenue: jobs.filter((j) => j.status === 'completed').reduce((sum, j) => sum + j.amount, 0),
  };

  const eventCounts = analyticsEvents.reduce<Record<string, number>>((acc, event) => {
    acc[event.event_name] = (acc[event.event_name] || 0) + 1;
    return acc;
  }, {});

  const tabs = [
    { id: 'jobs' as const, label: 'Live Dispatch', count: null },
    { id: 'workers' as const, label: 'Fleet Management', count: null },
    { id: 'leads' as const, label: 'Leads', count: leads.filter((lead) => lead.status === 'new').length || null },
    { id: 'verification' as const, label: 'Verification', count: pendingWorkers.length || null },
    { id: 'analytics' as const, label: 'Analytics', count: null },
    { id: 'email' as const, label: 'Email', count: null },
    { id: 'push' as const, label: 'Push', count: null },
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
          <button
            type="button"
            onClick={() => void fetchLiveData()}
            disabled={loadingLiveData}
            className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-3 disabled:opacity-50"
          >
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            {loadingLiveData ? 'Loading live data' : 'Live Monitoring'}
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLiveData ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {liveDataError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-xs font-bold text-red-600">
            Admin data could not load: {liveDataError}
          </div>
        )}

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
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-400 hover:text-gray-900'}`}>
              {tab.label}
              {tab.count !== null && <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeTab === tab.id ? 'bg-white/20' : 'bg-red-50 text-red-500'}`}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {['all', 'pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'].map((f) => (
                <button key={f} onClick={() => setJobFilter(f)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap ${jobFilter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400 hover:text-gray-900'}`}>
                  {f === 'all' ? 'All' : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label || f}
                </button>
              ))}
            </div>

            {filteredJobs.length === 0 ? (
              <div className="glass rounded-[2.5rem] p-12 border-white/40 text-center">
                <Navigation className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="font-black text-gray-900 text-xl">No jobs yet</p>
                <p className="text-xs text-gray-400 mt-2">New service requests will show here.</p>
              </div>
            ) : filteredJobs.map((job) => (
              <div key={job.id} className="glass rounded-[2rem] p-6 border-white/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <TradeIcon tradeId={job.trade} size={22} className="text-gray-900" />
                    <p className="font-black text-gray-900 truncate">{job.description}</p>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${STATUS_CONFIG[job.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-100 text-gray-500'}`}>{STATUS_CONFIG[job.status as keyof typeof STATUS_CONFIG]?.label || job.status}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.locationText}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1">Customer: {job.customerName}</span>
                    {job.customerPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {job.customerPhone}</span>}
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
              {filteredWorkers.length === 0 ? (
                <div className="glass rounded-[2.5rem] p-12 border-white/40 text-center md:col-span-2 lg:col-span-3">
                  <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="font-black text-gray-900 text-xl">No workers found</p>
                  <p className="text-xs text-gray-400 mt-2">Worker profiles from Supabase will show here.</p>
                </div>
              ) : filteredWorkers.map((worker) => (
                <div key={worker.id} className="glass rounded-[2rem] p-5 border-white/40">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={worker.profilePhoto} alt={worker.name} className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-gray-900 truncate">{worker.name}</p>
                        {worker.verified && <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <TradeIcon tradeId={worker.trade} size={14} className="text-gray-400" />
                        {getTradeName(worker.trade)}
                      </p>
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
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Tracked Funnel Events</p>
              <p className="text-7xl font-black text-gray-900 tracking-tighter">{analyticsEvents.length.toLocaleString()}</p>
              <p className="text-xs font-bold text-emerald-500 mt-4">Live from analytics_events</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { l: 'Signup Started', v: eventCounts.signup_started || 0 },
                { l: 'Signup Done', v: eventCounts.signup_completed || 0 },
                { l: 'Profile Done', v: eventCounts.profile_completed || 0 },
                { l: 'Bookings', v: eventCounts.booking_success || 0 },
              ].map((s, i) => (
                <div key={i} className="glass rounded-[2rem] p-6 text-center border-white/40">
                  <p className="text-2xl font-black text-gray-900 tracking-tighter">{s.v}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { l: 'Avg. Job Value', v: `₵${Math.round(stats.revenue / (jobs.filter((j) => j.status === 'completed').length || 1))}` },
                { l: 'Lead Captures', v: eventCounts.lead_capture_submitted || leads.length },
                { l: 'Worker Accepted', v: eventCounts.worker_accepted || 0 },
                { l: 'Worker Completed', v: eventCounts.worker_completed_job || 0 },
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
                      <span className="w-8 flex justify-center shrink-0">
                        <TradeIcon tradeId={trade.id} size={22} className="text-gray-900" />
                      </span>
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

        {activeTab === 'leads' && (
          <div className="space-y-4">
            {leads.length === 0 ? (
              <div className="glass rounded-[2.5rem] p-12 border-white/40 text-center">
                <Phone className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="font-black text-gray-900 text-xl">No captured leads yet</p>
                <p className="text-xs text-gray-400 mt-2">When customers search and no worker is found, their phone requests will appear here.</p>
              </div>
            ) : (
              leads.map((lead) => (
                <div key={lead.id} className="glass rounded-[2rem] p-6 border-white/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-black text-gray-900">{lead.name || 'Unnamed lead'}</p>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">{lead.status}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-wrap">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</span>
                      {lead.trade && <span>{getTradeName(lead.trade)}</span>}
                      {lead.area && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {lead.area}</span>}
                      <span>{new Date(lead.created_at).toLocaleString()}</span>
                    </div>
                    {lead.note && <p className="text-xs font-bold text-gray-500 mt-3">{lead.note}</p>}
                  </div>
                  <a
                    href={`tel:${lead.phone}`}
                    className="px-5 py-3 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest"
                  >
                    Call lead
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'email' && (
          <div className="glass rounded-[2.5rem] p-8 md:p-10 border-white/40 space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Email broadcast</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Admin only — sends through Resend
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Use this for onboarding nudges, service announcements, and profile reminders. Keep broadcasts rare and useful so users do not start ignoring 3juma emails.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Audience</label>
                <select
                  value={emailAudience}
                  onChange={(e) => setEmailAudience(e.target.value as EmailAudience)}
                  className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-sm font-bold text-gray-900 bg-white"
                >
                  <option value="all">All users</option>
                  <option value="customers">Customers</option>
                  <option value="workers">Workers</option>
                  <option value="incomplete_workers">Workers with incomplete profiles</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">CTA URL</label>
                <input
                  value={emailCtaUrl}
                  onChange={(e) => setEmailCtaUrl(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-sm font-bold text-gray-900"
                  placeholder="/worker/dashboard"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Subject</label>
              <input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                maxLength={120}
                className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-sm font-bold text-gray-900"
                placeholder="Finish your 3juma profile"
              />
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Message</label>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={6}
                maxLength={3000}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-900 resize-none"
                placeholder="Write the message users should receive..."
              />
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Button text</label>
              <input
                value={emailCtaLabel}
                onChange={(e) => setEmailCtaLabel(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-sm font-bold text-gray-900"
                placeholder="Open 3juma"
              />
            </div>

            <button
              type="button"
              disabled={emailBusy || !emailSubject.trim() || !emailMessage.trim()}
              onClick={async () => {
                setEmailFeedback(null);
                setEmailBusy(true);
                const r = await sendEmailBroadcast({
                  audience: emailAudience,
                  subject: emailSubject.trim(),
                  message: emailMessage.trim(),
                  ctaLabel: emailCtaLabel.trim() || 'Open 3juma',
                  ctaUrl: emailCtaUrl.trim() || '/',
                });
                setEmailBusy(false);
                setEmailFeedback(
                  r.ok
                    ? { ok: true, text: `Sent ${r.sent ?? 0} email(s) to ${r.recipients ?? 0} recipient(s).` }
                    : { ok: false, text: r.error ?? 'Failed' },
                );
              }}
              className="w-full h-14 rounded-2xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-30"
            >
              <Send className="w-4 h-4" /> Send email broadcast
            </button>
            {emailFeedback && (
              <p
                className={`text-[10px] font-bold uppercase tracking-wider ${emailFeedback.ok ? 'text-emerald-700' : 'text-red-600'}`}
              >
                {emailFeedback.text}
              </p>
            )}
          </div>
        )}

        {activeTab === 'push' && (
          <div className="glass rounded-[2.5rem] p-8 md:p-10 border-white/40 space-y-6 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Web push broadcast</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Admin only — everyone who enabled alerts (workers & customers)
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Deploy the <code className="text-gray-800 bg-gray-100 px-1 rounded">send-app-push</code> Edge Function and set VAPID secrets. Requires{' '}
              <code className="text-gray-800 bg-gray-100 px-1 rounded">push_subscriptions</code> rows from the app.
            </p>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Title</label>
              <input
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-sm font-bold text-gray-900"
              />
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Message</label>
              <textarea
                value={pushBody}
                onChange={(e) => setPushBody(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-900 resize-none"
                placeholder="We’re glad to have you — rate us on the store…"
              />
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Open URL (path)</label>
              <input
                value={pushUrl}
                onChange={(e) => setPushUrl(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-sm font-bold text-gray-900"
              />
            </div>
            <button
              type="button"
              disabled={pushBusy || !pushBody.trim()}
              onClick={async () => {
                setPushFeedback(null);
                setPushBusy(true);
                const r = await triggerMarketingPush({ title: pushTitle.trim() || '3juma', body: pushBody.trim(), url: pushUrl.trim() || '/' });
                setPushBusy(false);
                setPushFeedback(
                  r.ok
                    ? { ok: true, text: `Sent about ${r.sent ?? 0} notification(s).` }
                    : { ok: false, text: r.error ?? 'Failed' },
                );
              }}
              className="w-full h-14 rounded-2xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-30"
            >
              <Send className="w-4 h-4" /> Send to all subscribers
            </button>
            {pushFeedback && (
              <p
                className={`text-[10px] font-bold uppercase tracking-wider ${pushFeedback.ok ? 'text-emerald-700' : 'text-red-600'}`}
              >
                {pushFeedback.text}
              </p>
            )}
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-6">
            {pendingWorkers.length === 0 ? (
              <div className="glass rounded-[2.5rem] p-12 border-white/40 text-center">
                <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="font-black text-gray-900 text-xl">All Clear!</p>
                <p className="text-xs text-gray-400 mt-2">No workers pending verification.</p>
              </div>
            ) : (
              pendingWorkers.map((worker) => (
                <div key={worker.profile.id} className="glass rounded-[2.5rem] p-8 border-white/40 shadow-lg space-y-6">
                  {/* Worker header */}
                  <div className="flex items-center gap-5">
                    {worker.profile.profile_photo_url ? (
                      <img src={worker.profile.profile_photo_url} alt="" className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <Users className="w-7 h-7 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-gray-900 text-lg">{worker.profile.full_name || 'Unnamed Worker'}</h3>
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100">Pending</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span className="inline-flex items-center gap-1.5">
                          <TradeIcon tradeId={worker.profile.trade} size={14} className="text-gray-400" />
                          {getTradeName(worker.profile.trade)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {worker.profile.area}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {worker.profile.bio && (
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">About</p>
                      <p className="text-sm text-gray-700">{worker.profile.bio}</p>
                    </div>
                  )}

                  {/* Ghana Card */}
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Ghana Card</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {worker.documents.map(doc => (
                        <div key={doc.id} className="relative cursor-pointer group" onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}>
                          <img
                            src={doc.file_url}
                            alt={doc.document_type === 'ghana_card_front' ? 'Front' : 'Back'}
                            className={`w-full rounded-2xl object-cover shadow-sm transition-all ${expandedDoc === doc.id ? 'h-auto' : 'h-40'}`}
                          />
                          <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/50 rounded-lg text-[10px] font-black text-white uppercase tracking-widest">
                            {doc.document_type === 'ghana_card_front' ? 'Front' : 'Back'}
                          </div>
                          <div className="absolute top-2 right-2 p-1.5 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certificates */}
                  {worker.certificates.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Award className="w-4 h-4" /> Certificates</p>
                      <div className="space-y-2">
                        {worker.certificates.map(cert => (
                          <div key={cert.id} className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                            <Award className="w-4 h-4 text-amber-500" />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900">{cert.certificate_name}</p>
                              <p className="text-[10px] text-gray-400">{cert.issued_by}{cert.year_obtained ? ` • ${cert.year_obtained}` : ''}</p>
                            </div>
                            <a href={cert.file_url} target="_blank" rel="noreferrer" className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">View</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Portfolio */}
                  {worker.portfolio.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Work Portfolio</p>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                        {worker.portfolio.map(img => (
                          <div key={img.id} className="relative rounded-xl overflow-hidden">
                            <img src={img.image_url} alt={img.caption} className="w-full h-24 object-cover" />
                            {img.caption && (
                              <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                                <p className="text-[8px] font-bold text-white truncate">{img.caption}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t border-gray-100 pt-6">
                    {rejectingId === worker.profile.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={rejectNotes}
                          onChange={(e) => setRejectNotes(e.target.value)}
                          placeholder="Reason for rejection (will be shown to worker)..."
                          className="w-full h-24 p-4 bg-red-50/50 border-2 border-red-100 focus:border-red-500 rounded-2xl text-sm text-gray-900 font-bold outline-none resize-none transition-all"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setRejectingId(null); setRejectNotes(''); }}
                            className="px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => { rejectWorker(worker.profile.id, rejectNotes); setRejectingId(null); setRejectNotes(''); }}
                            disabled={!rejectNotes.trim() || processing === worker.profile.id}
                            className="px-6 py-3 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg disabled:opacity-30 transition-all"
                          >
                            Confirm Rejection
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setRejectingId(worker.profile.id)}
                          disabled={processing === worker.profile.id}
                          className="px-6 py-3 border-2 border-gray-200 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-30"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => approveWorker(worker.profile.id)}
                          disabled={processing === worker.profile.id}
                          className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-colors disabled:opacity-30"
                        >
                          {processing === worker.profile.id ? 'Processing...' : 'Approve & Verify'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
