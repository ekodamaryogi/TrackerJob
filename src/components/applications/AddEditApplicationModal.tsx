import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Building2,
  Briefcase,
  MapPin,
  Globe,
  Calendar,
  DollarSign,
  User,
  FileText,
  Link as LinkIcon,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import {
  JobApplication,
  ApplicationStatus,
  WorkType,
  EmploymentType,
  ApplicationSource,
} from '../../types';

interface AddEditApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appData: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editingApp?: JobApplication | null;
}

const WORK_TYPES: WorkType[] = ['Remote', 'Hybrid', 'On-site'];
const EMPLOYMENT_TYPES: EmploymentType[] = [
  'Full-time',
  'Part-time',
  'Internship',
  'Contract',
  'Freelance',
  'Other',
];
const STATUS_OPTIONS: ApplicationStatus[] = [
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
const SOURCE_OPTIONS: ApplicationSource[] = [
  'LinkedIn',
  'JobStreet',
  'Glints',
  'Company Website',
  'Referral',
  'Campus',
  'Other',
];
const CURRENCIES = ['USD', 'IDR', 'EUR', 'GBP', 'SGD', 'AUD', 'CAD'];

export const AddEditApplicationModal: React.FC<AddEditApplicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingApp,
}) => {
  const [activeSection, setActiveSection] = useState<'job' | 'app' | 'comp' | 'contact' | 'notes'>('job');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form fields state
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [location, setLocation] = useState('');
  const [workType, setWorkType] = useState<WorkType>('Hybrid');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Full-time');
  const [jobUrl, setJobUrl] = useState('');
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [salaryCurrency, setSalaryCurrency] = useState('USD');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');
  const [source, setSource] = useState<ApplicationSource>('LinkedIn');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterContact, setRecruiterContact] = useState('');
  const [notes, setNotes] = useState('');

  // Reset or populate fields on open/edit
  useEffect(() => {
    if (editingApp) {
      setCompany(editingApp.company || '');
      setPosition(editingApp.position || '');
      setLocation(editingApp.location || '');
      setWorkType(editingApp.work_type || 'Hybrid');
      setEmploymentType(editingApp.employment_type || 'Full-time');
      setJobUrl(editingApp.job_url || '');
      setApplicationDate(editingApp.application_date || new Date().toISOString().split('T')[0]);
      setDeadline(editingApp.deadline || '');
      setSalaryMin(editingApp.salary_min !== undefined ? String(editingApp.salary_min) : '');
      setSalaryMax(editingApp.salary_max !== undefined ? String(editingApp.salary_max) : '');
      setSalaryCurrency(editingApp.salary_currency || 'USD');
      setStatus(editingApp.status || 'Applied');
      setSource(editingApp.source || 'LinkedIn');
      setRecruiterName(editingApp.recruiter_name || '');
      setRecruiterContact(editingApp.recruiter_contact || '');
      setNotes(editingApp.notes || '');
    } else {
      setCompany('');
      setPosition('');
      setLocation('');
      setWorkType('Hybrid');
      setEmploymentType('Full-time');
      setJobUrl('');
      setApplicationDate(new Date().toISOString().split('T')[0]);
      setDeadline('');
      setSalaryMin('');
      setSalaryMax('');
      setSalaryCurrency('USD');
      setStatus('Applied');
      setSource('LinkedIn');
      setRecruiterName('');
      setRecruiterContact('');
      setNotes('');
    }
    setActiveSection('job');
    setErrors({});
  }, [editingApp, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!company.trim()) newErrors.company = 'Company name is required';
    if (!position.trim()) newErrors.position = 'Job position is required';
    if (!applicationDate) newErrors.applicationDate = 'Application date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      if (errors.company || errors.position) {
        setActiveSection('job');
      }
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        company: company.trim(),
        position: position.trim(),
        location: location.trim(),
        work_type: workType,
        employment_type: employmentType,
        job_url: jobUrl.trim() || undefined,
        application_date: applicationDate,
        deadline: deadline || undefined,
        salary_min: salaryMin ? Number(salaryMin) : undefined,
        salary_max: salaryMax ? Number(salaryMax) : undefined,
        salary_currency: salaryCurrency,
        status,
        source,
        recruiter_name: recruiterName.trim() || undefined,
        recruiter_contact: recruiterContact.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Error saving application:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    { id: 'job', label: '1. Job Info', icon: Building2 },
    { id: 'app', label: '2. Application', icon: Calendar },
    { id: 'comp', label: '3. Compensation', icon: DollarSign },
    { id: 'contact', label: '4. Contact', icon: User },
    { id: 'notes', label: '5. Notes', icon: FileText },
  ];

  return (
    <AnimatePresence>
      <div
        id="add-edit-app-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingApp ? 'Edit Job Application' : 'Add New Application'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {editingApp ? `Updating ${editingApp.company}` : 'Track a new opportunity in your pipeline'}
                </p>
              </div>
            </div>
            <button
              id="btn-close-add-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto px-4 py-1.5 gap-1 scrollbar-none">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  id={`tab-step-${s.id}`}
                  type="button"
                  onClick={() => setActiveSection(s.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Form Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {/* SECTION 1: JOB INFO */}
              {activeSection === 'job' && (
                <motion.div
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-company-name"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. PT GoTo, Google, Stripe, Traveloka"
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all ${
                        errors.company ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    {errors.company && (
                      <p className="text-xs text-rose-500 mt-1">{errors.company}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Job Position / Role <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-position-name"
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="e.g. Senior Data Analyst, Lead Frontend Engineer"
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all ${
                        errors.position ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    {errors.position && (
                      <p className="text-xs text-rose-500 mt-1">{errors.position}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Work Type
                      </label>
                      <select
                        id="select-work-type"
                        value={workType}
                        onChange={(e) => setWorkType(e.target.value as WorkType)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                      >
                        {WORK_TYPES.map((wt) => (
                          <option key={wt} value={wt}>
                            {wt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Employment Type
                      </label>
                      <select
                        id="select-employment-type"
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                      >
                        {EMPLOYMENT_TYPES.map((et) => (
                          <option key={et} value={et}>
                            {et}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Location
                    </label>
                    <input
                      id="input-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Jakarta (Hybrid), Remote, Singapore"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </motion.div>
              )}

              {/* SECTION 2: APPLICATION DETAILS */}
              {activeSection === 'app' && (
                <motion.div
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Current Status
                      </label>
                      <select
                        id="select-status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 font-semibold"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Application Source
                      </label>
                      <select
                        id="select-source"
                        value={source}
                        onChange={(e) => setSource(e.target.value as ApplicationSource)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                      >
                        {SOURCE_OPTIONS.map((src) => (
                          <option key={src} value={src}>
                            {src}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Application Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="input-app-date"
                        type="date"
                        value={applicationDate}
                        onChange={(e) => setApplicationDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Application Deadline
                      </label>
                      <input
                        id="input-deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Job Posting URL
                    </label>
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-job-url"
                        type="url"
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        placeholder="https://company.com/careers/job-id"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SECTION 3: COMPENSATION */}
              {activeSection === 'comp' && (
                <motion.div
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Currency
                    </label>
                    <select
                      id="select-currency"
                      value={salaryCurrency}
                      onChange={(e) => setSalaryCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr} value={curr}>
                          {curr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Minimum Salary
                      </label>
                      <input
                        id="input-salary-min"
                        type="number"
                        min="0"
                        step="1000"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                        placeholder={salaryCurrency === 'IDR' ? 'e.g. 20000000' : 'e.g. 5000'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Maximum Salary
                      </label>
                      <input
                        id="input-salary-max"
                        type="number"
                        min="0"
                        step="1000"
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                        placeholder={salaryCurrency === 'IDR' ? 'e.g. 28000000' : 'e.g. 8000'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SECTION 4: CONTACT */}
              {activeSection === 'contact' && (
                <motion.div
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Recruiter / Contact Name
                    </label>
                    <input
                      id="input-recruiter-name"
                      type="text"
                      value={recruiterName}
                      onChange={(e) => setRecruiterName(e.target.value)}
                      placeholder="e.g. Sarah Wijaya, Talent Acquisition Lead"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Recruiter Email / Phone / LinkedIn
                    </label>
                    <input
                      id="input-recruiter-contact"
                      type="text"
                      value={recruiterContact}
                      onChange={(e) => setRecruiterContact(e.target.value)}
                      placeholder="e.g. sarah.w@company.com or linkedin.com/in/sarah"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </motion.div>
              )}

              {/* SECTION 5: NOTES */}
              {activeSection === 'notes' && (
                <motion.div
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Personal Notes & Key Requirements
                    </label>
                    <textarea
                      id="textarea-notes"
                      rows={5}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add key highlights, referral details, tech stack notes, or interview prep focus..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 resize-y"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex gap-2">
                {activeSection !== 'job' && (
                  <button
                    type="button"
                    onClick={() => {
                      const idx = sections.findIndex((s) => s.id === activeSection);
                      if (idx > 0) setActiveSection(sections[idx - 1].id as any);
                    }}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
                {activeSection !== 'notes' && (
                  <button
                    type="button"
                    onClick={() => {
                      const idx = sections.findIndex((s) => s.id === activeSection);
                      if (idx < sections.length - 1) setActiveSection(sections[idx + 1].id as any);
                    }}
                    className="px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  id="btn-cancel-add-app"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-add-app"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-indigo-950/30 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : editingApp ? 'Update Application' : 'Save Application'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
