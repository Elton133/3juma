import { TRADES } from '@/data/constants';

export const getTradeColor = (tradeId: string): string => {
  return TRADES.find((t) => t.id === tradeId)?.color || '#6B7280';
};

export const getTradeName = (tradeId: string): string => {
  return TRADES.find((t) => t.id === tradeId)?.name || tradeId;
};

/** Emoji fallback when no SVG mapping exists (e.g. unknown trade id, or non-React contexts). */
export const getTradeIconFallback = (tradeId: string): string => {
  return TRADES.find((t) => t.id === tradeId)?.iconFallback || '🔧';
};

export const getTradeRateRange = (tradeId: string): string => {
  return TRADES.find((t) => t.id === tradeId)?.rateRange || 'GH₵80 – GH₵200';
};

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const calculateETA = (distance: number): number => {
  return 15 + Math.round(distance * 4);
};
