import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DataService } from '../../services/dataService';
import { Complaint, ComplaintComment, StatusHistory, Feedback, ComplaintStatus, Priority, UserProfile } from '../../types';
import { PriorityBadge, StatusBadge } from '../common/Badges';
import { SlaCountdown } from '../common/SlaCountdown';
import confetti from 'canvas-confetti';
import {
  X,
  Clock,
  MapPin,
  Building,
  User,
  ShieldAlert,
  Send,
  Lock,
  MessageSquare,
  History,
  Star,
  CheckCircle,
  RotateCcw,
  Wrench,
  UserCheck,
  AlertTriangle,
  Upload,
  ChevronRight,
  ExternalLink,
  Camera,
} from 'lucide-react';
import { CameraModal } from '../common/CameraModal';
import { INITIAL_PROFILES } from '../../data/seedData';

interface ComplaintDetailsModalProps {
  complaintId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({
  complaintId,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { currentUser, role } = useAuth();
  const { showToast } = useToast();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<ComplaintComment[]>([]);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'comments' | 'history' | 'feedback'>('comments');

  // New Comment state
  const [newComment, setNewComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Action Modals State
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionProof, setResolutionProof] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('user-staff');

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [aspects, setAspects] = useState({ speed: 5, quality: 5, communication: 5 });

  const loadData = async () => {
    if (!complaintId) return;
    const [c, comms, hist, fbs] = await Promise.all([
      DataService.getComplaintById(complaintId),
      DataService.getComments(complaintId),
      DataService.getStatusHistory(complaintId),
      DataService.getFeedback(),
    ]);

    setComplaint(c || null);
    setComments(comms);
    setHistory(hist);
    const fb = fbs.find((f) => f.complaintId === complaintId);
    setFeedback(fb || null);
  };

  useEffect(() => {
    if (isOpen && complaintId) {
      loadData();
    }
  }, [isOpen, complaintId]);

  if (!isOpen || !complaint) return null;

  const isStaffOrAdmin = role === 'staff' || role === 'department_head' || role === 'admin';
  const isReporter = currentUser?.id === complaint.reporterId;

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    try {
      setIsSubmittingComment(true);
      await DataService.addComment(complaint.id, currentUser, newComment.trim(), isInternalNote);
      setNewComment('');
      setIsInternalNote(false);
      await loadData();
      showToast('success', 'Comment posted');
    } catch (err: any) {
      showToast('error', 'Failed to post comment', err.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Status transitions
  const handleTransition = async (newStatus: ComplaintStatus, notes?: string, proof?: string) => {
    if (!currentUser) return;
    try {
      await DataService.updateComplaintStatus(complaint.id, newStatus, currentUser, notes, proof);
      showToast('success', `Status updated to ${newStatus.toUpperCase()}`);
      await loadData();
      onUpdated();
    } catch (err: any) {
      showToast('error', 'Status Update Failed', err.message);
    }
  };

  // Submit Resolution
  const handleConfirmResolve = async () => {
    if (!resolutionNotes.trim()) {
      showToast('warning', 'Notes required', 'Please describe the repair work performed.');
      return;
    }
    await handleTransition('resolved', resolutionNotes, resolutionProof || undefined);
    setShowResolveModal(false);
  };

  // Assign staff
  const handleConfirmAssign = async () => {
    if (!currentUser) return;
    try {
      await DataService.assignComplaint(complaint.id, selectedStaffId, currentUser);
      showToast('success', 'Technician assigned successfully');
      setShowAssignModal(false);
      await loadData();
      onUpdated();
    } catch (err: any) {
      showToast('error', 'Assignment failed', err.message);
    }
  };

  // Confirm resolution & Rating
  const handleConfirmRating = async () => {
    if (!currentUser) return;
    try {
      await DataService.submitFeedback(complaint.id, currentUser, rating, feedbackText, aspects);
      await DataService.updateComplaintStatus(complaint.id, 'closed', currentUser, 'Resolution confirmed by reporter with feedback.');
      
      // Celebrate with confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast('success', 'Thank you for your rating!', 'Complaint closed with your feedback.');
      setShowRatingModal(false);
      await loadData();
      onUpdated();
    } catch (err: any) {
      showToast('error', 'Feedback submission failed', err.message);
    }
  };

  // Reopen
  const handleReopen = async () => {
    const reason = window.prompt('Please describe why this issue is not fully resolved:');
    if (!reason) return;
    await handleTransition('reopened', `Reopened by reporter: ${reason}`);
  };

  const workflowSteps: ComplaintStatus[] = [
    'submitted',
    'acknowledged',
    'assigned',
    'in_progress',
    'resolved',
    'closed',
  ];

  const currentStepIdx = workflowSteps.indexOf(complaint.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                {complaint.complaintCode}
              </span>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
              <SlaCountdown deadline={complaint.deadline} status={complaint.status} />
              {complaint.isSafetyHazard && (
                <span className="inline-flex items-center text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded border border-rose-200">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Safety Hazard
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {complaint.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Timeline Bar */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px]">
            {workflowSteps.map((step, idx) => {
              const isPast = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;
              return (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-xs capitalize font-medium ${
                      isCurrent
                        ? 'text-blue-700 dark:text-blue-300 font-bold'
                        : isPast
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.replace('_', ' ')}
                  </span>
                  {idx < workflowSteps.length - 1 && (
                    <div
                      className={`h-0.5 w-6 sm:w-10 ${
                        isPast ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="px-6 py-2.5 bg-blue-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Available Actions:</span>

            {/* Staff Actions */}
            {isStaffOrAdmin && (
              <>
                {complaint.status === 'submitted' && (
                  <button
                    onClick={() => handleTransition('acknowledged')}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Acknowledge
                  </button>
                )}

                {(complaint.status === 'acknowledged' || complaint.status === 'assigned') && (
                  <button
                    onClick={() => handleTransition('in_progress')}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Wrench className="w-3.5 h-3.5" /> Start Work (In Progress)
                  </button>
                )}

                {complaint.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => handleTransition('on_hold', 'Parts on order / awaiting vendor access')}
                      className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-colors"
                    >
                      Put On Hold
                    </button>
                    <button
                      onClick={() => setShowResolveModal(true)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Complete & Mark Resolved
                    </button>
                  </>
                )}
              </>
            )}

            {/* Admin / HOD Assignment */}
            {(role === 'admin' || role === 'department_head') && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                {complaint.assignedToName ? 'Reassign Staff' : 'Assign Staff'}
              </button>
            )}

            {/* Student Resolution Confirmation & Rating */}
            {complaint.status === 'resolved' && (
              <>
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow transition-all flex items-center gap-1.5 animate-pulse"
                >
                  <Star className="w-3.5 h-3.5 fill-white" /> Confirm Resolution & Rate
                </button>
                <button
                  onClick={handleReopen}
                  className="px-3 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-200 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reopen Issue
                </button>
              </>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Assigned to: <strong className="text-slate-800 dark:text-slate-200">{complaint.assignedToName || 'Unassigned'}</strong>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase text-slate-400">Department</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {complaint.departmentName}
              </p>
              <span className="text-xs text-slate-500">Category: {complaint.categoryName}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase text-slate-400">Location</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                {complaint.campusBuilding} ({complaint.roomNumber})
              </p>
              <span className="text-xs text-slate-500">
                {complaint.floor} • {complaint.block}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase text-slate-400">Reporter</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {complaint.isAnonymous ? 'Anonymous Member' : complaint.reporterName}
              </p>
              <span className="text-xs text-slate-500">
                Logged on {new Date(complaint.createdAt).toLocaleDateString()} at{' '}
                {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Issue Description
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </div>
          </div>

          {/* Attachments / Resolution Proof Images */}
          {(complaint.imageUrl || complaint.resolutionProofUrl) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {complaint.imageUrl && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500">Initial Complaint Photo</span>
                  <img
                    src={complaint.imageUrl}
                    alt="Complaint Proof"
                    className="w-full h-44 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                </div>
              )}
              {complaint.resolutionProofUrl && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-600">Work Resolution Proof</span>
                  <img
                    src={complaint.resolutionProofUrl}
                    alt="Resolution Proof"
                    className="w-full h-44 object-cover rounded-xl border-2 border-emerald-500 shadow-sm"
                  />
                  {complaint.resolutionNotes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                      Notes: {complaint.resolutionNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tabs: Comments, History, Feedback */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'comments'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Discussion ({comments.length})
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`pb-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-4 h-4" /> Audit History ({history.length})
              </button>

              {feedback && (
                <button
                  onClick={() => setActiveTab('feedback')}
                  className={`pb-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'feedback'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Reporter Feedback
                </button>
              )}
            </div>

            {/* TAB: COMMENTS */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No comments posted yet.</p>
                  ) : (
                    comments.map((comm) => {
                      if (comm.isInternal && !isStaffOrAdmin) return null; // Hide internal from students
                      return (
                        <div
                          key={comm.id}
                          className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                            comm.isInternal
                              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">{comm.userName}</span>
                              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {comm.userRole.replace('_', ' ')}
                              </span>
                              {comm.isInternal && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                                  <Lock className="w-3 h-3" /> Internal Staff Note
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(comm.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">{comm.comment}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Post Comment Input */}
                <form onSubmit={handleAddComment} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add an update or public question..."
                      className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Post
                    </button>
                  </div>

                  {/* Staff Internal Note Checkbox */}
                  {isStaffOrAdmin && (
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded text-amber-600"
                      />
                      <span>Make this an Internal Staff Note (Concealed from students)</span>
                    </label>
                  )}
                </form>
              </div>
            )}

            {/* TAB: STATUS HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={h.id} className="flex items-start gap-3 text-xs">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      {i < history.length - 1 && <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-700" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {h.oldStatus} → <span className="text-blue-600 capitalize">{h.newStatus}</span>
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(h.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        By {h.changedByName}: {h.reasonOrNotes}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: FEEDBACK */}
            {activeTab === 'feedback' && feedback && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${s <= feedback.rating ? 'fill-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {feedback.rating} out of 5 Stars
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{feedback.comments}"</p>
                <div className="text-[10px] text-slate-400">
                  Submitted by {feedback.userName} on {new Date(feedback.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL: COMPLETE RESOLUTION */}
        {showResolveModal && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in zoom-in-95">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Resolution & Proof</h3>
              <p className="text-xs text-slate-500">
                Explain the action taken to fix this incident. This information is shared with the reporter.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Replaced optical lamp, cleaned cooling exhaust, verified 1080p output..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Photo Proof (Choose file or Live Camera)
                </label>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Choose file</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setResolutionProof(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-semibold text-teal-700 dark:text-teal-300"
                  >
                    <Camera className="w-3.5 h-3.5 text-teal-600" />
                    <span>Take Camera Photo</span>
                  </button>
                </div>

                {resolutionProof && (
                  <div className="flex items-center gap-2 mt-1">
                    <img
                      src={resolutionProof}
                      alt="Proof"
                      className="w-12 h-12 rounded-lg object-cover ring-2 ring-emerald-500 shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setResolutionProof(null)}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Remove photo
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmResolve}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Camera for Resolution */}
        <CameraModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(dataUrl) => setResolutionProof(dataUrl)}
          title="Capture Proof of Repair"
        />

        {/* MODAL: ASSIGN STAFF */}
        {showAssignModal && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in zoom-in-95">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign Technician</h3>
              <p className="text-xs text-slate-500">
                Select a qualified staff member from the department pool.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Member
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {INITIAL_PROFILES.filter((p) => p.role === 'staff').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.rollOrEmpId || 'Tech'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAssign}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: RATING & SATISFACTION */}
        {showRatingModal && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in zoom-in-95">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rate Resolution Quality</h3>
                <p className="text-xs text-slate-500">
                  How satisfied are you with the resolution of {complaint.complaintCode}?
                </p>
              </div>

              {/* Star Picker */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        starVal <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Comments */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Comments & Feedback
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={2}
                  placeholder="Share details on promptness, technician behavior, repair quality..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRating}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow hover:from-emerald-700"
                >
                  Submit Feedback & Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
