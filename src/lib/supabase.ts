import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  JobApplication,
  ApplicationEvent,
  Interview,
  ApplicationDocument,
  NotificationItem,
  UserSettings,
} from '../types';

let supabaseClientInstance: SupabaseClient | null = null;

export const getSupabaseConfig = () => {
  const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
  const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

  // Check custom localStorage override if user entered in settings
  let localUrl = '';
  let localKey = '';
  try {
    const customConfig = localStorage.getItem('personal_tracker_supabase_config');
    if (customConfig) {
      const parsed = JSON.parse(customConfig);
      localUrl = (parsed.url || '').trim();
      localKey = (parsed.key || '').trim();
    }
  } catch {
    // Ignore parse error
  }

  const url = localUrl || envUrl;
  const key = localKey || envKey;

  return {
    url,
    key,
    isConfigured: Boolean(url && key && url.startsWith('http')),
  };
};

export const saveSupabaseConfigToLocal = (url: string, key: string) => {
  const cleanedUrl = url.trim().replace(/\/+$/, '');
  const cleanedKey = key.trim();
  localStorage.setItem(
    'personal_tracker_supabase_config',
    JSON.stringify({ url: cleanedUrl, key: cleanedKey })
  );
  resetSupabaseClient();
};

export const clearSupabaseConfigFromLocal = () => {
  localStorage.removeItem('personal_tracker_supabase_config');
  resetSupabaseClient();
};

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return null;
  }

  if (!supabaseClientInstance) {
    try {
      const cleanUrl = config.url.replace(/\/+$/, '');
      supabaseClientInstance = createClient(cleanUrl, config.key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseClientInstance;
};

export const resetSupabaseClient = () => {
  supabaseClientInstance = null;
};

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  tableCount?: number;
  bucketAccessible?: boolean;
  missingTables?: string[];
}

export const testSupabaseConnection = async (
  url: string,
  key: string
): Promise<ConnectionTestResult> => {
  try {
    const cleanedUrl = url.trim().replace(/\/+$/, '');
    const cleanedKey = key.trim();

    if (!cleanedUrl || !cleanedKey) {
      return {
        success: false,
        message: 'Project URL dan Anon Public Key tidak boleh kosong.',
      };
    }

    if (!cleanedUrl.startsWith('https://') && !cleanedUrl.startsWith('http://')) {
      return {
        success: false,
        message: 'Format Project URL salah. Harus dimulai dengan https:// (contoh: https://xyz.supabase.co)',
      };
    }

    const testClient = createClient(cleanedUrl, cleanedKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Check critical tables
    const tablesToCheck = ['applications', 'application_events', 'interviews', 'documents', 'notifications', 'user_settings'];
    const missingTables: string[] = [];

    for (const table of tablesToCheck) {
      const { error } = await testClient.from(table).select('*').limit(1);
      if (error) {
        if (error.code === '42P01' || error.message?.toLowerCase().includes('does not exist')) {
          missingTables.push(table);
        } else if (error.code === '42501' || error.message?.toLowerCase().includes('row-level security')) {
          return {
            success: false,
            message: `Koneksi berhasil, namun RLS Policy pada tabel "${table}" memblokir akses anon. Pastikan Section 5 di file supabase_schema.sql sudah dijalankan.`,
          };
        }
      }
    }

    if (missingTables.length > 0) {
      return {
        success: false,
        missingTables,
        message: `Terhubung ke Supabase, namun tabel belum dibuat: [${missingTables.join(', ')}]. Silakan jalankan query dari file supabase_schema.sql di SQL Editor Supabase.`,
      };
    }

    // Check storage bucket
    let bucketAccessible = false;
    try {
      const { data: buckets, error: bError } = await testClient.storage.listBuckets();
      if (!bError && buckets) {
        bucketAccessible = buckets.some((b) => b.name === 'application-documents');
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      bucketAccessible,
      message: 'Koneksi ke Supabase berhasil dan seluruh tabel siap digunakan!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal terhubung ke Supabase. Periksa URL dan Anon Key Anda.',
    };
  }
};

/**
 * Upload and sync all local records to Supabase tables
 */
export const uploadLocalDataToSupabase = async (data: {
  applications: JobApplication[];
  events: ApplicationEvent[];
  interviews: Interview[];
  documents: ApplicationDocument[];
  notifications: NotificationItem[];
  settings: UserSettings;
}): Promise<{ success: boolean; count: number; error?: string }> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, count: 0, error: 'Supabase client is not configured.' };
  }

  try {
    let totalCount = 0;

    // 1. Applications
    if (data.applications && data.applications.length > 0) {
      const { error: appErr } = await supabase
        .from('applications')
        .upsert(data.applications, { onConflict: 'id' });
      if (appErr) throw new Error(`Applications sync error: ${appErr.message}`);
      totalCount += data.applications.length;
    }

    // 2. Events
    if (data.events && data.events.length > 0) {
      const { error: evtErr } = await supabase
        .from('application_events')
        .upsert(data.events, { onConflict: 'id' });
      if (evtErr) throw new Error(`Events sync error: ${evtErr.message}`);
      totalCount += data.events.length;
    }

    // 3. Interviews
    if (data.interviews && data.interviews.length > 0) {
      const { error: intErr } = await supabase
        .from('interviews')
        .upsert(data.interviews, { onConflict: 'id' });
      if (intErr) throw new Error(`Interviews sync error: ${intErr.message}`);
      totalCount += data.interviews.length;
    }

    // 4. Documents
    if (data.documents && data.documents.length > 0) {
      const { error: docErr } = await supabase
        .from('documents')
        .upsert(data.documents, { onConflict: 'id' });
      if (docErr) throw new Error(`Documents sync error: ${docErr.message}`);
      totalCount += data.documents.length;
    }

    // 5. Notifications
    if (data.notifications && data.notifications.length > 0) {
      const { error: notifErr } = await supabase
        .from('notifications')
        .upsert(data.notifications, { onConflict: 'id' });
      if (notifErr) throw new Error(`Notifications sync error: ${notifErr.message}`);
      totalCount += data.notifications.length;
    }

    // 6. User Settings
    if (data.settings) {
      const { error: setErr } = await supabase
        .from('user_settings')
        .upsert(
          {
            id: 'default_user',
            theme: data.settings.theme,
            in_app_notifications: data.settings.in_app_notifications,
            notify_interview: data.settings.notify_interview,
            notify_deadline: data.settings.notify_deadline,
            notify_followup: data.settings.notify_followup,
            notify_expired: data.settings.notify_expired,
            deadline_reminder_days: data.settings.deadline_reminder_days,
            interview_reminder_hours: data.settings.interview_reminder_hours,
            whatsapp_enabled: data.settings.whatsapp_enabled,
            whatsapp_phone: data.settings.whatsapp_phone,
            whatsapp_mode: data.settings.whatsapp_mode,
            whatsapp_api_key: data.settings.whatsapp_api_key,
            whatsapp_webhook_url: data.settings.whatsapp_webhook_url,
            whatsapp_notifications_enabled: data.settings.whatsapp_notifications_enabled,
            whatsapp_phone_number: data.settings.whatsapp_phone_number,
            whatsapp_notification_types: data.settings.whatsapp_notification_types,
            currency_default: data.settings.currency_default,
          },
          { onConflict: 'id' }
        );
      if (setErr) console.warn('Settings sync warning:', setErr.message);
    }

    return { success: true, count: totalCount };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Sync to Supabase failed' };
  }
};

