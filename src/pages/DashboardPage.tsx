import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { Complaint, MaintenanceTask, Notification, Department, UserProfile } from '../types';
import { PriorityBadge, StatusBadge } from '../components/common/Badges';
import { SlaCountdown } from '../components/common/SlaCountdown';
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Building,
  CalendarCheck,
  Flame,
  ArrowRight,
  TrendingUp,
  Shield,
  Star,
  Users,
  Eye,
  BookOpen,
  MapPin,
} from 'lucide-react';

interface DashboardPageProps {
  onOpenCreate: () => void;
  onSelectComplaint: (id: string) => void;
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenCreate,
  onSelectComplaint,
  onNavigate,
}) => {
  const { currentUser, role } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const loadData = async () => {
    const [cList, tList, dList] = await Promise.all([
      DataService.getComplaints(),
      DataService.getMaintenanceTasks(),
      DataService.getDepartments(),
    ]);
    setComplaints(cList);
    setTasks(tList);
    setDepartments(dList);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('sc360_data_updated', handleUpdate);
    return () => window.removeEventListener('sc360_data_updated', handleUpdate);
  }, []);

  // Filter complaints based on persona
  const myComplaints = complaints.filter((c) => c.reporterId === currentUser?.id);
  const myAssignedComplaints = complaints.filter((c) => c.assignedToId === currentUser?.id);
  const deptComplaints = complaints.filter((c) => c.departmentId === currentUser?.departmentId || c.departmentName.includes('Equipment'));
  const criticalComplaints = complaints.filter((c) => c.priority === 'critical' || c.isSafetyHazard);
  const overdueComplaints = complaints.filter((c) => {
    return c.status !== 'closed' && c.status !== 'resolved' && new Date() > new Date(c.deadline);
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-800 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm text-teal-200">
                {role.replace('_', ' ')} Portal
              </span>
              {currentUser?.rollOrEmpId && (
                <span className="font-mono text-xs text-white/70">ID: {currentUser.rollOrEmpId}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 max-w-xl">
              {role === 'student' && 'Track your reported complaints, monitor real-time repair status, and review campus resolutions.'}
              {(role === 'faculty' || role === 'professor') && 'Manage classroom AV, laboratory apparatus, and department facility incident tickets.'}
              {role === 'staff' && 'Review your assigned work orders, update task progress, and upload resolution proof.'}
              {(role === 'department_head' || role === 'hod') && 'Oversee department staff workload, review high-priority escalations, and monitor SLA deadlines.'}
              {role === 'admin' && 'Central command for institutional maintenance, asset tracking, recurring issues, and SLA enforcement.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-blue-900 text-xs sm:text-sm font-bold shadow-lg shadow-black/10 hover:bg-blue-50 transition-all active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 text-blue-700" />
              <span>Submit Complaint</span>
            </button>
            <button
              onClick={() => onNavigate('campus-map')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
            >
              <MapPin className="w-4 h-4" />
              <span>Campus Map</span>
            </button>
          </div>
        </div>

        {/* Decorative backdrop shapes */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Critical Alerts Strip (if any) */}
      {criticalComplaints.filter((c) => c.status !== 'closed' && c.status !== 'resolved').length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                Active Critical Safety Incident Alert!
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                {criticalComplaints[0].title} in {criticalComplaints[0].campusBuilding} ({criticalComplaints[0].roomNumber}) requires immediate dispatch.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectComplaint(criticalComplaints[0].id)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold whitespace-nowrap transition-colors"
          >
            Inspect Incident
          </button>
        </div>
      )}

      {/* ROLE 1 & 2: STUDENT / PROFESSOR DASHBOARD */}
      {(role === 'student' || role === 'faculty' || role === 'professor') && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">My Complaints</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{myComplaints.length}</p>
              <span className="text-[10px] text-blue-600 font-semibold">Total submitted</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">In Progress</span>
              <p className="text-2xl font-bold text-amber-500 mt-1">
                {myComplaints.filter((c) => c.status === 'in_progress' || c.status === 'assigned').length}
              </p>
              <span className="text-[10px] text-amber-600 font-semibold">Technician assigned</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Resolved</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {myComplaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length}
              </p>
              <span className="text-[10px] text-emerald-500 font-semibold">Ready to review</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Knowledge Base</span>
              <p className="text-2xl font-bold text-teal-600 mt-1">4 Guides</p>
              <span className="text-[10px] text-teal-500 font-semibold">Self-service fixes</span>
            </div>
          </div>

          {/* Active Complaints Stream */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Complaints & Status</h2>
                <p className="text-xs text-slate-500">Track real-time progress and technician assignments.</p>
              </div>
              <button
                onClick={() => onNavigate('complaint-directory')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                View all directory <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myComplaints.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectComplaint(item.id)}
                  className="py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600">{item.complaintCode}</span>
                      <StatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} />
                      <SlaCountdown deadline={item.deadline} status={item.status} />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {item.campusBuilding} ({item.roomNumber}) • {item.departmentName}
                    </p>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-blue-600">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ROLE 3: MAINTENANCE STAFF DASHBOARD */}
      {role === 'staff' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Assigned To Me</span>
              <p className="text-2xl font-bold text-blue-600 mt-1">{myAssignedComplaints.length}</p>
              <span className="text-[10px] text-blue-500 font-semibold">Active tasks</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">In Progress</span>
              <p className="text-2xl font-bold text-amber-500 mt-1">
                {myAssignedComplaints.filter((c) => c.status === 'in_progress').length}
              </p>
              <span className="text-[10px] text-amber-600 font-semibold">Under repair</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Overdue Tasks</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {myAssignedComplaints.filter((c) => new Date() > new Date(c.deadline) && c.status !== 'resolved').length}
              </p>
              <span className="text-[10px] text-rose-500 font-semibold">SLA breached</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Completed</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {myAssignedComplaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length}
              </p>
              <span className="text-[10px] text-emerald-500 font-semibold">Proof uploaded</span>
            </div>
          </div>

          {/* Assigned Work Queue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Assigned Work Queue & Deadlines</h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myAssignedComplaints.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectComplaint(item.id)}
                  className="py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600">{item.complaintCode}</span>
                      <StatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} />
                      <SlaCountdown deadline={item.deadline} status={item.status} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-xs text-slate-500">
                      {item.campusBuilding} ({item.roomNumber}) • Category: {item.categoryName}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectComplaint(item.id);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm whitespace-nowrap self-start sm:self-center"
                  >
                    Manage & Update Work
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ROLE 4: DEPARTMENT HEAD (HOD) DASHBOARD */}
      {(role === 'department_head' || role === 'hod') && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Dept Workload</span>
              <p className="text-2xl font-bold text-blue-600 mt-1">{deptComplaints.length}</p>
              <span className="text-[10px] text-blue-500 font-semibold">Equipment & Labs tickets</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Dept Resolution</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">78%</p>
              <span className="text-[10px] text-emerald-500 font-semibold">On-track</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Technician Pool</span>
              <p className="text-2xl font-bold text-indigo-600 mt-1">4 Active</p>
              <span className="text-[10px] text-indigo-500 font-semibold">Available for dispatch</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Recurring Warnings</span>
              <p className="text-2xl font-bold text-amber-500 mt-1">2 Hotspots</p>
              <span className="text-[10px] text-amber-600 font-semibold">Cluster detection</span>
            </div>
          </div>

          {/* Department Complaints Stream */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Department Incident Stream</h2>
                <p className="text-xs text-slate-500">Monitor technician assignments and high-priority tickets.</p>
              </div>
              <button
                onClick={() => onNavigate('recurring-issues')}
                className="text-xs font-bold text-amber-600 hover:underline"
              >
                Inspect Recurring Issues →
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {deptComplaints.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectComplaint(item.id)}
                  className="py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600">{item.complaintCode}</span>
                      <StatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} />
                      <SlaCountdown deadline={item.deadline} status={item.status} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-xs text-slate-500">
                      Assigned: {item.assignedToName || 'Unassigned'} • {item.campusBuilding} ({item.roomNumber})
                    </p>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-blue-600">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ROLE 5: ADMINISTRATOR DASHBOARD */}
      {role === 'admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Campus Total</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{complaints.length}</p>
              <span className="text-[10px] text-blue-600 font-semibold">Total logged incidents</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Overdue Breaches</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">{overdueComplaints.length}</p>
              <span className="text-[10px] text-rose-500 font-semibold">Exceeded SLA target</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Overall Resolution</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">82%</p>
              <span className="text-[10px] text-emerald-500 font-semibold">System-wide success</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Campus Assets</span>
              <p className="text-2xl font-bold text-teal-600 mt-1">6 Active</p>
              <span className="text-[10px] text-teal-500 font-semibold">Equipment registry</span>
            </div>
          </div>

          {/* Quick Actions & Directory Link */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => onNavigate('analytics')}
              className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition-all group"
            >
              <TrendingUp className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">Interactive Analytics</h3>
              <p className="text-xs text-slate-500 mt-0.5">Explore Recharts charts, SLA compliance gauges, and CSV export.</p>
            </div>

            <div
              onClick={() => onNavigate('recurring-issues')}
              className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/60 border border-amber-200 dark:border-slate-700 cursor-pointer hover:border-amber-400 transition-all group"
            >
              <AlertTriangle className="w-6 h-6 text-amber-600 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">Recurring Issue Engine</h3>
              <p className="text-xs text-slate-500 mt-0.5">Detect repeated failures by location, room, and equipment.</p>
            </div>

            <div
              onClick={() => onNavigate('audit-logs')}
              className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-800/60 border border-emerald-200 dark:border-slate-700 cursor-pointer hover:border-emerald-400 transition-all group"
            >
              <Shield className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">System Audit Logs</h3>
              <p className="text-xs text-slate-500 mt-0.5">Inspect timestamped governance logs and security events.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
