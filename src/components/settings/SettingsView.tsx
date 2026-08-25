import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Shield,
  Smartphone,
  Info,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Key,
  Globe,
  Send,
  BookOpen,
  Code2,
  Copy,
  Check,
} from 'lucide-react';
import { UserSettings, JobApplication, Interview, ApplicationDocument, ApplicationEvent } from '../../types';
import { exportToJSON, exportToCSV, importFromJSON } from '../../lib/exportImport';
import { WhatsAppSendModal } from '../whatsapp/WhatsAppSendModal';
import { WhatsAppNotificationPayload } from '../../lib/whatsapp';
import {
  testSupabaseConnection,
  uploadLocalDataToSupabase,
  pullAllDataFromSupabase,
  saveSupabaseConfigToLocal,
  clearSupabaseConfigFromLocal,
  SUPABASE_SQL_SCHEMA,
  ConnectionTestResult,
} from '../../lib/supabase';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  applications: JobApplication[];
  interviews: Interview[];
  documents: ApplicationDocument[];
  events: ApplicationEvent[];
  onRestoreSeedData: () => Promise<void>;
  onClearAllData: () => Promise<void>;
  onImportData: (data: {
    applications: JobApplication[];
    interviews: Interview[];
    documents: ApplicationDocument[];
    events: ApplicationEvent[];
  }) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  applications,
  interviews,
  documents,
  events,
  onRestoreSeedData,
  onClearAllData,
  onImportData,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'cloud' | 'data' | 'about'>('notifications');

  // Notification & WhatsApp state
  const [deadlineDays, setDeadlineDays] = useState(settings.deadline_reminder_days || 3);
  const [interviewHours, setInterviewHours] = useState(settings.interview_reminder_hours || 24);
  const [whatsappEnabled, setWhatsappEnabled] = useState(settings.whatsapp_enabled ?? true);
  const [whatsappPhone, setWhatsappPhone] = useState(settings.whatsapp_phone || '+6281234567890');
  const [whatsappMode, setWhatsappMode] = useState<
    'click_to_chat' | 'webhook_fonnte' | 'webhook_wablas' | 'webhook_custom' | 'meta_cloud_api'
  >(settings.whatsapp_mode || 'click_to_chat');
  const [whatsappApiKey, setWhatsappApiKey] = useState(settings.whatsapp_api_key || '');
  const [whatsappWebhookUrl, setWhatsappWebhookUrl] = useState(settings.whatsapp_webhook_url || '');
  const [whatsappNotifTypes, setWhatsappNotifTypes] = useState({
    interview: settings.whatsapp_notification_types?.interview ?? true,
    deadline: settings.whatsapp_notification_types?.deadline ?? true,
    followup: settings.whatsapp_notification_types?.followup ?? true,
    expired: settings.whatsapp_notification_types?.expired ?? true,
    status_change: settings.whatsapp_notification_types?.status_change ?? true,
  });

  // Interactive guide & test modal state
  const [showGuide, setShowGuide] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPayload, setTestPayload] = useState<WhatsAppNotificationPayload>({
    template: 'test_message',
    to: whatsappPhone,
  });

  // Supabase state
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabase_url || '');
  const [supabaseKey, setSupabaseKey] = useState(settings.supabase_anon_key || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [isPullingSupabase, setIsPullingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<ConnectionTestResult | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [showSupabaseTroubleshoot, setShowSupabaseTroubleshoot] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTestSupabaseConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      onShowToast('Silakan masukkan Project URL dan Anon Key terlebih dahulu.', 'error');
      return;
    }
    setIsTestingSupabase(true);
    try {
      const result = await testSupabaseConnection(supabaseUrl, supabaseKey);
      setSupabaseTestResult(result);
      if (result.success) {
        onShowToast('Berhasil terhubung ke database Supabase!', 'success');
      } else {
        onShowToast(result.message, 'error');
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Gagal menguji koneksi Supabase', 'error');
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleUploadToCloud = async () => {
    if (!supabaseUrl || !supabaseKey) {
      onShowToast('Silakan hubungkan Supabase terlebih dahulu.', 'error');
      return;
    }
    setIsSyncingSupabase(true);
    try {
      const res = await uploadLocalDataToSupabase({
        applications,
        events,
        interviews,
        documents,
        notifications: [],
        settings,
      });
      if (res.success) {
        onShowToast(`Sukses sinkronisasi ${res.count} data ke Supabase Cloud!`, 'success');
      } else {
        onShowToast(`Gagal sinkronisasi: ${res.error}`, 'error');
      }
    } catch (err: any) {
      onShowToast(`Gagal upload data: ${err?.message}`, 'error');
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!supabaseUrl || !supabaseKey) {
      onShowToast('Silakan hubungkan Supabase terlebih dahulu.', 'error');
      return;
    }
    setIsPullingSupabase(true);
    try {
      const res = await pullAllDataFromSupabase();
      if (res.success && res.data) {
        await onImportData({
          applications: res.data.applications,
          interviews: res.data.interviews,
          documents: res.data.documents,
          events: res.data.events,
        });
        if (res.data.settings) {
          await onUpdateSettings(res.data.settings);
        }
        onShowToast(`Sukses mengambil ${res.data.applications.length} lamaran dari Supabase Cloud!`, 'success');
      } else {
        onShowToast(`Gagal mengambil data: ${res.error}`, 'error');
      }
    } catch (err: any) {
      onShowToast(`Gagal pull data: ${err?.message}`, 'error');
    } finally {
      setIsPullingSupabase(false);
    }
  };

  const handleDisconnectSupabase = async () => {
    if (window.confirm('Putuskan koneksi ke Supabase dan kembali ke mode Offline LocalStorage?')) {
      setSupabaseUrl('');
      setSupabaseKey('');
      setSupabaseTestResult(null);
      clearSupabaseConfigFromLocal();
      await onUpdateSettings({
        supabase_url: '',
        supabase_anon_key: '',
      });
      onShowToast('Koneksi Supabase diputuskan. Kembali ke mode Offline.', 'info');
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onUpdateSettings({
        deadline_reminder_days: Number(deadlineDays),
        interview_reminder_hours: Number(interviewHours),
        whatsapp_enabled: whatsappEnabled,
        whatsapp_notifications_enabled: whatsappEnabled,
        whatsapp_phone: whatsappPhone.trim(),
        whatsapp_phone_number: whatsappPhone.trim(),
        whatsapp_mode: whatsappMode,
        whatsapp_api_key: whatsappApiKey.trim(),
        whatsapp_webhook_url: whatsappWebhookUrl.trim(),
        whatsapp_notification_types: whatsappNotifTypes,
      });
      onShowToast('Pengaturan Notifikasi & WhatsApp berhasil disimpan!', 'success');
    } catch {
      onShowToast('Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenTestModal = () => {
    setTestPayload({
      template: 'test_message',
      to: whatsappPhone.trim() || '+6281234567890',
    });
    setTestModalOpen(true);
  };

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const cleanedUrl = supabaseUrl.trim().replace(/\/+$/, '');
      const cleanedKey = supabaseKey.trim();

      saveSupabaseConfigToLocal(cleanedUrl, cleanedKey);

      await onUpdateSettings({
        supabase_url: cleanedUrl,
        supabase_anon_key: cleanedKey,
      });

      // Auto-run connection test
      if (cleanedUrl && cleanedKey) {
        const testRes = await testSupabaseConnection(cleanedUrl, cleanedKey);
        setSupabaseTestResult(testRes);
        if (testRes.success) {
          onShowToast('Kredensial Supabase tersimpan & koneksi aktif!', 'success');
        } else {
          onShowToast('Kredensial disimpan, namun koneksi belum valid: ' + testRes.message, 'error');
        }
      } else {
        onShowToast('Konfigurasi Supabase disimpan.', 'success');
      }
    } catch {
      onShowToast('Gagal menyimpan pengaturan Supabase', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJSON = () => {
    exportToJSON(applications, interviews, documents, events);
    onShowToast('JSON backup downloaded successfully', 'success');
  };

  const handleExportCSV = () => {
    exportToCSV(applications);
    onShowToast('Applications CSV exported successfully', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromJSON(file, async (data) => {
      try {
        await onImportData(data);
        onShowToast('Backup data imported successfully!', 'success');
      } catch (err) {
        onShowToast('Failed to import backup file. Format invalid.', 'error');
      }
    });
    e.target.value = '';
  };

  return (
    <div id="settings-view" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <SettingsIcon className="w-5 h-5 drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Application Settings & Integrations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Konfigurasi Notifikasi WhatsApp, Cloud Database, Backup data, dan preferensi aplikasi
            </p>
          </div>
        </div>

        {/* Setting Section Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mt-5 -mb-5 gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Notifications & WhatsApp</span>
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'cloud'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Cloud Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'data'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup, Export & Import</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'about'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About & Docs</span>
          </button>
        </div>
      </div>

      {/* TAB 1: NOTIFICATIONS & WHATSAPP */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className="space-y-6">
          {/* Main In-App Reminder Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-500" /> In-App Reminder Timing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tentukan waktu pengingat aktif untuk jadwal interview dan batas akhir pendaftaran (deadline).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Deadline Warning Threshold
                </label>
                <select
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-cyan-500"
                >
                  <option value={1}>1 hari sebelum deadline</option>
                  <option value={2}>2 hari sebelum deadline</option>
                  <option value={3}>3 hari sebelum deadline (Rekomendasi)</option>
                  <option value={7}>7 hari sebelum deadline</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Interview Reminder
                </label>
                <select
                  value={interviewHours}
                  onChange={(e) => setInterviewHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-cyan-500"
                >
                  <option value={1}>1 jam sebelum interview</option>
                  <option value={2}>2 jam sebelum interview</option>
                  <option value={12}>12 jam sebelum interview</option>
                  <option value={24}>24 jam sebelum interview (Rekomendasi)</option>
                </select>
              </div>
            </div>
          </div>

          {/* WhatsApp Notification Integration Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-500" /> Integrasi Notifikasi WhatsApp
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kirimkan pengingat jadwal interview, update status, dan alert deadline langsung ke nomor WhatsApp Anda.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappEnabled}
                  onChange={(e) => setWhatsappEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-xs"></div>
              </label>
            </div>

            {whatsappEnabled && (
              <div className="space-y-6 pt-2">
                {/* Recipient Phone Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Nomor WhatsApp Penerima Notifikasi (Format Internasional / 08...)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="+6281234567890 atau 081234567890"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    <div className="absolute right-3 top-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenTestModal}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1 border border-emerald-500/20 transition-colors cursor-pointer"
                      >
                        <Send className="w-3 h-3" /> Test Kirim WA
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format otomatis dinormalisasi ke kode negara (contoh: <code>081234567890</code> otomatis menjadi <code>6281234567890</code>).
                  </p>
                </div>

                {/* Integration Mode Cards */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Metode Integrasi Pengiriman WhatsApp
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Mode 1: Click to Chat (wa.me) */}
                    <div
                      onClick={() => setWhatsappMode('click_to_chat')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        whatsappMode === 'click_to_chat'
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-500" /> Direct (wa.me)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                          Gratis & Instan
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Membuka WhatsApp Web/App langsung dengan pesan terformat rapi. Tanpa perlu backend atau token API.
                      </p>
                    </div>

                    {/* Mode 2: Fonnte Gateway */}
                    <div
                      onClick={() => setWhatsappMode('webhook_fonnte')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        whatsappMode === 'webhook_fonnte'
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-500" /> Fonnte API Gateway
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold">
                          Otomatis (ID)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Kirim otomatis di background melalui API Fonnte Indonesia. Cukup masukkan API Token dari fonnte.com.
                      </p>
                    </div>

                    {/* Mode 3: Custom Webhook / Wablas */}
                    <div
                      onClick={() => setWhatsappMode('webhook_custom')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        whatsappMode === 'webhook_custom'
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-indigo-500" /> Custom Webhook
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                          Custom Bot
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Kirim payload JSON ke endpoint server/bot WhatsApp buatan Anda sendiri (Node.js, Baileys, Wablas, dll).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conditional Inputs for Fonnte / Webhook */}
                {whatsappMode === 'webhook_fonnte' && (
                  <div className="p-4 rounded-xl bg-cyan-50/40 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/60 space-y-3">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <h4 className="text-xs font-bold text-cyan-950 dark:text-cyan-200">
                        Fonnte API Token
                      </h4>
                    </div>
                    <input
                      type="password"
                      value={whatsappApiKey}
                      onChange={(e) => setWhatsappApiKey(e.target.value)}
                      placeholder="Masukkan Token Fonnte (contoh: aB1cD2eF3gH4iJ5kL6...)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono outline-none focus:border-cyan-500"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dapatkan token gratis di{' '}
                      <a
                        href="https://fonnte.com"
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-cyan-600 dark:text-cyan-400 font-semibold"
                      >
                        fonnte.com
                      </a>{' '}
                      setelah scan QR perangkat WhatsApp Anda.
                    </p>
                  </div>
                )}

                {whatsappMode === 'webhook_custom' && (
                  <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                        Custom Webhook URL & Secret
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={whatsappWebhookUrl}
                        onChange={(e) => setWhatsappWebhookUrl(e.target.value)}
                        placeholder="https://api.yourdomain.com/webhook/whatsapp"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono outline-none focus:border-indigo-500"
                      />
                      <input
                        type="password"
                        value={whatsappApiKey}
                        onChange={(e) => setWhatsappApiKey(e.target.value)}
                        placeholder="Bearer Token / Secret Key (Opsional)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* Event Trigger Toggles */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Pemicu Notifikasi WhatsApp (Event Triggers)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={whatsappNotifTypes.interview}
                        onChange={(e) =>
                          setWhatsappNotifTypes((prev) => ({ ...prev, interview: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold">Jadwal Interview (H-1 / H-2h)</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={whatsappNotifTypes.deadline}
                        onChange={(e) =>
                          setWhatsappNotifTypes((prev) => ({ ...prev, deadline: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold">Batas Deadline Lamaran</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={whatsappNotifTypes.status_change}
                        onChange={(e) =>
                          setWhatsappNotifTypes((prev) => ({ ...prev, status_change: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold">Perubahan Status Lamaran</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={whatsappNotifTypes.followup}
                        onChange={(e) =>
                          setWhatsappNotifTypes((prev) => ({ ...prev, followup: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold">Pengingat Follow-up Recruiter</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={whatsappNotifTypes.expired}
                        onChange={(e) =>
                          setWhatsappNotifTypes((prev) => ({ ...prev, expired: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold">Lamaran Kadaluarsa (Expired)</span>
                    </label>
                  </div>
                </div>

                {/* Collapsible Interactive Setup Guide (README) */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-500" />
                      <span>📖 Baca README & Panduan Integrasi WhatsApp Lengkap</span>
                    </div>
                    {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showGuide && (
                    <div className="p-4 space-y-4 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>1. Metode Direct Click-to-Chat (wa.me)</span>
                        </h4>
                        <p className="leading-relaxed">
                          Metode ini 100% gratis, langsung aktif tanpa setup backend/server. Saat notifikasi dipicu atau tombol WhatsApp ditekan, sistem membuat URL terenkripsi <code>https://wa.me/&lt;nomor&gt;?text=...</code> yang langsung membuka WhatsApp Web atau WhatsApp Mobile dengan pesan siap kirim.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>2. Metode Otomatis Fonnte Gateway (Indonesia)</span>
                        </h4>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Daftar akun gratis di <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="underline font-semibold text-emerald-600">fonnte.com</a></li>
                          <li>Scan QR code dengan WhatsApp di menu Device Fonnte</li>
                          <li>Salin API Token dari dashboard Fonnte dan tempelkan pada kolom <strong>Fonnte API Token</strong> di atas</li>
                          <li>Pesan akan terkirim otomatis di background tanpa perlu membuka tab WhatsApp</li>
                        </ol>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>3. Metode Custom Webhook (Node.js / Python / Baileys)</span>
                        </h4>
                        <p className="leading-relaxed">
                          Jika Anda memiliki server bot WhatsApp sendiri (menggunakan Baileys / WPPConnect / WhatsApp HTTP API), aplikasi akan mengirimkan HTTP POST JSON dengan format:
                        </p>
                        <div className="relative bg-slate-950 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyCode(
                                `{\n  "to": "6281234567890",\n  "message": "*REMINDER INTERVIEW*...",\n  "template": "interview_reminder",\n  "parameters": {\n    "company": "GoTo",\n    "position": "Data Analyst",\n    "date": "2026-08-26",\n    "time": "10:00 WIB"\n  }\n}`,
                                'webhook-json'
                              )
                            }
                            className="absolute right-2 top-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Copy JSON Schema"
                          >
                            {copiedCode === 'webhook-json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <pre>
{`{
  "to": "6281234567890",
  "message": "*REMINDER INTERVIEW*...",
  "template": "interview_reminder",
  "parameters": {
    "company": "GoTo",
    "position": "Data Analyst",
    "date": "2026-08-26",
    "time": "10:00 WIB"
  }
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleOpenTestModal}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                <span>Test Notifikasi WhatsApp</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-xs hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan WhatsApp'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: SUPABASE CLOUD */}
      {activeTab === 'cloud' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSupabase} className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-500 drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Supabase PostgreSQL Cloud Storage
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Sinkronisasi cloud multi-perangkat via database PostgreSQL & storage Supabase. Secara default aplikasi beroperasi dalam mode offline-first (LocalStorage).
                  </p>
                </div>

                {/* Connection Badge */}
                <div className="flex items-center gap-2">
                  {supabaseUrl && supabaseKey ? (
                    supabaseTestResult?.success ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Connected (Cloud Active)
                      </span>
                    ) : supabaseTestResult && !supabaseTestResult.success ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        Connection Error
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                        <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                        Credentials Set
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      Offline (LocalStorage)
                    </span>
                  )}
                </div>
              </div>

              {/* Quick 3-Step Setup Banner */}
              <div className="p-4 rounded-xl bg-cyan-50/40 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/60 text-xs space-y-2">
                <span className="font-bold text-cyan-950 dark:text-cyan-300 block flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  3 Langkah Cepat Integrasi Supabase:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
                  <li>Buat project baru di <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-semibold text-cyan-600 dark:text-cyan-400">supabase.com</a> (Free Tier).</li>
                  <li>Buka <strong>SQL Editor</strong> di dashboard Supabase, lalu jalankan script SQL Schema v2.1 di bawah.</li>
                  <li>Salin <strong>Project URL</strong> & <strong>Anon Public Key</strong> dari menu <em>Project Settings &gt; API</em> ke formulir di bawah ini.</li>
                </ol>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Supabase Project URL
                    </label>
                    <span className="text-[11px] text-slate-400">Contoh: https://xyzcompany.supabase.co</span>
                  </div>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Supabase Anon Public API Key
                    </label>
                    <span className="text-[11px] text-slate-400">Project Settings &gt; API &gt; anon public</span>
                  </div>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* Test Result Alert */}
              {supabaseTestResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs border ${
                    supabaseTestResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {supabaseTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold">{supabaseTestResult.message}</p>
                      {supabaseTestResult.bucketAccessible && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                          ✓ Storage Bucket <code>application-documents</code> terdeteksi & siap untuk upload CV/Dokumen.
                        </p>
                      )}
                      {supabaseTestResult.missingTables && supabaseTestResult.missingTables.length > 0 && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                          Tabel belum ditemukan: {supabaseTestResult.missingTables.join(', ')}. Silakan klik "Lihat SQL Schema" di bawah dan jalankan di SQL Editor Supabase.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestSupabaseConnection}
                    disabled={isTestingSupabase || !supabaseUrl || !supabaseKey}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-slate-200 dark:border-slate-700"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-cyan-500 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                    <span>{isTestingSupabase ? 'Menguji...' : 'Test Connection'}</span>
                  </button>

                  {supabaseUrl && supabaseKey && (
                    <button
                      type="button"
                      onClick={handleDisconnectSupabase}
                      className="px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-xs hover:shadow-[0_0_12px_rgba(6,182,212,0.35)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan & Hubungkan'}
                </button>
              </div>
            </div>
          </form>

          {/* Cloud Sync Actions: Upload Local to Cloud & Pull from Cloud */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Sinkronisasi Data Cloud
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gunakan tombol di bawah untuk mentransfer seluruh data lamaran, timeline, interview, dan dokumen antara browser lokal dan Supabase.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-cyan-500" /> Upload Local ke Supabase
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mengunggah {applications.length} lamaran, {interviews.length} interview, dan {documents.length} dokumen lokal saat ini ke cloud database Supabase.
                </p>
                <button
                  type="button"
                  onClick={handleUploadToCloud}
                  disabled={isSyncingSupabase || !supabaseUrl || !supabaseKey}
                  className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-bounce' : ''}`} />
                  <span>{isSyncingSupabase ? 'Mengunggah ke Cloud...' : 'Upload Data Lokal ke Cloud'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-indigo-500" /> Pull dari Supabase ke Local
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mengunduh data terbaru dari tabel Supabase dan menyimpannya ke browser local storage ini.
                </p>
                <button
                  type="button"
                  onClick={handlePullFromCloud}
                  disabled={isPullingSupabase || !supabaseUrl || !supabaseKey}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className={`w-3.5 h-3.5 ${isPullingSupabase ? 'animate-bounce' : ''}`} />
                  <span>{isPullingSupabase ? 'Mengunduh...' : 'Tarik Data dari Cloud'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive SQL Schema Viewer with 1-Click Copy */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowSqlSchema(!showSqlSchema)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-500" />
                <span>📜 Lihat & Salin Script SQL Database Supabase (Schema v2.1)</span>
              </div>
              {showSqlSchema ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSqlSchema && (
              <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Salin seluruh script di bawah dan tempelkan ke <strong>SQL Editor</strong> di Supabase:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(SUPABASE_SQL_SCHEMA, 'supabase-sql')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors cursor-pointer"
                  >
                    {copiedCode === 'supabase-sql' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Seluruh SQL Schema</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-slate-300 border border-slate-800">
                  <pre className="whitespace-pre">{SUPABASE_SQL_SCHEMA}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Troubleshooting FAQ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowSupabaseTroubleshoot(!showSupabaseTroubleshoot)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>🛠️ Panduan Mengatasi Masalah (Troubleshooting Supabase)</span>
              </div>
              {showSupabaseTroubleshoot ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSupabaseTroubleshoot && (
              <div className="p-5 space-y-4 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    1. Error: <code>relation "applications" does not exist</code> (Code 42P01)
                  </h4>
                  <p className="leading-relaxed">
                    <strong>Penyebab:</strong> Tabel belum dibuat di database Supabase.
                    <br />
                    <strong>Solusi:</strong> Buka menu <em>SQL Editor</em> di Supabase, tempelkan isi <code>supabase_schema.sql</code>, dan klik tombol <strong>Run</strong>.
                  </p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    2. Error: <code>invalid input syntax for type uuid: "app-001"</code> (Code 22P02)
                  </h4>
                  <p className="leading-relaxed">
                    <strong>Penyebab:</strong> Skema lama menggunakan tipe <code>UUID</code> kaku sedangkan aplikasi menggunakan ID berawalan string (seperti <code>app-001</code>).
                    <br />
                    <strong>Solusi:</strong> Schema v2.1 sudah diperbaiki menggunakan tipe <code>TEXT</code> yang mendukung kedua format secara fleksibel. Jalankan ulang script SQL Schema v2.1 di SQL Editor Supabase.
                  </p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    3. Error: <code>new row violates row-level security policy</code> (Code 42501)
                  </h4>
                  <p className="leading-relaxed">
                    <strong>Penyebab:</strong> RLS aktif namun belum memiliki policy perizinan untuk akses <code>anon</code>.
                    <br />
                    <strong>Solusi:</strong> Jalankan Section 5 di <code>supabase_schema.sql</code> yang otomatis membuat policy <code>FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)</code>.
                  </p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    4. Upload Dokumen / CV gagal disimpan di Supabase Storage
                  </h4>
                  <p className="leading-relaxed">
                    <strong>Penyebab:</strong> Bucket storage belum berstatus Public.
                    <br />
                    <strong>Solusi:</strong> Buka menu <em>Storage</em> di dashboard Supabase, klik titik tiga pada bucket <code>application-documents</code> &gt; <em>Edit Bucket</em> &gt; pastikan centang <strong>Public bucket</strong> aktif.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP, EXPORT & IMPORT */}
      {activeTab === 'data' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-500" /> Export & Data Backup
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Download your complete application database to prevent data loss or view in spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Full Database JSON Backup
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Includes all {applications.length} applications, {interviews.length} interviews, {documents.length} documents, and {events.length} timeline milestones.
              </p>
              <button
                onClick={handleExportJSON}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download JSON Backup
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Spreadsheet CSV Export
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exports all applications with status, dates, compensation, and recruiters for Excel or Google Sheets.
              </p>
              <button
                onClick={handleExportCSV}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Applications CSV
              </button>
            </div>
          </div>

          {/* Import JSON Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-500" /> Restore / Import Backup
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Restore your tracker from a previously downloaded JSON backup file.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Select Backup JSON File
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-rose-200 dark:border-rose-950/60 space-y-4">
            <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Data Management & Reset
            </h4>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  if (window.confirm('Restore sample demonstration applications and interviews?')) {
                    await onRestoreSeedData();
                    onShowToast('Restored sample demonstration data', 'success');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset to Demo Data
              </button>

              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete ALL applications, documents, and interviews?')) {
                    await onClearAllData();
                    onShowToast('All data cleared', 'info');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-semibold hover:bg-rose-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ABOUT & DOCS */}
      {activeTab === 'about' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-base shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              JT
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Job Application Tracker & Notification Suite
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Versi 2.0.0 • WhatsApp & Cloud Synchronized</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-3">
            <p className="leading-relaxed">
              Dirancang khusus untuk melacak seluruh siklus lamaran pekerjaan, tahapan wawancara teknis & HR, dokumen CV/Portfolio, batas deadline pendaftaran, serta dilengkapi pengiriman notifikasi pengingat via WhatsApp otomatis.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-800">
              <span>Stack: React 19, TypeScript, Tailwind CSS v4, Motion</span>
              <span>•</span>
              <span>Integrasi: WhatsApp (wa.me, Fonnte, Custom Webhook)</span>
              <span>•</span>
              <span>Database: Offline LocalStorage + Supabase Cloud</span>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Test Modal */}
      {testModalOpen && (
        <WhatsAppSendModal
          isOpen={testModalOpen}
          onClose={() => setTestModalOpen(false)}
          payload={testPayload}
          title="Test Notifikasi WhatsApp"
        />
      )}
    </div>
  );
};

