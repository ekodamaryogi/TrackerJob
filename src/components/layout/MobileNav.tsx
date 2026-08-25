import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Kanban,
  Calendar as CalendarIcon,
  FolderOpen,
  Bell,
  Settings,
  PlusCircle,
  X,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  unreadNotifsCount: number;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddModal,
  unreadNotifsCount,
  isMobileMenuOpen,
  onCloseMobileMenu,
}) => {
  const bottomTabs = [
    { id: 'dashboard' as NavTab, label: 'Home', icon: LayoutDashboard },
    { id: 'pipeline' as NavTab, label: 'Pipeline', icon: Kanban },
    { id: 'applications' as NavTab, label: 'Jobs', icon: Briefcase },
    { id: 'calendar' as NavTab, label: 'Calendar', icon: CalendarIcon },
    {
      id: 'notifications' as NavTab,
      label: 'Alerts',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
    },
  ];

  const drawerItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications' as NavTab, label: 'Applications', icon: Briefcase },
    { id: 'pipeline' as NavTab, label: 'Pipeline (Kanban)', icon: Kanban },
    { id: 'calendar' as NavTab, label: 'Calendar & Events', icon: CalendarIcon },
    { id: 'documents' as NavTab, label: 'Documents & CVs', icon: FolderOpen },
    {
      id: 'notifications' as NavTab,
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
    },
    { id: 'settings' as NavTab, label: 'Settings & Supabase', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex items-center justify-around"
      >
        {bottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`mobile-bottom-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 text-[10px] font-bold flex items-center justify-center rounded-full bg-rose-500 text-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile Drawer Menu (Sliding overlay) */}
      {isMobileMenuOpen && (
        <div
          id="mobile-drawer-backdrop"
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex"
          onClick={onCloseMobileMenu}
        >
          <div
            className="w-72 max-w-[80vw] h-full bg-slate-900 text-white p-5 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-base">CareerTrack</span>
                </div>
                <button
                  id="btn-close-mobile-drawer"
                  onClick={onCloseMobileMenu}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add Application Action */}
              <div className="my-4">
                <button
                  id="btn-mobile-drawer-add"
                  onClick={() => {
                    onCloseMobileMenu();
                    onOpenAddModal();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Application</span>
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <nav className="space-y-1 mt-2">
                {drawerItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`mobile-drawer-nav-${item.id}`}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobileMenu();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="text-xs text-slate-500 pt-4 border-t border-slate-800">
              Personal Job Application Tracker
            </div>
          </div>
        </div>
      )}
    </>
  );
};
