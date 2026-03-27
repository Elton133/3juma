-- Fix: Support all status values in service_requests
-- The current check constraint may be missing some statuses like 'arrived' or 'en_route'.

-- 1. Identify and drop the old constraint
-- (Usually named 'service_requests_status_check' based on your error)
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_status_check;

-- 2. Add the comprehensive status check constraint
ALTER TABLE public.service_requests ADD CONSTRAINT service_requests_status_check
CHECK (status IN (
  'pending',
  'accepted',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
  'disputed'
));

-- 3. Ensure all existing records are valid
UPDATE public.service_requests SET status = 'pending' WHERE status NOT IN (
  'pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled', 'disputed'
);
