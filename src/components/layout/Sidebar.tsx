import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Bell,
  Star,
  User,
  LogOut,
  Wrench,
  CalendarCheck,
  Building2,
  Users,
  TrendingUp,
  Download,
  ShieldCheck,
  MapPin,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenCreateComplaint?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onOpenCreateComplaint,
  isOpen,
  onClose,
}) => {
  const { role, currentUser, logout } = useAuth();
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    onNavigate('login');
    showToast('info', 'Signed Out', 'You have been signed out safely.');
  };

  /**
   * SECTION 7: ROLE-SPECIFIC SIDEBARS
   * Build menus strictly according to the authenticated user's role.
   */
  const getNavItems = () => {
    switch (role) {
      case 'student':
        return [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard className="w-4 h-4" />,
            action: () => onNavigate('dashboard'),
          },
          {
            id: 'submit-complaint',
            label: 'Submit Complaint',
            icon: <PlusCircle className="w-4 h-4 text-teal-400" />,
            action: () => {
              if (onOpenCreateComplaint) onOpenCreateComplaint();
            },
          },
          {
            id: 'my-complaints',
            label: 'My Complaints',
            icon: <FileText className="w-4 h-4" />,
            action: () => onNavigate('complaint-directory'),
          },
          {
            id: 'campus-map',
            label: 'Campus Map',
            icon: <MapPin className="w-4 h-4" />,
            action: () => onNavigate('campus-map'),
          },
          {
            id: 'knowledge-base',
            label: 'Self-Help Guides',
            icon: <BookOpen className="w-4 h-4" />,
            action: () => onNavigate('knowledge-base'),
          },
          {
            id: 'profile',
            label: 'Profile',
            icon: <User className="w-4 h-4" />,
            action: () => onNavigate('profile'),
          },
        ];

      case 'professor':
      case 'faculty':
        return [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard className="w-4 h-4" />,
            action: () => onNavigate('dashboard'),
          },
          {
            id: 'submit-complaint',
            label: 'Submit Complaint',
            icon: <PlusCircle className="w-4 h-4 text-indigo-400" />,
            action: () => {
              if (onOpenCreateComplaint) onOpenCreateComplaint();
            },
          },
          {
            id: 'my-complaints',
            label: 'My Complaints',
            icon: <FileText className="w-4 h-4" />,
            action: () => onNavigate('complaint-directory'),
          },
          {
            id: 'campus-map',
            label: 'Campus Map',
            icon: <MapPin className="w-4 h-4" />,
            action: () => onNavigate('campus-map'),
          },
          {
            id: 'knowledge-base',
            label: 'Knowledge Base',
            icon: <BookOpen className="w-4 h-4" />,
            action: () => onNavigate('knowledge-base'),
          },
          {
            id: 'profile',
            label: 'Profile',
            icon: <User className="w-4 h-4" />,
            action: () => onNavigate('profile'),
          },
        ];

      case 'staff':
        return [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard className="w-4 h-4" />,
            action: () => onNavigate('dashboard'),
          },
          {
            id: 'assigned-complaints',
            label: 'Assigned Complaints',
            icon: <FileText className="w-4 h-4" />,
            action: () => onNavigate('complaint-directory'),
          },
          {
            id: 'maintenance-tasks',
            label: 'Maintenance Tasks',
            icon: <CalendarCheck className="w-4 h-4" />,
            action: () => onNavigate('maintenance-planner'),
          },
          {
            id: 'campus-map',
            label: 'Campus Map',
            icon: <MapPin className="w-4 h-4" />,
            action: () => onNavigate('campus-map'),
          },
          {
            id: 'profile',
            label: 'Profile',
            icon: <User className="w-4 h-4" />,
            action: () => onNavigate('profile'),
          },
        ];

      case 'hod':
      case 'department_head':
        return [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard className="w-4 h-4" />,
            action: () => onNavigate('dashboard'),
          },
          {
            id: 'department-complaints',
            label: 'Department Complaints',
            icon: <FileText className="w-4 h-4" />,
            action: () => onNavigate('complaint-directory'),
          },
          {
            id: 'analytics',
            label: 'Analytics',
            icon: <TrendingUp className="w-4 h-4" />,
            action: () => onNavigate('analytics'),
          },
          {
            id: 'reports',
            label: 'Reports & CSV',
            icon: <Download className="w-4 h-4" />,
            action: () => onNavigate('reports'),
          },
          {
            id: 'campus-map',
            label: 'Campus Map',
            icon: <MapPin className="w-4 h-4" />,
            action: () => onNavigate('campus-map'),
          },
          {
            id: 'profile',
            label: 'Profile',
            icon: <User className="w-4 h-4" />,
            action: () => onNavigate('profile'),
          },
        ];

      case 'admin':
      default:
        return [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard className="w-4 h-4" />,
            action: () => onNavigate('dashboard'),
          },
          {
            id: 'complaint-directory',
            label: 'All Complaints',
            icon: <FileText className="w-4 h-4" />,
            action: () => onNavigate('complaint-directory'),
          },
          {
            id: 'admin-management',
            label: 'Departments & Users',
            icon: <Users className="w-4 h-4" />,
            action: () => onNavigate('admin-management'),
          },
          {
            id: 'analytics',
            label: 'Analytics & SLA',
            icon: <TrendingUp className="w-4 h-4" />,
            action: () => onNavigate('analytics'),
          },
          {
            id: 'reports',
            label: 'Export Reports',
            icon: <Download className="w-4 h-4" />,
            action: () => onNavigate('reports'),
          },
          {
            id: 'audit-logs',
            label: 'System Audit Logs',
            icon: <ShieldCheck className="w-4 h-4" />,
            action: () => onNavigate('audit-logs'),
          },
          {
            id: 'profile',
            label: 'Profile',
            icon: <User className="w-4 h-4" />,
            action: () => onNavigate('profile'),
          },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between overflow-y-auto`}
      >
        <div className="p-4 space-y-6">
          {/* User Role Card */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
            <div className="flex items-center gap-2.5">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-9 h-9 rounded-xl object-cover border border-slate-300 dark:border-slate-600"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  {currentUser?.fullName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser?.fullName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Role-Specific Navigation Menu */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-3">
              {role.toUpperCase()} Menu
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Logout Button */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
