import type { Worker } from '@/types/worker';
import { TRADES, AREAS } from '@/data/constants';

const NAMES = ['Kofi', 'Ama', 'Yaw', 'Akua', 'Kwame', 'Serwaa', 'Ekow', 'Efua', 'Kwesi', 'Nana', 'Kojo', 'Adwoa', 'Paa', 'Maame'];

export const generateMockWorkers = (): Worker[] => {
  const workers: Worker[] = [];

  TRADES.forEach((trade) => {
    AREAS.slice(0, 4).forEach((area) => {
      for (let i = 0; i < 2; i++) {
        const nameIndex = Math.floor(Math.random() * NAMES.length);
        workers.push({
          id: `${trade.id}-${area.name}-${i}`,
          name: `${NAMES[nameIndex]} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}.`,
          trade: trade.id,
          areaName: area.name,
          lat: area.lat + (Math.random() - 0.5) * 0.04,
          lng: area.lng + (Math.random() - 0.5) * 0.04,
          rating: 3.5 + Math.random() * 1.5,
          jobsCompleted: 5 + Math.floor(Math.random() * 50),
          verified: Math.random() > 0.3,
          available: Math.random() > 0.4,
          strikes: Math.random() > 0.8 ? 1 : 0,
          subscriptionActive: Math.random() > 0.2,
          profilePhoto: `https://i.pravatar.cc/150?img=${(workers.length % 70) + 1}`,
          phone: `+233 ${['24', '54', '20', '50'][Math.floor(Math.random() * 4)]}${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
        });
      }
    });
  });

  return workers;
};
