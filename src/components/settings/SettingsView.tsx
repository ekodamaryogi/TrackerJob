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
} from 'lucide-react';
import { UserSettings, JobApplication, Interview, ApplicationDocument, ApplicationEvent } from '../../types';
import { exportToJSON, exportToCSV, importFromJSON } from '../../lib/exportImport';

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

  // Notification state
  const [deadlineDays, setDeadlineDays] = useState(settings.deadline_reminder_days || 3);
  const [interviewHours, setInterviewHours] = useState(settings.interview_reminder_hours || 24);
  const [whatsappEnabled, setWhatsappEnabled] = useState(settings.whatsapp_notifications_enabled || false);
  const [whatsappPhone, setWhatsappPhone] = useState(settings.whatsapp_phone_number || '');

  // Supabase state
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabase_url || '');
  const [supabaseKey, setSupabaseKey] = useState(settings.supabase_anon_key || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onUpdateSettings({
        deadline_reminder_days: Number(deadlineDays),
        interview_reminder_hours: Number(interviewHours),
        whatsapp_notifications_enabled: whatsappEnabled,
        whatsapp_phone_number: whatsappPhone.trim(),
      });
      onShowToast('Notification preferences saved successfully', 'success');
    } catch {
      onShowToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onUpdateSettings({
        supabase_url: supabaseUrl.trim(),
        supabase_anon_key: supabaseKey.trim(),
      });
      onShowToast('Supabase configuration updated! Reloading sync provider.', 'success');
    } catch {
      onShowToast('Failed to save Supabase settings', 'error');
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
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Application Settings & Data Control
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure notifications, cloud database, backups, and preferences
            </p>
          </div>
        </div>

        {/* Setting Section Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mt-5 -mb-5 gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Notifications & WhatsApp
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'cloud'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Supabase Cloud Sync
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'data'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Backup, Export & Import
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'about'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            About & Architecture
          </button>
        </div>
      </div>

      {/* TAB 1: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" /> In-App Reminder Timing
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Control when you receive alerts for upcoming interviews and expiring deadlines.
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                >
                  <option value={1}>1 day before deadline</option>
                  <option value={2}>2 days before deadline</option>
                  <option value={3}>3 days before deadline (Recommended)</option>
                  <option value={7}>7 days before deadline</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Interview Reminder
                </label>
                <select
                  value={interviewHours}
                  onChange={(e) => setInterviewHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                >
                  <option value={1}>1 hour before interview</option>
                  <option value={2}>2 hours before interview</option>
                  <option value={12}>12 hours before interview</option>
                  <option value={24}>24 hours before interview (Recommended)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" /> WhatsApp Integration
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Prepare notifications for WhatsApp dispatch via webhook or URL links
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappEnabled}
                    onChange={(e) => setWhatsappEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {whatsappEnabled && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Your WhatsApp Phone Number (International format)
                  </label>
                  <input
                    type="text"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+6281234567890 or +14155552671"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Notification Preferences'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: SUPABASE CLOUD */}
      {activeTab === 'cloud' && (
        <form onSubmit={handleSaveSupabase} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Supabase PostgreSQL Cloud Storage
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                By default, this application stores all records securely in your browser's local
                storage (offline-first). If you want multi-device cloud synchronization, connect your
                free Supabase project below.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2">
              <span className="font-bold text-indigo-900 dark:text-indigo-300 block">
                How to set up free Supabase sync:
              </span>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
                <li>Create a free project on <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-semibold text-indigo-600 dark:text-indigo-400">supabase.com</a></li>
                <li>Run the provided SQL Migration in your SQL editor (see schema below)</li>
                <li>Paste your Project URL & Anon Public Key below</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Status: {supabaseUrl && supabaseKey ? 'Configured' : 'Offline / LocalStorage Active'}
              </span>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save & Connect Supabase'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: BACKUP, EXPORT & IMPORT */}
      {activeTab === 'data' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" /> Export & Data Backup
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Download your complete application database to prevent data loss or view in spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Full Database JSON Backup
              </h4>
              <p className="text-xs text-slate-500">
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
              <p className="text-xs text-slate-500">
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
              <Upload className="w-4 h-4 text-indigo-600" /> Restore / Import Backup
            </h4>
            <p className="text-xs text-slate-500">
              Restore your tracker from a previously downloaded JSON backup file.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer">
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

      {/* TAB 4: ABOUT */}
      {activeTab === 'about' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base">
              JT
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Personal Job Application Tracker
              </h3>
              <p className="text-xs text-slate-500">Version 1.0.0 • Single-User Productivity Suite</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p>
              Built specifically for ambitious job seekers to track every job application, manage
              interview stages, organize resumes and cover letters in-app, monitor deadlines, and
              analyze search performance.
            </p>
            <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-400">
              <span>Stack: React 19, TypeScript, Tailwind CSS, Motion</span>
              <span>•</span>
              <span>Storage: LocalStorage + Optional Supabase Cloud</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
