export type ApplicationStatus =
  | 'Wishlist'
  | 'Applied'
  | 'Screening'
  | 'Interview'
  | 'Technical Test'
  | 'HR Interview'
  | 'Offer'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn'
  | 'Expired';

export type WorkType = 'Remote' | 'Hybrid' | 'On-site';

export type EmploymentType =
  | 'Full-time'
  | 'Part-time'
  | 'Internship'
  | 'Contract'
  | 'Freelance'
  | 'Other';

export type ApplicationSource =
  | 'LinkedIn'
  | 'JobStreet'
  | 'Glints'
  | 'Company Website'
  | 'Referral'
  | 'Campus'
  | 'Other';

export type InterviewType =
  | 'HR Interview'
  | 'Technical Interview'
  | 'User Interview'
  | 'Manager Interview'
  | 'Final Interview'
  | 'Other';

export type DocumentType =
  | 'CV'
  | 'Cover Letter'
  | 'Job Description'
  | 'Portfolio'
  | 'Certificate'
  | 'Other';

export type NotificationType =
  | 'interview_reminder'
  | 'deadline_reminder'
  | 'followup_reminder'
  | 'application_expired'
  | 'status_update'
  | 'general';

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string;
  work_type: WorkType;
  employment_type: EmploymentType;
  job_url?: string;
  application_date: string; // ISO date string (YYYY-MM-DD)
  deadline?: string; // ISO date string (YYYY-MM-DD)
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  status: ApplicationStatus;
  source: ApplicationSource;
  recruiter_name?: string;
  recruiter_contact?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  title: string;
  description?: string;
  event_type: 'status_change' | 'note' | 'interview' | 'deadline' | 'document' | 'contact' | 'custom';
  event_date: string; // ISO date or datetime
  created_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  type: InterviewType;
  scheduled_at: string; // ISO datetime
  duration_minutes: number;
  interviewer?: string;
  meeting_url?: string;
  location?: string;
  notes?: string;
  questions?: string[];
  result?: 'Pending' | 'Passed' | 'Failed' | 'Rescheduled' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  name: string;
  type: DocumentType;
  file_url: string; // Local base64/blob URL or Supabase storage URL
  file_size?: number; // In bytes
  mime_type?: string;
  uploaded_at: string;
  content_text?: string; // Optional raw text/markdown preview for simulated CVs/JD
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  application_id?: string;
  event_date?: string;
  is_read: boolean;
  created_at: string;
}

export type AppNotification = NotificationItem;

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  in_app_notifications?: boolean;
  notify_interview?: boolean;
  notify_deadline?: boolean;
  notify_followup?: boolean;
  notify_expired?: boolean;
  deadline_reminder_days?: number;
  interview_reminder_hours?: number;
  whatsapp_enabled?: boolean;
  whatsapp_phone?: string;
  whatsapp_notifications_enabled?: boolean;
  whatsapp_phone_number?: string;
  whatsapp_notification_types?: {
    interview: boolean;
    deadline: boolean;
    followup: boolean;
    expired: boolean;
  };
  supabase_url?: string;
  supabase_anon_key?: string;
  currency_default?: string;
}

export interface CalendarEventItem {
  id: string;
  application_id: string;
  company: string;
  position: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: 'interview' | 'deadline' | 'followup' | 'technical_test' | 'other';
  interview_id?: string;
  status: ApplicationStatus;
}
