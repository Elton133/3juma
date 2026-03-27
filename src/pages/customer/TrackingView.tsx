import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Zap, Navigation, CheckCircle, MapPin } from 'lucide-react';

const TrackingView: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    { id: 'confirmed', label: 'Dispatched', icon: Zap },
    { id: 'en_route', label: 'En Route', icon: Navigation },
    { id: 'arrived', label: 'Arrived', icon: CheckCircle },
  ];
  const currentIdx = 0; // Mock: dispatched

  return (
    <div className="min-h-screen bg-[#fafafa] py-20 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <button onClick={() => navigate('/')} className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-900 transition-colors mb-12 flex items-center justify-center gap-2 mx-auto">
          <ChevronLeft className="w-4 h-4" /> Home
        </button>

        <div className="glass rounded-[3rem] p-12 shadow-2xl border-white/40 space-y-8">
          <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto">
            <Zap className="w-10 h-10 text-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Specialist Heading Out</h2>

          <div className="flex justify-between relative max-w-sm mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2" />
            <div className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 transition-all duration-1000" style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }} />
            {steps.map((s, i) => (
              <div key={s.id} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg ${i <= currentIdx ? 'bg-emerald-500 text-white' : 'bg-white text-gray-300'}`}>
                <s.icon className="w-5 h-5" />
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-[2rem] p-6 text-left space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Details</p>
            <p className="font-bold text-gray-900">Your dispatch request has been confirmed</p>
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
              <MapPin className="w-3 h-3" /> Awaiting worker arrival
            </div>
          </div>

          <button onClick={() => navigate('/')} className="text-xs font-black text-gray-300 uppercase tracking-widest hover:text-red-500 transition-colors">Cancel Request</button>
        </div>
      </div>
    </div>
  );
};

export default TrackingView;
