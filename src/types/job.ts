export interface Job {
  id: string;
  customerName: string;
  customerPhone: string;
  workerId: string;
  workerName: string;
  trade: string;
  description: string;
  locationText: string;
  lat: number;
  lng: number;
  status: 'pending' | 'confirmed' | 'en_route' | 'in_progress' | 'completed' | 'cancelled';
  depositPaid: boolean;
  scheduledTime: Date;
  createdAt: Date;
  amount: number;
}
