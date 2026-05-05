import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { X, Loader2, CheckCircle, Phone, Star, Briefcase, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { usePublicWorker } from '@/hooks/usePublicWorker';
import { getTradeName } from '@/lib/utils';
import { TradeIcon } from '@/components/TradeIcon';
import { trackEvent } from '@/lib/analytics';

const BookingView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trade = searchParams.get('trade') || '';
  const workerId = searchParams.get('worker') || '';
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const bookLat = latParam != null && !Number.isNaN(Number(latParam)) ? Number(latParam) : 0;
  const bookLng = lngParam != null && !Number.isNaN(Number(lngParam)) ? Number(lngParam) : 0;
  
  const { user } = useAuth();
  const { worker, loading: workerLoading } = usePublicWorker(workerId);
  const { createRequest, loading: apiLoading, error: apiError } = useServiceRequests(user?.id);
  
  const [description, setDescription] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBookingSubmit = async () => {
    if (!worker) return;
    
    setIsProcessing(true);
    void trackEvent('booking_started', { trade, worker_id: worker.id, payment_method: 'launch_free' });
    try {
      const result = await createRequest(
        {
          worker_id: worker.userId,
          trade: trade,
          description: description,
          location_text: worker.areaName,
          lat: bookLat,
          lng: bookLng,
          guest_name: user ? null : guestName,
          guest_phone: user ? null : guestPhone,
        }
      );

      if (result && result.id) {
        void trackEvent('booking_success', {
          trade,
          worker_id: worker.id,
          payment_method: 'launch_free',
          service_request_id: result.id,
          guest: !user,
        });
        setSuccess(true);
        setTimeout(() => navigate(`/tracking?requestId=${result.id}`), 2000);
      }
    } catch (err) {
      console.error('[Ejuma] Booking error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (workerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="w-10 h-10 animate-spin text-gray-900" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center space-y-4">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Worker not found</p>
          <button onClick={() => navigate(-1)} className="text-gray-900 font-bold border-b-2 border-gray-900">Go Back</button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
        <div className="max-w-md w-full glass rounded-[3rem] p-10 text-center shadow-2xl border-white/40">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-4">Request Sent!</h2>
          <p className="text-gray-500 font-medium leading-relaxed mb-8">
            Worker has been notified and is reviewing your request. Redirecting you to tracking...
          </p>
        </div>
      </div>
    );
  }

  const isFormValid = description.trim() && (user || (guestName && guestPhone));

  return (
    <div className="min-h-screen bg-[#fafafa] py-12 md:py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-[3rem] p-6 md:p-10 shadow-2xl border-white/40">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Confirm Booking</h2>
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {(apiError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-xs font-bold text-red-500">{apiError}</p>
            </div>
          )}

          <div className="space-y-8">
            <div className="p-6 md:p-8 bg-gray-50/50 rounded-[2.5rem] border border-white">
              <div className="flex items-center gap-6">
                <img src={worker.profilePhoto} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-lg" alt={`${worker.name} Profile`} />
                <div>
                  <p className="font-black text-lg md:text-xl text-gray-900 tracking-tight">{worker.name}</p>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                    <TradeIcon tradeId={trade} size={14} className="text-emerald-500" />
                    {getTradeName(trade)} Specialist
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span className="inline-flex items-center gap-1.5 text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-current" /> {worker.rating.toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> {worker.jobsCompleted} jobs
                  </span>
                  {worker.phone && (
                    <a href={`tel:${worker.phone}`} className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700">
                      <Phone className="w-3.5 h-3.5" /> Call worker
                    </a>
                  )}
                </div>
                {worker.yearsExperience ? (
                  <p className="text-[11px] font-bold text-gray-500">
                    {worker.yearsExperience}+ years experience in {getTradeName(trade).toLowerCase()} work.
                  </p>
                ) : null}
                {worker.bio ? (
                  <p className="text-xs font-medium text-gray-600 leading-relaxed">{worker.bio}</p>
                ) : (
                  <p className="text-xs font-medium text-gray-400 leading-relaxed">
                    This worker has not added a bio yet, but ratings and job history are available above.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Free booking during launch</p>
              <p className="mt-2 text-sm font-bold text-emerald-900 leading-relaxed">
                No service charge today. Send the request for free, then agree the job price directly with the worker.
              </p>
            </div>

            {!user && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-4">Booking as Guest</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full h-14 px-6 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold transition-all outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full h-14 px-6 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-gray-900 font-bold transition-all outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Problem Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue in detail..."
                className="w-full h-40 p-6 bg-gray-50/50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-[2rem] text-gray-900 font-bold transition-all outline-none resize-none shadow-inner"
              />
            </div>

            <button
              onClick={handleBookingSubmit}
              disabled={!isFormValid || isProcessing || apiLoading}
              className="w-full h-16 md:h-20 bg-gray-900 text-white rounded-[1.5rem] font-black text-lg md:text-xl shadow-xl disabled:opacity-20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {(isProcessing || apiLoading) ? (
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" />
              ) : (
                <>
                  Send Request
                  <Send className="w-5 h-5 md:w-6 md:h-6" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingView;
