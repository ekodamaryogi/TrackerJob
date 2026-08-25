import React, { useState, useEffect, useCallback } from 'react';
import {
  JobApplication,
  Interview,
  ApplicationDocument,
  ApplicationEvent,
  UserSettings,
  AppNotification,
  ApplicationStatus,
} from './types';
import { Storage } from './lib/storage';
import { NotificationService } from './lib/notifications';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { ApplicationsListView } from './components/applications/ApplicationsListView';
import { PipelineView } from './components/pipeline/PipelineView';
import { CalendarView } from './components/calendar/CalendarView';
import { DocumentsView } from './components/documents/DocumentsView';
import { SettingsView } from './components/settings/SettingsView';
import { NotificationsModal } from './components/notifications/NotificationsModal';
import { AddEditApplicationModal } from './components/applications/AddEditApplicationModal';
import { ApplicationDetailModal } from './components/applications/ApplicationDetailModal';
import { AddEditInterviewModal } from './components/interviews/AddEditInterviewModal';
import { DocumentViewerModal } from './components/documents/DocumentViewerModal';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { ToastProvider, useToast } from './components/common/ToastContext';

type ActiveView = 'dashboard' | 'applications' | 'pipeline' | 'calendar' | 'documents' | 'settings';

function MainApp() {
  const { showToast } = useToast();

  // Primary State
  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    deadline_reminder_days: 3,
    interview_reminder_hours: 24,
    theme: 'light',
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  const [selectedAppForDetail, setSelectedAppForDetail] = useState<JobApplication | null>(null);

  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [interviewModalAppId, setInterviewModalAppId] = useState<string>('');

  const [viewingDocument, setViewingDocument] = useState<ApplicationDocument | null>(null);

  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  // Theme synchronization with document element
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (themeValue: 'light' | 'dark' | 'system') => {
      const isDark =
        themeValue === 'dark' ||
        (themeValue === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(settings.theme || 'light');

    const handleSystemThemeChange = () => {
      if (settings.theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [settings.theme]);

  // Load all initial data from storage
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [apps, intvs, docs, evts, sett] = await Promise.all([
        Storage.getApplications(),
        Storage.getInterviews(),
        Storage.getDocuments(),
        Storage.getEvents(),
        Storage.fetchSettingsFromCloud(),
      ]);

      setApplications(apps);
      setInterviews(intvs);
      setDocuments(docs);
      setEvents(evts);
      setSettings(sett);

      // Generate dynamic notifications
      const notifs = NotificationService.generateNotifications(apps, intvs, sett);
      setNotifications(notifs);
    } catch (err) {
      console.error('Error loading tracker data:', err);
      showToast('Error loading saved applications', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep detail modal updated if applications update
  useEffect(() => {
    if (selectedAppForDetail) {
      const updated = applications.find((a) => a.id === selectedAppForDetail.id);
      if (updated) {
        setSelectedAppForDetail(updated);
      }
    }
  }, [applications]);

  // ---------------- Handlers: Applications ----------------
  const handleSaveApplication = async (
    appData: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>
  ) => {
    if (editingApp) {
      const updated = await Storage.updateApplication(editingApp.id, appData);
      if (updated) {
        setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        // Record timeline event
        await Storage.createEvent({
          application_id: updated.id,
          title: 'Application Details Updated',
          description: `Updated position to ${updated.position} at ${updated.company}`,
          event_type: 'status_change',
          event_date: new Date().toISOString(),
        });
        const freshEvents = await Storage.getEvents();
        setEvents(freshEvents);
        showToast(`Updated ${updated.company} application`, 'success');
      }
    } else {
      const created = await Storage.createApplication(appData);
      setApplications((prev) => [created, ...prev]);
      // Record initial event
      await Storage.createEvent({
        application_id: created.id,
        title: 'Application Created',
        description: `Added ${created.position} at ${created.company} to pipeline`,
        event_type: 'status_change',
        event_date: new Date().toISOString(),
      });
      const freshEvents = await Storage.getEvents();
      setEvents(freshEvents);
      showToast(`Added ${created.company} to your applications!`, 'success');
    }
    setEditingApp(null);
  };

  const handleUpdateStatus = async (id: string, newStatus: ApplicationStatus) => {
    const updated = await Storage.updateApplication(id, { status: newStatus });
    if (updated) {
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      await Storage.createEvent({
        application_id: id,
        title: `Status updated to ${newStatus}`,
        description: `Moved stage to ${newStatus}`,
        event_type: 'status_change',
        event_date: new Date().toISOString(),
      });
      const freshEvents = await Storage.getEvents();
      setEvents(freshEvents);
      showToast(`Moved to ${newStatus}`, 'info');
    }
  };

  const handleDeleteApplication = (id: string) => {
    const target = applications.find((a) => a.id === id);
    setDeleteConfirmState({
      isOpen: true,
      title: 'Delete Application',
      message: `Are you sure you want to permanently delete the application for ${
        target?.company || 'this company'
      }? This will also delete related interviews and documents.`,
      onConfirm: async () => {
        await Storage.deleteApplication(id);
        setApplications((prev) => prev.filter((a) => a.id !== id));
        setInterviews((prev) => prev.filter((i) => i.application_id !== id));
        setDocuments((prev) => prev.filter((d) => d.application_id !== id));
        setEvents((prev) => prev.filter((e) => e.application_id !== id));
        if (selectedAppForDetail?.id === id) {
          setSelectedAppForDetail(null);
        }
        showToast('Application deleted', 'info');
      },
    });
  };

  // ---------------- Handlers: Interviews ----------------
  const handleOpenAddInterview = (appId?: string) => {
    const targetAppId = appId || applications[0]?.id || '';
    setInterviewModalAppId(targetAppId);
    setEditingInterview(null);
    setIsInterviewModalOpen(true);
  };

  const handleOpenEditInterview = (interview: Interview) => {
    setInterviewModalAppId(interview.application_id);
    setEditingInterview(interview);
    setIsInterviewModalOpen(true);
  };

  const handleSaveInterview = async (
    intvData: Omit<Interview, 'id' | 'created_at' | 'updated_at'>
  ) => {
    if (editingInterview) {
      const updated = await Storage.updateInterview(editingInterview.id, intvData);
      if (updated) {
        setInterviews((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        showToast('Interview details updated', 'success');
      }
    } else {
      const created = await Storage.createInterview(intvData);
      setInterviews((prev) => [...prev, created]);
      const app = applications.find((a) => a.id === intvData.application_id);
      await Storage.createEvent({
        application_id: intvData.application_id,
        title: `Scheduled ${intvData.type}`,
        description: `Scheduled for ${new Date(intvData.scheduled_at).toLocaleDateString()}`,
        event_type: 'interview',
        event_date: new Date().toISOString(),
      });
      const freshEvents = await Storage.getEvents();
      setEvents(freshEvents);
      showToast(`Scheduled interview for ${app?.company || 'job'}`, 'success');
    }
    setEditingInterview(null);
  };

  const handleDeleteInterview = (id: string) => {
    setDeleteConfirmState({
      isOpen: true,
      title: 'Delete Interview',
      message: 'Are you sure you want to remove this scheduled interview?',
      onConfirm: async () => {
        await Storage.deleteInterview(id);
        setInterviews((prev) => prev.filter((i) => i.id !== id));
        showToast('Interview removed', 'info');
      },
    });
  };

  // ---------------- Handlers: Documents ----------------
  const handleUploadDocument = async (appId: string, file: File, docType: string) => {
    // Read file as text if text/pdf/markdown, or create blob URL
    let contentText: string | undefined;
    if (
      file.type.includes('text') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json')
    ) {
      try {
        contentText = await file.text();
      } catch {}
    } else {
      contentText = `Document: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: ${docType}\nUploaded on: ${new Date().toLocaleDateString()}`;
    }

    const fileUrl = URL.createObjectURL(file);
    const newDoc = await Storage.createDocument({
      application_id: appId,
      name: file.name,
      type: docType as any,
      file_url: fileUrl,
      mime_type: file.type || 'application/octet-stream',
      file_size: file.size,
      content_text: contentText,
    });

    setDocuments((prev) => [...prev, newDoc]);
    await Storage.createEvent({
      application_id: appId,
      title: `Uploaded ${docType}: ${file.name}`,
      event_type: 'document',
      event_date: new Date().toISOString(),
    });
    const freshEvents = await Storage.getEvents();
    setEvents(freshEvents);
    showToast(`Uploaded ${file.name}`, 'success');
  };

  const handleDeleteDocument = (id: string) => {
    setDeleteConfirmState({
      isOpen: true,
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document from the vault?',
      onConfirm: async () => {
        await Storage.deleteDocument(id);
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        showToast('Document deleted', 'info');
      },
    });
  };

  // ---------------- Handlers: Timeline & Notes ----------------
  const handleAddEvent = async (eventData: Omit<ApplicationEvent, 'id' | 'created_at'>) => {
    const created = await Storage.createEvent(eventData);
    setEvents((prev) => [created, ...prev]);
    showToast('Timeline milestone recorded', 'success');
  };

  const handleUpdateNotes = async (appId: string, notes: string) => {
    const updated = await Storage.updateApplication(appId, { notes });
    if (updated) {
      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
      showToast('Notes saved', 'success');
    }
  };

  // ---------------- Handlers: Settings & Data ----------------
  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = await Storage.saveSettings(newSettings);
    setSettings(updated);
    // Refresh notifications
    const notifs = NotificationService.generateNotifications(applications, interviews, updated);
    setNotifications(notifs);
  };

  const handleRestoreSeedData = async () => {
    await Storage.resetToSeedData();
    await loadData();
  };

  const handleClearAllData = async () => {
    await Storage.clearAll();
    await loadData();
  };

  const handleImportData = async (data: {
    applications: JobApplication[];
    interviews: Interview[];
    documents: ApplicationDocument[];
    events: ApplicationEvent[];
  }) => {
    await Storage.importFullData(data);
    await loadData();
  };

  // Dismiss notification
  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (notif.application_id) {
      const app = applications.find((a) => a.id === notif.application_id);
      if (app) {
        setSelectedAppForDetail(app);
      }
    }
  };

  const handleSelectTab = (tab: NavTab) => {
    if (tab === 'notifications') {
      setIsNotificationsModalOpen(true);
    } else {
      setCurrentView(tab as ActiveView);
    }
  };

  const handleToggleTheme = async (themeMode: 'light' | 'dark' | 'system') => {
    await handleUpdateSettings({ theme: themeMode });
    showToast(`Theme set to ${themeMode}`, 'info');
  };

  // Filtered applications based on global search
  const filteredApplications = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.company.toLowerCase().includes(q) ||
      app.position.toLowerCase().includes(q) ||
      (app.location || '').toLowerCase().includes(q) ||
      (app.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (app.notes || '').toLowerCase().includes(q)
    );
  });

  const activeApplicationsCount = applications.filter(
    (a) => !['Rejected', 'Withdrawn', 'Expired', 'Accepted'].includes(a.status)
  ).length;

  const upcomingInterviewsCount = interviews.filter((i) => {
    try {
      return new Date(i.scheduled_at).getTime() >= new Date().getTime() - 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased selection:bg-cyan-500 selection:text-white cyber-grid-bg">
      {/* Desktop Navigation Sidebar */}
      <Sidebar
        activeTab={currentView}
        onSelectTab={handleSelectTab}
        onOpenAddModal={() => {
          setEditingApp(null);
          setIsAddAppModalOpen(true);
        }}
        unreadNotifsCount={notifications.length}
        activeApplicationsCount={activeApplicationsCount}
        upcomingInterviewsCount={upcomingInterviewsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Header Navbar */}
        <Navbar
          activeTab={currentView}
          onSelectTab={handleSelectTab}
          onOpenAddModal={() => {
            setEditingApp(null);
            setIsAddAppModalOpen(true);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          unreadNotifsCount={notifications.length}
          theme={settings.theme || 'light'}
          onToggleTheme={handleToggleTheme}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* View Router Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_12px_rgba(6,182,212,0.4)]" />
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && (
                <DashboardView
                  applications={filteredApplications}
                  interviews={interviews}
                  onSelectApplication={(app) => setSelectedAppForDetail(app)}
                  onOpenAddModal={() => {
                    setEditingApp(null);
                    setIsAddAppModalOpen(true);
                  }}
                  onViewAllApplications={() => setCurrentView('applications')}
                  onViewCalendar={() => setCurrentView('calendar')}
                />
              )}

              {currentView === 'applications' && (
                <ApplicationsListView
                  applications={filteredApplications}
                  onSelectApplication={(app) => setSelectedAppForDetail(app)}
                  onEditApplication={(app) => {
                    setEditingApp(app);
                    setIsAddAppModalOpen(true);
                  }}
                  onDeleteApplication={handleDeleteApplication}
                  onOpenAddModal={() => {
                    setEditingApp(null);
                    setIsAddAppModalOpen(true);
                  }}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}

              {currentView === 'pipeline' && (
                <PipelineView
                  applications={filteredApplications}
                  interviews={interviews}
                  onSelectApplication={(app) => setSelectedAppForDetail(app)}
                  onUpdateStatus={handleUpdateStatus}
                  onOpenAddModal={() => {
                    setEditingApp(null);
                    setIsAddAppModalOpen(true);
                  }}
                />
              )}

              {currentView === 'calendar' && (
                <CalendarView
                  applications={applications}
                  interviews={interviews}
                  onSelectApplication={(app) => setSelectedAppForDetail(app)}
                  onEditInterview={handleOpenEditInterview}
                  onScheduleInterview={() => handleOpenAddInterview()}
                />
              )}

              {currentView === 'documents' && (
                <DocumentsView
                  documents={documents}
                  applications={applications}
                  onViewDocument={(doc) => setViewingDocument(doc)}
                  onDeleteDocument={handleDeleteDocument}
                  onUploadDocument={handleUploadDocument}
                />
              )}

              {currentView === 'settings' && (
                <SettingsView
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  applications={applications}
                  interviews={interviews}
                  documents={documents}
                  events={events}
                  onRestoreSeedData={handleRestoreSeedData}
                  onClearAllData={handleClearAllData}
                  onImportData={handleImportData}
                  onShowToast={showToast}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar & Mobile Drawer */}
      <MobileNav
        activeTab={currentView}
        onSelectTab={handleSelectTab}
        onOpenAddModal={() => {
          setEditingApp(null);
          setIsAddAppModalOpen(true);
        }}
        unreadNotifsCount={notifications.length}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onDismissNotification={handleDismissNotification}
        onNotificationClick={handleNotificationClick}
        onClearAll={() => {
          setNotifications([]);
          showToast('All notifications cleared', 'info');
        }}
      />

      {/* MODALS */}
      {/* 1. Add / Edit Application Modal */}
      <AddEditApplicationModal
        isOpen={isAddAppModalOpen}
        onClose={() => {
          setIsAddAppModalOpen(false);
          setEditingApp(null);
        }}
        onSave={handleSaveApplication}
        editingApp={editingApp}
      />

      {/* 2. Application Detail Page / Modal */}
      <ApplicationDetailModal
        isOpen={!!selectedAppForDetail}
        onClose={() => setSelectedAppForDetail(null)}
        application={selectedAppForDetail}
        events={events}
        interviews={interviews}
        documents={documents}
        onEdit={(app) => {
          setSelectedAppForDetail(null);
          setEditingApp(app);
          setIsAddAppModalOpen(true);
        }}
        onDelete={(id) => {
          handleDeleteApplication(id);
        }}
        onStatusChange={handleUpdateStatus}
        onAddEvent={handleAddEvent}
        onAddInterview={(appId) => handleOpenAddInterview(appId)}
        onEditInterview={handleOpenEditInterview}
        onDeleteInterview={handleDeleteInterview}
        onViewDocument={(doc) => setViewingDocument(doc)}
        onDeleteDocument={handleDeleteDocument}
        onUploadDocument={handleUploadDocument}
        onUpdateNotes={handleUpdateNotes}
      />

      {/* 3. Add / Edit Interview Modal */}
      <AddEditInterviewModal
        isOpen={isInterviewModalOpen}
        onClose={() => {
          setIsInterviewModalOpen(false);
          setEditingInterview(null);
        }}
        onSave={handleSaveInterview}
        editingInterview={editingInterview}
        applicationId={interviewModalAppId}
        applications={applications}
      />

      {/* 4. In-App Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        document={viewingDocument}
        application={
          viewingDocument
            ? applications.find((a) => a.id === viewingDocument.application_id) || null
            : null
        }
      />

      {/* 5. Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmState.isOpen}
        onClose={() => setDeleteConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          await deleteConfirmState.onConfirm();
          setDeleteConfirmState((prev) => ({ ...prev, isOpen: false }));
        }}
        title={deleteConfirmState.title}
        message={deleteConfirmState.message}
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
