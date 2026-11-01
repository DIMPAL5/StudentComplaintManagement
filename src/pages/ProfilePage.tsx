import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DataService } from '../services/dataService';
import { Complaint } from '../types';
import { CameraModal } from '../components/common/CameraModal';
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  RotateCcw,
  Save,
  Camera,
  Trash2,
  LogOut,
  AlertTriangle,
  Building,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';

interface ProfilePageProps {
  onSignOut?: () => void;
  onAccountDeleted?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onSignOut, onAccountDeleted }) => {
  const { currentUser, role, isDemoMode, updateProfile, deleteAccount, logout } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [rollOrEmpId, setRollOrEmpId] = useState(currentUser?.rollOrEmpId || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Camera Modal
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Delete Account Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // User Stats
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    if (currentUser) {
      DataService.getComplaints().then((list) => {
        setMyComplaints(list.filter((c) => c.reporterId === currentUser.id));
      });
    }
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        bio: bio.trim() || undefined,
        rollOrEmpId: rollOrEmpId.trim() || undefined,
      });
      showToast('success', 'Profile Updated', 'Your profile details have been saved.');
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('warning', 'Password too short', 'Password must be at least 6 characters.');
      return;
    }

    try {
      await updateProfile({ password: newPassword });
      showToast('success', 'Password Updated', 'Your account credentials have been updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      showToast('error', 'Failed to update password', err.message);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== 'delete') {
      showToast('warning', 'Confirmation required', 'Please type DELETE in capital letters to confirm.');
      return;
    }

    try {
      setIsDeleting(true);
      const res = await deleteAccount();
      if (res.success) {
        showToast('info', 'Account Deleted', 'Your profile and credentials have been permanently deleted.');
        setShowDeleteModal(false);
        if (onAccountDeleted) onAccountDeleted();
        else window.location.reload();
      } else {
        showToast('error', 'Deletion Failed', res.error || 'Could not delete account.');
      }
    } catch (err: any) {
      showToast('error', 'Deletion Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo complaints, comments, assets, and tasks back to initial seed data?')) {
      DataService.resetDemoData();
      showToast('success', 'Demo data reset!', 'Database restored to initial state.');
      setTimeout(() => window.location.reload(), 600);
    }
  };

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
      showToast('info', 'Signed out', 'You have been logged out.');
      if (onSignOut) onSignOut();
      else window.location.reload();
    }
  };

  const resolvedCount = myComplaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const inProgressCount = myComplaints.filter((c) => c.status === 'in_progress' || c.status === 'assigned').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          My Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal identity, campus credentials, camera photos, and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: User Card & Quick Actions */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="relative inline-block group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-28 h-28 rounded-3xl object-cover ring-4 ring-slate-100 dark:ring-slate-800 mx-auto shadow-md"
              />
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-extrabold text-3xl mx-auto shadow-md">
                {fullName.charAt(0) || 'U'}
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="absolute -bottom-2 -right-2 p-2 rounded-2xl bg-teal-600 text-white shadow-lg hover:bg-teal-700 transition-colors"
              title="Snap avatar photo with camera"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{fullName}</h2>
            <p className="text-xs text-slate-400">{currentUser?.email}</p>
            <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold capitalize bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              {role.replace('_', ' ')}
            </span>
          </div>

          {bio && <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{bio}"</p>}

          {/* Activity Statistics */}
          <div className="grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">{myComplaints.length}</span>
              <span className="text-[10px] text-slate-400">Total</span>
            </div>
            <div>
              <span className="text-xs font-bold text-amber-500 block">{inProgressCount}</span>
              <span className="text-[10px] text-slate-400">Active</span>
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-600 block">{resolvedCount}</span>
              <span className="text-[10px] text-slate-400">Resolved</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1 text-left">
            <p>Roll / Emp ID: <strong className="text-slate-800 dark:text-slate-200">{currentUser?.rollOrEmpId || 'N/A'}</strong></p>
            <p>Department: <strong className="text-slate-800 dark:text-slate-200">{currentUser?.departmentName || 'Apex General Campus'}</strong></p>
            <p>Mode: <strong className="text-teal-600 font-semibold">{isDemoMode ? 'Local Demo Mode' : 'Supabase Live'}</strong></p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="w-full py-2 px-3 rounded-xl border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 text-xs font-semibold hover:bg-teal-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Capture Live Selfie Avatar</span>
            </button>

            <button
              onClick={handleResetData}
              className="w-full py-2 px-3 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Demo Seed Data
            </button>

            <button
              onClick={handleSignOut}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Right Column: Profile Edit & Danger Zone */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Info Form */}
          <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Profile Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Roll / Employee ID</label>
                <input
                  type="text"
                  value={rollOrEmpId}
                  onChange={(e) => setRollOrEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Avatar Image URL (or use Camera)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bio / Specialization Notes
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="e.g. 4th Year Computer Science Student, Section B"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-400" /> Account Security & Password
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                Update Password
              </button>
            </div>
          </form>

          {/* DANGER ZONE: DELETE ACCOUNT */}
          <div className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/60 space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold">Danger Zone: Delete Account</h3>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              Permanently delete your profile, credentials, and associated user session. Past filed complaints will be retained for institutional facilities auditing but will no longer be linked to your personal login.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account Permanently</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Camera Modal for Avatar */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          setAvatarUrl(dataUrl);
          updateProfile({ avatarUrl: dataUrl });
          showToast('success', 'Avatar Captured!', 'New selfie profile picture applied.');
        }}
        title="Snap Profile Selfie"
      />

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-rose-600">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold">Confirm Account Deletion</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you absolutely sure you want to delete your account <strong>({currentUser?.email})</strong>? This action cannot be undone.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Type <span className="font-mono text-rose-600 uppercase font-black">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none text-xs font-mono font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                onClick={handleConfirmDeleteAccount}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-40 transition-colors shadow-md shadow-rose-600/20"
              >
                {isDeleting ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
