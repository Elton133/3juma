export interface ServiceRequest {
  id: string;
  customer_id: string;
  worker_id: string | null;
  trade: string;
  description: string;
  location_text: string;
  lat: number;
  lng: number;
  status: 'pending' | 'accepted' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  scheduled_at: string | null;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  estimated_amount: number | null;
  final_amount: number | null;
  payment_status: 'pending' | 'awaiting_deposit' | 'paid';
  created_at: string;
  updated_at: string;
  // Joined data
  customer_name?: string;
  customer_phone?: string;
  worker_name?: string;
}

export interface Payment {
  id: string;
  service_request_id: string;
  payer_id: string;
  amount: number;
  currency: string;
  payment_type: 'deposit' | 'final' | 'tip' | 'refund';
  payment_method: 'momo' | 'card' | 'cash' | 'paystack';
  momo_number: string | null;
  momo_provider: 'MTN' | 'Vodafone' | 'AirtelTigo' | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transaction_ref: string | null;
  payment_ref?: string;
  paid_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  service_request_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  service_request_id: string;
  raised_by: string;
  reason: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution_notes: string | null;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
}
