import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClientInstance: SupabaseClient | null = null;

export const getSupabaseConfig = () => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  // Check custom localStorage override if user entered in settings
  let localUrl = '';
  let localKey = '';
  try {
    const customConfig = localStorage.getItem('personal_tracker_supabase_config');
    if (customConfig) {
      const parsed = JSON.parse(customConfig);
      localUrl = parsed.url || '';
      localKey = parsed.key || '';
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

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return null;
  }

  if (!supabaseClientInstance) {
    try {
      supabaseClientInstance = createClient(config.url, config.key);
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

export const testSupabaseConnection = async (
  url: string,
  key: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!url || !key) {
      return { success: false, message: 'URL and Anon Key must not be empty.' };
    }
    const testClient = createClient(url, key);
    const { error } = await testClient.from('applications').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return {
        success: false,
        message: `Connected to Supabase, but encountered error: ${error.message}. (Ensure tables are created with the provided SQL schema)`,
      };
    }
    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed. Check your credentials.' };
  }
};

export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- Personal Job Application Tracker SQL Schema
-- Compatible with Supabase & PostgreSQL
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  salary_currency TEXT DEFAULT 'USD',
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

-- Indexes for Applications
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company);
CREATE INDEX IF NOT EXISTS idx_applications_deadline ON applications(deadline);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

-- 2. Application Events / Timeline Table
CREATE TABLE IF NOT EXISTS application_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'status_change',
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_application_id ON application_events(application_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON application_events(event_date DESC);

-- 3. Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at);

-- 4. Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CV', 'Cover Letter', 'Job Description', 'Portfolio', 'Certificate', 'Other')),
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  content_text TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  event_date TIMESTAMPTZ,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 6. Storage Bucket for Documents (Run in Supabase Storage UI or via SQL)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('application-documents', 'application-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policy (Allow public reads and uploads for single user setup)
CREATE POLICY "Public Document Access" ON storage.objects
FOR ALL USING (bucket_id = 'application-documents')
WITH CHECK (bucket_id = 'application-documents');

-- Trigger to auto-update updated_at on applications
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_applications_modtime
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_interviews_modtime
BEFORE UPDATE ON interviews
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
`;
