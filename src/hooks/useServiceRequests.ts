import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { triggerCustomerJobUpdatePush, triggerWorkerNewJobPush } from '@/lib/appPushTriggers';
import type { ServiceRequest, Payment } from '@/types/payment';

export function useServiceRequests(userId?: string) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── CREATE REQUEST ──────────────────────────────────────────
  const createRequest = useCallback(async (requestData: Partial<ServiceRequest>, paymentData?: Partial<Payment>) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured() || !supabase) {
      if (import.meta.env.PROD) {
        setError('Service unavailable');
        setLoading(false);
        return null;
      }
      const mockId = `job-${Date.now()}`;
      if (import.meta.env.DEV) {
        console.warn('[3juma] Supabase not configured — mock job id:', mockId);
      }
      setLoading(false);
      return { id: mockId };
    }

    try {
      // 1. Create service request
      const method = paymentData?.payment_method;
      const paymentCompleted = paymentData?.status === 'completed';
      const isCash = method === 'cash';
      const paymentStatus =
        paymentCompleted && !isCash ? 'paid' : isCash ? 'pending' : 'awaiting_deposit';

      const { data: request, error: reqErr } = await supabase
        .from('service_requests')
        .insert({
          ...requestData,
          customer_id: userId || null, // Allow guest
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          payment_status: paymentStatus,
        })
        .select()
        .single();

      if (reqErr) throw reqErr;

      // 2. Create initial payment (deposit or full) — columns must match DB (`transaction_ref`, not `payment_ref`; Paystack → `card`)
      if (paymentData && request) {
        const rawMethod = (paymentData as { payment_method?: string }).payment_method;
        const dbMethod =
          rawMethod === 'paystack' ? 'card' : (rawMethod as Payment['payment_method'] | undefined) || 'cash';
        const txRef =
          paymentData.transaction_ref ??
          (paymentData as { payment_ref?: string }).payment_ref ??
          null;

        const { error: payErr } = await supabase.from('payments').insert({
          service_request_id: request.id,
          payer_id: userId || null,
          amount: Number(paymentData.amount ?? 0),
          currency: paymentData.currency || 'GHS',
          payment_type: paymentData.payment_type || 'deposit',
          payment_method: dbMethod as Payment['payment_method'],
          momo_number: paymentData.momo_number ?? null,
          momo_provider: paymentData.momo_provider ?? null,
          status: paymentData.status || 'pending',
          transaction_ref: txRef,
          created_at: new Date().toISOString(),
        });
        if (payErr) throw payErr;
      }

      if (request?.id) {
        void triggerWorkerNewJobPush(request.id);
      }

      return request;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ─── FETCH REQUESTS (for customer or worker) ────────────────
  const fetchRequests = useCallback(async (role: 'customer' | 'worker') => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    try {
      const column = role === 'customer' ? 'customer_id' : 'worker_id';
      const { data, error: err } = await supabase
        .from('service_requests')
        .select(`
          *,
          customer:users!service_requests_customer_id_fkey(full_name, phone),
          worker:users!service_requests_worker_id_fkey(full_name)
        `)
        .eq(column, userId)
        .order('created_at', { ascending: false });

      if (err) throw err;

      const formatted = (data || []).map(req => ({
        ...req,
        customer_name: req.customer?.full_name,
        customer_phone: req.customer?.phone,
        worker_name: req.worker?.full_name,
      }));

      setRequests(formatted);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ─── GET SINGLE REQUEST (for tracking) ─────────────────────
  const getRequest = useCallback(async (requestId: string) => {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error: err } = await supabase
        .from('service_requests')
        .select(`
          *,
          customer:users!service_requests_customer_id_fkey(full_name, phone),
          worker:users!service_requests_worker_id_fkey(full_name)
        `)
        .eq('id', requestId)
        .single();

      if (err) throw err;

      return {
        ...data,
        customer_name: data.customer?.full_name,
        customer_phone: data.customer?.phone,
        worker_name: data.worker?.full_name,
      } as ServiceRequest;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  // ─── UPDATE STATUS ──────────────────────────────────────────
  const updateStatus = useCallback(async (requestId: string, status: ServiceRequest['status'], additionalData: Partial<ServiceRequest> = {}) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return true;
    }

    try {
      console.log(`[3juma] Updating request ${requestId} to ${status}`, additionalData);
      
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      if (status === 'accepted') updates.accepted_at = new Date().toISOString();
      if (status === 'in_progress') updates.started_at = new Date().toISOString();
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();

      const { data, error: err } = await supabase
        .from('service_requests')
        .update(updates)
        .eq('id', requestId)
        .select()
        .maybeSingle(); // Safer than .single()

      if (err) {
        console.error('[3juma] Update error:', err);
        throw err;
      }
      
      if (!data) {
        console.warn('[3juma] Update returned no data. Check RLS policies or if the request ID exists.');
        throw new Error('Could not update request. You might not have permission or the request was not found.');
      }

      console.log('[3juma] Update successful:', data);

      const notifyCustomer: ServiceRequest['status'][] = [
        'accepted',
        'en_route',
        'arrived',
        'in_progress',
        'completed',
        'cancelled',
        'disputed',
      ];
      if (notifyCustomer.includes(status)) {
        void triggerCustomerJobUpdatePush(requestId, status);
      }

      return data as ServiceRequest;
    } catch (err: any) {
      console.error('[3juma] updateStatus failed:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    requests,
    loading,
    error,
    createRequest,
    fetchRequests,
    getRequest,
    updateStatus,
    clearError: () => setError(null),
  };
}
