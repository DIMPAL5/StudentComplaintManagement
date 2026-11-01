import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DataService } from '../../services/dataService';
import {
  LayoutDashboard,
  FileText,
  MapPin,
  BookOpen,
  Wrench,
  CalendarCheck,
  Package,
  TrendingUp,
  AlertOctagon,
  Users,
  ShieldCheck,
  Download,
  Play,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const { role, isDemoMode } = useAuth();
  const { showToast } = useToast();

  const handleRunSlaCheck = async () => {
    const result = await DataService.checkOverdueComplaints();
    showToast(
      'info',
      'SLA Engine Simulation Complete',
      `Identified ${result.overdueCount} overdue complaints; auto-escalated ${result.escalatedCount} tickets.`
    );
    window.dispatchEvent(new CustomEvent('sc360_data_updated'));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['student', 'faculty', 'staff', 'department_head', 'admin'] },
    { id: 'complaint-directory', label: 'Complaint Directory', icon: <FileText className="w-4 h-4" />, roles: ['student', 'faculty', 'staff', 'department_head', 'admin'] },
    { id: 'campus-map', label: 'Interactive Campus Map', icon: <MapPin className="w-4 h-4" />, roles: ['student', 'faculty', 'staff', 'department_head', 'admin'] },
    { id: 'knowledge-base', label: 'Knowledge Base & FAQ', icon: <BookOpen className="w-4 h-4" />, roles: ['student', 'faculty', 'staff', 'department_head', 'admin'] },
    
    // Maintenance Staff & HOD & Admin
    { id: 'maintenance-planner', label: 'Preventive Maintenance', icon: <CalendarCheck className="w-4 h-4" />, roles: ['staff', 'department_head', 'admin'] },
    { id: 'assets', label: 'Campus Asset Registry', icon: <Package className="w-4 h-4" />, roles: ['staff', 'department_head', 'admin'] },
    
    // HOD & Admin
    { id: 'recurring-issues', label: 'Recurring Issue Detector', icon: <AlertOctagon className="w-4 h-4" />, roles: ['department_head', 'admin'] },
    { id: 'analytics', label: 'Analytics & Trends', icon: <TrendingUp className="w-4 h-4" />, roles: ['department_head', 'admin'] },
    { id: 'reports', label: 'Export Reports & CSV', icon: <Download className="w-4 h-4" />, roles: ['department_head', 'admin'] },

    // Admin Only
    { id: 'admin-management', label: 'Departments & Users', icon: <Users className="w-4 h-4" />, roles: ['admin'] },
    { id: 'audit-logs', label: 'System Audit Logs', icon: <ShieldCheck className="w-4 h-4" />, roles: ['admin'] },
  ];

  const visibleNav = navItems.filter((item) => item.roles.includes(role));

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
          {/* Main Navigation */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-3">
              Navigation
            </p>
            <nav className="space-y-1">
              {visibleNav.map((item) => {
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
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

          {/* Quick Simulation Actions */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-3">
              Automation & Tools
            </p>
            <div className="space-y-2 px-1">
              <button
                onClick={handleRunSlaCheck}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                  <span>Evaluate SLA Escalations</span>
                </div>
                <span className="text-[10px] bg-amber-200/70 dark:bg-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                  TEST
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isDemoMode ? 'Local Demo Mode' : 'Connected to Supabase'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {isDemoMode
                ? 'Persistent via localStorage. Full role simulation with pre-populated college data.'
                : 'Live PostgreSQL & Realtime active.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
