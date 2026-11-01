import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Department, UserProfile, SystemSettings, ComplaintCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Building,
  Settings,
  PlusCircle,
  CheckCircle,
  Save,
  RotateCcw,
  Shield,
  X,
} from 'lucide-react';
import { INITIAL_PROFILES } from '../data/seedData';

export const AdminManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_PROFILES);

  const [activeTab, setActiveTab] = useState<'departments' | 'users' | 'settings'>('departments');

  // Add Dept Modal
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState<Partial<Department>>({
    name: '',
    code: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    active: true,
  });

  const loadData = async () => {
    const [dList, setts] = await Promise.all([
      DataService.getDepartments(),
      DataService.getSettings(),
    ]);
    setDepartments(dList);
    setSettings(setts);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !currentUser) return;
    try {
      await DataService.updateSettings(settings, currentUser);
      showToast('success', 'System Settings Updated', 'SLA thresholds and global policies saved.');
    } catch (err: any) {
      showToast('error', 'Failed to update settings', err.message);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code || !currentUser) return;

    try {
      const dept: Department = {
        id: `dept-${Date.now()}`,
        name: deptForm.name,
        code: deptForm.code.toUpperCase(),
        description: deptForm.description || '',
        contactEmail: deptForm.contactEmail || 'dept@campus.edu',
        contactPhone: deptForm.contactPhone || '+1 (555) 000-0000',
        active: true,
        createdAt: new Date().toISOString(),
      };

      await DataService.saveDepartment(dept, currentUser);
      showToast('success', 'Department Created', dept.name);
      setShowDeptModal(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Error creating department', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Campus Administration & Governance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure departments, staff roles, and Service Level Agreement (SLA) response windows.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'departments'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4" /> Departments ({departments.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> User Directory ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" /> SLA Policies & Settings
        </button>
      </div>

      {/* TAB: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setDeptForm({ name: '', code: '', description: '', contactEmail: '', contactPhone: '', active: true });
                setShowDeptModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow"
            >
              <PlusCircle className="w-4 h-4" /> Add Department
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d) => (
              <div
                key={d.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                      {d.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {d.name}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Active
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{d.description}</p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-0.5">
                  <p>HOD: <strong className="text-slate-800 dark:text-slate-200">{d.headName || 'Pending Assignment'}</strong></p>
                  <p>Email: {d.contactEmail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => (
              <div key={u.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.fullName} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {u.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{u.fullName}</h3>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                    {u.rollOrEmpId || 'ID-TBD'}
                  </span>
                  <span className="capitalize text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    {u.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SLA & SETTINGS */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Service Level Agreement (SLA) Targets</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Maximum allowable duration before tickets are automatically flagged as overdue and escalated.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 space-y-1">
              <label className="font-bold text-rose-900 dark:text-rose-200 block">Critical Priority SLA</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={settings.slaCriticalHours}
                  onChange={(e) => setSettings({ ...settings, slaCriticalHours: parseInt(e.target.value) || 2 })}
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
                <span className="text-slate-500">hours</span>
              </div>
              <span className="text-[10px] text-slate-400">Immediate hazard response</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 space-y-1">
              <label className="font-bold text-amber-900 dark:text-amber-200 block">High Priority SLA</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={settings.slaHighHours}
                  onChange={(e) => setSettings({ ...settings, slaHighHours: parseInt(e.target.value) || 8 })}
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
                <span className="text-slate-500">hours</span>
              </div>
              <span className="text-[10px] text-slate-400">Lab & classroom apparatus</span>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-1">
              <label className="font-bold text-blue-900 dark:text-blue-200 block">Medium Priority SLA</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="4"
                  max="120"
                  value={settings.slaMediumHours}
                  onChange={(e) => setSettings({ ...settings, slaMediumHours: parseInt(e.target.value) || 24 })}
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
                <span className="text-slate-500">hours</span>
              </div>
              <span className="text-[10px] text-slate-400">Standard campus plumbing/Wi-Fi</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
              <label className="font-bold text-slate-800 dark:text-slate-200 block">Low Priority SLA</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="12"
                  max="240"
                  value={settings.slaLowHours}
                  onChange={(e) => setSettings({ ...settings, slaLowHours: parseInt(e.target.value) || 72 })}
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
                <span className="text-slate-500">hours</span>
              </div>
              <span className="text-[10px] text-slate-400">Furniture, routine litter</span>
            </div>
          </div>

          {/* Institutional Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Campus Institute Name</label>
              <input
                type="text"
                value={settings.campusName}
                onChange={(e) => setSettings({ ...settings, campusName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Emergency Help Hotline</label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Facilities Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow transition-colors"
            >
              <Save className="w-4 h-4" /> Save System Policies
            </button>
          </div>
        </form>
      )}

      {/* CREATE DEPT MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Campus Department</h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department Name</label>
                <input
                  type="text"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Audiovisual & Classroom Tech"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department Code</label>
                <input
                  type="text"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  placeholder="e.g. AVTECH"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={deptForm.contactEmail}
                  onChange={(e) => setDeptForm({ ...deptForm, contactEmail: e.target.value })}
                  placeholder="dept@campus.edu"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
