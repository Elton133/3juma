import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import { ChevronLeft, MapPin, Search } from 'lucide-react';
import { AREAS, GOOGLE_MAPS_API_KEY, MAP_STYLES } from '@/data/constants';
import { getTradeIcon, getTradeName, getTradeColor } from '@/lib/utils';
import WorkerCard from '@/components/WorkerCard';
import { useMarketplace } from '@/hooks/useMarketplace';
import type { Worker } from '@/types/worker';

const MapView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trade = searchParams.get('trade') || '';
  const areaName = searchParams.get('area') || '';
  const selectedArea = AREAS.find((a) => a.name === areaName) || null;

  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const [searchRadius, setSearchRadius] = useState(5);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const { workers: filteredWorkers, loading: marketplaceLoading } = useMarketplace(
    trade,
    selectedArea?.lat || 0,
    selectedArea?.lng || 0,
    searchRadius
  );

  const handleBook = (worker: Worker) => {
    const q = new URLSearchParams({
      trade,
      area: areaName,
      worker: worker.id,
      lat: String(worker.lat),
      lng: String(worker.lng),
    });
    navigate(`/booking?${q.toString()}`);
  };

  if (!selectedArea) return <div className="min-h-screen flex items-center justify-center bg-[#fafafa]"><p className="text-xs font-black text-gray-400 uppercase tracking-widest">Invalid search parameters.</p></div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-[#fafafa] overflow-hidden">
      {/* Sidebar — capped to ensure map visibility on mobile */}
      <div className="w-full max-h-[50vh] md:max-h-none md:w-96 bg-white/90 backdrop-blur-xl border-b md:border-b-0 md:border-r border-gray-100 flex flex-col overflow-hidden relative z-20 shadow-xl">
        <div className="p-3 md:p-8 border-b border-gray-100">
          <button onClick={() => navigate('/')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 flex items-center gap-2 mb-2 md:mb-8 group transition-colors">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Modify Search
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gray-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl shadow-xl">{getTradeIcon(trade)}</div>
            <div>
              <h2 className="font-black text-gray-900 text-base md:text-xl tracking-tight leading-none">{getTradeName(trade)}s</h2>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1 md:mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> {areaName}</p>
            </div>
          </div>
          <div className="mt-3 md:mt-10 space-y-1 md:space-y-4 px-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Radius</label>
              <span className="text-xs font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{searchRadius}km</span>
            </div>
            <input type="range" min="1" max="10" value={searchRadius} onChange={(e) => setSearchRadius(Number(e.target.value))} className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gray-900" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50/10">
          {marketplaceLoading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-4" />
              <div className="h-2 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-2 w-16 bg-gray-200 rounded" />
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="text-center py-10 md:py-20"><Search className="w-10 h-10 md:w-12 md:h-12 text-gray-200 mx-auto mb-3" /><p className="text-xs font-black text-gray-400 uppercase tracking-widest">No specialists found</p></div>
          ) : (
            filteredWorkers.map((w) => (
              <WorkerCard key={w.id} worker={w} customerLat={selectedArea.lat} customerLng={selectedArea.lng} onCall={() => window.location.href = `tel:${w.phone}`} onBook={() => handleBook(w)} isSelected={selectedWorker?.id === w.id} onClick={() => setSelectedWorker(w)} />
            ))
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative z-10">
        {isLoaded ? (
          <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={{ lat: selectedArea.lat, lng: selectedArea.lng }} zoom={14} options={{ styles: MAP_STYLES, disableDefaultUI: true, zoomControl: true }}>
            <Circle center={{ lat: selectedArea.lat, lng: selectedArea.lng }} radius={searchRadius * 1000} options={{ fillColor: '#000', fillOpacity: 0.05, strokeColor: '#000', strokeOpacity: 0.1, strokeWeight: 1 }} />
            <Marker position={{ lat: selectedArea.lat, lng: selectedArea.lng }} icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#000', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 4 }} />
            {filteredWorkers.map((w) => (
              <Marker key={w.id} position={{ lat: w.lat, lng: w.lng }} onClick={() => setSelectedWorker(w)} icon={{ path: google.maps.SymbolPath.CIRCLE, scale: selectedWorker?.id === w.id ? 12 : 8, fillColor: getTradeColor(w.trade), fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 }} />
            ))}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-xs font-black text-gray-400 uppercase tracking-widest">Loading Map...</div>
        )}
      </div>
    </div>
  );
};

export default MapView;
