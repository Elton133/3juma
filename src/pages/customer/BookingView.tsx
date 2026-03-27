import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { X, Zap, Smartphone, CreditCard, Banknote, Loader2, CheckCircle, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { usePublicWorker } from '@/hooks/usePublicWorker';
import { getTradeIcon, getTradeName } from '@/lib/utils';
import { initializePaystack } from '@/lib/paystack';

const BookingView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trade = searchParams.get('trade') || '';
  const workerId = searchParams.get('worker') || '';
  
  const { user } = useAuth();
  const { worker, loading: workerLoading } = usePublicWorker(workerId);
  const { createRequest, loading: apiLoading, error: apiError } = useServiceRequests(user?.id);
  
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'momo' | 'cash'>('paystack');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBookingSubmit = async (paymentRef?: string) => {
    if (!worker) return;
    
    setIsProcessing(true);
    try {
      const result = await createRequest(
        {
          worker_id: worker.userId,
          trade: trade,
          description: description,
          location_text: worker.areaName, // In real app, get user's current area
          lat: 0, // Should be user's lat
          lng: 0, // Should be user's lng
        },
        {
          amount: 20,
          payment_type: 'deposit',
          payment_method: paymentMethod,
          status: paymentMethod === 'paystack' ? 'completed' : 'pending',
          payment_ref: paymentRef,
        }
      );

      if (result && result.id) {
        setSuccess(true);
        setTimeout(() => navigate(`/tracking?requestId=${result.id}`), 2000);
      }
    } catch (err) {
      console.error('[Ejuma] Booking error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayAndDispatch = async () => {
    if (paymentMethod === 'paystack') {
      try {
        await initializePaystack({
          email: user?.email || 'customer@ejuma.com',
          amount: 20,
          metadata: {
            worker_id: workerId,
            trade: trade,
            customer_name: user?.name,
          },
          onSuccess: (res) => {
            console.log('Paystack Success:', res);
            handleBookingSubmit(res.reference);
          },
          onClose: () => {
            console.log('Paystack Closed');
          },
        });
      } catch (err) {
        alert('Could not initialize payment. Please try again.');
      }
    } else {
      // Manual Momo or Cash
      handleBookingSubmit();
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

  return (
    <div className="min-h-screen bg-[#fafafa] py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-[3rem] p-10 shadow-2xl border-white/40">
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

          {step === 1 ? (
            <div className="space-y-8">
              <div className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-white">
                <div className="flex items-center gap-6">
                  <img src={worker.profilePhoto} className="w-20 h-20 rounded-2xl object-cover shadow-lg" alt={`${worker.name} Profile`} />
                  <div>
                    <p className="font-black text-xl text-gray-900 tracking-tight">{worker.name}</p>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                      {getTradeIcon(trade)} {getTradeName(trade)} Specialist
                    </p>
                  </div>
                </div>
              </div>

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
                onClick={() => setStep(2)} 
                disabled={!description.trim()} 
                className="w-full h-20 bg-gray-900 text-white rounded-[1.5rem] font-black text-xl shadow-xl disabled:opacity-20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Continue to Payment
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="p-10 bg-gray-900 rounded-[3rem] text-center text-white shadow-2xl relative overflow-hidden">
                <Zap className="absolute top-0 right-0 w-40 h-40 text-white/5 -translate-y-10 translate-x-10" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Booking Deposit</p>
                <p className="text-5xl font-black tracking-tighter">₵20.00</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-6">Secure Your Slot • Refundable</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Select Payment Method</label>
                <div className="grid gap-3">
                  <button 
                    onClick={() => setPaymentMethod('paystack')}
                    className={`flex items-center gap-4 p-6 rounded-[1.5rem] border-2 transition-all ${paymentMethod === 'paystack' ? 'border-gray-900 bg-gray-900 text-white shadow-xl' : 'border-gray-100 bg-gray-50/50 grayscale hover:grayscale-0'}`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-black text-sm uppercase tracking-tight">Paystack</p>
                      <p className={`text-[10px] font-bold ${paymentMethod === 'paystack' ? 'text-gray-400' : 'text-gray-300'}`}>Cards, Bank & USSD</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setPaymentMethod('momo')}
                    className={`flex items-center gap-4 p-6 rounded-[1.5rem] border-2 transition-all ${paymentMethod === 'momo' ? 'border-[#ffcb05] bg-[#ffcb05] text-black shadow-xl' : 'border-gray-100 bg-gray-50/50 grayscale hover:grayscale-0'}`}
                  >
                    <Smartphone className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-black text-sm uppercase tracking-tight">Direct Momo</p>
                      <p className={`text-[10px] font-bold ${paymentMethod === 'momo' ? 'text-black/60' : 'text-gray-300'}`}>Pay to Worker's Phone</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-center gap-4 p-6 rounded-[1.5rem] border-2 transition-all ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-500 text-white shadow-xl' : 'border-gray-100 bg-gray-50/50 grayscale hover:grayscale-0'}`}
                  >
                    <Banknote className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-black text-sm uppercase tracking-tight">Post-paid (Cash)</p>
                      <p className={`text-[10px] font-bold ${paymentMethod === 'cash' ? 'text-white/80' : 'text-gray-300'}`}>Pay after work is done</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <Edit className="w-6 h-6 text-gray-400" />
                </button>
                <button 
                  onClick={handlePayAndDispatch} 
                  disabled={isProcessing || apiLoading}
                  className="flex-1 h-20 bg-gray-900 text-white rounded-3xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {(isProcessing || apiLoading) ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <>
                      Pay & Dispatch
                      <Zap className="w-6 h-6 fill-white" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingView;
