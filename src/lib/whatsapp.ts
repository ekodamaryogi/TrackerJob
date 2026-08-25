import { JobApplication, Interview, UserSettings } from '../types';

export interface WhatsAppNotificationPayload {
  to?: string;
  template:
    | 'interview_reminder'
    | 'deadline_reminder'
    | 'expired_alert'
    | 'followup_reminder'
    | 'status_change'
    | 'job_summary'
    | 'test_message'
    | 'custom';
  customTitle?: string;
  customMessage?: string;
  parameters?: {
    company?: string;
    position?: string;
    date?: string;
    time?: string;
    link?: string;
    interviewer?: string;
    location?: string;
    salary?: string;
    status?: string;
    oldStatus?: string;
    deadline?: string;
    notes?: string;
    jobUrl?: string;
  };
}

export interface WhatsAppSendResult {
  success: boolean;
  message: string;
  mode: string;
  waUrl?: string;
  formattedText: string;
  error?: string;
  rawResponse?: any;
}

/**
 * Normalizes a phone number into international format without symbols
 * Example:
 *  "081234567890"  -> "6281234567890"
 *  "+62 812-3456"  -> "628123456"
 *  "81234567890"   -> "6281234567890"
 */
export const cleanPhoneNumber = (phone: string, defaultCountryCode = '62'): string => {
  if (!phone) return '';
  // Remove all non-numeric characters except leading +
  let cleaned = phone.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Indonesian local format handling (08... -> 628...)
  if (cleaned.startsWith('0')) {
    cleaned = defaultCountryCode + cleaned.substring(1);
  } else if (cleaned.length >= 8 && cleaned.length <= 11 && !cleaned.startsWith(defaultCountryCode)) {
    // If entered without leading 0 or country code (e.g. 812345...)
    cleaned = defaultCountryCode + cleaned;
  }

  return cleaned;
};

/**
 * Generates direct wa.me link with URL-encoded text
 */
export const generateWhatsAppUrl = (phone: string, text: string): string => {
  const clean = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  if (!clean) {
    return `https://api.whatsapp.com/send?text=${encodedText}`;
  }
  return `https://wa.me/${clean}?text=${encodedText}`;
};

/**
 * Opens WhatsApp Web or App in a new tab safely
 */
export const openWhatsAppDirect = (phone: string, text: string): boolean => {
  try {
    const url = generateWhatsAppUrl(phone, text);
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    return !!opened;
  } catch (e) {
    console.error('Failed to open WhatsApp window:', e);
    return false;
  }
};

