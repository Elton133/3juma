export const TRADES = [
  { id: 'plumber', name: 'Plumber', color: '#3B82F6', icon: '🔧', rateRange: 'GH₵80 – GH₵200' },
  { id: 'electrician', name: 'Electrician', color: '#EAB308', icon: '⚡', rateRange: 'GH₵100 – GH₵250' },
  { id: 'mason', name: 'Mason', color: '#F97316', icon: '🧱', rateRange: 'GH₵100 – GH₵220' },
  { id: 'carpenter', name: 'Carpenter', color: '#22C55E', icon: '🪚', rateRange: 'GH₵80 – GH₵180' },
  { id: 'welder', name: 'Welder', color: '#6B7280', icon: '🔥', rateRange: 'GH₵100 – GH₵230' },
  { id: 'painter', name: 'Painter', color: '#EC4899', icon: '🎨', rateRange: 'GH₵150 – GH₵300' },
  { id: 'tiler', name: 'Tiler', color: '#8B5CF6', icon: '🏗️', rateRange: 'GH₵90 – GH₵200' },
  { id: 'ac_tech', name: 'AC Technician', color: '#06B6D4', icon: '❄️', rateRange: 'GH₵120 – GH₵280' },
  { id: 'roofer', name: 'Roofer', color: '#DC2626', icon: '🏠', rateRange: 'GH₵100 – GH₵240' },
  { id: 'auto_mechanic', name: 'Auto Mechanic', color: '#14B8A6', icon: '🚗', rateRange: 'GH₵100 – GH₵260' },
];

export const AREAS = [
  { name: 'Accra Central', lat: 5.5500, lng: -0.2167 },
  { name: 'Madina', lat: 5.6667, lng: -0.1667 },
  { name: 'Tema', lat: 5.6700, lng: 0.0000 },
  { name: 'Kumasi Adum', lat: 6.6833, lng: -1.6167 },
  { name: 'Ashaiman', lat: 5.7000, lng: -0.0333 },
  { name: 'Dansoman', lat: 5.5333, lng: -0.2667 },
  { name: 'Mamprobi', lat: 5.5333, lng: -0.2500 },
  { name: 'Osu', lat: 5.5500, lng: -0.1833 },
  { name: 'Labone', lat: 5.5667, lng: -0.1750 },
  { name: 'Airport Residential', lat: 5.6000, lng: -0.1750 },
  { name: 'East Legon', lat: 5.6167, lng: -0.1333 },
  { name: 'West Legon', lat: 5.6500, lng: -0.1833 },
];

export const STATUS_CONFIG = {
  pending: { color: 'bg-amber-50 text-amber-600', label: 'Pending' },
  confirmed: { color: 'bg-indigo-50 text-indigo-600', label: 'Confirmed' },
  en_route: { color: 'bg-cyan-50 text-cyan-600', label: 'En Route' },
  in_progress: { color: 'bg-orange-50 text-orange-600', label: 'In Progress' },
  completed: { color: 'bg-emerald-50 text-emerald-600', label: 'Completed' },
  cancelled: { color: 'bg-rose-50 text-rose-600', label: 'Cancelled' },
};

export const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
];

export const GOOGLE_MAPS_API_KEY = ''; // Set your Google Maps API key here
