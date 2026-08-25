-- ==============================================================================
-- PERSONAL JOB APPLICATION TRACKER - SUPABASE DATABASE SCHEMA (v2.1)
-- Fully Idempotent, Safe to Re-run, Supports Both UUID & Text String IDs
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLE DEFINITIONS (Using TEXT for primary/foreign keys for universal compatibility)
-- ==============================================================================

-- Table: applications (Inti dari setiap lamaran pekerjaan)
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  location TEXT DEFAULT '',
  work_type TEXT NOT NULL CHECK (work_type IN ('Remote', 'Hybrid', 'On-site')),
  employment_type TEXT NOT NULL CHECK (employment_type IN ('Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance', 'Other')),
  job_url TEXT,
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deadline DATE,
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency TEXT DEFAULT 'IDR',
  status TEXT NOT NULL CHECK (status IN (
    'Wishlist', 'Applied', 'Screening', 'Interview', 'Technical Test', 
    'HR Interview', 'Offer', 'Accepted', 'Rejected', 'Withdrawn', 'Expired'
  )),
  source TEXT NOT NULL CHECK (source IN (
    'LinkedIn', 'JobStreet', 'Glints', 'Company Website', 'Referral', 'Campus', 'Other'
  )),
  recruiter_name TEXT,
  recruiter_contact TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: application_events (Riwayat timeline & milestone lamaran)
CREATE TABLE IF NOT EXISTS public.application_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'status_change',
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: interviews (Jadwal & rincian interview / technical test)
CREATE TABLE IF NOT EXISTS public.interviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'HR Interview', 'Technical Interview', 'User Interview', 'Manager Interview', 'Final Interview', 'Other'
  )),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 45,
  interviewer TEXT,
  meeting_url TEXT,
  location TEXT,
  notes TEXT,
  questions JSONB DEFAULT '[]'::jsonb,
  result TEXT DEFAULT 'Pending' CHECK (result IN ('Pending', 'Passed', 'Failed', 'Rescheduled', 'Cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: documents (Metadata dokumen seperti CV, Cover Letter, Portofolio)
CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CV', 'Cover Letter', 'Job Description', 'Portfolio', 'Certificate', 'Other')),
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  content_text TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: notifications (Notifikasi in-app untuk deadline & interview)
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  application_id TEXT REFERENCES public.applications(id) ON DELETE SET NULL,
  event_date TIMESTAMPTZ,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: user_settings (Preferensi user, notifikasi WhatsApp, & tema)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id TEXT PRIMARY KEY DEFAULT 'default_user',
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  in_app_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  notify_interview BOOLEAN NOT NULL DEFAULT TRUE,
  notify_deadline BOOLEAN NOT NULL DEFAULT TRUE,
  notify_followup BOOLEAN NOT NULL DEFAULT TRUE,
  notify_expired BOOLEAN NOT NULL DEFAULT FALSE,
  deadline_reminder_days INTEGER NOT NULL DEFAULT 3,
  interview_reminder_hours INTEGER NOT NULL DEFAULT 24,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_phone TEXT DEFAULT '',
  whatsapp_mode TEXT DEFAULT 'click_to_chat',
  whatsapp_api_key TEXT DEFAULT '',
  whatsapp_webhook_url TEXT DEFAULT '',
  whatsapp_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_phone_number TEXT DEFAULT '',
  whatsapp_notification_types JSONB DEFAULT '{"interview": true, "deadline": true, "followup": true, "expired": true, "status_change": true}'::jsonb,
  currency_default TEXT NOT NULL DEFAULT 'IDR',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. INDEXES (Untuk performa query cepat)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_company ON public.applications(company);
CREATE INDEX IF NOT EXISTS idx_applications_deadline ON public.applications(deadline);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_application_id ON public.application_events(application_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.application_events(event_date DESC);

CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON public.interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON public.interviews(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_documents_application_id ON public.documents(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- ==============================================================================
-- 4. AUTOMATIC TIMESTAMP TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_applications_modtime ON public.applications;
CREATE TRIGGER update_applications_modtime
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_interviews_modtime ON public.interviews;
CREATE TRIGGER update_interviews_modtime
BEFORE UPDATE ON public.interviews
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_settings_modtime ON public.user_settings;
CREATE TRIGGER update_settings_modtime
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES (Idempotent: Drop first, then create)
-- ==============================================================================

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Applications policy
DROP POLICY IF EXISTS "Allow public read-write for applications" ON public.applications;
CREATE POLICY "Allow public read-write for applications" ON public.applications
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Application events policy
DROP POLICY IF EXISTS "Allow public read-write for application_events" ON public.application_events;
CREATE POLICY "Allow public read-write for application_events" ON public.application_events
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Interviews policy
DROP POLICY IF EXISTS "Allow public read-write for interviews" ON public.interviews;
CREATE POLICY "Allow public read-write for interviews" ON public.interviews
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Documents policy
DROP POLICY IF EXISTS "Allow public read-write for documents" ON public.documents;
CREATE POLICY "Allow public read-write for documents" ON public.documents
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Notifications policy
DROP POLICY IF EXISTS "Allow public read-write for notifications" ON public.notifications;
CREATE POLICY "Allow public read-write for notifications" ON public.notifications
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- User settings policy
DROP POLICY IF EXISTS "Allow public read-write for user_settings" ON public.user_settings;
CREATE POLICY "Allow public read-write for user_settings" ON public.user_settings
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 6. SUPABASE STORAGE BUCKET (Untuk Menyimpan File CV & Dokumen)
-- ==============================================================================

-- Buat / Update Storage Bucket 'application-documents' secara publik
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('application-documents', 'application-documents', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policy (Drop first, then recreate)
DROP POLICY IF EXISTS "Allow public storage access" ON storage.objects;
DROP POLICY IF EXISTS "Public Document Access" ON storage.objects;

CREATE POLICY "Allow public storage access" ON storage.objects
  FOR ALL TO anon, authenticated
  USING (bucket_id = 'application-documents')
  WITH CHECK (bucket_id = 'application-documents');

-- ==============================================================================
-- 7. INITIAL SEED DATA (Opsional - Default User Settings)
-- ==============================================================================

INSERT INTO public.user_settings (
  id, theme, in_app_notifications, notify_interview, notify_deadline, 
  notify_followup, notify_expired, deadline_reminder_days, interview_reminder_hours, 
  whatsapp_enabled, whatsapp_mode, currency_default
)
VALUES (
  'default_user', 'light', true, true, true, 
  true, true, 3, 24, 
  true, 'click_to_chat', 'IDR'
)
ON CONFLICT (id) DO NOTHING;

-- Selesai! Schema database Supabase siap digunakan.
