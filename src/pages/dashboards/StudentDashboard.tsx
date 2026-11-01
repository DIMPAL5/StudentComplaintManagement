import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { Complaint, Notification } from '../../types';
import { PriorityBadge, StatusBadge } from '../../components/common/Badges';
import { SlaCountdown } from '../../components/common/SlaCountdown';
import {
  GraduationCap,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Star,
  Bell,
  User,
  LogOut,
  Sparkles,
  Eye,
  FileText,
  Calendar,
  Layers,
} from 'lucide-react';

interface StudentDashboardProps {
  onOpenCreate: () => void;
  onSelectComplaint: (id: string) => void;
  onNavigate: (page: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
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
    // Students only see their own complaints
    const studentTickets = allComplaints.filter(
      (c) => c.reporterId === currentUser?.id || c.reporterEmail.toLowerCase() === currentUser?.email.toLowerCase()
    );
    setComplaints(studentTickets);
    setNotifications(allNotifs.slice(0, 5));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('sc360_data_updated', handleUpdate);
    return () => window.removeEventListener('sc360_data_updated', handleUpdate);
  }, [currentUser]);

  // Statistics
  const totalSubmitted = complaints.length;
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
      'Student rated resolution satisfaction'
    );
    setRatingSubmitted((prev) => ({ ...prev, [complaintId]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student Portal</span>
              </span>
              {currentUser?.rollOrEmpId && (
                <span className="font-mono text-xs text-white/70">PRN: {currentUser.rollOrEmpId}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUser?.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
              Report campus infrastructure issues, track live technician resolution progress, and verify completed repairs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-teal-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Submit New Complaint</span>
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

      {/* Quick Summary Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total Submitted
          </p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{totalSubmitted}</p>
          <p className="text-[10px] text-slate-400 mt-1">Institutional tickets logged</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
            Pending Review
          </p>
          <p className="text-2xl font-black text-amber-500 mt-1">{pendingCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Awaiting dispatch</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
            In Progress
          </p>
          <p className="text-2xl font-black text-blue-500 mt-1">{inProgressCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Assigned to technician</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
            Resolved
          </p>
          <p className="text-2xl font-black text-emerald-500 mt-1">{resolvedCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Closed or verified</p>
        </div>
      </div>

      {/* Main Content Layout: Left = My Complaints, Right = Timeline & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): My Complaints List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>My Complaints ({complaints.length})</span>
            </h2>
            <button
              onClick={() => onNavigate('complaint-directory')}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {complaints.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  No Complaints Reported Yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Have an issue with campus WiFi, lab equipment, or hostel facilities? Click below to submit.
                </p>
              </div>
              <button
                onClick={onOpenCreate}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20"
              >
                Submit First Complaint
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectComplaint(c.id)}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400/50 dark:hover:border-teal-400/50 shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-teal-600 dark:text-teal-400">
                          {c.complaintCode}
                        </span>
                        <StatusBadge status={c.status} />
                        <PriorityBadge priority={c.priority} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {c.campusBuilding} • Room {c.roomNumber} • {c.departmentName}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                      <SlaCountdown deadline={c.deadline} status={c.status} />
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Complaint Status Timeline */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Lifecycle Progress
                    </p>
                    <div className="grid grid-cols-5 gap-1 text-center">
                      {[
                        { label: 'Submitted', done: true },
                        { label: 'Acknowledged', done: ['acknowledged', 'assigned', 'in_progress', 'resolved', 'closed'].includes(c.status) },
                        { label: 'Assigned', done: ['assigned', 'in_progress', 'resolved', 'closed'].includes(c.status) },
                        { label: 'In Progress', done: ['in_progress', 'resolved', 'closed'].includes(c.status) },
                        { label: 'Resolved', done: ['resolved', 'closed'].includes(c.status) },
                      ].map((step, idx) => (
                        <div key={idx} className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              step.done ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                          />
                          <span
                            className={`text-[9px] font-medium block truncate ${
                              step.done ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Action for Resolved Complaints */}
                  {c.status === 'resolved' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Rate Resolution Quality:
                      </span>
                      {ratingSubmitted[c.id] ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Rating Recorded!
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

        {/* Right Column: Notifications & Self Help */}
        <div className="space-y-6">
          {/* Recent In-App Notifications */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400" />
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

          {/* Quick FAQ / Diagnostic Help */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white shadow-md space-y-3">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Self-Help Knowledge Base</span>
            </div>
            <p className="text-xs text-blue-200">
              Check quick troubleshooting steps before lodging tickets for instant resolutions.
            </p>
            <button
              onClick={() => onNavigate('knowledge-base')}
              className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all text-center block cursor-pointer"
            >
              Open Campus FAQs & Guides
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
