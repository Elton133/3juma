import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Search, Users } from 'lucide-react';
import { AREAS } from '@/data/constants';
import { getTradeName, getTradeColor } from '@/lib/utils';
import { TradeIcon } from '@/components/TradeIcon';
import WorkerCard from '@/components/WorkerCard';
import { useMarketplace } from '@/hooks/useMarketplace';
import type { Worker } from '@/types/worker';

/**
 * Specialist search — list-first. No Google Maps API; area coords are only used for distance in cards.
 */
const MapView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trade = searchParams.get('trade') || '';
  const areaName = searchParams.get('area') || '';
  const selectedArea = AREAS.find((a) => a.name === areaName) || null;

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

  const areaHighlights = useMemo(
    () =>
      AREAS.map((a) => ({
        ...a,
        active: a.name === areaName,
      })),
    [areaName]
  );

  if (!selectedArea) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">
          Invalid search — pick a trade and Dawhenya, Tema, or Prampram on the home page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-[#fafafa] overflow-hidden">
      <div className="w-full max-h-[55vh] md:max-h-none md:w-[26rem] lg:w-96 bg-white/90 backdrop-blur-xl border-b md:border-b-0 md:border-r border-gray-100 flex flex-col overflow-hidden relative z-20 shadow-xl shrink-0">
        <div className="p-3 md:p-8 border-b border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 flex items-center gap-2 mb-2 md:mb-8 group transition-colors"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Modify Search
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gray-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl">
              <TradeIcon tradeId={trade} className="w-6 h-6 md:w-8 md:h-8 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-base md:text-xl tracking-tight leading-none">{getTradeName(trade)}s</h2>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1 md:mt-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {areaName}
              </p>
            </div>
          </div>
          <div className="mt-3 md:mt-10 space-y-1 md:space-y-4 px-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Search radius</label>
              <span className="text-xs font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{searchRadius} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gray-900"
            />
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
            <div className="text-center py-10 md:py-20">
              <Search className="w-10 h-10 md:w-12 md:h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No specialists in this radius yet</p>
              <p className="text-[10px] font-bold text-gray-300 mt-2 px-4">Try a larger radius or another area.</p>
            </div>
          ) : (
            filteredWorkers.map((w) => (
              <WorkerCard
                key={w.id}
                worker={w}
                customerLat={selectedArea.lat}
                customerLng={selectedArea.lng}
                onCall={() => (window.location.href = `tel:${w.phone}`)}
                onBook={() => handleBook(w)}
                isSelected={selectedWorker?.id === w.id}
                onClick={() => setSelectedWorker(w)}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[40vh] md:min-h-0 relative z-10 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 bg-gradient-to-br from-gray-100 via-white to-emerald-50/40 border-t md:border-t-0 md:border-l border-gray-100">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gray-900 text-white shadow-2xl mx-auto">
              <MapPin className="w-9 h-9" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2">Service area</p>
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{areaName}</h3>
              <p className="text-sm font-bold text-gray-500 mt-2 leading-relaxed">
                We&apos;re live in <span className="text-gray-900">Dawhenya</span>, <span className="text-gray-900">Tema</span>, and{' '}
                <span className="text-gray-900">Prampram</span>. Map view may come later — your list updates from real profiles here.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {areaHighlights.map((a) => (
                <span
                  key={a.name}
                  className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-colors ${
                    a.active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white/80 text-gray-400 border-gray-100'
                  }`}
                >
                  {a.name}
                </span>
              ))}
            </div>

            {!marketplaceLoading && filteredWorkers.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <Users className="w-4 h-4 text-emerald-500" />
                {filteredWorkers.length} specialist{filteredWorkers.length === 1 ? '' : 's'} in range
              </div>
            )}

            {selectedWorker && (
              <div
                className="rounded-2xl border-2 border-gray-900/10 bg-white/90 backdrop-blur px-5 py-4 text-left shadow-lg"
                style={{ borderColor: `${getTradeColor(selectedWorker.trade)}33` }}
              >
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Selected</p>
                <p className="font-black text-gray-900">{selectedWorker.name}</p>
                <p className="text-xs font-bold text-gray-500 mt-0.5">{selectedWorker.areaName}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
