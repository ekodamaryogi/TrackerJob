import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  Sparkles,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { JobApplication, ApplicationStatus, Interview } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, formatSalaryRange } from '../../lib/notifications';

interface PipelineViewProps {
  applications: JobApplication[];
  interviews: Interview[];
  onSelectApplication: (app: JobApplication) => void;
  onUpdateStatus: (id: string, newStatus: ApplicationStatus) => Promise<void>;
  onOpenAddModal: () => void;
}

const PIPELINE_COLUMNS: { id: ApplicationStatus; title: string; color: string; neonGlow: string }[] = [
  { id: 'Wishlist', title: 'Wishlist', color: 'border-t-slate-400', neonGlow: 'hover:border-slate-400' },
  { id: 'Applied', title: 'Applied', color: 'border-t-cyan-500', neonGlow: 'hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.25)]' },
  { id: 'Screening', title: 'Screening', color: 'border-t-indigo-500', neonGlow: 'hover:border-indigo-400 hover:shadow-[0_0_12px_rgba(99,102,241,0.25)]' },
  { id: 'Interview', title: 'Interview', color: 'border-t-amber-500', neonGlow: 'hover:border-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]' },
  { id: 'Technical Test', title: 'Technical Test', color: 'border-t-purple-500', neonGlow: 'hover:border-purple-400 hover:shadow-[0_0_12px_rgba(168,85,247,0.25)]' },
  { id: 'HR Interview', title: 'HR Interview', color: 'border-t-orange-500', neonGlow: 'hover:border-orange-400 hover:shadow-[0_0_12px_rgba(249,115,22,0.25)]' },
  { id: 'Offer', title: 'Offer', color: 'border-t-emerald-400', neonGlow: 'hover:border-emerald-400 hover:shadow-[0_0_12px_rgba(52,211,153,0.3)]' },
  { id: 'Accepted', title: 'Accepted', color: 'border-t-teal-400', neonGlow: 'hover:border-teal-400 hover:shadow-[0_0_12px_rgba(45,212,191,0.3)]' },
  { id: 'Rejected', title: 'Rejected', color: 'border-t-rose-500', neonGlow: 'hover:border-rose-400 hover:shadow-[0_0_12px_rgba(251,113,133,0.25)]' },
  { id: 'Withdrawn', title: 'Withdrawn', color: 'border-t-zinc-500', neonGlow: 'hover:border-zinc-400' },
  { id: 'Expired', title: 'Expired', color: 'border-t-amber-700', neonGlow: 'hover:border-amber-600' },
];

export const PipelineView: React.FC<PipelineViewProps> = ({
  applications,
  interviews,
  onSelectApplication,
  onUpdateStatus,
  onOpenAddModal,
}) => {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = useState<ApplicationStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData('text/plain', appId);
    setDraggedAppId(appId);
  };

  const handleDragOver = (e: React.DragEvent, colId: ApplicationStatus) => {
    e.preventDefault();
    if (hoveredCol !== colId) {
      setHoveredCol(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: ApplicationStatus) => {
    e.preventDefault();
    setHoveredCol(null);
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (!appId) return;

    const currentApp = applications.find((a) => a.id === appId);
    if (currentApp && currentApp.status !== targetStatus) {
      if (targetStatus === 'Accepted' || targetStatus === 'Offer') {
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
      }
      await onUpdateStatus(appId, targetStatus);
    }
    setDraggedAppId(null);
  };

  return (
    <div id="pipeline-view" className="space-y-4 pb-12">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Kanban Recruitment Pipeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Drag and drop cards across columns to advance application stages
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400 hidden md:inline">
            Total: {applications.length} applications
          </span>
          <button
            id="btn-pipeline-add-app"
            onClick={onOpenAddModal}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Job</span>
          </button>
        </div>
      </div>

      {/* Horizontal Scrolling Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[70vh] scrollbar-thin">
        {PIPELINE_COLUMNS.map((col) => {
          const colApps = applications.filter((a) => a.status === col.id);
          const isOver = hoveredCol === col.id;

          return (
            <div
              key={col.id}
              id={`kanban-column-${col.id.toLowerCase().replace(/\s+/g, '-')}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`w-72 shrink-0 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border-t-4 ${
                col.color
              } ${col.neonGlow} border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[80vh] transition-all ${
                isOver
                  ? 'ring-2 ring-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : ''
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {col.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {colApps.length}
                  </span>
                </div>

                <button
                  onClick={onOpenAddModal}
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title={`Add to ${col.title}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Column Cards Container */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {colApps.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl bg-white/40 dark:bg-slate-900/20">
                    No applications
                  </div>
                ) : (
                  colApps.map((app) => {
                    const appIntvs = interviews.filter((i) => i.application_id === app.id);
                    const isAppExpired =
                      app.status === 'Expired' ||
                      (app.deadline &&
                        new Date(app.deadline) < new Date() &&
                        ['Wishlist', 'Applied', 'Screening'].includes(app.status));

                    return (
                      <div
                        key={app.id}
                        id={`kanban-card-${app.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onClick={() => onSelectApplication(app)}
                        className={`group p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-grab active:cursor-grabbing space-y-2.5 ${
                          draggedAppId === app.id ? 'opacity-40 scale-95' : ''
                        }`}
                      >
                        {/* Company & Position */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                              {app.company}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-300 truncate block font-medium">
                              {app.position}
                            </span>
                          </div>
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                            {app.company.slice(0, 2).toUpperCase()}
                          </div>
                        </div>

                        {/* Location & Work Type */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 font-medium">
                            {app.work_type}
                          </span>
                          <span className="truncate">{app.location || 'Remote'}</span>
                        </div>

                        {/* Salary (if recorded) */}
                        {(app.salary_min || app.salary_max) && (
                          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatSalaryRange(
                              app.salary_min,
                              app.salary_max,
                              app.salary_currency
                            )}
                          </div>
                        )}

                        {/* Footer Info & Badges */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Applied {formatDate(app.application_date)}</span>

                          {appIntvs.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {appIntvs.length}
                            </span>
                          )}

                          {isAppExpired && app.status !== 'Expired' && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Exp.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
