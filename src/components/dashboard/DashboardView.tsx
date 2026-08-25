import React, { useMemo } from 'react';
import {
  Briefcase,
  Clock,
  CheckCircle2,
  Trophy,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Building2,
  MapPin,
  Video,
} from 'lucide-react';
import { JobApplication, Interview, ApplicationEvent } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, formatRelativeTime } from '../../lib/notifications';

interface DashboardViewProps {
  applications: JobApplication[];
  interviews: Interview[];
  events: ApplicationEvent[];
  onSelectApplication: (app: JobApplication) => void;
  onOpenAddModal: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  applications,
  interviews,
  events,
  onSelectApplication,
  onOpenAddModal,
  onNavigateToTab,
}) => {
  // Compute Key Metrics
  const metrics = useMemo(() => {
    const total = applications.length;
    const active = applications.filter((a) =>
      ['Wishlist', 'Applied', 'Screening', 'Interview', 'Technical Test', 'HR Interview'].includes(
        a.status
      )
    ).length;
    const interviewCount = applications.filter((a) =>
      ['Interview', 'Technical Test', 'HR Interview'].includes(a.status)
    ).length;
    const offers = applications.filter((a) => a.status === 'Offer').length;
    const accepted = applications.filter((a) => a.status === 'Accepted').length;
    const rejected = applications.filter((a) => a.status === 'Rejected').length;
    const expired = applications.filter((a) => a.status === 'Expired').length;

    // Applications this week & month
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = applications.filter(
      (a) => new Date(a.application_date) >= oneWeekAgo
    ).length;
    const thisMonth = applications.filter(
      (a) => new Date(a.application_date) >= oneMonthAgo
    ).length;

    // Rates
    const interviewRate = total > 0 ? Math.round(((interviewCount + offers + accepted) / total) * 100) : 0;
    const responseCount = applications.filter(
      (a) => !['Wishlist', 'Applied'].includes(a.status)
    ).length;
    const responseRate = total > 0 ? Math.round((responseCount / total) * 100) : 0;
    const offerRate = total > 0 ? Math.round(((offers + accepted) / total) * 100) : 0;

    return {
      total,
      active,
      interviewCount,
      offers,
      accepted,
      rejected,
      expired,
      thisWeek,
      thisMonth,
      interviewRate,
      responseRate,
      offerRate,
    };
  }, [applications]);

  // Status Distribution Data
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return counts;
  }, [applications]);

  // Source Distribution Data
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((a) => {
      counts[a.source] = (counts[a.source] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [applications]);

  // Upcoming Interviews & Deadlines
  const upcomingInterviews = useMemo(() => {
    const now = new Date();
    return interviews
      .filter((i) => new Date(i.scheduled_at) >= now)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, 4);
  }, [interviews]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    return applications
      .filter(
        (a) =>
          a.deadline &&
          a.deadline >= todayStr &&
          !['Offer', 'Accepted', 'Rejected', 'Withdrawn', 'Expired'].includes(a.status)
      )
      .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))
      .slice(0, 4);
  }, [applications]);

  // Recent Applications
  const recentApplications = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [applications]);

  return (
    <div id="dashboard-view" className="space-y-6 pb-12">
      {/* Top Banner / Welcome Action with Cyber Grid */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-lg border border-cyan-500/30 cyber-banner-grid">
        {/* Subtle Neon Top Edge */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.25)]">
              // SYS_MONITOR: ACTIVE
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{metrics.active > 0
              ? `You have ${metrics.active} active job application${metrics.active > 1 ? 's' : ''}`
              : 'Your job search tracker is ready'}</span>
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            {metrics.offers > 0
              ? `🎉 Outstanding! You have ${metrics.offers} active job offer waiting for your decision.`
              : upcomingInterviews.length > 0
              ? `Next interview scheduled for ${new Date(upcomingInterviews[0].scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.`
              : 'Track applications, interviews, technical tests, and deadlines in one place.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            id="btn-dashboard-view-pipeline"
            onClick={() => onNavigateToTab('pipeline')}
            className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-sm font-medium border border-slate-700 hover:border-cyan-500/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all cursor-pointer font-mono"
          >
            Pipeline [Kanban]
          </button>
          <button
            id="btn-dashboard-add-app"
            onClick={onOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-fuchsia-500 active:scale-95 text-white text-sm font-semibold shadow-md shadow-cyan-950/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 cursor-pointer border border-cyan-400/30"
          >
            <Plus className="w-4 h-4 text-cyan-200" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Primary Statistic Cards with Cyber Top Neon Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* Total */}
        <div
          onClick={() => onNavigateToTab('applications')}
          className="cyber-card-cyan bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-cyan-500/60 hover:shadow-[0_0_14px_rgba(6,182,212,0.2)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">[TOTAL]</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 group-hover:text-cyan-400 transition-colors">
            {metrics.total}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">All applications</span>
        </div>

        {/* Active */}
        <div
          onClick={() => onNavigateToTab('pipeline')}
          className="cyber-card-cyan bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-cyan-500/60 hover:shadow-[0_0_14px_rgba(6,182,212,0.2)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400">[ACTIVE]</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">
            {metrics.active}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">In progress</span>
        </div>

        {/* Interviews */}
        <div
          onClick={() => onNavigateToTab('calendar')}
          className="cyber-card-amber bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-amber-500/60 hover:shadow-[0_0_14px_rgba(245,158,11,0.2)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
              [ROUNDS]
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {metrics.interviewCount}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">HR & Tech rounds</span>
        </div>

        {/* Offers */}
        <div
          onClick={() => onNavigateToTab('pipeline')}
          className="cyber-card-emerald bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-emerald-500/60 hover:shadow-[0_0_14px_rgba(16,185,129,0.2)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              [OFFERS]
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {metrics.offers}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Job offers</span>
        </div>

        {/* Accepted */}
        <div
          onClick={() => onNavigateToTab('pipeline')}
          className="cyber-card-emerald bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-teal-500/60 hover:shadow-[0_0_14px_rgba(20,184,166,0.2)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400">[SIGNED]</span>
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-teal-600 dark:text-teal-400 mt-2">
            {metrics.accepted}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Signed offers</span>
        </div>

        {/* Rejected */}
        <div
          onClick={() => onNavigateToTab('pipeline')}
          className="cyber-card-magenta bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-rose-500/60 hover:shadow-[0_0_14px_rgba(244,63,94,0.2)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">[REJECTED]</span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {metrics.rejected}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Unsuccessful</span>
        </div>

        {/* Expired */}
        <div
          onClick={() => onNavigateToTab('pipeline')}
          className="cyber-card-amber bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-amber-600/60 transition-all cursor-pointer col-span-2 sm:col-span-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-500">[EXPIRED]</span>
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-400 mt-2">
            {metrics.expired}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Deadline passed</span>
        </div>
      </div>

      {/* Secondary Conversion / Rate Metrics with Glowing Progress Bars */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-cyan-500/40 transition-colors">
          <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">Response Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900 dark:text-cyan-300">
              {metrics.responseRate}%
            </span>
            <span className="text-xs text-slate-400">progressed past applied</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all shadow-[0_0_8px_rgba(6,182,212,0.5)]"
              style={{ width: `${Math.min(metrics.responseRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-amber-500/40 transition-colors">
          <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">Interview Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900 dark:text-amber-400">
              {metrics.interviewRate}%
            </span>
            <span className="text-xs text-slate-400">reached interview stage</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              style={{ width: `${Math.min(metrics.interviewRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-emerald-500/40 transition-colors">
          <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">Offer Conversion</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.offerRate}%
            </span>
            <span className="text-xs text-slate-400">of all applications</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: `${Math.min(metrics.offerRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-fuchsia-500/40 transition-colors">
          <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">Velocity</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900 dark:text-fuchsia-300">
              +{metrics.thisMonth}
            </span>
            <span className="text-xs text-slate-400">applied this month</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span className="text-cyan-400">+{metrics.thisWeek}</span> in last 7 days
          </div>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Events & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Events (Interviews & Deadlines) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Upcoming Recruitment Events
                </h3>
              </div>
              <button
                id="btn-view-all-calendar"
                onClick={() => onNavigateToTab('calendar')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Full Calendar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Upcoming Interviews */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Scheduled Interviews
                </h4>
                {upcomingInterviews.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800">
                    No upcoming interviews scheduled.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {upcomingInterviews.map((intv) => {
                      const app = applications.find((a) => a.id === intv.application_id);
                      const d = new Date(intv.scheduled_at);
                      return (
                        <div
                          key={intv.id}
                          onClick={() => app && onSelectApplication(app)}
                          className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate">
                                {intv.type}
                              </p>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {app?.company || 'Company'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {app?.position}
                              </p>
                            </div>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shrink-0">
                              {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-900/30 text-xs text-slate-500 dark:text-slate-400">
                            <span>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({intv.duration_minutes}m)</span>
                            {intv.meeting_url && (
                              <a
                                href={intv.meeting_url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                              >
                                <Video className="w-3 h-3" /> Join
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Upcoming Deadlines */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Approaching Deadlines
                </h4>
                {upcomingDeadlines.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800">
                    No approaching application deadlines.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {upcomingDeadlines.map((app) => {
                      const d = new Date(app.deadline!);
                      const daysLeft = Math.ceil(
                        (d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <div
                          key={app.id}
                          onClick={() => onSelectApplication(app)}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {app.company}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {app.position}
                              </p>
                            </div>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded shrink-0 ${
                                daysLeft <= 1
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                              }`}
                            >
                              {daysLeft <= 0 ? 'Today' : `${daysLeft}d left`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
                            <span>Deadline: {formatDate(app.deadline)}</span>
                            <StatusBadge status={app.status} size="sm" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Applications Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Recent Applications
              </h3>
              <button
                id="btn-view-all-apps"
                onClick={() => onNavigateToTab('applications')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View all ({applications.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => onSelectApplication(app)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold shrink-0">
                      {app.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {app.position}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="truncate">{app.company}</span>
                        <span>•</span>
                        <span>{app.work_type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:block text-right">
                      <span className="text-xs text-slate-400 block">Applied {formatDate(app.application_date)}</span>
                    </div>
                    <StatusBadge status={app.status} size="sm" />
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Status & Source Distributions */}
        <div className="space-y-6">
          {/* Status Breakdown Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
              Status Distribution
            </h3>

            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => {
                const numCount = Number(count);
                const pct = metrics.total > 0 ? Math.round((numCount / metrics.total) * 100) : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {status}
                      </span>
                      <span className="text-slate-500 font-semibold">
                        {numCount} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          ['Offer', 'Accepted'].includes(status)
                            ? 'bg-emerald-500'
                            : ['Interview', 'Technical Test', 'HR Interview'].includes(status)
                            ? 'bg-amber-500'
                            : status === 'Applied'
                            ? 'bg-blue-500'
                            : status === 'Expired'
                            ? 'bg-amber-700'
                            : status === 'Rejected'
                            ? 'bg-rose-500'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sources Breakdown Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
              Application Sources
            </h3>

            <div className="space-y-2.5">
              {sourceCounts.map(([source, count]) => {
                const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                return (
                  <div
                    key={source}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {source}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