export const WhatsAppService = {
  /**
   * Format message for Interview Reminder
   */
  formatInterviewMessage: (interview: Interview, app: JobApplication): string => {
    const interviewDate = new Date(interview.scheduled_at);
    const dateFormatted = interviewDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeFormatted = interviewDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    let msg = `🔔 *REMINDER INTERVIEW KERJA*\n\n`;
    msg += `Halo! Anda memiliki jadwal interview:\n`;
    msg += `🏢 *Perusahaan:* ${app.company}\n`;
    msg += `💼 *Posisi:* ${app.position}\n`;
    msg += `🎯 *Tahap:* ${interview.type}\n`;
    msg += `🗓️ *Hari/Tanggal:* ${dateFormatted}\n`;
    msg += `⏰ *Waktu:* ${timeFormatted} WIB (${interview.duration_minutes} Menit)\n`;

    if (interview.interviewer) {
      msg += `👤 *Interviewer:* ${interview.interviewer}\n`;
    }
    if (interview.location) {
      msg += `📍 *Lokasi:* ${interview.location}\n`;
    }
    if (interview.meeting_url) {
      msg += `🔗 *Link Meeting:* ${interview.meeting_url}\n`;
    }
    if (interview.notes) {
      msg += `📝 *Catatan Persiapan:* ${interview.notes}\n`;
    }

    msg += `\n✨ *Tips:* Siapkan CV, ringkasan portfolio, dan pelajari latar belakang perusahaan. Semangat! 🚀`;
    return msg;
  },

  /**
   * Format message for Deadline Reminder
   */
  formatDeadlineMessage: (app: JobApplication): string => {
    const dateFormatted = app.deadline
      ? new Date(app.deadline).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '-';

    let msg = `⏳ *PENGINGAT BATAS AKHIR LAMARAN (DEADLINE)*\n\n`;
    msg += `Batas akhir pendaftaran pekerjaan akan segera berakhir:\n`;
    msg += `🏢 *Perusahaan:* ${app.company}\n`;
    msg += `💼 *Posisi:* ${app.position}\n`;
    msg += `📅 *Deadline:* ${dateFormatted}\n`;
    msg += `📊 *Status Saat Ini:* ${app.status}\n`;
    if (app.job_url) {
      msg += `🔗 *Link Lowongan:* ${app.job_url}\n`;
    }
    msg += `\n⚠️ Pastikan berkas CV, cover letter, dan portfolio sudah terkirim sebelum batas waktu.`;
    return msg;
  },

  /**
   * Format message for Application Status Change
   */
  formatStatusChangeMessage: (app: JobApplication, newStatus: string): string => {
    let msg = `📈 *UPDATE STATUS LAMARAN KERJA*\n\n`;
    msg += `Status lamaran kerja Anda telah diperbarui:\n`;
    msg += `🏢 *Perusahaan:* ${app.company}\n`;
    msg += `💼 *Posisi:* ${app.position}\n`;
    msg += `🔄 *Status Baru:* *${newStatus.toUpperCase()}*\n`;
    msg += `📅 *Tanggal Update:* ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;

    if (newStatus === 'Interview' || newStatus === 'Technical Test' || newStatus === 'HR Interview') {
      msg += `\n🎉 Selamat! Anda melangkah ke tahap selanjutnya. Segera cek jadwal dan persiapkan materi.`;
    } else if (newStatus === 'Offer') {
      msg += `\n🎉 *CONGRATULATIONS!* Anda mendapatkan tawaran kerja (Offer Letter). Periksa kompensasi dan benefit sebelum batas konfirmasi.`;
    } else if (newStatus === 'Rejected') {
      msg += `\n💪 Jangan patah semangat! Terus evaluasi dan kirimkan lamaran ke peluang hebat berikutnya.`;
    }

    return msg;
  },

  /**
   * Format message for Follow-up Reminder
   */
  formatFollowupMessage: (app: JobApplication): string => {
    let msg = `📬 *PENGINGAT FOLLOW-UP LAMARAN KERJA*\n\n`;
    msg += `Waktunya menindaklanjuti progres lamaran kerja:\n`;
    msg += `🏢 *Perusahaan:* ${app.company}\n`;
    msg += `💼 *Posisi:* ${app.position}\n`;
    msg += `📅 *Tanggal Melamar:* ${app.application_date}\n`;
    if (app.recruiter_name || app.recruiter_contact) {
      msg += `👤 *Kontak Recruiter:* ${app.recruiter_name || ''} (${app.recruiter_contact || '-'})\n`;
    }
    msg += `\n💡 Kirimkan pesan follow-up sopan untuk menanyakan kabar proses seleksi Anda.`;
    return msg;
  },

  /**
   * Format message for Full Job Summary
   */
  formatJobSummaryMessage: (app: JobApplication): string => {
    let msg = `📋 *DETAIL LAMARAN KERJA*\n\n`;
    msg += `🏢 *Perusahaan:* ${app.company}\n`;
    msg += `💼 *Posisi:* ${app.position}\n`;
    msg += `📍 *Lokasi & Tipe:* ${app.location} (${app.work_type} - ${app.employment_type})\n`;
    msg += `📊 *Status:* ${app.status}\n`;
    msg += `📅 *Tanggal Melamar:* ${app.application_date}\n`;
    if (app.deadline) {
      msg += `⏳ *Deadline:* ${app.deadline}\n`;
    }
    if (app.salary_min || app.salary_max) {
      msg += `💰 *Gaji:* ${app.salary_currency} ${app.salary_min?.toLocaleString() || '0'} - ${app.salary_max?.toLocaleString() || '0'}\n`;
    }
    if (app.job_url) {
      msg += `🔗 *Link:* ${app.job_url}\n`;
    }
    if (app.notes) {
      msg += `📝 *Catatan:* ${app.notes}\n`;
    }
    return msg;
  },

  /**
   * Format test message to verify configuration
   */
  formatTestMessage: (phoneNumber: string): string => {
    const timeNow = new Date().toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'medium',
    });
    return (
      `🧪 *TEST NOTIFIKASI WHATSAPP - JOB APPLICATION TRACKER*\n\n` +
      `✅ Selamat! Integrasi notifikasi WhatsApp Anda berhasil terhubung dan siap digunakan.\n\n` +
      `📱 *Nomor Tujuan:* ${phoneNumber}\n` +
      `⏰ *Waktu Kirim:* ${timeNow}\n` +
      `🤖 *Sistem:* Job Application Tracker & Reminder Suite\n\n` +
      `Anda akan menerima pengingat otomatis untuk jadwal interview, batas deadline, dan perkembangan status lamaran kerja Anda.`
    );
  },

  /**
   * Universal Dispatcher for WhatsApp Notification
   */
  sendWhatsAppNotification: async (
    payload: WhatsAppNotificationPayload,
    settings: UserSettings
  ): Promise<WhatsAppSendResult> => {
    const recipientPhone = payload.to || settings.whatsapp_phone || '';
    const cleanPhone = cleanPhoneNumber(recipientPhone);
    const mode = settings.whatsapp_mode || 'click_to_chat';

    // 1. Generate text body according to template
    let text = '';
    const params = payload.parameters || {};

    switch (payload.template) {
      case 'interview_reminder':
        text =
          `🔔 *REMINDER INTERVIEW KERJA*\n\n` +
          `Halo! Anda memiliki jadwal interview:\n` +
          `🏢 *Perusahaan:* ${params.company || 'Perusahaan'}\n` +
          `💼 *Posisi:* ${params.position || 'Posisi'}\n` +
          `🗓️ *Tanggal:* ${params.date || '-'}\n` +
          `⏰ *Waktu:* ${params.time || '-'} WIB\n` +
          (params.link ? `🔗 *Meeting Link:* ${params.link}\n` : '') +
          (params.interviewer ? `👤 *Interviewer:* ${params.interviewer}\n` : '') +
          `\n✨ Siapkan diri dan semoga sukses! 🚀`;
        break;

      case 'deadline_reminder':
        text =
          `⏳ *PENGINGAT BATAS AKHIR (DEADLINE)*\n\n` +
          `Batas pengajuan lamaran mendekati deadline:\n` +
          `🏢 *Perusahaan:* ${params.company || 'Perusahaan'}\n` +
          `💼 *Posisi:* ${params.position || 'Posisi'}\n` +
          `📅 *Deadline:* ${params.date || params.deadline || '-'}\n` +
          `\n⚠️ Pastikan semua berkas telah siap sebelum waktu berakhir.`;
        break;

      case 'status_change':
        text =
          `📈 *UPDATE STATUS LAMARAN*\n\n` +
          `Status lamaran kerja Anda telah berubah:\n` +
          `🏢 *Perusahaan:* ${params.company || 'Perusahaan'}\n` +
          `💼 *Posisi:* ${params.position || 'Posisi'}\n` +
          `🔄 *Status:* *${(params.status || '').toUpperCase()}*\n` +
          `📅 *Waktu:* ${new Date().toLocaleDateString('id-ID')}\n`;
        break;

      case 'expired_alert':
        text =
          `⚠️ *PEMBERITAHUAN LAMARAN KADALUARSA*\n\n` +
          `Batas deadline untuk posisi *${params.position}* di *${params.company}* telah lewat tanpa respon.`;
        break;

      case 'followup_reminder':
        text =
          `📬 *PENGINGAT FOLLOW-UP LAMARAN*\n\n` +
          `Waktunya follow-up ke recruiter *${params.company}* untuk posisi *${params.position}*.`;
        break;

      case 'test_message':
        text = WhatsAppService.formatTestMessage(cleanPhone || recipientPhone);
        break;

      case 'custom':
      default:
        text =
          payload.customMessage ||
          `${payload.customTitle ? `*${payload.customTitle}*\n\n` : ''}${params.notes || 'Pengingat dari Job Application Tracker'}`;
        break;
    }

    const waUrl = generateWhatsAppUrl(cleanPhone, text);

    // 2. Fonnte WhatsApp API Gateway
    const fonnteToken = settings.whatsapp_api_key?.trim();

    if (!fonnteToken) {
      return {
        success: false,
        message: 'Token Fonnte belum diisi. Masukkan API Token Fonnte Anda di menu Settings > Notifications & WhatsApp.',
        mode: 'fonnte',
        formattedText: text,
        waUrl,
        error: 'Token Fonnte kosong',
      };
    }

    if (!cleanPhone) {
      return {
        success: false,
        message: 'Nomor WhatsApp penerima belum diisi atau tidak valid.',
        mode: 'fonnte',
        formattedText: text,
        waUrl,
        error: 'Nomor telepon kosong',
      };
    }

    try {
      const formData = new FormData();
      formData.append('target', cleanPhone);
      formData.append('message', text);

      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: fonnteToken,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.status) {
        return {
          success: true,
          message: `Notifikasi WhatsApp berhasil dikirim ke ${cleanPhone} via Fonnte Gateway.`,
          mode: 'fonnte',
          formattedText: text,
          waUrl,
          rawResponse: data,
        };
      } else {
        const errorReason = data.reason || data.message || 'Token Fonnte tidak valid atau perangkat WhatsApp offline';
        return {
          success: false,
          message: `Gagal mengirim via Fonnte: ${errorReason}`,
          mode: 'fonnte',
          formattedText: text,
          waUrl,
          error: errorReason,
          rawResponse: data,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Koneksi ke Fonnte API gagal: ${err.message}.`,
        mode: 'fonnte',
        formattedText: text,
        waUrl,
        error: err.message,
      };
    }
  },
};
