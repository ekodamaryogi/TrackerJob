import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { UserSettings } from '../../types';
import {
  WhatsAppService,
  WhatsAppNotificationPayload,
  cleanPhoneNumber,
  openWhatsAppDirect,
  generateWhatsAppUrl,
} from '../../lib/whatsapp';
import { Storage } from '../../lib/storage';

interface WhatsAppSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: WhatsAppNotificationPayload;
  title?: string;
}

export const WhatsAppSendModal: React.FC<WhatsAppSendModalProps> = ({
  isOpen,
  onClose,
  payload,
  title = 'Kirim Notifikasi WhatsApp',
}) => {
  const [settings, setSettings] = useState<UserSettings>(() => Storage.getSettings());
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{
    success?: boolean;
    message?: string;
    mode?: string;
    raw?: any;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentSettings = Storage.getSettings();
      setSettings(currentSettings);
      const targetPhone = payload.to || currentSettings.whatsapp_phone || '+6281234567890';
      setPhoneNumber(targetPhone);

      // Generate preview text from payload
      let preview = '';
      if (payload.customMessage) {
        preview = payload.customMessage;
      } else {
        const params = payload.parameters || {};
        switch (payload.template) {
          case 'interview_reminder':
            preview =
              `🔔 *REMINDER INTERVIEW KERJA*\n\n` +
              `Halo! Anda memiliki jadwal interview:\n` +
              `🏢 *Perusahaan:* ${params.company || 'Perusahaan'}\n` +
              `💼 *Posisi:* ${params.position || 'Posisi'}\n` +
              `🗓️ *Tanggal:* ${params.date || '-'}\n` +
              `⏰ *Waktu:* ${params.time || '-'} WIB\n` +
              (params.link ? `🔗 *Meeting Link:* ${params.link}\n` : '') +
              (params.interviewer ? `👤 *Interviewer:* ${params.interviewer}\n` : '') +
              (params.location ? `📍 *Lokasi:* ${params.location}\n` : '') +
              (params.notes ? `📝 *Catatan:* ${params.notes}\n` : '') +
              `\n✨ Siapkan diri dan semoga sukses! 🚀`;
            break;
          case 'deadline_reminder':
            preview =
              `⏳ *PENGINGAT BATAS AKHIR (DEADLINE)*\n\n` +
              `Batas pengajuan lamaran mendekati deadline:\n` +
              `🏢 *Perusahaan:* ${params.company || 'Perusahaan'}\n` +
              `💼 *Posisi:* ${params.position || 'Posisi'}\n` +
              `📅 *Deadline:* ${params.date || params.deadline || '-'}\n` +
              (params.jobUrl ? `🔗 *Link Lowongan:* ${params.jobUrl}\n` : '') +
              `\n⚠️ Pastikan semua berkas telah siap sebelum waktu berakhir.`;
            break;
          case 'status_change':
            preview =
              `📈 *UPDATE STATUS LAMARAN*\n\n` +
              `Status lamaran kerja Anda telah diperbarui:\n` +
              `🏢 *Perusahaan:* ${params.company || 'Perusahaan'}\n` +
              `💼 *Posisi:* ${params.position || 'Posisi'}\n` +
              `🔄 *Status Baru:* *${(params.status || '').toUpperCase()}*\n` +
              `📅 *Waktu:* ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n` +
              `\nSemoga lancar dan sukses selalu! ✨`;
            break;
          case 'followup_reminder':
            preview =
              `📬 *PENGINGAT FOLLOW-UP LAMARAN*\n\n` +
              `Waktunya follow-up ke recruiter *${params.company}* untuk posisi *${params.position}*.\n` +
              (params.interviewer ? `👤 *Recruiter:* ${params.interviewer}\n` : '') +
              `\nKirimkan email/pesan follow-up sopan untuk menanyakan perkembangan lamaran.`;
            break;
          case 'job_summary':
            preview =
              `📋 *RINGKASAN LOWONGAN KERJA*\n\n` +
              `🏢 *Perusahaan:* ${params.company}\n` +
              `💼 *Posisi:* ${params.position}\n` +
              `📍 *Lokasi:* ${params.location || '-'}\n` +
              `📊 *Status:* ${params.status || '-'}\n` +
              (params.salary ? `💰 *Gaji:* ${params.salary}\n` : '') +
              (params.deadline ? `⏳ *Deadline:* ${params.deadline}\n` : '') +
              (params.jobUrl ? `🔗 *Link:* ${params.jobUrl}\n` : '') +
              (params.notes ? `📝 *Catatan:* ${params.notes}\n` : '');
            break;
          case 'test_message':
            preview = WhatsAppService.formatTestMessage(targetPhone);
            break;
          default:
            preview = payload.customMessage || 'Pesan notifikasi Job Application Tracker';
            break;
        }
      }
      setMessageText(preview);
      setSendResult(null);
    }
  }, [isOpen, payload]);

  if (!isOpen) return null;

  const clean = cleanPhoneNumber(phoneNumber);
  const waUrl = generateWhatsAppUrl(clean, messageText);
  const mode = settings.whatsapp_mode || 'click_to_chat';

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const handleOpenWhatsAppDirect = () => {
    openWhatsAppDirect(clean, messageText);
  };

  const handleSendViaGateway = async () => {
    setIsSending(true);
    setSendResult(null);
    try {
      const activePayload: WhatsAppNotificationPayload = {
        ...payload,
        to: clean,
        customMessage: messageText,
      };
      const result = await WhatsAppService.sendWhatsAppNotification(activePayload, {
        ...settings,
        whatsapp_phone: clean,
      });

      setSendResult({
        success: result.success,
        message: result.message,
        mode: result.mode,
        raw: result.rawResponse,
      });

      if (result.mode === 'click_to_chat') {
        openWhatsAppDirect(clean, messageText);
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err.message || 'Terjadi kesalahan saat memproses pengiriman WhatsApp.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {title}
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {mode === 'webhook_fonnte'
                    ? 'Fonnte Gateway'
                    : mode === 'webhook_wablas'
                    ? 'Wablas Gateway'
                    : mode === 'webhook_custom'
                    ? 'Custom Webhook'
                    : 'Direct WhatsApp'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preview pesan, atur nomor penerima, dan kirim pesan via WhatsApp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Phone Number Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Nomor WhatsApp Penerima (Format Internasional / Lokal)
            </label>
            <div className="relative">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contoh: 081234567890 atau +6281234567890"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-2.5 text-[11px] font-mono text-slate-400">
                Cleaned: {clean || '-'}
              </span>
            </div>
          </div>

          {/* Message Textarea / Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Isi Pesan WhatsApp (Dapat Diedit)
              </label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-xs text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Pesan'}</span>
              </button>
            </div>

            <textarea
              rows={8}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono leading-relaxed outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Tuliskan isi pesan notifikasi..."
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>Mendukung format WhatsApp: *tebal*, _miring_, ~coret~</span>
              <span>{messageText.length} karakter</span>
            </div>
          </div>

          {/* Result Alert if available */}
          {sendResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                sendResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200'
              }`}
            >
              {sendResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{sendResult.message}</p>
                {!sendResult.success && (
                  <button
                    onClick={handleOpenWhatsAppDirect}
                    className="mt-1.5 text-xs font-bold underline flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Buka via WhatsApp Web / App Langsung
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            {/* Direct WhatsApp button (wa.me) */}
            <button
              type="button"
              onClick={handleOpenWhatsAppDirect}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Buka WhatsApp Web atau App langsung di tab baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka WA Langsung</span>
            </button>

            {/* Main Trigger / Gateway Send */}
            <button
              type="button"
              onClick={handleSendViaGateway}
              disabled={isSending || !phoneNumber.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {mode === 'click_to_chat' ? 'Kirim via WhatsApp' : 'Kirim via Gateway'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
