import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronRight, Shield, CheckCircle, Star, Clock, User, Briefcase } from 'lucide-react';
import { TRADES, AREAS } from '@/data/constants';
import { TradeIcon } from '@/components/TradeIcon';
import { ROUTES } from '@/lib/routes';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTrade, setSelectedTrade] = useState('');
  const [selectedAreaName, setSelectedAreaName] = useState('');

  const handleSearch = () => {
    if (selectedTrade && selectedAreaName) {
      navigate(`/search?trade=${selectedTrade}&area=${encodeURIComponent(selectedAreaName)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <p className="sr-only">
        Ejuma connects people with vetted tradespeople: plumbers, electricians, masons, carpenters, welders, painters, tilers, AC technicians, roofers, and
        auto mechanics. Service areas: Dawhenya, Tema, and Prampram along the Greater Accra coast.
      </p>
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-6 md:pt-14 md:pb-8">
        <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">How do you want to use 3juma?</p>
        <div className="grid md:grid-cols-2 gap-3 md:gap-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.login)}
            className="glass group rounded-[2rem] p-6 md:p-8 border-2 border-white/60 text-left hover:border-gray-900 transition-all flex items-center gap-4 md:gap-6 shadow-lg"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500 group-hover:bg-gray-900 group-hover:text-white transition-colors shrink-0">
              <User className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">I need a specialist</h2>
              <p className="text-[11px] md:text-xs font-bold text-gray-400 mt-1 leading-snug">Book a vetted tradesperson — sign in with your customer account</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 ml-auto shrink-0 hidden sm:block" />
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.workerLogin)}
            className="glass group rounded-[2rem] p-6 md:p-8 border-2 border-white/60 text-left hover:border-gray-900 transition-all flex items-center gap-4 md:gap-6 shadow-lg"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500 group-hover:bg-gray-900 group-hover:text-white transition-colors shrink-0">
              <Briefcase className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">I&apos;m a worker</h2>
              <p className="text-[11px] md:text-xs font-bold text-gray-400 mt-1 leading-snug">Open your worker portal and dashboard</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 ml-auto shrink-0 hidden sm:block" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden pt-4 md:pt-8 pb-24 md:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gray-100 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-xl">
            <Shield className="w-3 h-3" /> Ghana's Vetted Trades
          </div>
          <h1 className="text-6xl md:text-9xl font-black text-gray-900 tracking-tighter leading-[0.8] mb-12">
            The hands-on<br /><span className="text-gray-300 tracking-normal italic">workforce</span>
          </h1>

          <div id="search" className="glass rounded-[2.5rem] p-4 md:p-6 max-w-2xl mx-auto shadow-2xl border-white/40 scroll-mt-24">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Service</label>
                <div className="relative">
                  <select value={selectedTrade} onChange={(e) => setSelectedTrade(e.target.value)} className="w-full h-14 pl-12 pr-4 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl appearance-none text-gray-900 font-bold transition-all outline-none">
                    <option value="">Select Trade...</option>
                    {TRADES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.iconFallback} {t.name}
                      </option>
                    ))}
                  </select>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Location</label>
                <div className="relative">
                  <select value={selectedAreaName} onChange={(e) => setSelectedAreaName(e.target.value)} className="w-full h-14 pl-12 pr-4 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl appearance-none text-gray-900 font-bold transition-all outline-none">
                    <option value="">Select Area...</option>
                    {AREAS.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
                  </select>
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
            <button onClick={handleSearch} disabled={!selectedTrade || !selectedAreaName} className="w-full mt-6 h-16 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all disabled:opacity-20 shadow-xl flex items-center justify-center gap-3">
              Find Specialist <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Verified Workers', value: '500+', Icon: Shield },
            { label: 'Jobs Completed', value: '12k+', Icon: CheckCircle },
            { label: 'Average Rating', value: '4.8/5', Icon: Star },
            { label: 'Response Time', value: '< 20m', Icon: Clock },
          ].map((stat, i) => (
            <div key={i} className="glass rounded-3xl p-6 text-center border-white/60">
              <stat.Icon className="w-6 h-6 mx-auto mb-3 text-gray-400" />
              <p className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-24">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-12">Expertise Today</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {TRADES.map((t) => (
            <button key={t.id} onClick={() => { setSelectedTrade(t.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="glass p-8 rounded-[2rem] text-left hover:scale-[1.05] transition-all group border-white/40">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-900 group-hover:bg-white transition-colors mb-6">
                <TradeIcon tradeId={t.id} size={32} strokeWidth={1.5} />
              </div>
              <p className="text-xl font-black text-gray-900 tracking-tight leading-tight">{t.name}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{t.rateRange}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
