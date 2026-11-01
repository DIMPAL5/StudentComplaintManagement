import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { MaintenanceTask, Asset, Department } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  CalendarCheck,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { INITIAL_PROFILES } from '../data/seedData';

export const MaintenancePlannerPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [filterTab, setFilterTab] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'overdue'>('all');

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState<Partial<MaintenanceTask>>({
    title: '',
    assetId: '',
    departmentId: '',
    assignedToId: 'user-staff',
    dueDate: new Date(Date.now() + 7 * 86400 * 1000).toISOString().slice(0, 10),
    recurrence: 'monthly',
    notes: '',
  });

  const loadData = async () => {
    const [tList, aList, dList] = await Promise.all([
      DataService.getMaintenanceTasks(),
      DataService.getAssets(),
      DataService.getDepartments(),
    ]);
    setTasks(tList);
    setAssets(aList);
    setDepartments(dList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (filterTab === 'all') return true;
    return t.status === filterTab;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTask.title) return;

    try {
      const linkedAsset = assets.find((a) => a.id === newTask.assetId);
      const dept = departments.find((d) => d.id === newTask.departmentId) || departments[0];
      const staff = INITIAL_PROFILES.find((p) => p.id === newTask.assignedToId);

      const created: MaintenanceTask = {
        id: `task-${Date.now()}`,
        title: newTask.title,
        assetId: linkedAsset?.id,
        assetName: linkedAsset?.name,
        departmentId: dept.id,
        departmentName: dept.name,
        assignedToId: staff?.id,
        assignedToName: staff?.fullName,
        dueDate: new Date(newTask.dueDate || Date.now()).toISOString(),
        recurrence: (newTask.recurrence as any) || 'monthly',
        status: 'scheduled',
        notes: newTask.notes || '',
        createdAt: new Date().toISOString(),
      };

      await DataService.saveMaintenanceTask(created, currentUser);
      showToast('success', 'Preventive Task Scheduled', created.title);
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Failed to schedule task', err.message);
    }
  };

  const handleUpdateTaskStatus = async (task: MaintenanceTask, newStatus: any) => {
    if (!currentUser) return;
    try {
      const completionNotes =
        newStatus === 'completed' ? window.prompt('Enter work completion summary:') || 'Routine maintenance completed.' : '';

      const updated = {
        ...task,
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
        completionNotes: completionNotes || task.completionNotes,
      };

      await DataService.saveMaintenanceTask(updated, currentUser);
      showToast('success', `Task updated to ${newStatus}`);
      loadData();
    } catch (err: any) {
      showToast('error', 'Update failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-600" />
            Preventive Maintenance Planner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Schedule recurring inspections, calibration routines, and filter replacements.
          </p>
        </div>

        <button
          onClick={() => {
            setNewTask({
              title: '',
              assetId: assets[0]?.id || '',
              departmentId: departments[0]?.id || '',
              assignedToId: 'user-staff',
              dueDate: new Date(Date.now() + 7 * 86400 * 1000).toISOString().slice(0, 10),
              recurrence: 'monthly',
              notes: '',
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Schedule Task</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {(['all', 'scheduled', 'in_progress', 'completed', 'overdue'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
              filterTab === tab
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No maintenance tasks found in this view.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                      t.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                        : t.status === 'overdue'
                        ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                        : t.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    {t.recurrence}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target Asset: <strong className="text-slate-800 dark:text-slate-200">{t.assetName || 'General Facility Routine'}</strong> • Assigned: {t.assignedToName || 'Unassigned'}
                </p>
                {t.notes && <p className="text-xs text-slate-600 dark:text-slate-400 italic">Notes: {t.notes}</p>}
                {t.completionNotes && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Completed: {t.completionNotes}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Due Date</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(t.dueDate).toLocaleDateString()}
                  </span>
                </div>

                {t.status !== 'completed' && (
                  <div className="flex items-center gap-1.5">
                    {t.status === 'scheduled' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(t, 'in_progress')}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                      >
                        Start Task
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateTaskStatus(t, 'completed')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Complete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* SCHEDULE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Maintenance Routine</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g., Quarterly Air Filter Replacement & Cleaning"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Campus Asset
                </label>
                <select
                  value={newTask.assetId}
                  onChange={(e) => setNewTask({ ...newTask, assetId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">General Facility Task</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.assetCode}] {a.name} ({a.building})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Recurrence
                  </label>
                  <select
                    value={newTask.recurrence}
                    onChange={(e) => setNewTask({ ...newTask, recurrence: e.target.value as any })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="one_time">One-Time</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    required
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Responsible Staff Member
                </label>
                <select
                  value={newTask.assignedToId}
                  onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {INITIAL_PROFILES.filter((p) => p.role === 'staff').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.rollOrEmpId || 'Tech'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Checklist / Procedures Notes
                </label>
                <textarea
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  rows={2}
                  placeholder="Specific inspection guidelines..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow"
                >
                  Schedule Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
