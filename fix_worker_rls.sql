-- Fix: Worker Permissions Refinement
-- This ensures workers can select and update requests where they are the assigned worker.
-- It also allows workers to "Claim" pending requests that have no worker assigned (if you want to implement that later).

-- 1. Redefine SELECT policy for workers
DROP POLICY IF EXISTS "Workers read assigned requests" ON public.service_requests;
CREATE POLICY "Workers read assigned requests" ON public.service_requests 
FOR SELECT 
TO authenticated
USING (
  worker_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  OR (status = 'pending' AND worker_id IS NULL) -- Allow seeing open market jobs
);

-- 2. Redefine UPDATE policy for workers
-- This is critical for accepting/starting/completing jobs
DROP POLICY IF EXISTS "Workers update assigned requests" ON public.service_requests;
CREATE POLICY "Workers update assigned requests" ON public.service_requests 
FOR UPDATE 
TO authenticated
USING (
  worker_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  OR (status = 'pending' AND worker_id IS NULL) -- Allow claiming
)
WITH CHECK (
  worker_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

-- 3. Ensure SELECT for payments is also allowed for the assigned worker (to see earnings)
DROP POLICY IF EXISTS "Workers read own payments" ON public.payments;
CREATE POLICY "Workers read assigned payments" ON public.payments 
FOR SELECT 
TO authenticated
USING (
  service_request_id IN (
    SELECT id FROM public.service_requests 
    WHERE worker_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  )
);
