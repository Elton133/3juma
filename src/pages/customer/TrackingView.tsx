import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Zap, Navigation, CheckCircle, Clock, Loader2 } from 'lucide-react';
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
    { id: 'accepted', label: 'Dispatched', icon: Zap },
    { id: 'en_route', label: 'En Route', icon: Navigation },
    { id: 'arrived', label: 'Arrived', icon: CheckCircle },
    { id: 'in_progress', label: 'Working', icon: Zap },
    { id: 'completed', label: 'Finished', icon: CheckCircle },
  ];

  const getStatusIndex = (status?: string) => {
    if (!status) return 0;
    const idx = steps.findIndex(s => s.id === status);
    if (idx !== -1) return idx;
    if (status === 'confirmed') return 1;
    return 0;
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
    <div className="min-h-screen bg-[#fafafa] py-20 px-4">
      <ReviewModal 
        isOpen={showReview} 
        onClose={() => setShowReview(false)} 
        onSubmit={handleReviewSubmit}
        workerName={request?.worker_name || 'the Specialist'}
      />
      
      <div className="max-w-2xl mx-auto text-center">
        <button onClick={() => navigate('/')} className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-900 transition-colors mb-12 flex items-center justify-center gap-2 mx-auto">
          <ChevronLeft className="w-4 h-4" /> Home
        </button>

        <div className="glass rounded-[3rem] p-12 shadow-2xl border-white/40 space-y-12">
          <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto">
            {request?.status === 'completed' ? (
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            ) : (
              <Zap className="w-10 h-10 text-emerald-500 animate-pulse" />
            )}
          </div>
          
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            {currentIdx === 0 ? 'Finding Your Specialist' : 
             request?.status === 'completed' ? 'Great Job Done!' :
             request?.status === 'in_progress' ? 'Service in Progress' :
             'Specialist Heading Out'}
          </h2>

          <div className="flex justify-between relative max-w-lg mx-auto px-2">
            <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2" />
            <div className="absolute top-5 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 transition-all duration-1000" style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }} />
            {steps.map((s, i) => (
              <div key={s.id} className="relative group flex flex-col items-center">
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg ${i <= currentIdx ? 'bg-emerald-500 text-white' : 'bg-white text-gray-300'}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <p className={`text-[7px] font-black uppercase tracking-widest mt-4 ${i <= currentIdx ? 'text-emerald-500' : 'text-gray-300'}`}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-[2rem] p-8 text-left space-y-4 shadow-inner">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Highlights</p>
            <p className="font-bold text-gray-900 leading-relaxed">
              {request ? request.description : 'Your dispatch request has been confirmed'}
            </p>
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pt-2 ${currentIdx > 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {request?.status === 'completed' ? 'Job finished and paid' :
               request?.status === 'in_progress' ? 'Expert is working now' :
               currentIdx === 0 ? 'Searching for worker...' : 'Expert is en route'}
            </div>
            
            {request?.worker_name && (
              <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-gray-100">
                  🛠️
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm tracking-tight">{request.worker_name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Specialist</p>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => navigate('/')} className="text-xs font-black text-gray-300 uppercase tracking-widest hover:text-red-500 transition-colors">Cancel Request</button>
        </div>
      </div>
    </div>
  );
};

export default TrackingView;
