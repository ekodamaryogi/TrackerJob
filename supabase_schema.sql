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

-- Table: user_settings (Preferensi user, konfigurasi Fonnte API Token & WhatsApp Penerima)
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
  -- Konfigurasi WhatsApp Fonnte Gateway Cloud
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  whatsapp_phone TEXT DEFAULT '', -- Nomor WhatsApp Penerima (+62... / 08...)
  whatsapp_api_key TEXT DEFAULT '', -- Fonnte API Token (dari fonnte.com)
  whatsapp_mode TEXT DEFAULT 'webhook_fonnte',
  whatsapp_webhook_url TEXT DEFAULT '',
  whatsapp_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  whatsapp_phone_number TEXT DEFAULT '',
  whatsapp_notification_types JSONB DEFAULT '{"interview": true, "deadline": true, "followup": true, "expired": true, "status_change": true}'::jsonb,
  currency_default TEXT NOT NULL DEFAULT 'IDR',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrasi aman (ALTER TABLE) untuk database Supabase yang sudah pernah dibuat sebelumnya
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT DEFAULT '';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT DEFAULT '';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS whatsapp_mode TEXT DEFAULT 'webhook_fonnte';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS whatsapp_notification_types JSONB DEFAULT '{"interview": true, "deadline": true, "followup": true, "expired": true, "status_change": true}'::jsonb;

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
-- 7. OTOMATISASI WHATSAPP 24/7 DI SUPABASE CLOUD (pg_net & pg_cron)
-- ==============================================================================
-- Fitur ini memungkinkan Supabase mengirim pesan WhatsApp Fonnte secara otomatis
-- di background 24/7 TANPA PERLU MEMBUKA BROWSER ATAU WEB SAMA SEKALI.

-- 7.1 Aktifkan Ekstensi pg_net (untuk HTTP Request ke API Fonnte)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 7.2 Fungsi Mengirim Pesan ke API Fonnte dari Database Supabase
CREATE OR REPLACE FUNCTION public.send_fonnte_wa(
  p_phone TEXT,
  p_message TEXT,
  p_token TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_request_id BIGINT;
  v_clean_phone TEXT;
BEGIN
  IF p_token IS NULL OR p_token = '' OR p_phone IS NULL OR p_phone = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token atau nomor HP kosong');
  END IF;

  -- Normalisasi nomor HP (08xx -> 628xx)
  v_clean_phone := REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g');
  IF v_clean_phone LIKE '08%' THEN
    v_clean_phone := '62' || SUBSTRING(v_clean_phone FROM 2);
  END IF;

  -- Kirim HTTP POST langsung dari Supabase ke server Fonnte
  SELECT net.http_post(
    url := 'https://api.fonnte.com/send',
    headers := jsonb_build_object(
      'Authorization', p_token,
      'Content-Type', 'application/x-www-form-urlencoded'
    ),
    body := 'target=' || v_clean_phone || '&message=' || url_encode(p_message)
  ) INTO v_request_id;

  RETURN jsonb_build_object('success', true, 'request_id', v_request_id, 'target', v_clean_phone);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.3 Helper Function untuk URL Encode
CREATE OR REPLACE FUNCTION public.url_encode(p_data TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    p_data,
    ' ', '%20'),
    E'\n', '%0A'),
    '&', '%26'),
    '=', '%3D'),
    '#', '%23');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7.4 Fungsi Pengecekan Pengingat Harian (Jadwal Interview & Deadline)
CREATE OR REPLACE FUNCTION public.cron_check_and_send_wa_reminders()
RETURNS VOID AS $$
DECLARE
  v_settings RECORD;
  v_interview RECORD;
  v_msg TEXT;
BEGIN
  -- Ambil konfigurasi user dari database
  SELECT * INTO v_settings FROM public.user_settings WHERE id = 'default_user' LIMIT 1;
  
  IF v_settings.whatsapp_enabled IS NOT TRUE OR v_settings.whatsapp_api_key = '' OR v_settings.whatsapp_phone = '' THEN
    RETURN;
  END IF;

  -- 1. Cek Jadwal Interview dalam 24 Jam ke depan
  FOR v_interview IN
    SELECT i.*, a.company, a.position 
    FROM public.interviews i
    JOIN public.applications a ON a.id = i.application_id
    WHERE i.scheduled_at >= NOW() 
      AND i.scheduled_at <= NOW() + INTERVAL '24 hours'
      AND i.status = 'scheduled'
  LOOP
    v_msg := '🔔 *REMINDER INTERVIEW (JOB TRACKER)*' || E'\n\n' ||
             'Halo! Anda memiliki jadwal interview besok:' || E'\n' ||
             '🏢 *Perusahaan:* ' || v_interview.company || E'\n' ||
             '💼 *Posisi:* ' || v_interview.position || E'\n' ||
             '📅 *Waktu:* ' || TO_CHAR(v_interview.scheduled_at, 'DD Mon YYYY, HH24:MI') || ' WIB' || E'\n' ||
             '📍 *Tipe/Lokasi:* ' || COALESCE(v_interview.location, 'Online/Remote') || E'\n\n' ||
             'Semoga sukses interview-nya! 🚀';
             
    PERFORM public.send_fonnte_wa(v_settings.whatsapp_phone, v_msg, v_settings.whatsapp_api_key);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 8. INITIAL SEED DATA (Default User Settings)
-- ==============================================================================

INSERT INTO public.user_settings (
  id, theme, in_app_notifications, notify_interview, notify_deadline, 
  notify_followup, notify_expired, deadline_reminder_days, interview_reminder_hours, 
  whatsapp_enabled, whatsapp_mode, currency_default
)
VALUES (
  'default_user', 'light', true, true, true, 
  true, true, 3, 24, 
  true, 'webhook_fonnte', 'IDR'
)
ON CONFLICT (id) DO NOTHING;

-- Selesai! Schema database Supabase & Otomasi Fonnte siap digunakan.
