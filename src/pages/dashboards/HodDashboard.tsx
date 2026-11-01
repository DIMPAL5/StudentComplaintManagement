import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { Complaint, UserProfile, Priority, Department } from '../../types';
import { PriorityBadge, StatusBadge } from '../../components/common/Badges';
import { SlaCountdown } from '../../components/common/SlaCountdown';
import {
  Building2,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  TrendingUp,
  Download,
  AlertOctagon,
  LogOut,
  User,
  Shield,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface HodDashboardProps {
  onSelectComplaint: (id: string) => void;
  onNavigate: (page: string) => void;
}

export const HodDashboard: React.FC<HodDashboardProps> = ({
  onSelectComplaint,
  onNavigate,
}) => {
  const { currentUser, logout } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [staffUsers, setStaffUsers] = useState<UserProfile[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);

  // Assign staff modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [targetStaffId, setTargetStaffId] = useState<string>('');
  const [targetPriority, setTargetPriority] = useState<Priority>('medium');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const loadData = async () => {
    const [allComplaints, allUsers, allDepts] = await Promise.all([
      DataService.getComplaints(),
      DataService.getUsers(),
      DataService.getDepartments(),
    ]);

    // HOD only manages their department
    const deptId = currentUser?.departmentId || 'dept-1';
    const currentDept = allDepts.find((d) => d.id === deptId) || allDepts[0];
    setDepartment(currentDept);

    const deptTickets = allComplaints.filter(
      (c) =>
        c.departmentId === deptId ||
        c.departmentName.toLowerCase().includes(currentDept.name.toLowerCase().substring(0, 5)) ||
        c.departmentName.toLowerCase().includes('equipment')
    );
    setComplaints(deptTickets);

    const technicians = allUsers.filter(
      (u) => u.role === 'staff' || u.role === 'department_head' || u.role === 'hod'
    );
    setStaffUsers(technicians);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('sc360_data_updated', handleUpdate);
    return () => window.removeEventListener('sc360_data_updated', handleUpdate);
  }, [currentUser]);

  // Metrics
  const totalDeptComplaints = complaints.length;
  const pendingCount = complaints.filter(
    (c) => c.status === 'submitted' || c.status === 'acknowledged'
  ).length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'assigned' || c.status === 'in_progress'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === 'resolved' || c.status === 'closed'
  ).length;
  const overdueCount = complaints.filter((c) => {
    return c.status !== 'closed' && c.status !== 'resolved' && new Date() > new Date(c.deadline);
  }).length;
  const escalatedComplaints = complaints.filter(
    (c) => c.priority === 'critical' || c.isSafetyHazard || overdueCount > 0
  );

  // Staff Workload Map
  const staffWorkload = staffUsers.map((staff) => {
    const activeTasks = complaints.filter(
      (c) => c.assignedToId === staff.id && c.status !== 'resolved' && c.status !== 'closed'
    ).length;
    return {
      staff,
      activeTasks,
    };
  });

  const handleOpenAssignModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setTargetStaffId(complaint.assignedToId || (staffUsers[0]?.id ?? ''));
    setTargetPriority(complaint.priority);
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedComplaint || !currentUser) return;
    const staff = staffUsers.find((s) => s.id === targetStaffId);
    if (!staff) return;

    await DataService.assignComplaint(selectedComplaint.id, staff.id, currentUser);
    setIsAssignModalOpen(false);
    setSelectedComplaint(null);
    loadData();
  };

  const handleExportCsv = () => {
    if (complaints.length === 0) return;
    const headers = ['Code', 'Title', 'Category', 'Priority', 'Status', 'Building', 'Room', 'Reporter', 'Deadline'];
    const rows = complaints.map((c) => [
      `"${c.complaintCode}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.categoryName}"`,
      `"${c.priority}"`,
      `"${c.status}"`,
      `"${c.campusBuilding}"`,
      `"${c.roomNumber}"`,
      `"${c.reporterName}"`,
      `"${c.deadline}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HOD_${department?.code || 'DEPT'}_Complaints_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* HOD Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>HOD Administrative Portal</span>
              </span>
              <span className="font-mono text-xs text-purple-200">
                Department: {department?.name || 'Campus Infrastructure'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUser?.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-purple-100 max-w-xl">
              Oversee departmental ticket lifecycles, balance technical staff workload, enforce SLA deadlines, and generate institutional compliance reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Report</span>
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5-Card Department Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Dept</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{totalDeptComplaints}</p>
          <p className="text-[10px] text-slate-400 mt-1">Logged in department</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Pending</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{pendingCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Awaiting staff dispatch</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500">In Progress</p>
          <p className="text-2xl font-black text-blue-500 mt-1">{inProgressCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Assigned & active</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Resolved</p>
          <p className="text-2xl font-black text-emerald-500 mt-1">{resolvedCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Completed repairs</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Overdue SLA</p>
          <p className="text-2xl font-black text-rose-500 mt-1">{overdueCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Breached resolution time</p>
        </div>
      </div>

      {/* Escalation Alert Strip */}
      {escalatedComplaints.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold text-rose-200">
                {escalatedComplaints.length} Priority Complaints Require Escalation Review
              </p>
              <p className="text-rose-300/80 text-[11px]">
                Critical or overdue tickets require staff reassignment or deadline review.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectComplaint(escalatedComplaints[0].id)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors whitespace-nowrap"
          >
            Review Ticket
          </button>
        </div>
      )}

      {/* Main Grid: Staff Workload + Department Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Department Complaints with Assign Action */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-500" />
              <span>Department Complaints ({complaints.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs font-semibold text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Department Analytics</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div
                  onClick={() => onSelectComplaint(c.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-purple-500">
                        {c.complaintCode}
                      </span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-400 transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {c.campusBuilding} • Room {c.roomNumber} • Assigned to:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {c.assignedToName || 'Unassigned'}
                      </strong>
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                    <SlaCountdown deadline={c.deadline} status={c.status} />
                    <span className="text-[10px] text-slate-400">
                      Reported by {c.reporterName}
                    </span>
                  </div>
                </div>

                {/* HOD Management Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Category: <span className="font-semibold text-slate-300">{c.categoryName}</span>
                  </div>
                  <button
                    onClick={() => handleOpenAssignModal(c)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Assign / Reassign Staff</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Staff Workload Monitor & Reports */}
        <div className="space-y-6">
          {/* Staff Workload Monitor */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span>Department Staff Workload</span>
            </h3>

            <div className="space-y-3">
              {staffWorkload.map(({ staff, activeTasks }) => {
                const maxCapacity = 5;
                const pct = Math.min(100, Math.round((activeTasks / maxCapacity) * 100));
                const isOverloaded = activeTasks >= 4;

                return (
                  <div key={staff.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {staff.fullName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOverloaded
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {activeTasks} Active {activeTasks === 1 ? 'Task' : 'Tasks'}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverloaded ? 'bg-rose-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Reports & Actions */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-900 to-indigo-950 text-white shadow-md space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Department Operations
            </p>
            <p className="text-xs text-purple-200">
              Download clean audit logs or full ticket registers for monthly department meetings.
            </p>
            <div className="space-y-2 pt-1">
              <button
                onClick={handleExportCsv}
                className="w-full py-2.5 rounded-xl bg-white text-purple-950 font-bold text-xs hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Department CSV</span>
              </button>
              <button
                onClick={() => onNavigate('recurring-issues')}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors cursor-pointer"
              >
                Analyze Recurring Faults
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assign / Reassign Staff Modal */}
      {isAssignModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-400" />
                <span>Staff Assignment & Priority</span>
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-400">Target Ticket:</p>
              <p className="text-sm font-bold text-white">{selectedComplaint.title}</p>
              <p className="text-xs text-purple-400 font-mono">{selectedComplaint.complaintCode}</p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Assign Technician:
                </label>
                <select
                  value={targetStaffId}
                  onChange={(e) => setTargetStaffId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                >
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.departmentName || 'Technical Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveAssignment}
                className="w-full mt-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Confirm Dispatch & Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
