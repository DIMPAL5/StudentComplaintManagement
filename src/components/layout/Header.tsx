import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { DataService } from '../../services/dataService';
import { Notification, UserRole } from '../../types';
import {
  Bell,
  Sun,
  Moon,
  PlusCircle,
  Menu,
  RotateCcw,
  LogOut,
  Shield,
  User,
  GraduationCap,
  Briefcase,
  Wrench,
  CheckCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  onOpenCreateComplaint: () => void;
  onToggleSidebar: () => void;
  onNavigate: (page: string) => void;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateComplaint,
  onToggleSidebar,
  onNavigate,
  onOpenAuthModal,
}) => {
  const { currentUser, role, isDemoMode, switchDemoRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (currentUser) {
      const list = await DataService.getNotifications(currentUser.id);
      setNotifications(list);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [currentUser]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (currentUser) {
      await DataService.markAllNotificationsRead(currentUser.id);
      await fetchNotifications();
      showToast('info', 'Notifications cleared', 'All notifications marked as read.');
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo complaints, comments, assets, and tasks back to initial seed data?')) {
      DataService.resetDemoData();
      showToast('success', 'Demo data reset!', 'Database restored to initial state.');
      setTimeout(() => window.location.reload(), 600);
    }
  };

  const roleMeta: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
    student: { label: 'Student', icon: <GraduationCap className="w-4 h-4" />, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60' },
    professor: { label: 'Professor', icon: <Briefcase className="w-4 h-4" />, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60' },
    faculty: { label: 'Professor', icon: <Briefcase className="w-4 h-4" />, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60' },
    staff: { label: 'Maintenance Staff', icon: <Wrench className="w-4 h-4" />, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60' },
    hod: { label: 'Dept Head (HOD)', icon: <Building2 className="w-4 h-4" />, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60' },
    department_head: { label: 'Dept Head (HOD)', icon: <Building2 className="w-4 h-4" />, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60' },
    admin: { label: 'Administrator', icon: <Shield className="w-4 h-4" />, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60' },
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-700 to-teal-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  Smart Campus <span className="text-teal-600 dark:text-teal-400">360</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  CMS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Complaint Management & Facility Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Center: Institutional Authenticated Role Badge */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Portal:</span>
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-bold uppercase text-[10px] tracking-wider shadow-xs">
                {role}
              </span>
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Submit Complaint Button */}
          <button
            onClick={onOpenCreateComplaint}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Complaint</span>
            <span className="sm:hidden">Report</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</h3>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      {notifications.length}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={async () => {
                          await DataService.markNotificationRead(n.id);
                          fetchNotifications();
                          if (n.complaintId) {
                            onNavigate('complaint-directory');
                          }
                          setShowNotifications(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold ${!n.isRead ? 'text-blue-900 dark:text-blue-200' : 'text-slate-700 dark:text-slate-300'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  {currentUser?.fullName.charAt(0) || 'U'}
                </div>
              )}
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  {currentUser?.fullName}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  {currentUser?.role.replace('_', ' ')}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{currentUser?.fullName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</p>
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {isDemoMode ? 'Demo Mode (Local DB)' : 'Supabase Production'}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    My Profile & Settings
                  </button>

                  {onOpenAuthModal && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenAuthModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    >
                      <User className="w-4 h-4" />
                      Sign In / Switch Account
                    </button>
                  )}

                  <button
                    onClick={handleResetData}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Demo Seed Data
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 pt-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      onNavigate('login');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Demo Switcher Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
        <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Switch Persona:</span>
        {(['student', 'faculty', 'staff', 'department_head', 'admin'] as UserRole[]).map((r) => (
          <button
            key={r}
            onClick={() => switchDemoRole(r)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap capitalize ${
              role === r
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {r === 'department_head' ? 'HOD' : r}
          </button>
        ))}
      </div>
    </header>
  );
};
