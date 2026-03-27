-- ============================================================
-- 3juma — Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. USERS (extends Supabase auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id       UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('customer', 'worker', 'admin')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create public.users record on auth.signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id UUID;
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  
  INSERT INTO public.users (auth_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    user_role
  )
  RETURNING id INTO new_user_id;

  -- Create empty worker profile if role is worker
  IF user_role = 'worker' THEN
    INSERT INTO public.worker_profiles (user_id, trade, area, verification_status)
    VALUES (new_user_id, 'none', 'none', 'none');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 2. WORKER PROFILES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.worker_profiles (
  id                    UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trade                 TEXT NOT NULL,
  area                  TEXT NOT NULL,
  bio                   TEXT DEFAULT '',
  profile_photo_url     TEXT,
  ghana_card_id         TEXT,
  gender                TEXT,
  dob                   DATE,
  years_experience      INTEGER DEFAULT 0,
  specializations       TEXT[] DEFAULT '{}'::TEXT[],
  verification_status   TEXT NOT NULL DEFAULT 'none' CHECK (verification_status = ANY (ARRAY['none'::TEXT, 'pending'::TEXT, 'approved'::TEXT, 'rejected'::TEXT])),
  is_verified           BOOLEAN DEFAULT FALSE,
  verified_at           TIMESTAMPTZ,
  verified_by           UUID REFERENCES public.users(id),
  rejection_notes       TEXT,
  is_available          BOOLEAN DEFAULT TRUE,
  rating_avg            NUMERIC(2,1) DEFAULT 0.0,
  jobs_completed        INTEGER DEFAULT 0,
  strikes               INTEGER DEFAULT 0,
  subscription_active   BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 3. VERIFICATION DOCUMENTS (Ghana Card)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.verification_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id       UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL CHECK (document_type IN ('ghana_card_front', 'ghana_card_back')),
  file_url        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes     TEXT,
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 4. WORKER CERTIFICATES (optional, free-form)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.worker_certificates (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id         UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  certificate_name  TEXT NOT NULL,        -- free text, e.g. "City & Guilds Plumbing"
  file_url          TEXT NOT NULL,
  issued_by         TEXT,
  year_obtained     INTEGER,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 5. WORK PORTFOLIO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.work_portfolio (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id   UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  caption     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 6. SERVICE REQUESTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.service_requests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id         UUID NOT NULL REFERENCES public.users(id),
  worker_id           UUID REFERENCES public.users(id),
  trade               TEXT NOT NULL,
  description         TEXT NOT NULL,
  location_text       TEXT NOT NULL,
  lat                 DOUBLE PRECISION NOT NULL,
  lng                 DOUBLE PRECISION NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'accepted', 'en_route', 'in_progress',
                                          'completed', 'cancelled', 'disputed')),
  scheduled_at        TIMESTAMPTZ,
  accepted_at         TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancellation_reason TEXT,
  estimated_amount    NUMERIC(10,2),
  final_amount        NUMERIC(10,2),
  payment_status      TEXT NOT NULL DEFAULT 'awaiting_deposit',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 7. PAYMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_request_id  UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  payer_id            UUID NOT NULL REFERENCES public.users(id),
  amount              NUMERIC(10,2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'GHS',
  payment_type        TEXT NOT NULL CHECK (payment_type IN ('deposit', 'final', 'tip', 'refund')),
  payment_method      TEXT NOT NULL CHECK (payment_method IN ('momo', 'card', 'cash')),
  momo_number         TEXT,
  momo_provider       TEXT CHECK (momo_provider IN ('MTN', 'Vodafone', 'AirtelTigo')),
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  transaction_ref     TEXT UNIQUE,
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 8. REVIEWS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.reviews (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_request_id  UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  reviewer_id         UUID NOT NULL REFERENCES public.users(id),
  reviewee_id         UUID NOT NULL REFERENCES public.users(id),
  rating              INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment             TEXT DEFAULT '',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 9. DISPUTES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.disputes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_request_id  UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  raised_by           UUID NOT NULL REFERENCES public.users(id),
  reason              TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution_notes    TEXT,
  resolved_by         UUID REFERENCES public.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────
-- 10. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('job_request', 'payment', 'verification', 'system')),
  data_json   JSONB DEFAULT '{}',
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 11. FCM TOKENS (Firebase Cloud Messaging)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.fcm_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  device_info TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX idx_worker_profiles_user ON public.worker_profiles(user_id);
CREATE INDEX idx_worker_profiles_trade ON public.worker_profiles(trade);
CREATE INDEX idx_worker_profiles_verification ON public.worker_profiles(verification_status);
CREATE INDEX idx_verification_docs_worker ON public.verification_documents(worker_id);
CREATE INDEX idx_certificates_worker ON public.worker_certificates(worker_id);
CREATE INDEX idx_portfolio_worker ON public.work_portfolio(worker_id);
CREATE INDEX idx_service_requests_customer ON public.service_requests(customer_id);
CREATE INDEX idx_service_requests_worker ON public.service_requests(worker_id);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);
CREATE INDEX idx_service_requests_payment_status ON public.service_requests(payment_status);
CREATE INDEX idx_payments_request ON public.payments(service_request_id);
CREATE INDEX idx_payments_payer ON public.payments(payer_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_reviews_request ON public.reviews(service_request_id);
CREATE INDEX idx_disputes_request ON public.disputes(service_request_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read = FALSE;
CREATE INDEX idx_fcm_tokens_user ON public.fcm_tokens(user_id);

-- ─────────────────────────────────────────────────────────────
-- STORAGE BUCKETS (run via Supabase Dashboard → Storage)
-- ─────────────────────────────────────────────────────────────
-- Create these buckets manually in the Supabase dashboard:
--
-- 1. profile-photos   (Public)
-- 2. verification-docs (Private — admin-only read)
-- 3. certificates      (Private — admin-only read)
-- 4. portfolio-images  (Public)

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (idempotent policies)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Users
DROP POLICY IF EXISTS "Users read own" ON public.users;
CREATE POLICY "Users read own" ON public.users FOR SELECT USING (auth.uid() = auth_id);
DROP POLICY IF EXISTS "Users update own" ON public.users;
CREATE POLICY "Users update own" ON public.users FOR UPDATE USING (auth.uid() = auth_id);

-- Worker Profiles
DROP POLICY IF EXISTS "Workers read own profile" ON public.worker_profiles;
CREATE POLICY "Workers read own profile" ON public.worker_profiles FOR SELECT USING (
  user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);
DROP POLICY IF EXISTS "Workers update own profile" ON public.worker_profiles;
CREATE POLICY "Workers update own profile" ON public.worker_profiles FOR UPDATE USING (
  user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);
DROP POLICY IF EXISTS "Workers insert own profile" ON public.worker_profiles;
CREATE POLICY "Workers insert own profile" ON public.worker_profiles FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);
DROP POLICY IF EXISTS "Public read verified workers" ON public.worker_profiles;
CREATE POLICY "Public read verified workers" ON public.worker_profiles FOR SELECT USING (is_verified = TRUE);
DROP POLICY IF EXISTS "Admins read all profiles" ON public.worker_profiles;
CREATE POLICY "Admins read all profiles" ON public.worker_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Admins update all profiles" ON public.worker_profiles;
CREATE POLICY "Admins update all profiles" ON public.worker_profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- Verification Documents
DROP POLICY IF EXISTS "Workers select own verification" ON public.verification_documents;
CREATE POLICY "Workers select own verification" ON public.verification_documents FOR SELECT USING (
  worker_id IN (SELECT id FROM public.worker_profiles WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
);
DROP POLICY IF EXISTS "Workers insert own verification" ON public.verification_documents;
CREATE POLICY "Workers insert own verification" ON public.verification_documents FOR INSERT WITH CHECK (
  worker_id IN (SELECT id FROM public.worker_profiles WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
);
DROP POLICY IF EXISTS "Workers delete own verification" ON public.verification_documents;
CREATE POLICY "Workers delete own verification" ON public.verification_documents FOR DELETE USING (
  worker_id IN (SELECT id FROM public.worker_profiles WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
);
DROP POLICY IF EXISTS "Admins manage all verification" ON public.verification_documents;
CREATE POLICY "Admins manage all verification" ON public.verification_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- Certificates
DROP POLICY IF EXISTS "Workers select own certificates" ON public.worker_certificates;
CREATE POLICY "Workers select own certificates" ON public.worker_certificates FOR SELECT USING (
  worker_id IN (SELECT id FROM public.worker_profiles WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
);
DROP POLICY IF EXISTS "Workers insert own certificates" ON public.worker_certificates;
CREATE POLICY "Workers insert own certificates" ON public.worker_certificates FOR INSERT WITH CHECK (
  worker_id IN (SELECT id FROM public.worker_profiles WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
);
DROP POLICY IF EXISTS "Workers delete own certificates" ON public.worker_certificates;
CREATE POLICY "Workers delete own certificates" ON public.worker_certificates FOR DELETE USING (
  worker_id IN (SELECT id FROM public.worker_profiles WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
);
DROP POLICY IF EXISTS "Public read worker certificates" ON public.worker_certificates;
CREATE POLICY "Public read worker certificates" ON public.worker_certificates FOR SELECT USING (
  worker_id IN (SELECT id FROM public.worker_profiles WHERE is_verified = TRUE)
);

-- Portfolio
DROP POLICY IF EXISTS "Workers select own portfolio" ON public.work_portfolio;
CREATE POLICY "Workers select own portfolio" ON public.work_portfolio FOR SELECT USING (
  worker_id IN (SELECT id FROM public.worker_profiles WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
);
DROP POLICY IF EXISTS "Workers insert own portfolio" ON public.work_portfolio;
CREATE POLICY "Workers insert own portfolio" ON public.work_portfolio FOR INSERT WITH CHECK (
  worker_id IN (SELECT id FROM public.worker_profiles WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
);
DROP POLICY IF EXISTS "Workers delete own portfolio" ON public.work_portfolio;
CREATE POLICY "Workers delete own portfolio" ON public.work_portfolio FOR DELETE USING (
  worker_id IN (SELECT id FROM public.worker_profiles WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
);
DROP POLICY IF EXISTS "Public read worker portfolio" ON public.work_portfolio;
CREATE POLICY "Public read worker portfolio" ON public.work_portfolio FOR SELECT USING (
  worker_id IN (SELECT id FROM public.worker_profiles WHERE is_verified = TRUE)
);

-- Service Requests
DROP POLICY IF EXISTS "Customers read own requests" ON public.service_requests;
CREATE POLICY "Customers read own requests" ON public.service_requests FOR SELECT USING (
  customer_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);
DROP POLICY IF EXISTS "Customers insert own requests" ON public.service_requests;
CREATE POLICY "Customers insert own requests" ON public.service_requests FOR INSERT WITH CHECK (
  customer_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);
DROP POLICY IF EXISTS "Customers update own requests" ON public.service_requests;
CREATE POLICY "Customers update own requests" ON public.service_requests FOR UPDATE USING (
  customer_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);
DROP POLICY IF EXISTS "Workers read assigned requests" ON public.service_requests;
CREATE POLICY "Workers read assigned requests" ON public.service_requests FOR SELECT USING (
  worker_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);
DROP POLICY IF EXISTS "Workers update assigned requests" ON public.service_requests;
CREATE POLICY "Workers update assigned requests" ON public.service_requests FOR UPDATE USING (
  worker_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins read all requests" ON public.service_requests;
CREATE POLICY "Admins read all requests" ON public.service_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- Payments
DROP POLICY IF EXISTS "Users read own payments" ON public.payments;
CREATE POLICY "Users read own payments" ON public.payments FOR SELECT USING (
  payer_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);
DROP POLICY IF EXISTS "Users insert own payments" ON public.payments;
CREATE POLICY "Users insert own payments" ON public.payments FOR INSERT WITH CHECK (
  payer_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

-- Notifications
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (
  user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);
