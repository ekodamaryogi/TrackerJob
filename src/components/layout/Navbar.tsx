import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Monitor,
  Plus,
  Menu,
  X,
  Briefcase,
  Check,
  Clock,
  Settings as SettingsIcon,
  Calendar,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unreadNotifsCount: number;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: (theme: 'light' | 'dark' | 'system') => void;
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddModal,
  searchQuery,
  onSearchChange,
  unreadNotifsCount,
  theme,
  onToggleTheme,
  onOpenMobileMenu,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Real-time clock tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format real-time clock & date
  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'applications':
        return 'Job Applications';
      case 'pipeline':
        return 'Recruitment Pipeline';
      case 'calendar':
        return 'Interview & Event Calendar';
      case 'documents':
        return 'Application Documents';
      case 'notifications':
        return 'Notifications & Reminders';
      case 'settings':
        return 'Tracker Settings';
      default:
        return 'Personal Job Tracker';
    }
  };

  return (
    <header
      id="app-navbar"
      className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors relative"
    >
      {/* Subtle Bottom Laser Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 gap-3">
        {/* Mobile Menu & Title */}
        <div className="flex items-center gap-3">
          <button
            id="btn-mobile-menu-toggle"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
              <span>{getPageTitle()}</span>
              <span className="hidden lg:inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-cyan-400 border border-slate-200 dark:border-cyan-500/20">
                [LIVE_SYNC]
              </span>
            </h2>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md hidden sm:block mx-4">
          <div className="relative group">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search company, position, or keywords..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 focus:border-cyan-500 focus:shadow-[0_0_12px_rgba(6,182,212,0.25)] focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all"
            />
            {searchQuery && (
              <button
                id="btn-clear-search"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Actions & Real-Time Clock */}
        <div className="flex items-center gap-2">
          {/* Real-time Clock Widget in Navbar */}
          <div
            id="navbar-realtime-clock"
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-xs shadow-xs"
            title={`Real-time System Clock: ${formattedDate} ${formattedTime}`}
          >
            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-mono font-bold text-slate-800 dark:text-cyan-300 tracking-wider">
                {formattedTime}
              </span>
            </div>
            <span className="w-1 h-3 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {formattedDate}
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          {/* Quick Settings Navbar Button */}
          <button
            id="btn-navbar-settings"
            onClick={() => onSelectTab('settings')}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Open Settings & WhatsApp / Supabase"
            aria-label="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>

          {/* Notifications Button */}
          <button
            id="btn-navbar-notifications"
            onClick={() => onSelectTab('notifications')}
            className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="View notifications"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-[0_0_6px_#f43f5e]" />
            )}
          </button>

          {/* Theme Dropdown */}
          <div className="relative">
            <button
              id="btn-navbar-theme-toggle"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
              ) : theme === 'light' ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Monitor className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              )}
            </button>

            {showThemeMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowThemeMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-36 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50">
                  <button
                    onClick={() => {
                      onToggleTheme('light');
                      setShowThemeMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                  >
                    <span className="flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5 text-amber-500" /> Light
                    </span>
                    {theme === 'light' && <Check className="w-3.5 h-3.5 text-cyan-500" />}
                  </button>
                  <button
                    onClick={() => {
                      onToggleTheme('dark');
                      setShowThemeMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                  >
                    <span className="flex items-center gap-2">
                      <Moon className="w-3.5 h-3.5 text-cyan-400" /> Dark
                    </span>
                    {theme === 'dark' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                  <button
                    onClick={() => {
                      onToggleTheme('system');
                      setShowThemeMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                  >
                    <span className="flex items-center gap-2">
                      <Monitor className="w-3.5 h-3.5 text-slate-500" /> System
                    </span>
                    {theme === 'system' && <Check className="w-3.5 h-3.5 text-cyan-500" />}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quick Add Button (Desktop & Mobile) with Cyberpunk Gradient */}
          <button
            id="btn-navbar-add-app"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-sm shadow-sm hover:shadow-[0_0_12px_rgba(6,182,212,0.35)] transition-all cursor-pointer border border-cyan-400/30"
          >
            <Plus className="w-4 h-4 text-cyan-200" />
            <span className="hidden sm:inline">Add Job</span>
          </button>
        </div>
      </div>

      {/* Sub-bar Real-time Clock on Tablet / Mobile */}
      <div className="lg:hidden flex items-center justify-between px-4 py-1 bg-slate-100/60 dark:bg-slate-950/60 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
        <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
          <Clock className="w-3 h-3" />
          <span>{formattedTime}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span>{formattedDate}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      {/* Mobile Search Bar (under navbar on small screens) */}
      <div className="px-4 pb-3 pt-2 sm:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="mobile-global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search jobs..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none"
          />
        </div>
      </div>
    </header>
  );
};
