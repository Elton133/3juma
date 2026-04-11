import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Truck, Hammer, CheckCircle, Clock, Loader2, Bell } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Wrench01Icon } from '@hugeicons/core-free-icons';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import type { ServiceRequest } from '@/types/payment';
import ReviewModal from '@/components/ReviewModal';
import { useReviews } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { isPushApiSupported, isWebPushConfigured, subscribeWebPush } from '@/lib/webPushClient';

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
  const [reviewPromptDismissed, setReviewPromptDismissed] = useState(false);
  const [jobPushEnabled, setJobPushEnabled] = useState(false);
  const [jobPushMsg, setJobPushMsg] = useState<string | null>(null);

  useEffect(() => {
    setReviewPromptDismissed(false);
    setReviewed(false);
    setShowReview(false);
  }, [requestId]);

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    const loadRequest = async () => {
      const data = await getRequest(requestId);
      if (data) {
        setRequest(data);
        if (data.status === 'completed' && user && !reviewed && !reviewPromptDismissed) {
          setShowReview(true);
        }
      }
      setLoading(false);
    };

    void loadRequest();
    const interval = setInterval(() => void loadRequest(), 5000);
    return () => clearInterval(interval);
  }, [requestId, getRequest, reviewed, reviewPromptDismissed, user]);

  /** Fewer dots — matches simplified worker flow (alerts on accept, on the way, done). */
  const steps = [
    { id: 'pending', label: 'Requested', icon: Clock },
    { id: 'active', label: 'On the way', icon: Truck },
    { id: 'working', label: 'On site', icon: Hammer },
    { id: 'completed', label: 'Done', icon: CheckCircle },
  ];

  const getStatusIndex = (status?: string) => {
    if (!status) return 0;
    if (status === 'pending' || status === 'cancelled' || status === 'disputed') return 0;
    if (status === 'accepted' || status === 'en_route') return 1;
    if (status === 'arrived' || status === 'in_progress') return 2;
    if (status === 'completed') return 3;
    return 0;
  };

  const handleEnableJobPush = async () => {
    setJobPushMsg(null);
    if (!user?.id || !supabase) {
      setJobPushMsg('Sign in to get push updates for this job.');
      return;
    }
    if (!isWebPushConfigured()) {
      setJobPushMsg('App push is not configured (VITE_VAPID_PUBLIC_KEY).');
      return;
    }
    if (!isPushApiSupported()) {
      setJobPushMsg('Push is not supported in this browser.');
      return;
    }
    const result = await subscribeWebPush(supabase, user.id);
    if (result.ok) {
      setJobPushEnabled(true);
      return;
    }
    setJobPushMsg(
      result.reason === 'permission_denied'
        ? 'Allow notifications for this site in your browser settings.'
        : result.detail || 'Could not enable job alerts.',
    );
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
        onClose={() => {
          setShowReview(false);
          setReviewPromptDismissed(true);
        }}
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
            <div
              className="absolute top-4 md:top-5 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 transition-all duration-1000"
              style={{ width: `${steps.length > 1 ? (currentIdx / (steps.length - 1)) * 100 : 0}%` }}
            />
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
            
            {user && request && !jobPushEnabled && (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <button
                  type="button"
                  onClick={() => void handleEnableJobPush()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                >
                  <Bell className="w-4 h-4" /> Notify me about this job
                </button>
                {jobPushMsg && <p className="text-[10px] font-bold text-amber-700 text-center">{jobPushMsg}</p>}
              </div>
            )}
            {user && request && jobPushEnabled && (
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest text-center pt-2">
                Job alerts on — we’ll ping you when your worker updates status.
              </p>
            )}

            {request?.worker_name && (
              <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-gray-700 shadow-sm border border-gray-100">
                  <HugeiconsIcon icon={Wrench01Icon} size={28} strokeWidth={1.5} className="md:w-8 md:h-8" />
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
