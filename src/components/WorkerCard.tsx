import React from 'react';
import { Star, Shield, Clock, Navigation, Phone, Calendar } from 'lucide-react';
import type { Worker } from '@/types/worker';
import { getTradeIcon, getTradeName, calculateDistance, calculateETA } from '@/lib/utils';

interface WorkerCardProps {
  worker: Worker;
  customerLat: number;
  customerLng: number;
  onCall: () => void;
  onBook: () => void;
  onClick?: () => void;
  isSelected?: boolean;
}

const WorkerCard: React.FC<WorkerCardProps> = ({ worker, customerLat, customerLng, onCall, onBook, onClick, isSelected }) => {
  const distance = calculateDistance(customerLat, customerLng, worker.lat, worker.lng);
  const eta = calculateETA(distance);

  return (
    <div
      onClick={onClick}
      className={`glass rounded-3xl p-5 transition-all cursor-pointer group hover:scale-[1.02] border-2 ${isSelected ? 'border-gray-900 bg-white shadow-xl' : 'border-transparent bg-white/60 hover:bg-white/80 shadow-sm'}`}
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <img src={worker.profilePhoto} alt={worker.name} className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
          {worker.available && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white animate-pulse" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-gray-900 truncate text-xl tracking-tight">{worker.name}</h3>
            {worker.verified && <Shield className="w-5 h-5 text-emerald-500 fill-current" />}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            {getTradeIcon(worker.trade)} {getTradeName(worker.trade)}
          </p>
          <div className="flex items-center gap-4 mt-4">
            <span className="flex items-center gap-1.5 text-gray-900 font-black text-sm">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              {worker.rating.toFixed(1)}
            </span>
            <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">{worker.jobsCompleted} jobs</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl">
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <Navigation className="w-4 h-4" /> {distance.toFixed(1)}km
        </div>
        <div className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-widest">
          <Clock className="w-4 h-4 text-emerald-500" /> ~{eta}m
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); onCall(); }} className="flex-1 h-14 border-2 border-gray-100 text-gray-900 rounded-2xl hover:bg-white hover:border-gray-900 transition-all text-xs font-black uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2">
          <Phone className="w-4 h-4" /> Call
        </button>
        <button onClick={(e) => { e.stopPropagation(); onBook(); }} disabled={!worker.available} className="flex-1 h-14 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all text-xs font-black uppercase tracking-widest px-4 disabled:opacity-20 shadow-lg active:scale-95 flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4" /> Book
        </button>
      </div>
    </div>
  );
};

export default WorkerCard;
