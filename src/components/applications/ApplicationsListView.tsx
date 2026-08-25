import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Building2,
  Calendar,
  DollarSign,
  ExternalLink,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  AlertTriangle,
} from 'lucide-react';
import { JobApplication, ApplicationStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, formatSalaryRange } from '../../lib/notifications';

interface ApplicationsListViewProps {
  applications: JobApplication[];
  onSelectApplication: (app: JobApplication) => void;
  onEditApplication: (app: JobApplication) => void;
  onDeleteApplication: (id: string) => void;
  onOpenAddModal: () => void;
}

export const ApplicationsListView: React.FC<ApplicationsListViewProps> = ({
  applications,
  onSelectApplication,
  onEditApplication,
  onDeleteApplication,
  onOpenAddModal,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'status' | 'deadline'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        // Status filter
        if (statusFilter !== 'ALL' && app.status !== statusFilter) {
          return false;
        }
        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchCompany = app.company.toLowerCase().includes(q);
          const matchPosition = app.position.toLowerCase().includes(q);
          const matchLocation = (app.location || '').toLowerCase().includes(q);
          const matchNotes = (app.notes || '').toLowerCase().includes(q);
          if (!matchCompany && !matchPosition && !matchLocation && !matchNotes) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'date') {
          comp = new Date(a.application_date).getTime() - new Date(b.application_date).getTime();
        } else if (sortBy === 'company') {
          comp = a.company.localeCompare(b.company);
        } else if (sortBy === 'status') {
          comp = a.status.localeCompare(b.status);
        } else if (sortBy === 'deadline') {
          comp = (a.deadline || '9999').localeCompare(b.deadline || '9999');
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [applications, statusFilter, search, sortBy, sortOrder]);

  const toggleSort = (field: 'date' | 'company' | 'status' | 'deadline') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const statusChips = [
    { label: 'All', value: 'ALL' },
    { label: 'Active', value: 'Interview' },
    { label: 'Wishlist', value: 'Wishlist' },
    { label: 'Applied', value: 'Applied' },
    { label: 'Screening', value: 'Screening' },
    { label: 'Tech Test', value: 'Technical Test' },
    { label: 'Offer', value: 'Offer' },
    { label: 'Accepted', value: 'Accepted' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Expired', value: 'Expired' },
  ];

  return (
    <div id="applications-list-view" className="space-y-4 pb-12">
      {/* Top Filter & Search Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              All Job Applications
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredApplications.length} of {applications.length} applications
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-filter-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter company, role..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>
            <button
              id="btn-list-add-app"
              onClick={onOpenAddModal}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Job</span>
            </button>
          </div>
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {statusChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setStatusFilter(chip.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === chip.value
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th
                onClick={() => toggleSort('company')}
                className="py-3.5 px-4 cursor-pointer hover:text-indigo-600"
              >
                <div className="flex items-center gap-1">
                  Company & Role <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('status')}
                className="py-3.5 px-4 cursor-pointer hover:text-indigo-600"
              >
                <div className="flex items-center gap-1">
                  Status <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('date')}
                className="py-3.5 px-4 cursor-pointer hover:text-indigo-600"
              >
                <div className="flex items-center gap-1">
                  Applied Date <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('deadline')}
                className="py-3.5 px-4 cursor-pointer hover:text-indigo-600"
              >
                <div className="flex items-center gap-1">
                  Deadline <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Work / Source</th>
              <th className="py-3.5 px-4">Compensation</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No job applications matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => {
                const isExpired =
                  app.status === 'Expired' ||
                  (app.deadline &&
                    new Date(app.deadline) < new Date() &&
                    ['Wishlist', 'Applied', 'Screening'].includes(app.status));

                return (
                  <tr
                    key={app.id}
                    onClick={() => onSelectApplication(app)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Company & Role */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shrink-0">
                          {app.company.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white block truncate">
                            {app.company}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 block truncate">
                            {app.position}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} size="sm" />
                      {isExpired && app.status !== 'Expired' && (
                        <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5">
                          (Expired)
                        </span>
                      )}
                    </td>

                    {/* Applied Date */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {formatDate(app.application_date)}
                    </td>

                    {/* Deadline */}
                    <td className="py-3.5 px-4">
                      {app.deadline ? (
                        <span
                          className={`font-semibold ${
                            isExpired
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {formatDate(app.deadline)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Work Type & Source */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {app.work_type}
                      </span>
                      <span className="text-[11px] text-slate-400 block">{app.source}</span>
                    </td>

                    {/* Salary */}
                    <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatSalaryRange(
                        app.salary_min,
                        app.salary_max,
                        app.salary_currency
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onSelectApplication(app)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditApplication(app)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Application"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteApplication(app.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Application"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards */}
      <div className="md:hidden space-y-3">
        {filteredApplications.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            No applications found.
          </div>
        ) : (
          filteredApplications.map((app) => (
            <div
              key={app.id}
              onClick={() => onSelectApplication(app)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                    {app.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {app.position}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-semibold">
                      {app.company}
                    </p>
                  </div>
                </div>
                <StatusBadge status={app.status} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <div>
                  <span className="block text-[10px] uppercase text-slate-400 font-bold">
                    Applied Date
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(app.application_date)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-slate-400 font-bold">
                    Work Type
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {app.work_type} • {app.source}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatSalaryRange(
                    app.salary_min,
                    app.salary_max,
                    app.salary_currency
                  )}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5">
                  View Details <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
