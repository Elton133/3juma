export const TRADES = [
  { id: 'plumber', name: 'Plumber', color: '#3B82F6', iconFallback: '🔧', rateRange: 'GH₵80 – GH₵200' },
  { id: 'electrician', name: 'Electrician', color: '#EAB308', iconFallback: '⚡', rateRange: 'GH₵100 – GH₵250' },
  { id: 'mason', name: 'Mason', color: '#F97316', iconFallback: '🧱', rateRange: 'GH₵100 – GH₵220' },
  { id: 'carpenter', name: 'Carpenter', color: '#22C55E', iconFallback: '🪚', rateRange: 'GH₵80 – GH₵180' },
  { id: 'welder', name: 'Welder', color: '#6B7280', iconFallback: '🔥', rateRange: 'GH₵100 – GH₵230' },
  { id: 'painter', name: 'Painter', color: '#EC4899', iconFallback: '🎨', rateRange: 'GH₵150 – GH₵300' },
  { id: 'tiler', name: 'Tiler', color: '#8B5CF6', iconFallback: '🏗️', rateRange: 'GH₵90 – GH₵200' },
  { id: 'ac_tech', name: 'AC Technician', color: '#06B6D4', iconFallback: '❄️', rateRange: 'GH₵120 – GH₵280' },
  { id: 'roofer', name: 'Roofer', color: '#DC2626', iconFallback: '🏠', rateRange: 'GH₵100 – GH₵240' },
  { id: 'auto_mechanic', name: 'Auto Mechanic', color: '#14B8A6', iconFallback: '🚗', rateRange: 'GH₵100 – GH₵260' },
];

/** Launch areas — Greater Accra east / Tema corridor (coords used for distance sorting only; no map API). */
export const AREAS = [
  { name: 'Dawhenya', lat: 5.724, lng: 0.131 },
  { name: 'Tema', lat: 5.6698, lng: 0.0166 },
  { name: 'Prampram', lat: 5.714, lng: 0.117 },
];

export const STATUS_CONFIG = {
  pending: { color: 'bg-amber-50 text-amber-600', label: 'Pending' },
  accepted: { color: 'bg-indigo-50 text-indigo-600', label: 'Accepted' },
  en_route: { color: 'bg-cyan-50 text-cyan-600', label: 'En Route' },
  arrived: { color: 'bg-violet-50 text-violet-600', label: 'Arrived' },
  in_progress: { color: 'bg-orange-50 text-orange-600', label: 'In Progress' },
  completed: { color: 'bg-emerald-50 text-emerald-600', label: 'Completed' },
  cancelled: { color: 'bg-rose-50 text-rose-600', label: 'Cancelled' },
  disputed: { color: 'bg-amber-50 text-amber-800', label: 'Disputed' },
};