/**
 * Pull all data from Supabase into memory
 */
export const pullAllDataFromSupabase = async (): Promise<{
  success: boolean;
  data?: {
    applications: JobApplication[];
    events: ApplicationEvent[];
    interviews: Interview[];
    documents: ApplicationDocument[];
    notifications: NotificationItem[];
    settings?: UserSettings;
  };
  error?: string;
}> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured.' };
  }

  try {
    const [appRes, evtRes, intRes, docRes, notifRes, setRes] = await Promise.all([
      supabase.from('applications').select('*').order('created_at', { ascending: false }),
      supabase.from('application_events').select('*').order('event_date', { ascending: false }),
      supabase.from('interviews').select('*').order('scheduled_at', { ascending: true }),
      supabase.from('documents').select('*').order('uploaded_at', { ascending: false }),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      supabase.from('user_settings').select('*').eq('id', 'default_user').maybeSingle(),
    ]);

    if (appRes.error) throw new Error(`Applications fetch error: ${appRes.error.message}`);
    if (evtRes.error) throw new Error(`Events fetch error: ${evtRes.error.message}`);
    if (intRes.error) throw new Error(`Interviews fetch error: ${intRes.error.message}`);
    if (docRes.error) throw new Error(`Documents fetch error: ${docRes.error.message}`);
    if (notifRes.error) throw new Error(`Notifications fetch error: ${notifRes.error.message}`);

    return {
      success: true,
      data: {
        applications: appRes.data || [],
        events: evtRes.data || [],
        interviews: intRes.data || [],
        documents: docRes.data || [],
        notifications: notifRes.data || [],
        settings: setRes.data || undefined,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to pull data from Supabase' };
  }
};

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- PERSONAL JOB APPLICATION TRACKER - SUPABASE DATABASE SCHEMA (v2.1)
-- Safe to run repeatedly (Idempotent) & Supports both custom and UUID IDs
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Table: applications
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

-- 2. Table: application_events
CREATE TABLE IF NOT EXISTS public.application_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'status_change',
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: interviews
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

-- 4. Table: documents
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

-- 5. Table: notifications
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

-- 6. Table: user_settings (Preferensi sistem, Fonnte API Token & WhatsApp Penerima)
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

-- Idempotent column migrations for existing user_settings table
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT DEFAULT '';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT DEFAULT '';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS whatsapp_mode TEXT DEFAULT 'webhook_fonnte';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS whatsapp_notification_types JSONB DEFAULT '{"interview": true, "deadline": true, "followup": true, "expired": true, "status_change": true}'::jsonb;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_company ON public.applications(company);
CREATE INDEX IF NOT EXISTS idx_applications_deadline ON public.applications(deadline);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_application_id ON public.application_events(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON public.interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON public.documents(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Triggers for updated_at
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

-- Row Level Security (RLS) Policies
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-write for applications" ON public.applications;
CREATE POLICY "Allow public read-write for applications" ON public.applications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for application_events" ON public.application_events;
CREATE POLICY "Allow public read-write for application_events" ON public.application_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for interviews" ON public.interviews;
CREATE POLICY "Allow public read-write for interviews" ON public.interviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for documents" ON public.documents;
CREATE POLICY "Allow public read-write for documents" ON public.documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for notifications" ON public.notifications;
CREATE POLICY "Allow public read-write for notifications" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for user_settings" ON public.user_settings;
CREATE POLICY "Allow public read-write for user_settings" ON public.user_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Storage Bucket & Storage Policy
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('application-documents', 'application-documents', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public storage access" ON storage.objects;
DROP POLICY IF EXISTS "Public Document Access" ON storage.objects;
CREATE POLICY "Allow public storage access" ON storage.objects
  FOR ALL TO anon, authenticated
  USING (bucket_id = 'application-documents')
  WITH CHECK (bucket_id = 'application-documents');

-- Ekstensi pg_net & Otomatisasi Notifikasi WhatsApp Fonnte Latar Belakang (24/7 di Cloud)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

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

  v_clean_phone := REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g');
  IF v_clean_phone LIKE '08%' THEN
    v_clean_phone := '62' || SUBSTRING(v_clean_phone FROM 2);
  END IF;

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
`;
