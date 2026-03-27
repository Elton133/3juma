export interface Worker {
  id: string;
  name: string;
  trade: string;
  areaName: string;
  lat: number;
  lng: number;
  rating: number;
  jobsCompleted: number;
  verified: boolean;
  available: boolean;
  strikes: number;
  subscriptionActive: boolean;
  profilePhoto: string;
  phone: string;
}
