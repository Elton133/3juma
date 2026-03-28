import type { Worker } from '@/types/worker';
import type { Job } from '@/types/job';
import { TRADES, AREAS } from '@/data/constants';

export const generateMockJobs = (workers: Worker[]): Job[] => {
  const statuses: Job['status'][] = ['pending', 'accepted', 'en_route', 'in_progress', 'completed', 'cancelled'];
  const jobs: Job[] = [];

  for (let i = 0; i < 15; i++) {
    const worker = workers[Math.floor(Math.random() * workers.length)];
    const area = AREAS[Math.floor(Math.random() * AREAS.length)];
    const trade = TRADES[Math.floor(Math.random() * TRADES.length)];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 14));

    jobs.push({
      id: `job-${i + 1}`,
      customerName: ['Ama', 'Kojo', 'Efua', 'Kwame', 'Serwaa'][Math.floor(Math.random() * 5)],
      customerPhone: `+233 24${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
      workerId: worker.id,
      workerName: worker.name,
      trade: trade.id,
      description: ['Fix leaking pipe', 'Install new lighting', 'Repair broken socket', 'Paint bedroom', 'Assemble furniture'][Math.floor(Math.random() * 5)],
      locationText: area.name,
      lat: area.lat,
      lng: area.lng,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      depositPaid: Math.random() > 0.3,
      scheduledTime: new Date(date.getTime() + 3600000),
      createdAt: date,
      amount: 80 + Math.floor(Math.random() * 200),
    });
  }

  return jobs;
};
