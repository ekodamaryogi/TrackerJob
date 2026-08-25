import {
  JobApplication,
  Interview,
  NotificationItem,
  UserSettings,
} from '../types';
import { Storage } from './storage';

export interface WhatsAppNotificationPayload {
  to: string;
  template: 'interview_reminder' | 'deadline_reminder' | 'expired_alert' | 'followup_reminder';
  parameters: {
    company: string;
    position: string;
    date: string;
    time?: string;
    link?: string;
  };
}

export const NotificationService = {
  // Pure generator for fast UI reactive updates
  generateNotifications: (
    apps: JobApplication[],
    interviews: Interview[],
    settings: UserSettings
  ): NotificationItem[] => {
    const list: NotificationItem[] = [];
    const now = new Date();

    // 1. Upcoming interviews in the next 48h
    interviews.forEach((interview) => {
      const interviewDate = new Date(interview.scheduled_at);
      const diffHours = (interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours > 0 && diffHours <= 48) {
        const app = apps.find((a) => a.id === interview.application_id);
        if (app) {
          const timeFormatted = interviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateFormatted = interviewDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          list.push({
            id: `notif-int-${interview.id}`,
            title: `Upcoming ${interview.type}: ${app.company}`,
            message: `${interview.type} with ${app.company} (${app.position}) is scheduled for ${dateFormatted} at ${timeFormatted}.`,
            type: 'interview_reminder',
            application_id: app.id,
            event_date: interview.scheduled_at,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    });

    // 2. Upcoming deadlines in next 3 days
    apps.forEach((app) => {
      if (app.deadline && !['Offer', 'Accepted', 'Rejected', 'Withdrawn', 'Expired'].includes(app.status)) {
        const deadlineDate = new Date(app.deadline);
        const diffDays = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays >= 0 && diffDays <= 3) {
          const dateFormatted = deadlineDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          list.push({
            id: `notif-dl-${app.id}`,
            title: `Deadline Approaching: ${app.company}`,
            message: `Application deadline for ${app.position} at ${app.company} is on ${dateFormatted}.`,
            type: 'deadline_reminder',
            application_id: app.id,
            event_date: app.deadline,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    });

    return list;
  },

  // Check and generate any missing time-sensitive notifications
  evaluateTimeSensitiveAlerts: async (): Promise<NotificationItem[]> => {
    const settings = Storage.getSettings();
    if (!settings.in_app_notifications) return [];

    const apps = await Storage.getApplications();
    const interviews = await Storage.getInterviews();
    const existingNotifs = await Storage.getNotifications();
    const createdNotifs: NotificationItem[] = [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Check Upcoming Interviews (Next 48 hours)
    if (settings.notify_interview) {
      for (const interview of interviews) {
        const interviewDate = new Date(interview.scheduled_at);
        const diffHours = (interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours > 0 && diffHours <= 48) {
          const app = apps.find((a) => a.id === interview.application_id);
          const notifKey = `int-${interview.id}-${interviewDate.toISOString().slice(0, 10)}`;
          const alreadyExists = existingNotifs.some(
            (n) => n.application_id === interview.application_id && n.type === 'interview_reminder' && n.title.includes(interview.type)
          );

          if (!alreadyExists && app) {
            const timeFormatted = interviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateFormatted = interviewDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const notif = await Storage.createNotification({
              title: `Upcoming ${interview.type}: ${app.company}`,
              message: `${interview.type} with ${app.company} (${app.position}) is scheduled for ${dateFormatted} at ${timeFormatted}.`,
              type: 'interview_reminder',
              application_id: app.id,
              event_date: interview.scheduled_at,
              is_read: false,
            });
            createdNotifs.push(notif);

            // Trigger WhatsApp if enabled
            if (settings.whatsapp_enabled && settings.whatsapp_phone && settings.whatsapp_notification_types.interview) {
              NotificationService.sendWhatsAppNotification({
                to: settings.whatsapp_phone,
                template: 'interview_reminder',
                parameters: {
                  company: app.company,
                  position: app.position,
                  date: dateFormatted,
                  time: timeFormatted,
                  link: interview.meeting_url,
                },
              });
            }
          }
        }
      }
    }

    // 2. Check Upcoming Deadlines (Next 3 days)
    if (settings.notify_deadline) {
      for (const app of apps) {
        if (app.deadline && !['Offer', 'Accepted', 'Rejected', 'Withdrawn', 'Expired'].includes(app.status)) {
          const deadlineDate = new Date(app.deadline);
          const diffDays = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

          if (diffDays >= 0 && diffDays <= 3) {
            const alreadyExists = existingNotifs.some(
              (n) => n.application_id === app.id && n.type === 'deadline_reminder'
            );

            if (!alreadyExists) {
              const dateFormatted = deadlineDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              const notif = await Storage.createNotification({
                title: `Deadline Approaching: ${app.company}`,
                message: `Application deadline for ${app.position} at ${app.company} is on ${dateFormatted}.`,
                type: 'deadline_reminder',
                application_id: app.id,
                event_date: app.deadline,
                is_read: false,
              });
              createdNotifs.push(notif);
            }
          }
        }
      }
    }

    // 3. Check Expired Applications (deadline passed & still in wishlist/applied/screening)
    if (settings.notify_expired) {
      for (const app of apps) {
        if (app.deadline && ['Wishlist', 'Applied', 'Screening'].includes(app.status)) {
          const deadlineDate = new Date(app.deadline);
          if (deadlineDate < now) {
            const alreadyExists = existingNotifs.some(
              (n) => n.application_id === app.id && n.type === 'application_expired'
            );

            if (!alreadyExists) {
              const notif = await Storage.createNotification({
                title: `Application Expired: ${app.company}`,
                message: `The deadline for ${app.position} at ${app.company} has passed without response. Consider marking as Expired.`,
                type: 'application_expired',
                application_id: app.id,
                event_date: app.deadline,
                is_read: false,
              });
              createdNotifs.push(notif);
            }
          }
        }
      }
    }

    return createdNotifs;
  },

  // Extensible WhatsApp notification sender
  sendWhatsAppNotification: async (
    payload: WhatsAppNotificationPayload
  ): Promise<{ success: boolean; message: string; simulatedPreview?: string }> => {
    // Generate text message preview
    let messageText = '';
    switch (payload.template) {
      case 'interview_reminder':
        messageText = `🔔 *Job Tracker Alert: Interview Reminder*\n\nYou have an upcoming interview with *${payload.parameters.company}* for *${payload.parameters.position}*.\n🗓️ *Date:* ${payload.parameters.date}\n⏰ *Time:* ${payload.parameters.time || 'TBA'}${payload.parameters.link ? `\n🔗 *Meeting Link:* ${payload.parameters.link}` : ''}\n\nGood luck! 🚀`;
        break;
      case 'deadline_reminder':
        messageText = `⏳ *Job Tracker Alert: Deadline Approaching*\n\nYour application for *${payload.parameters.position}* at *${payload.parameters.company}* is due on *${payload.parameters.date}*.`;
        break;
      case 'expired_alert':
        messageText = `⚠️ *Job Tracker Alert: Application Expired*\n\nDeadline for *${payload.parameters.position}* at *${payload.parameters.company}* has passed.`;
        break;
      case 'followup_reminder':
        messageText = `📬 *Job Tracker Alert: Follow-up Reminder*\n\nTime to follow up with *${payload.parameters.company}* regarding your application.`;
        break;
    }

    // In a live production environment with WhatsApp Cloud API token, this makes a POST to:
    // https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages
    console.log('[WhatsApp Notification Dispatch]', {
      recipient: payload.to,
      template: payload.template,
      body: messageText,
    });

    return {
      success: true,
      message: `WhatsApp message prepared for ${payload.to}`,
      simulatedPreview: messageText,
    };
  },
};

// Utility formatting functions
export const formatCurrency = (amount?: number, currency = 'USD'): string => {
  if (amount === undefined || amount === null) return '-';
  try {
    if (currency === 'IDR') {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
};

export const formatSalaryRange = (min?: number, max?: number, currency = 'USD'): string => {
  if (!min && !max) return 'Not disclosed';
  if (min && max) {
    if (currency === 'IDR') {
      const minM = min >= 1000000 ? `${(min / 1000000).toFixed(0)}M` : min.toLocaleString();
      const maxM = max >= 1000000 ? `${(max / 1000000).toFixed(0)}M` : max.toLocaleString();
      return `Rp ${minM} - ${maxM} / mo`;
    }
    return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
  }
  if (min) return `From ${formatCurrency(min, currency)}`;
  if (max) return `Up to ${formatCurrency(max, currency)}`;
  return 'Not disclosed';
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const formatRelativeTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
};
