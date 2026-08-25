import { JobApplication, Interview, ApplicationDocument, ApplicationEvent } from '../types';
import { Storage } from './storage';

export const exportToCSV = (apps: JobApplication[]): void => {
  const headers = [
    'ID',
    'Company',
    'Position',
    'Location',
    'Work Type',
    'Employment Type',
    'Status',
    'Source',
    'Application Date',
    'Deadline',
    'Salary Min',
    'Salary Max',
    'Currency',
    'Recruiter Name',
    'Recruiter Contact',
    'Job URL',
    'Notes',
  ];

  const rows = apps.map((app) => [
    `"${app.id}"`,
    `"${(app.company || '').replace(/"/g, '""')}"`,
    `"${(app.position || '').replace(/"/g, '""')}"`,
    `"${(app.location || '').replace(/"/g, '""')}"`,
    `"${app.work_type}"`,
    `"${app.employment_type}"`,
    `"${app.status}"`,
    `"${app.source}"`,
    `"${app.application_date || ''}"`,
    `"${app.deadline || ''}"`,
    app.salary_min !== undefined ? app.salary_min : '',
    app.salary_max !== undefined ? app.salary_max : '',
    `"${app.salary_currency || 'USD'}"`,
    `"${(app.recruiter_name || '').replace(/"/g, '""')}"`,
    `"${(app.recruiter_contact || '').replace(/"/g, '""')}"`,
    `"${(app.job_url || '').replace(/"/g, '""')}"`,
    `"${(app.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `job_applications_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (
  applications: JobApplication[],
  interviews: Interview[],
  documents: ApplicationDocument[],
  events: ApplicationEvent[]
): void => {
  const fullData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    applications,
    interviews,
    documents,
    events,
  };

  const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `job_tracker_full_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importFromJSON = (
  file: File,
  onSuccess: (data: {
    applications: JobApplication[];
    interviews: Interview[];
    documents: ApplicationDocument[];
    events: ApplicationEvent[];
  }) => void
): void => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const parsed = JSON.parse(content);
      if (parsed.applications && Array.isArray(parsed.applications)) {
        onSuccess({
          applications: parsed.applications || [],
          interviews: parsed.interviews || [],
          documents: parsed.documents || [],
          events: parsed.events || parsed.application_events || [],
        });
      } else {
        throw new Error('Invalid backup schema');
      }
    } catch (err) {
      console.error('Failed to parse JSON file:', err);
    }
  };
  reader.readAsText(file);
};

export const ExportImport = {
  exportToCSV: async (): Promise<void> => {
    const apps = await Storage.getApplications();
    exportToCSV(apps);
  },
  exportFullJSON: async (): Promise<void> => {
    const [apps, interviews, documents, events] = await Promise.all([
      Storage.getApplications(),
      Storage.getInterviews(),
      Storage.getDocuments(),
      Storage.getEvents(),
    ]);
    exportToJSON(apps, interviews, documents, events);
  },
  importFromJSON,
};
