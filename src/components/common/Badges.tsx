import React from 'react';
import { Priority, ComplaintStatus } from '../../types';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  HelpCircle,
  RotateCcw,
  UserCheck,
  Wrench,
  ShieldAlert,
} from 'lucide-react';

export const PriorityBadge: React.FC<{ priority: Priority; className?: string }> = ({ priority, className = '' }) => {
  const configs: Record<Priority, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    critical: {
      label: 'Critical',
      bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      text: 'text-rose-600',
      icon: <ShieldAlert className="w-3.5 h-3.5 mr-1" />,
    },
    high: {
      label: 'High',
      bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      text: 'text-amber-600',
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />,
    },
    medium: {
      label: 'Medium',
      bg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      text: 'text-blue-600',
      icon: <AlertCircle className="w-3.5 h-3.5 mr-1" />,
    },
    low: {
      label: 'Low',
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      text: 'text-slate-600',
      icon: <Clock className="w-3.5 h-3.5 mr-1" />,
    },
  };

  const c = configs[priority] || configs.medium;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${className}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ComplaintStatus; className?: string }> = ({ status, className = '' }) => {
  const configs: Record<ComplaintStatus, { label: string; bg: string; icon: React.ReactNode }> = {
    submitted: {
      label: 'Submitted',
      bg: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      icon: <Clock className="w-3.5 h-3.5 mr-1" />,
    },
    acknowledged: {
      label: 'Acknowledged',
      bg: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
      icon: <CheckCircle className="w-3.5 h-3.5 mr-1" />,
    },
    assigned: {
      label: 'Assigned',
      bg: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
      icon: <UserCheck className="w-3.5 h-3.5 mr-1" />,
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      icon: <Wrench className="w-3.5 h-3.5 mr-1 animate-pulse" />,
    },
    on_hold: {
      label: 'On Hold',
      bg: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
      icon: <HelpCircle className="w-3.5 h-3.5 mr-1" />,
    },
    resolved: {
      label: 'Resolved',
      bg: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      icon: <CheckCircle className="w-3.5 h-3.5 mr-1" />,
    },
    closed: {
      label: 'Closed',
      bg: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
      icon: <CheckCircle className="w-3.5 h-3.5 mr-1" />,
    },
    reopened: {
      label: 'Reopened',
      bg: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      icon: <RotateCcw className="w-3.5 h-3.5 mr-1" />,
    },
  };

  const c = configs[status] || configs.submitted;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${className}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
};
