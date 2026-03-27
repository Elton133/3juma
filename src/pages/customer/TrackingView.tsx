import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Truck, Hammer, Navigation, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import type { ServiceRequest } from '@/types/payment';
import ReviewModal from '@/components/ReviewModal';
import { useReviews } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';

const TrackingView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const { user } = useAuth();
  const { getRequest } = useServiceRequests();
  const { submitReview } = useReviews();
  
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    const loadRequest = async () => {
      const data = await getRequest(requestId);
      if (data) {
        setRequest(data);
        if (data.status === 'completed' && !reviewed) {
          setShowReview(true);
        }
      }
      setLoading(false);
    };

    loadRequest();
    const interval = setInterval(loadRequest, 5000);
    return () => clearInterval(interval);
  }, [requestId, getRequest, reviewed]);

  const steps = [
    { id: 'pending', label: 'Requested', icon: Clock },
    { id: 'accepted', label: 'Dispatched', icon: Truck },
    { id: 'en_route', label: 'En Route', icon: Navigation },
    { id: 'arrived', label: 'Arrived', icon: CheckCircle },
    { id: 'in_progress', label: 'Working', icon: Hammer },
    { id: 'completed', label: 'Finished', icon: CheckCircle },
  ];

  const getStatusIndex = (status?: string) => {
    if (!status) return 0;
    const idx = steps.findIndex(s => s.id === status);
    return idx !== -1 ? idx : 0;
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!request || !user) return;
    const success = await submitReview({
      service_request_id: request.id,
      reviewer_id: user.id,
      reviewee_id: request.worker_id || '',
      rating,
      comment,
    });
    if (success) {
      setReviewed(true);
      setShowReview(false);
    }
  };

  const currentIdx = getStatusIndex(request?.status);

  if (loading && !request) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] py-12 md:py-20 px-4">
      <ReviewModal 
        isOpen={showReview} 
        onClose={() => setShowReview(false)} 
        onSubmit={handleReviewSubmit}
        workerName={request?.worker_name || 'the Specialist'}
      />
      
      <div className="max-w-2xl mx-auto text-center">
        <button onClick={() => navigate('/')} className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-900 transition-colors mb-8 md:mb-12 flex items-center justify-center gap-2 mx-auto">
          <ChevronLeft className="w-4 h-4" /> Home
        </button>

        <div className="glass rounded-[3rem] p-6 md:p-12 shadow-2xl border-white/40 space-y-8 md:space-y-12">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto">
            {request?.status === 'completed' ? (
              <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />
            ) : (
              <Truck className="w-8 h-8 md:w-10 md:h-10 text-emerald-500 animate-pulse" />
            )}
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight px-4">
            {currentIdx === 0 ? 'Finding Your Specialist' : 
             request?.status === 'completed' ? 'Great Job Done!' :
             request?.status === 'in_progress' ? 'Service in Progress' :
             'Specialist Heading Out'}
          </h2>

          <div className="flex justify-between relative max-w-lg mx-auto px-1 md:px-2">
            <div className="absolute top-4 md:top-5 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2" />
            <div className="absolute top-4 md:top-5 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 transition-all duration-1000" style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }} />
            {steps.map((s, i) => (
              <div key={s.id} className="relative group flex flex-col items-center">
                <div className={`relative z-10 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${i <= currentIdx ? 'bg-emerald-500 text-white scale-110' : 'bg-white text-gray-300'}`}>
                  <s.icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <p className={`text-[6px] md:text-[7px] font-black uppercase tracking-widest mt-3 md:mt-4 ${i <= currentIdx ? 'text-emerald-500' : 'text-gray-300'} hidden md:block`}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-[2rem] p-6 md:p-8 text-left space-y-4 shadow-inner">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
              <span>Job Highlights</span>
              {request?.guest_name && <span className="text-amber-600">Guest: {request.guest_name}</span>}
            </p>
            <p className="font-bold text-gray-900 text-sm md:text-base leading-relaxed">
              {request ? request.description : 'Your dispatch request has been confirmed'}
            </p>
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pt-2 ${currentIdx > 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {request?.status === 'completed' ? 'Job finished and paid' :
               request?.status === 'in_progress' ? 'Expert is working now' :
               currentIdx === 0 ? 'Searching for worker...' : 'Expert is en route'}
            </div>
            
            {request?.worker_name && (
              <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-xl shadow-sm border border-gray-100">
                  🛠️
                </div>
                <div>
                  <p className="font-black text-gray-900 text-xs md:text-sm tracking-tight">{request.worker_name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Specialist</p>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => navigate('/')} className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-red-500 transition-colors">Cancel Request</button>
        </div>
      </div>
    </div>
  );
};

export default TrackingView;
