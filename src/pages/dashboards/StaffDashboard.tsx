import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { Complaint, MaintenanceTask, Notification, ComplaintStatus } from '../../types';
import { PriorityBadge, StatusBadge } from '../../components/common/Badges';
import { SlaCountdown } from '../../components/common/SlaCountdown';
import { CameraModal } from '../../components/common/CameraModal';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Bell,
  User,
  LogOut,
  CalendarCheck,
  Camera,
  MessageSquare,
  FileCheck,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

interface StaffDashboardProps {
  onSelectComplaint: (id: string) => void;
  onNavigate: (page: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onSelectComplaint,
  onNavigate,
}) => {
  const { currentUser, logout } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Action modals state
  const [activeComplaintForAction, setActiveComplaintForAction] = useState<Complaint | null>(null);
  const [actionType, setActionType] = useState<'status' | 'notes' | 'proof' | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('in_progress');
  const [workNoteText, setWorkNoteText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);

  const loadData = async () => {
    const [allComplaints, allTasks, allNotifs] = await Promise.all([
      DataService.getComplaints(),
      DataService.getMaintenanceTasks(),
      DataService.getNotifications(currentUser?.id),
    ]);
    // Staff only sees tickets assigned to them or their department
    const staffTickets = allComplaints.filter(
      (c) =>
        c.assignedToId === currentUser?.id ||
        c.departmentId === currentUser?.departmentId ||
        c.departmentName.toLowerCase().includes('equipment') ||
        c.departmentName.toLowerCase().includes('maintenance')
    );
    setComplaints(staffTickets);
    setTasks(allTasks.filter((t) => t.assignedToId === currentUser?.id || !t.assignedToId));
    setNotifications(allNotifs.slice(0, 5));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('sc360_data_updated', handleUpdate);
    return () => window.removeEventListener('sc360_data_updated', handleUpdate);
  }, [currentUser]);

  // Status Metrics
  const newAssignments = complaints.filter(
    (c) => c.status === 'assigned' || c.status === 'acknowledged'
  );
  const inProgressTasks = complaints.filter((c) => c.status === 'in_progress');
  const completedTasks = complaints.filter(
    (c) => c.status === 'resolved' || c.status === 'closed'
  );
  const overdueTasks = complaints.filter((c) => {
    return c.status !== 'closed' && c.status !== 'resolved' && new Date() > new Date(c.deadline);
  });

  const handleUpdateStatusSubmit = async () => {
    if (!activeComplaintForAction || !currentUser) return;
    await DataService.updateComplaintStatus(
      activeComplaintForAction.id,
      newStatus,
      currentUser,
      resolutionText.trim() || `Technician status update to ${newStatus}`,
      proofImage || undefined
    );
    setActiveComplaintForAction(null);
    setActionType(null);
    setResolutionText('');
    setProofImage(null);
    loadData();
  };

  const handleAddNoteSubmit = async () => {
    if (!activeComplaintForAction || !currentUser || !workNoteText.trim()) return;
    await DataService.addComment(
      activeComplaintForAction.id,
      currentUser,
      workNoteText.trim(),
      true
    );
    setWorkNoteText('');
    setActiveComplaintForAction(null);
    setActionType(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Staff Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                <span>Maintenance Staff Portal</span>
              </span>
              <span className="font-mono text-xs text-amber-200">
                {currentUser?.departmentName || 'Equipment & Labs Maintenance'}
              </span>
              {currentUser?.rollOrEmpId && (
                <span className="font-mono text-xs text-white/70">ID: {currentUser.rollOrEmpId}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUser?.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
              Inspect assigned repair tickets, log technical progress notes, upload camera proof of completed work, and execute scheduled PM routines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

      {/* Staff Metrics Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
            New Assignments
          </p>
          <p className="text-2xl font-black text-amber-500 mt-1">{newAssignments.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Pending technician action</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
            In-Progress Tasks
          </p>
          <p className="text-2xl font-black text-blue-500 mt-1">{inProgressTasks.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Work underway on site</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
            Completed Tasks
          </p>
          <p className="text-2xl font-black text-emerald-500 mt-1">{completedTasks.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Resolution proof submitted</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
            Overdue Tasks
          </p>
          <p className="text-2xl font-black text-rose-500 mt-1">{overdueTasks.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">SLA deadline breached</p>
        </div>
      </div>

      {/* Main Staff Work Orders List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-amber-500" />
              <span>Assigned Work Orders ({complaints.length})</span>
            </span>
            <button
              onClick={() => onNavigate('complaint-directory')}
              className="text-xs font-semibold text-amber-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </h2>

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
                      <span className="font-mono text-[11px] font-bold text-amber-500">
                        {c.complaintCode}
                      </span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {c.campusBuilding} • Room {c.roomNumber} • Reporter:{' '}
                      <strong>{c.reporterName}</strong>
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                    <SlaCountdown deadline={c.deadline} status={c.status} />
                    <span className="text-[10px] text-slate-400">
                      Target: {new Date(c.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Technician Quick Actions Strip */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveComplaintForAction(c);
                      setActionType('status');
                      setNewStatus(c.status === 'assigned' ? 'in_progress' : 'resolved');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Update Status</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveComplaintForAction(c);
                      setActionType('notes');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Add Work Notes</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveComplaintForAction(c);
                      setActionType('proof');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload Proof & Complete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Preventive Maintenance & Notifications */}
        <div className="space-y-6">
          {/* Assigned Maintenance Tasks */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-amber-500" />
                <span>Preventive Maintenance</span>
              </span>
              <button
                onClick={() => onNavigate('maintenance-planner')}
                className="text-[11px] text-amber-500 hover:underline"
              >
                View Calendar
              </button>
            </h3>

            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No PM routines pending today</p>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{t.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase">
                        {t.recurrence.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.departmentName} {t.assetName ? `• Asset: ${t.assetName}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Assignment Alerts</span>
            </h3>

            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No unread alerts</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-0.5"
                  >
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Update Status / Work Notes / Proof of Work */}
      {actionType && activeComplaintForAction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>
                  {actionType === 'status' && 'Update Task Status'}
                  {actionType === 'notes' && 'Add Technician Work Note'}
                  {actionType === 'proof' && 'Upload Proof & Resolve'}
                </span>
              </h3>
              <button
                onClick={() => {
                  setActionType(null);
                  setActiveComplaintForAction(null);
                }}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Complaint:{' '}
              <strong className="text-white">{activeComplaintForAction.title}</strong> (
              <code className="text-amber-400 font-mono text-xs">{activeComplaintForAction.complaintCode}</code>)
            </p>

            {actionType === 'status' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select New Status:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                >
                  <option value="in_progress">In Progress (Work Ongoing)</option>
                  <option value="on_hold">On Hold (Awaiting Parts/Approval)</option>
                  <option value="resolved">Resolved (Work Completed)</option>
                </select>
                <button
                  onClick={handleUpdateStatusSubmit}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Confirm Status Change
                </button>
              </div>
            )}

            {actionType === 'notes' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Internal Technical Notes:
                </label>
                <textarea
                  rows={4}
                  value={workNoteText}
                  onChange={(e) => setWorkNoteText(e.target.value)}
                  placeholder="e.g. Inspected faulty capacitor; replaced fuse unit on board..."
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500"
                />
                <button
                  onClick={handleAddNoteSubmit}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
                >
                  Save Work Note
                </button>
              </div>
            )}

            {actionType === 'proof' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Resolution Summary:
                </label>
                <textarea
                  rows={3}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Describe repair actions taken..."
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500"
                />

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Proof Photo of Completed Work:
                  </label>
                  {proofImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/50">
                      <img src={proofImage} alt="Repair proof" className="w-full h-32 object-cover" />
                      <button
                        onClick={() => setProofImage(null)}
                        className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-[10px]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="w-full py-3 rounded-xl border border-dashed border-slate-700 hover:border-amber-400 text-slate-300 text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>Take Photo with Device Camera</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setNewStatus('resolved');
                    handleUpdateStatusSubmit();
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                >
                  Submit Proof & Mark Resolved
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(photoUri) => {
          setProofImage(photoUri);
          setIsCameraOpen(false);
        }}
      />
    </div>
  );
};
