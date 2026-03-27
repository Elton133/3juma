import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { X, Zap, Smartphone, Edit } from 'lucide-react';
import { AREAS } from '@/data/constants';
import { generateMockWorkers } from '@/data/mock-workers';
import { getTradeIcon, getTradeName } from '@/lib/utils';

const allWorkers = generateMockWorkers();

const BookingView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trade = searchParams.get('trade') || '';
  const areaName = searchParams.get('area') || '';
  const workerId = searchParams.get('worker') || '';
  const worker = allWorkers.find((w) => w.id === workerId);
  const selectedArea = AREAS.find((a) => a.name === areaName);

  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        navigate(`/tracking?jobId=job-${Date.now()}`);
      }, 1500);
    }
  };

  if (!worker || !selectedArea) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Invalid booking parameters.</p></div>;

  return (
    <div className="min-h-screen bg-[#fafafa] py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-[3rem] p-10 shadow-2xl border-white/40">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Confirm Request</h2>
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <div className="p-6 bg-gray-50/50 rounded-3xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">{getTradeIcon(trade)}</div>
                  <div>
                    <p className="font-black text-lg text-gray-900 tracking-tight">{getTradeName(trade)} Specialist</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{worker.name}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Job Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs to be fixed?" className="w-full h-32 p-5 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-[2rem] text-gray-900 font-bold transition-all outline-none resize-none" />
              </div>
              <button onClick={handleNext} disabled={!description.trim()} className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl disabled:opacity-20 transition-all">Continue to Deposit</button>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              {isProcessing ? (
                <div className="py-20 animate-pulse">
                  <Zap className="w-12 h-12 text-gray-900 mx-auto mb-4" />
                  <p className="font-black text-gray-900 uppercase tracking-widest text-xs">Processing Dispatch...</p>
                </div>
              ) : (
                <>
                  <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100">
                    <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2">Booking Deposit</p>
                    <p className="text-4xl font-black text-gray-900 tracking-tighter">₵20.00</p>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-4">Fully refundable if worker doesn't arrive</p>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <Smartphone className="w-6 h-6 text-gray-400" />
                    <div className="text-left flex-1">
                      <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Mobile Money</p>
                      <p className="text-[10px] font-bold text-gray-400">GH - 024XXXXXXX</p>
                    </div>
                    <Edit className="w-4 h-4 text-gray-300" />
                  </div>
                  <button onClick={handleNext} className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl active:scale-[0.98] transition-all">Pay & Dispatch</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingView;
