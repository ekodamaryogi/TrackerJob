import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Kanban,
  Calendar as CalendarIcon,
  FolderOpen,
  Bell,
  Settings as SettingsIcon,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'applications'
  | 'pipeline'
  | 'calendar'
  | 'documents'
  | 'notifications'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  unreadNotifsCount: number;
  activeApplicationsCount: number;
  upcomingInterviewsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddModal,
  unreadNotifsCount,
  activeApplicationsCount,
  upcomingInterviewsCount,
}) => {
  const mainNavItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications' as NavTab, label: 'Applications', icon: Briefcase },
    { id: 'pipeline' as NavTab, label: 'Pipeline', icon: Kanban },
    { id: 'calendar' as NavTab, label: 'Calendar', icon: CalendarIcon },
    { id: 'documents' as NavTab, label: 'Documents', icon: FolderOpen },
  ];

  const secondaryNavItems = [
    {
      id: 'notifications' as NavTab,
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
    },
    { id: 'settings' as NavTab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside
      id="desktop-sidebar"
      className="hidden md:flex flex-col w-64 lg:w-72 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0 h-screen sticky top-0 z-30 select-none"
    >
      {/* Brand Header with Cyberpunk Neon Touch */}
      <div className="p-5 border-b border-slate-800/90 flex items-center justify-between relative overflow-hidden">
        {/* Subtle top neon laser line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />
        
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-fuchsia-600 p-[1px] shadow-md shadow-cyan-950/40">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center text-cyan-400">
              <Briefcase className="w-5 h-5 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
            </div>
            {/* Glowing corner dot */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
              Career<span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">Track</span>
              <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                PRO_2.6
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              <span className="font-mono text-[10px] tracking-wide text-slate-400">SYS.ONLINE</span>
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 pb-2">
        <button
          id="btn-sidebar-add-application"
          onClick={onOpenAddModal}
          className="relative w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-fuchsia-500 active:scale-[0.98] text-white font-semibold text-sm shadow-md shadow-cyan-950/30 hover:shadow-[0_0_16px_rgba(6,182,212,0.35)] transition-all duration-200 group cursor-pointer border border-cyan-400/30"
        >
          <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200 text-cyan-200" />
          <span className="tracking-wide">Add Application</span>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              // Core Navigation
            </p>
          </div>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-slate-800/90 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)] font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]'
                          : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              // Systems & Sync
            </p>
          </div>
          <nav className="space-y-1">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-slate-800/90 text-fuchsia-300 border border-fuchsia-500/40 shadow-[0_0_12px_rgba(236,72,153,0.15)] font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-fuchsia-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.6)]'
                          : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white shadow-[0_0_8px_#f43f5e] animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mini Active Summary Footer (Cyber HUD panel) */}
      <div className="p-4 border-t border-slate-800/90 bg-slate-950/60 relative">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 via-indigo-500 to-fuchsia-500" />
          <div className="flex items-center justify-between text-slate-300 pl-1">
            <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> ACTIVE_APPS
            </span>
            <span className="font-mono font-bold text-cyan-300">{activeApplicationsCount}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300 pl-1">
            <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ROUNDS_AHEAD
            </span>
            <span className="font-mono font-bold text-emerald-400">{upcomingInterviewsCount}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
