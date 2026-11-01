import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { Complaint, Notification } from '../../types';
import { PriorityBadge, StatusBadge } from '../../components/common/Badges';
import { SlaCountdown } from '../../components/common/SlaCountdown';
import {
  Briefcase,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Star,
  Bell,
  User,
  LogOut,
  Laptop,
  Flame,
  FileText,
  Building,
} from 'lucide-react';

interface ProfessorDashboardProps {
  onOpenCreate: () => void;
  onSelectComplaint: (id: string) => void;
  onNavigate: (page: string) => void;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({
  onOpenCreate,
  onSelectComplaint,
  onNavigate,
}) => {
  const { currentUser, logout } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedRating, setSelectedRating] = useState<{ [id: string]: number }>({});
  const [ratingSubmitted, setRatingSubmitted] = useState<{ [id: string]: boolean }>({});

  const loadData = async () => {
    const [allComplaints, allNotifs] = await Promise.all([
      DataService.getComplaints(),
      DataService.getNotifications(currentUser?.id),
    ]);
    // Professors only see tickets they submitted
    const facultyTickets = allComplaints.filter(
      (c) =>
        c.reporterId === currentUser?.id ||
        c.reporterEmail.toLowerCase() === currentUser?.email.toLowerCase() ||
        c.reporterRole === 'professor' ||
        c.reporterRole === 'faculty'
    );
    setComplaints(facultyTickets);
    setNotifications(allNotifs.slice(0, 5));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('sc360_data_updated', handleUpdate);
    return () => window.removeEventListener('sc360_data_updated', handleUpdate);
  }, [currentUser]);

  const totalReported = complaints.length;
  const pendingCount = complaints.filter(
    (c) => c.status === 'submitted' || c.status === 'acknowledged'
  ).length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'assigned' || c.status === 'in_progress'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === 'resolved' || c.status === 'closed'
  ).length;

  const handleRate = async (complaintId: string, rating: number) => {
    if (!currentUser) return;
    setSelectedRating((prev) => ({ ...prev, [complaintId]: rating }));
    await DataService.submitFeedback(
      complaintId,
      currentUser,
      rating,
      'Faculty verified and rated resolution quality'
    );
    setRatingSubmitted((prev) => ({ ...prev, [complaintId]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Professor Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-blue-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Professor Portal</span>
              </span>
              <span className="font-mono text-xs text-white/70">
                {currentUser?.departmentName || 'Computer Science & Engineering'}
              </span>
              {currentUser?.rollOrEmpId && (
                <span className="font-mono text-xs text-indigo-200">ID: {currentUser.rollOrEmpId}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUser?.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-xl">
              Report classroom projector faults, laboratory apparatus damage, and academic facility issues with prioritized turnaround.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Report Facility Issue</span>
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

      {/* Professor Status Summaries */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total Reported
          </p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{totalReported}</p>
          <p className="text-[10px] text-slate-400 mt-1">Classroom & lab issues</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
            Under Review
          </p>
          <p className="text-2xl font-black text-amber-500 mt-1">{pendingCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">SLA tracking active</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
            In Progress
          </p>
          <p className="text-2xl font-black text-blue-500 mt-1">{inProgressCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Assigned technicians</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
            Resolved
          </p>
          <p className="text-2xl font-black text-emerald-500 mt-1">{resolvedCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Verified work orders</p>
        </div>
      </div>

      {/* Classroom, Lab, and Dept Reporting Shortcuts */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Laptop className="w-4 h-4 text-indigo-500" />
          <span>Quick Classroom & Department Reporting</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={onOpenCreate}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 text-left transition-all group"
          >
            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              Classroom Projector / AV
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              HDMI audio, Smart TV, projector lamp fault
            </p>
          </button>
          <button
            onClick={onOpenCreate}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 text-left transition-all group"
          >
            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              Laboratory Apparatus
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Oscilloscopes, fume hoods, network switches
            </p>
          </button>
          <button
            onClick={onOpenCreate}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 text-left transition-all group"
          >
            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              Department Facilities
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Faculty cabin AC, electrical fixtures, WiFi
            </p>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Reported Incidents ({complaints.length})</span>
            </h2>
            <button
              onClick={() => onNavigate('complaint-directory')}
              className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {complaints.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                No Faculty Complaints Logged
              </p>
              <button
                onClick={onOpenCreate}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
              >
                Log Classroom Incident
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectComplaint(c.id)}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-400/50 shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {c.complaintCode}
                        </span>
                        <StatusBadge status={c.status} />
                        <PriorityBadge priority={c.priority} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {c.campusBuilding} • Room {c.roomNumber} • Assigned to:{' '}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {c.assignedToName || 'Awaiting Dispatch'}
                        </strong>
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                      <SlaCountdown deadline={c.deadline} status={c.status} />
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Action */}
                  {c.status === 'resolved' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Verify Resolution:
                      </span>
                      {ratingSubmitted[c.id] ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolution Verified
                        </span>
                      ) : (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRate(c.id, star)}
                              className="text-slate-300 hover:text-amber-400 transition-colors p-0.5"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  (selectedRating[c.id] || 0) >= star
                                    ? 'text-amber-400 fill-amber-400'
                                    : ''
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Notifications */}
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              <span>Status Notifications</span>
            </h3>

            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No unread notifications</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-0.5"
                  >
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{n.message}</p>
                    <span className="text-[10px] text-slate-400 block pt-1">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
