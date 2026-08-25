import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Link as LinkIcon,
  ExternalLink,
  Edit,
  Trash2,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  Video,
  Eye,
  Download,
  Upload,
  MessageSquare,
  AlertTriangle,
  History,
  Send,
} from 'lucide-react';
import {
  JobApplication,
  ApplicationEvent,
  Interview,
  ApplicationDocument,
  ApplicationStatus,
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, formatRelativeTime, formatSalaryRange } from '../../lib/notifications';

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: JobApplication | null;
  events: ApplicationEvent[];
  interviews: Interview[];
  documents: ApplicationDocument[];
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onAddEvent: (eventData: Omit<ApplicationEvent, 'id' | 'created_at'>) => Promise<void>;
  onAddInterview: (appId: string) => void;
  onEditInterview: (interview: Interview) => void;
  onDeleteInterview: (id: string) => void;
  onViewDocument: (doc: ApplicationDocument) => void;
  onDeleteDocument: (id: string) => void;
  onUploadDocument: (appId: string, file: File, docType: string) => Promise<void>;
  onUpdateNotes: (appId: string, notes: string) => Promise<void>;
}

const ALL_STATUSES: ApplicationStatus[] = [
  'Wishlist',
  'Applied',
  'Screening',
  'Interview',
  'Technical Test',
  'HR Interview',
  'Offer',
  'Accepted',
  'Rejected',
  'Withdrawn',
  'Expired',
];

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  isOpen,
  onClose,
  application,
  events,
  interviews,
  documents,
  onEdit,
  onDelete,
  onStatusChange,
  onAddEvent,
  onAddInterview,
  onEditInterview,
  onDeleteInterview,
  onViewDocument,
  onDeleteDocument,
  onUploadDocument,
  onUpdateNotes,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'interviews' | 'documents' | 'notes'>('overview');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('CV');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (application) {
      setNotesText(application.notes || '');
    }
    setActiveTab('overview');
    setShowAddEventForm(false);
  }, [application, isOpen]);

  if (!isOpen || !application) return null;

  const appEvents = events.filter((e) => e.application_id === application.id);
  const appInterviews = interviews.filter((i) => i.application_id === application.id);
  const appDocuments = documents.filter((d) => d.application_id === application.id);

  const handleSaveNotes = async () => {
    try {
      setIsSavingNotes(true);
      await onUpdateNotes(application.id, notesText);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAddTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    await onAddEvent({
      application_id: application.id,
      title: newEventTitle.trim(),
      description: newEventDesc.trim() || undefined,
      event_type: 'custom',
      event_date: new Date().toISOString(),
    });
    setNewEventTitle('');
    setNewEventDesc('');
    setShowAddEventForm(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      await onUploadDocument(application.id, file, uploadDocType);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const isExpired =
    application.status === 'Expired' ||
    (application.deadline &&
      new Date(application.deadline) < new Date() &&
      ['Wishlist', 'Applied', 'Screening'].includes(application.status));

  return (
    <AnimatePresence>
      <div
        id="app-detail-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 15 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-4 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Application Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold shrink-0">
                  {application.company.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {application.position}
                    </h2>
                    <StatusBadge status={application.status} size="sm" />
                    {isExpired && application.status !== 'Expired' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                        Deadline Passed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> {application.company}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {application.location || 'Location Not Specified'}
                    </span>
                    <span>•</span>
                    <span>{application.work_type}</span>
                    <span>•</span>
                    <span>{application.employment_type}</span>
                  </div>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {/* Status Dropdown */}
                <select
                  id="select-detail-status-change"
                  value={application.status}
                  onChange={(e) => onStatusChange(application.id, e.target.value as ApplicationStatus)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>

                <button
                  id="btn-edit-application"
                  onClick={() => onEdit(application)}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                  title="Edit details"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  id="btn-delete-application"
                  onClick={() => onDelete(application.id)}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete application"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  id="btn-close-detail-modal"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mt-6 -mb-6 gap-6">
              <button
                id="tab-detail-overview"
                onClick={() => setActiveTab('overview')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Overview
              </button>
              <button
                id="tab-detail-timeline"
                onClick={() => setActiveTab('timeline')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'timeline'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>Timeline</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 font-bold">
                  {appEvents.length}
                </span>
              </button>
              <button
                id="tab-detail-interviews"
                onClick={() => setActiveTab('interviews')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'interviews'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>Interviews</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 font-bold">
                  {appInterviews.length}
                </span>
              </button>
              <button
                id="tab-detail-documents"
                onClick={() => setActiveTab('documents')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'documents'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>Documents</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 font-bold">
                  {appDocuments.length}
                </span>
              </button>
              <button
                id="tab-detail-notes"
                onClick={() => setActiveTab('notes')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'notes'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Notes
              </button>
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card: Key Dates & Info */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Application Dates
                    </h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Applied Date:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatDate(application.application_date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Application Deadline:</span>
                      <span
                        className={`font-semibold ${
                          isExpired ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {application.deadline ? formatDate(application.deadline) : 'No Deadline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Source:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {application.source}
                      </span>
                    </div>
                    {application.job_url && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <a
                          href={application.job_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Original Job Listing
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Card: Compensation & Contact */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Compensation & Contact
                    </h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Salary Range:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatSalaryRange(
                          application.salary_min,
                          application.salary_max,
                          application.salary_currency
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Recruiter:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {application.recruiter_name || 'Not recorded'}
                      </span>
                    </div>
                    {application.recruiter_contact && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Contact:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {application.recruiter_contact}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Preview in Overview */}
                {application.notes && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Key Highlights & Notes
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {application.notes}
                    </p>
                  </div>
                )}

                {/* Quick Action Buttons Row */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    id="btn-quick-schedule-interview"
                    onClick={() => onAddInterview(application.id)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Schedule Interview
                  </button>
                  <button
                    id="btn-quick-add-timeline-event"
                    onClick={() => {
                      setActiveTab('timeline');
                      setShowAddEventForm(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Timeline Milestone
                  </button>
                  <button
                    id="btn-quick-upload-doc"
                    onClick={() => setActiveTab('documents')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Document
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Recruitment Activity History
                  </h4>
                  <button
                    id="btn-toggle-add-event"
                    onClick={() => setShowAddEventForm(!showAddEventForm)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Event
                  </button>
                </div>

                {/* Add Event Form */}
                {showAddEventForm && (
                  <form
                    onSubmit={handleAddTimelineEvent}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Milestone Title
                      </label>
                      <input
                        type="text"
                        required
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        placeholder="e.g. Technical Test Completed, Offer Received, Follow-up Email Sent"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Details / Notes (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={newEventDesc}
                        onChange={(e) => setNewEventDesc(e.target.value)}
                        placeholder="Additional context or outcome..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddEventForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                      >
                        Save Milestone
                      </button>
                    </div>
                  </form>
                )}

                {/* Timeline Feed */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {appEvents.length === 0 ? (
                    <p className="text-xs text-slate-400">No timeline events recorded yet.</p>
                  ) : (
                    appEvents.map((evt) => (
                      <div key={evt.id} className="relative">
                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                              {evt.title}
                            </h5>
                            <span className="text-[11px] text-slate-400">
                              {formatDate(evt.event_date)}
                            </span>
                          </div>
                          {evt.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                              {evt.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: INTERVIEWS */}
            {activeTab === 'interviews' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Scheduled Interviews ({appInterviews.length})
                  </h4>
                  <button
                    id="btn-add-interview-from-detail"
                    onClick={() => onAddInterview(application.id)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Schedule Interview
                  </button>
                </div>

                {appInterviews.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
                    <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No interviews scheduled yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Add your upcoming HR screening, technical interview, or manager round.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appInterviews.map((intv) => {
                      const d = new Date(intv.scheduled_at);
                      return (
                        <div
                          key={intv.id}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                {intv.type}
                              </span>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                                {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({intv.duration_minutes} mins)
                              </h5>
                              {intv.interviewer && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  Interviewer: {intv.interviewer}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                  intv.result === 'Passed'
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                    : intv.result === 'Failed'
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                }`}
                              >
                                {intv.result || 'Pending'}
                              </span>
                              <button
                                onClick={() => onEditInterview(intv)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteInterview(intv.id)}
                                className="p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {intv.meeting_url && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-400">Meeting:</span>
                              <a
                                href={intv.meeting_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                              >
                                <Video className="w-3.5 h-3.5" /> {intv.meeting_url}
                              </a>
                            </div>
                          )}

                          {intv.questions && intv.questions.length > 0 && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Questions:
                              </span>
                              <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                                {intv.questions.map((q, idx) => (
                                  <li key={idx}>{q}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {intv.notes && (
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                              {intv.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DOCUMENTS */}
            {activeTab === 'documents' && (
              <div className="space-y-5">
                {/* Upload Document Strip */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <select
                      value={uploadDocType}
                      onChange={(e) => setUploadDocType(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                    >
                      <option value="CV">CV / Resume</option>
                      <option value="Cover Letter">Cover Letter</option>
                      <option value="Job Description">Job Description</option>
                      <option value="Portfolio">Portfolio</option>
                      <option value="Certificate">Certificate / Offer</option>
                      <option value="Other">Other</option>
                    </select>
                    <span className="text-xs text-slate-400 hidden sm:inline">Select document type</span>
                  </div>

                  <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md"
                    />
                  </label>
                </div>

                {/* Documents List */}
                {appDocuments.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No documents attached to this job
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Attach your tailored CV, cover letter, or job specification.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {appDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {doc.name}
                            </h5>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                {doc.type}
                              </span>
                              <span>•</span>
                              <span>{formatDate(doc.uploaded_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                          <button
                            onClick={() => onViewDocument(doc)}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View In-App
                          </button>
                          <button
                            onClick={() => onDeleteDocument(doc.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Application Notes & Interview Insights
                  </h4>
                  <button
                    id="btn-save-notes"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                  </button>
                </div>

                <textarea
                  id="textarea-detail-notes"
                  rows={10}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Record recruiter notes, compensation negotiations, tech stack details, questions asked during interviews, or your next action items..."
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 resize-y"
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
