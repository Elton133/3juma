import React, { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  workerName: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit, workerName }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(rating, comment);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <Star className="w-8 h-8 fill-amber-500" />
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Rate your Experience</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">How was {workerName}'s service?</p>
          </div>

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className="p-1">
                <Star className={`w-8 h-8 transition-all ${s <= rating ? 'fill-amber-400 text-amber-400 scale-110' : 'text-gray-200'}`} />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any feedback for the specialist?"
            className="w-full h-24 p-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none resize-none"
          />

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl disabled:opacity-20 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
