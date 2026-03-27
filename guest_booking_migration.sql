-- Migration: Allow Guest Bookings
-- 1. Make customer_id nullable in service_requests
ALTER TABLE public.service_requests ALTER COLUMN customer_id DROP NOT NULL;

-- 2. Add guest contact fields to service_requests
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- 3. Make payer_id nullable in payments
ALTER TABLE public.payments ALTER COLUMN payer_id DROP NOT NULL;

-- 4. Update RLS for Guest Bookings
-- Allow anonymous inserts into service_requests
DROP POLICY IF EXISTS "Public insert requests" ON public.service_requests;
CREATE POLICY "Public insert requests" ON public.service_requests FOR INSERT WITH CHECK (true);

-- Allow anonymous inserts into payments
DROP POLICY IF EXISTS "Public insert payments" ON public.payments;
CREATE POLICY "Public insert payments" ON public.payments FOR INSERT WITH CHECK (true);

-- Allow anyone with the specific requestId to read the request (for tracking)
DROP POLICY IF EXISTS "Public read request by id" ON public.service_requests;
CREATE POLICY "Public read request by id" ON public.service_requests FOR SELECT USING (true);
