import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  User,
  Video,
  MapPin,
  FileText,
  HelpCircle,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { Interview, InterviewType, JobApplication } from '../../types';

interface AddEditInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Interview, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editingInterview?: Interview | null;
  applicationId: string;
  applications: JobApplication[];
}

const INTERVIEW_TYPES: InterviewType[] = [
  'HR Interview',
  'Technical Interview',
  'User Interview',
  'Manager Interview',
  'Final Interview',
  'Other',
];

const RESULTS = ['Pending', 'Passed', 'Failed', 'Rescheduled', 'Cancelled'];

export const AddEditInterviewModal: React.FC<AddEditInterviewModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingInterview,
  applicationId,
  applications,
}) => {
  const [selectedAppId, setSelectedAppId] = useState(applicationId);
  const [type, setType] = useState<InterviewType>('Technical Interview');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [interviewer, setInterviewer] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [location, setLocation] = useState('Google Meet');
  const [notes, setNotes] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [result, setResult] = useState<'Pending' | 'Passed' | 'Failed' | 'Rescheduled' | 'Cancelled'>('Pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingInterview) {
      setSelectedAppId(editingInterview.application_id);
      setType(editingInterview.type);
      // Format to datetime-local string YYYY-MM-DDTHH:mm
      try {
        const d = new Date(editingInterview.scheduled_at);
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setScheduledAt(localIso);
      } catch {
        setScheduledAt('');
      }
      setDurationMinutes(editingInterview.duration_minutes || 45);
      setInterviewer(editingInterview.interviewer || '');
      setMeetingUrl(editingInterview.meeting_url || '');
      setLocation(editingInterview.location || '');
      setNotes(editingInterview.notes || '');
      setQuestions(editingInterview.questions || []);
      setResult(editingInterview.result || 'Pending');
    } else {
      setSelectedAppId(applicationId);
      setType('Technical Interview');
      // Default to tomorrow at 10:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setScheduledAt(localIso);
      setDurationMinutes(45);
      setInterviewer('');
      setMeetingUrl('');
      setLocation('Google Meet');
      setNotes('');
      setQuestions([]);
      setResult('Pending');
    }
  }, [editingInterview, applicationId, isOpen]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions([...questions, newQuestion.trim()]);
      setNewQuestion('');
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt || !selectedAppId) return;

    try {
      setIsSubmitting(true);
      await onSave({
        application_id: selectedAppId,
        type,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: Number(durationMinutes),
        interviewer: interviewer.trim() || undefined,
        meeting_url: meetingUrl.trim() || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        questions: questions.length > 0 ? questions : undefined,
        result,
      });
      onClose();
    } catch (err) {
      console.error('Error saving interview:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="add-interview-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingInterview ? 'Edit Interview Details' : 'Schedule New Interview'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track date, meeting link, prep notes, and questions
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
              {/* Application Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Job Application <span className="text-rose-500">*</span>
                </label>
                <select
                  id="select-interview-app"
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 font-semibold"
                >
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.company} — {app.position}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interview Type & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Interview Type
                  </label>
                  <select
                    id="select-interview-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as InterviewType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                  >
                    {INTERVIEW_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    id="input-interview-duration"
                    type="number"
                    min="15"
                    step="15"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Scheduled Date & Time */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-interview-datetime"
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Interviewer & Meeting URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Interviewer Name(s)
                  </label>
                  <input
                    id="input-interviewer-name"
                    type="text"
                    value={interviewer}
                    onChange={(e) => setInterviewer(e.target.value)}
                    placeholder="e.g. John Doe (Tech Lead)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Meeting URL / Location
                  </label>
                  <input
                    id="input-interview-location"
                    type="text"
                    value={meetingUrl || location}
                    onChange={(e) => {
                      if (e.target.value.startsWith('http')) {
                        setMeetingUrl(e.target.value);
                      } else {
                        setLocation(e.target.value);
                      }
                    }}
                    placeholder="https://meet.google.com/xyz or Office address"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Result State */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Interview Outcome
                </label>
                <select
                  id="select-interview-result"
                  value={result}
                  onChange={(e) => setResult(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 font-medium"
                >
                  {RESULTS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Key Questions Tracker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Questions to Prepare / Asked
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddQuestion();
                      }
                    }}
                    placeholder="Add a question (e.g. Tell me about your architecture experience)..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-2 bg-slate-800 text-white dark:bg-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {questions.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <span className="text-slate-800 dark:text-slate-200">{q}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes & Prep */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Preparation Notes & Feedback
                </label>
                <textarea
                  id="textarea-interview-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key talking points, tech topics to review, or post-interview notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                id="btn-save-interview"
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-950/30 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : editingInterview ? 'Update Interview' : 'Save Interview'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
