import {
  JobApplication,
  ApplicationEvent,
  Interview,
  ApplicationDocument,
  NotificationItem,
  UserSettings,
  ApplicationStatus,
} from '../types';
import { getSupabaseClient } from './supabase';
import {
  INITIAL_APPLICATIONS,
  INITIAL_EVENTS,
  INITIAL_INTERVIEWS,
  INITIAL_DOCUMENTS,
  INITIAL_NOTIFICATIONS,
  DEFAULT_USER_SETTINGS,
} from './initialData';

const STORAGE_KEYS = {
  APPLICATIONS: 'job_tracker_applications_v1',
  EVENTS: 'job_tracker_events_v1',
  INTERVIEWS: 'job_tracker_interviews_v1',
  DOCUMENTS: 'job_tracker_documents_v1',
  NOTIFICATIONS: 'job_tracker_notifications_v1',
  SETTINGS: 'job_tracker_settings_v1',
};

// Helper for local storage get/set
const getLocal = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
};

const setLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
  }
};

export const Storage = {
  // Initialization check
  init: () => {
    if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
      setLocal(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      setLocal(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INTERVIEWS)) {
      setLocal(STORAGE_KEYS.INTERVIEWS, INITIAL_INTERVIEWS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) {
      setLocal(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      setLocal(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      setLocal(STORAGE_KEYS.SETTINGS, DEFAULT_USER_SETTINGS);
    }
  },

  // Reset database to initial seed data
  resetToDefault: () => {
    setLocal(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
    setLocal(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    setLocal(STORAGE_KEYS.INTERVIEWS, INITIAL_INTERVIEWS);
    setLocal(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
    setLocal(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setLocal(STORAGE_KEYS.SETTINGS, DEFAULT_USER_SETTINGS);
  },

  resetToSeedData: async () => {
    Storage.resetToDefault();
  },

  importFullData: async (data: {
    applications: JobApplication[];
    interviews: Interview[];
    documents: ApplicationDocument[];
    events: ApplicationEvent[];
  }) => {
    if (data.applications) setLocal(STORAGE_KEYS.APPLICATIONS, data.applications);
    if (data.interviews) setLocal(STORAGE_KEYS.INTERVIEWS, data.interviews);
    if (data.documents) setLocal(STORAGE_KEYS.DOCUMENTS, data.documents);
    if (data.events) setLocal(STORAGE_KEYS.EVENTS, data.events);
  },

  // Clear all data
  clearAll: () => {
    setLocal(STORAGE_KEYS.APPLICATIONS, []);
    setLocal(STORAGE_KEYS.EVENTS, []);
    setLocal(STORAGE_KEYS.INTERVIEWS, []);
    setLocal(STORAGE_KEYS.DOCUMENTS, []);
    setLocal(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  // ================= APPLICATIONS =================
  getApplications: async (): Promise<JobApplication[]> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          // Sync with local
          setLocal(STORAGE_KEYS.APPLICATIONS, data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetch failed, fallback to local:', err);
      }
    }
    return getLocal<JobApplication[]>(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
  },

  getApplicationById: async (id: string): Promise<JobApplication | null> => {
    const apps = await Storage.getApplications();
    return apps.find((a) => a.id === id) || null;
  },

  createApplication: async (
    appData: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>
  ): Promise<JobApplication> => {
    const newApp: JobApplication = {
      ...appData,
      id: 'app-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to local
    const current = getLocal<JobApplication[]>(STORAGE_KEYS.APPLICATIONS, []);
    const updated = [newApp, ...current];
    setLocal(STORAGE_KEYS.APPLICATIONS, updated);

    // Create automatic initial timeline event
    await Storage.createEvent({
      application_id: newApp.id,
      title: `Application Added (${newApp.status})`,
      description: `Targeting ${newApp.position} at ${newApp.company}. Work type: ${newApp.work_type}.`,
      event_type: 'status_change',
      event_date: new Date().toISOString(),
    });

    // Sync to Supabase if configured
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('applications').insert(newApp);
      } catch (err) {
        console.warn('Supabase sync error on createApplication:', err);
      }
    }

    return newApp;
  },

  updateApplication: async (
    id: string,
    updates: Partial<JobApplication>
  ): Promise<JobApplication | null> => {
    const current = getLocal<JobApplication[]>(STORAGE_KEYS.APPLICATIONS, []);
    const index = current.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const oldStatus = current[index].status;
    const updatedApp: JobApplication = {
      ...current[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    current[index] = updatedApp;
    setLocal(STORAGE_KEYS.APPLICATIONS, current);

    // If status changed, record timeline event automatically
    if (updates.status && updates.status !== oldStatus) {
      await Storage.createEvent({
        application_id: id,
        title: `Status changed to ${updates.status}`,
        description: `Moved from ${oldStatus} to ${updates.status}`,
        event_type: 'status_change',
        event_date: new Date().toISOString(),
      });
    }

    // Sync to Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('applications').update(updatedApp).eq('id', id);
      } catch (err) {
        console.warn('Supabase update error:', err);
      }
    }

    return updatedApp;
  },

  updateApplicationStatus: async (
    id: string,
    newStatus: ApplicationStatus
  ): Promise<JobApplication | null> => {
    return Storage.updateApplication(id, { status: newStatus });
  },

  deleteApplication: async (id: string): Promise<boolean> => {
    const current = getLocal<JobApplication[]>(STORAGE_KEYS.APPLICATIONS, []);
    const updated = current.filter((a) => a.id !== id);
    setLocal(STORAGE_KEYS.APPLICATIONS, updated);

    // Cascade delete local events, interviews, documents, notifications
    const events = getLocal<ApplicationEvent[]>(STORAGE_KEYS.EVENTS, []).filter(
      (e) => e.application_id !== id
    );
    setLocal(STORAGE_KEYS.EVENTS, events);

    const interviews = getLocal<Interview[]>(STORAGE_KEYS.INTERVIEWS, []).filter(
      (i) => i.application_id !== id
    );
    setLocal(STORAGE_KEYS.INTERVIEWS, interviews);

    const documents = getLocal<ApplicationDocument[]>(STORAGE_KEYS.DOCUMENTS, []).filter(
      (d) => d.application_id !== id
    );
    setLocal(STORAGE_KEYS.DOCUMENTS, documents);

    const notifications = getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []).filter(
      (n) => n.application_id !== id
    );
    setLocal(STORAGE_KEYS.NOTIFICATIONS, notifications);

    // Sync to Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('applications').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete error:', err);
      }
    }

    return true;
  },

  // ================= EVENTS / TIMELINE =================
  getEvents: async (applicationId?: string): Promise<ApplicationEvent[]> => {
    const supabase = getSupabaseClient();
    if (supabase && applicationId) {
      try {
        const { data, error } = await supabase
          .from('application_events')
          .select('*')
          .eq('application_id', applicationId)
          .order('event_date', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase events fetch failed:', err);
      }
    }
    const allEvents = getLocal<ApplicationEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    if (applicationId) {
      return allEvents
        .filter((e) => e.application_id === applicationId)
        .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    }
    return allEvents;
  },

  createEvent: async (
    eventData: Omit<ApplicationEvent, 'id' | 'created_at'>
  ): Promise<ApplicationEvent> => {
    const newEvent: ApplicationEvent = {
      ...eventData,
      id: 'evt-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
    };

    const current = getLocal<ApplicationEvent[]>(STORAGE_KEYS.EVENTS, []);
    setLocal(STORAGE_KEYS.EVENTS, [newEvent, ...current]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('application_events').insert(newEvent);
      } catch (err) {
        console.warn('Supabase insert event error:', err);
      }
    }

    return newEvent;
  },

  deleteEvent: async (id: string): Promise<boolean> => {
    const current = getLocal<ApplicationEvent[]>(STORAGE_KEYS.EVENTS, []);
    setLocal(STORAGE_KEYS.EVENTS, current.filter((e) => e.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('application_events').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete event error:', err);
      }
    }
    return true;
  },

  // ================= INTERVIEWS =================
  getInterviews: async (applicationId?: string): Promise<Interview[]> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('interviews').select('*').order('scheduled_at', { ascending: true });
        if (applicationId) {
          query = query.eq('application_id', applicationId);
        }
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase interviews fetch error:', err);
      }
    }
    const all = getLocal<Interview[]>(STORAGE_KEYS.INTERVIEWS, INITIAL_INTERVIEWS);
    if (applicationId) {
      return all
        .filter((i) => i.application_id === applicationId)
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    }
    return all.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  },

  createInterview: async (
    interviewData: Omit<Interview, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Interview> => {
    const newInterview: Interview = {
      ...interviewData,
      id: 'int-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const current = getLocal<Interview[]>(STORAGE_KEYS.INTERVIEWS, []);
    setLocal(STORAGE_KEYS.INTERVIEWS, [...current, newInterview]);

    // Timeline event
    await Storage.createEvent({
      application_id: newInterview.application_id,
      title: `${newInterview.type} Scheduled`,
      description: `Scheduled for ${new Date(newInterview.scheduled_at).toLocaleString()} with ${newInterview.interviewer || 'interviewer'}.`,
      event_type: 'interview',
      event_date: newInterview.scheduled_at,
    });

    // In-app notification
    await Storage.createNotification({
      title: `Upcoming ${newInterview.type}`,
      message: `Interview scheduled on ${new Date(newInterview.scheduled_at).toLocaleString()}`,
      type: 'interview_reminder',
      application_id: newInterview.application_id,
      event_date: newInterview.scheduled_at,
      is_read: false,
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('interviews').insert(newInterview);
      } catch (err) {
        console.warn('Supabase insert interview error:', err);
      }
    }

    return newInterview;
  },

  updateInterview: async (id: string, updates: Partial<Interview>): Promise<Interview | null> => {
    const current = getLocal<Interview[]>(STORAGE_KEYS.INTERVIEWS, []);
    const index = current.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const updatedInterview: Interview = {
      ...current[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    current[index] = updatedInterview;
    setLocal(STORAGE_KEYS.INTERVIEWS, current);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('interviews').update(updatedInterview).eq('id', id);
      } catch (err) {
        console.warn('Supabase update interview error:', err);
      }
    }

    return updatedInterview;
  },

  deleteInterview: async (id: string): Promise<boolean> => {
    const current = getLocal<Interview[]>(STORAGE_KEYS.INTERVIEWS, []);
    setLocal(STORAGE_KEYS.INTERVIEWS, current.filter((i) => i.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('interviews').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete interview error:', err);
      }
    }
    return true;
  },

  // ================= DOCUMENTS =================
  getDocuments: async (applicationId?: string): Promise<ApplicationDocument[]> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('documents').select('*').order('uploaded_at', { ascending: false });
        if (applicationId) {
          query = query.eq('application_id', applicationId);
        }
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase documents fetch error:', err);
      }
    }
    const all = getLocal<ApplicationDocument[]>(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
    if (applicationId) {
      return all.filter((d) => d.application_id === applicationId);
    }
    return all;
  },

  createDocument: async (
    docData: Omit<ApplicationDocument, 'id' | 'uploaded_at'>
  ): Promise<ApplicationDocument> => {
    const newDoc: ApplicationDocument = {
      ...docData,
      id: 'doc-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      uploaded_at: new Date().toISOString(),
    };

    const current = getLocal<ApplicationDocument[]>(STORAGE_KEYS.DOCUMENTS, []);
    setLocal(STORAGE_KEYS.DOCUMENTS, [newDoc, ...current]);

    // Timeline event
    await Storage.createEvent({
      application_id: newDoc.application_id,
      title: `Document Uploaded: ${newDoc.name}`,
      description: `Attached ${newDoc.type} (${((newDoc.file_size || 0) / 1024).toFixed(0)} KB)`,
      event_type: 'document',
      event_date: new Date().toISOString(),
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('documents').insert(newDoc);
      } catch (err) {
        console.warn('Supabase insert document error:', err);
      }
    }

    return newDoc;
  },

  deleteDocument: async (id: string): Promise<boolean> => {
    const current = getLocal<ApplicationDocument[]>(STORAGE_KEYS.DOCUMENTS, []);
    setLocal(STORAGE_KEYS.DOCUMENTS, current.filter((d) => d.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('documents').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete document error:', err);
      }
    }
    return true;
  },

  // ================= NOTIFICATIONS =================
  getNotifications: async (): Promise<NotificationItem[]> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase notifications fetch error:', err);
      }
    }
    return getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  createNotification: async (
    notifData: Omit<NotificationItem, 'id' | 'created_at'>
  ): Promise<NotificationItem> => {
    const newNotif: NotificationItem = {
      ...notifData,
      id: 'notif-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
    };

    const current = getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    setLocal(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...current]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('notifications').insert(newNotif);
      } catch (err) {
        console.warn('Supabase insert notification error:', err);
      }
    }
    return newNotif;
  },

  markNotificationRead: async (id: string, isRead = true): Promise<void> => {
    const current = getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = current.map((n) => (n.id === id ? { ...n, is_read: isRead } : n));
    setLocal(STORAGE_KEYS.NOTIFICATIONS, updated);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('notifications').update({ is_read: isRead }).eq('id', id);
      } catch (err) {
        console.warn('Supabase update notification error:', err);
      }
    }
  },

  markAllNotificationsRead: async (): Promise<void> => {
    const current = getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = current.map((n) => ({ ...n, is_read: true }));
    setLocal(STORAGE_KEYS.NOTIFICATIONS, updated);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('notifications').update({ is_read: true }).neq('id', '0');
      } catch (err) {
        console.warn('Supabase mark all notifications read error:', err);
      }
    }
  },

  deleteNotification: async (id: string): Promise<boolean> => {
    const current = getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    setLocal(STORAGE_KEYS.NOTIFICATIONS, current.filter((n) => n.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('notifications').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete notification error:', err);
      }
    }
    return true;
  },

  // ================= USER SETTINGS =================
  getSettings: (): UserSettings => {
    const local = getLocal<UserSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_USER_SETTINGS);
    return {
      ...DEFAULT_USER_SETTINGS,
      ...local,
    };
  },

  fetchSettingsFromCloud: async (): Promise<UserSettings> => {
    const local = getLocal<UserSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_USER_SETTINGS);
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('id', 'default_user')
          .maybeSingle();

        if (!error && data) {
          const merged: UserSettings = {
            ...DEFAULT_USER_SETTINGS,
            ...local,
            ...data,
            whatsapp_notification_types: data.whatsapp_notification_types || local.whatsapp_notification_types || DEFAULT_USER_SETTINGS.whatsapp_notification_types,
          };
          setLocal(STORAGE_KEYS.SETTINGS, merged);
          return merged;
        }
      } catch (err) {
        console.warn('Supabase settings fetch error, using local/env:', err);
      }
    }
    return {
      ...DEFAULT_USER_SETTINGS,
      ...local,
    };
  },

  updateSettings: (updates: Partial<UserSettings>): UserSettings => {
    const current = getLocal<UserSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_USER_SETTINGS);
    const updated = { ...current, ...updates };
    setLocal(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  saveSettings: async (updates: Partial<UserSettings>): Promise<UserSettings> => {
    const updated = Storage.updateSettings(updates);
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('user_settings').upsert(
          {
            id: 'default_user',
            theme: updated.theme,
            in_app_notifications: updated.in_app_notifications,
            notify_interview: updated.notify_interview,
            notify_deadline: updated.notify_deadline,
            notify_followup: updated.notify_followup,
            notify_expired: updated.notify_expired,
            deadline_reminder_days: updated.deadline_reminder_days,
            interview_reminder_hours: updated.interview_reminder_hours,
            whatsapp_enabled: updated.whatsapp_enabled,
            whatsapp_phone: updated.whatsapp_phone,
            whatsapp_mode: updated.whatsapp_mode,
            whatsapp_api_key: updated.whatsapp_api_key,
            whatsapp_webhook_url: updated.whatsapp_webhook_url,
            whatsapp_notifications_enabled: updated.whatsapp_notifications_enabled,
            whatsapp_phone_number: updated.whatsapp_phone_number,
            whatsapp_notification_types: updated.whatsapp_notification_types,
            currency_default: updated.currency_default,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (err) {
        console.warn('Supabase sync user_settings error:', err);
      }
    }
    return updated;
  },
};
