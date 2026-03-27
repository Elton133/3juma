export interface WorkerProfile {
  id: string;
  user_id: string;
  trade: string;
  area: string;
  bio: string;
  profile_photo_url: string | null;
  ghana_card_id: string | null;
  gender: string | null;
  dob: string | null;
  years_experience: number;
  specializations: string[];
  verification_status: 'none' | 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  rejection_notes: string | null;
  is_available: boolean;
  rating_avg: number;
  jobs_completed: number;
  strikes: number;
  subscription_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data (not in table directly)
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface VerificationDocument {
  id: string;
  worker_id: string;
  document_type: 'ghana_card_front' | 'ghana_card_back';
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export interface WorkerCertificate {
  id: string;
  worker_id: string;
  certificate_name: string;
  file_url: string;
  issued_by: string | null;
  year_obtained: number | null;
  created_at: string;
}

export interface PortfolioImage {
  id: string;
  worker_id: string;
  image_url: string;
  caption: string;
  created_at: string;
}
