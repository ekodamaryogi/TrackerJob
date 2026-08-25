import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  AlertTriangle,
  Plus,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { JobApplication, Interview } from '../../types';
import { formatDate } from '../../lib/notifications';

interface CalendarViewProps {
  applications: JobApplication[];
  interviews: Interview[];
  onSelectApplication: (app: JobApplication) => void;
  onEditInterview: (interview: Interview) => void;
  onScheduleInterview: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  applications,
  interviews,
  onSelectApplication,
  onEditInterview,
  onScheduleInterview,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(
    new Date().toISOString().split('T')[0]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.toISOString().split('T')[0]);
  };

  // Build calendar matrix
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Map events to date strings (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map: Record<string, { interviews: Interview[]; deadlines: JobApplication[] }> = {};

    interviews.forEach((i) => {
      try {
        const dateKey = new Date(i.scheduled_at).toISOString().split('T')[0];
        if (!map[dateKey]) map[dateKey] = { interviews: [], deadlines: [] };
        map[dateKey].interviews.push(i);
      } catch {}
    });

    applications.forEach((a) => {
      if (a.deadline) {
        const dateKey = a.deadline;
        if (!map[dateKey]) map[dateKey] = { interviews: [], deadlines: [] };
        map[dateKey].deadlines.push(a);
      }
    });

    return map;
  }, [interviews, applications]);

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    if (!selectedDay) return { interviews: [], deadlines: [] };
    return eventsByDate[selectedDay] || { interviews: [], deadlines: [] };
  }, [selectedDay, eventsByDate]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div id="calendar-view" className="space-y-6 pb-12">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interviews, technical evaluations, and application deadlines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 p-0.5">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-calendar-schedule-interview"
            onClick={onScheduleInterview}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Interview</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Matrix Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                className="py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Matrix Days */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots for first week padding */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-xl bg-slate-50/40 dark:bg-slate-900/20" />
            ))}

            {/* Actual Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayData = eventsByDate[dateStr];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDay;

              const hasInterviews = dayData && dayData.interviews.length > 0;
              const hasDeadlines = dayData && dayData.deadlines.length > 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDay(dateStr)}
                  className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/30'
                      : isToday
                      ? 'border-indigo-400 bg-indigo-50/20 dark:bg-slate-800/60'
                      : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : isSelected
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Quick indicator badges */}
                    <div className="flex items-center gap-1">
                      {hasInterviews && (
                        <div className="w-2 h-2 rounded-full bg-amber-500" title="Interview" />
                      )}
                      {hasDeadlines && (
                        <div className="w-2 h-2 rounded-full bg-rose-500" title="Deadline" />
                      )}
                    </div>
                  </div>

                  {/* Day Content Badges */}
                  <div className="space-y-1 overflow-hidden">
                    {hasInterviews && (
                      <div className="text-[10px] font-semibold truncate bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-1 py-0.5 rounded">
                        {dayData.interviews.length === 1
                          ? `${applications.find((a) => a.id === dayData.interviews[0].application_id)?.company || 'Interview'}`
                          : `${dayData.interviews.length} Interviews`}
                      </div>
                    )}
                    {hasDeadlines && (
                      <div className="text-[10px] font-semibold truncate bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 px-1 py-0.5 rounded">
                        {dayData.deadlines.length} Deadline{dayData.deadlines.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Event Drawer / Detail Panel */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Schedule For
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {selectedDay ? formatDate(selectedDay) : 'Select a date'}
            </h3>
          </div>

          {/* List of interviews on this day */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[60vh]">
            {selectedDateEvents.interviews.length === 0 &&
            selectedDateEvents.deadlines.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No events or deadlines on this day.
              </div>
            ) : null}

            {/* Interviews */}
            {selectedDateEvents.interviews.map((intv) => {
              const app = applications.find((a) => a.id === intv.application_id);
              const timeStr = new Date(intv.scheduled_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={intv.id}
                  onClick={() => onEditInterview(intv)}
                  className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 cursor-pointer hover:border-amber-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      {intv.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeStr}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      {app?.position || 'Job Interview'}
                    </h5>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {app?.company || 'Company'}
                    </p>
                  </div>

                  {intv.interviewer && (
                    <p className="text-xs text-slate-500">Interviewer: {intv.interviewer}</p>
                  )}

                  {intv.meeting_url && (
                    <a
                      href={intv.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-1"
                    >
                      <Video className="w-3 h-3" /> Join Video Call
                    </a>
                  )}
                </div>
              );
            })}

            {/* Deadlines */}
            {selectedDateEvents.deadlines.map((app) => (
              <div
                key={app.id}
                onClick={() => onSelectApplication(app)}
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 cursor-pointer hover:border-rose-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Application Deadline
                  </span>
                  <span className="text-xs text-slate-500">{app.work_type}</span>
                </div>

                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                    {app.position}
                  </h5>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {app.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
