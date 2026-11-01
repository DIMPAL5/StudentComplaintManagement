import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Asset, Department, CampusBuilding } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Package,
  PlusCircle,
  Search,
  Wrench,
  Calendar,
  Building,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';

export const AssetsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [buildings, setBuildings] = useState<CampusBuilding[]>([]);

  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    assetCode: '',
    name: '',
    category: 'Classroom Equipment',
    building: 'Engineering Block A',
    room: 'Room 101',
    condition: 'good',
  });

  const loadData = async () => {
    const [aList, dList, bList] = await Promise.all([
      DataService.getAssets(),
      DataService.getDepartments(),
      DataService.getBuildings(),
    ]);
    setAssets(aList);
    setDepartments(dList);
    setBuildings(bList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      !search ||
      a.assetCode.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.building.toLowerCase().includes(search.toLowerCase());
    const matchesCond = conditionFilter === 'all' || a.condition === conditionFilter;
    return matchesSearch && matchesCond;
  });

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newAsset.name || !newAsset.assetCode) return;

    try {
      const dept = departments[0];
      const assetToSave: Asset = {
        id: `ast-${Date.now()}`,
        assetCode: newAsset.assetCode,
        name: newAsset.name,
        category: newAsset.category || 'Classroom Equipment',
        building: newAsset.building || 'Engineering Block A',
        room: newAsset.room || 'Room 101',
        departmentId: dept.id,
        departmentName: dept.name,
        installationDate: new Date().toISOString().slice(0, 10),
        condition: (newAsset.condition as any) || 'good',
        nextMaintenanceDate: new Date(Date.now() + 30 * 86400 * 1000).toISOString().slice(0, 10),
        lastServicedDate: new Date().toISOString().slice(0, 10),
        complaintCount: 0,
      };

      await DataService.saveAsset(assetToSave, currentUser);
      showToast('success', 'Asset Registered', `${assetToSave.name} added to inventory.`);
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Failed to save asset', err.message);
    }
  };

  const conditionColors: Record<string, string> = {
    excellent: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
    good: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
    fair: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
    poor: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300',
    maintenance_required: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 animate-pulse',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-teal-600" />
            Campus Asset Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track condition, maintenance history, and linked complaints for high-value campus equipment.
          </p>
        </div>

        <button
          onClick={() => {
            setNewAsset({
              assetCode: `AST-EQ-${Math.floor(100 + Math.random() * 900)}`,
              name: '',
              category: 'Classroom Equipment',
              building: buildings[0]?.name || 'Engineering Block A',
              room: 'Room 201',
              condition: 'good',
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Asset</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by asset code, name, or building..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
          />
        </div>

        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
        >
          <option value="all">All Conditions</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
          <option value="maintenance_required">Maintenance Required</option>
        </select>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-blue-400 dark:hover:border-blue-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                  {asset.assetCode}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                  {asset.name}
                </h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  conditionColors[asset.condition] || conditionColors.good
                }`}
              >
                {asset.condition.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {asset.building} • {asset.room}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-slate-400" />
                <span>Responsible: {asset.departmentName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Next Service: {asset.nextMaintenanceDate}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Linked Tickets: <strong className="text-slate-700 dark:text-slate-200">{asset.complaintCount}</strong>
              </span>
              <span className="text-[11px] text-teal-600 font-semibold">
                Installed {asset.installationDate}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ADD ASSET MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Register Campus Asset</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Asset Code
                </label>
                <input
                  type="text"
                  value={newAsset.assetCode}
                  onChange={(e) => setNewAsset({ ...newAsset, assetCode: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  placeholder="e.g. Dell OptiPlex 7090 Tower"
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Building
                  </label>
                  <select
                    value={newAsset.building}
                    onChange={(e) => setNewAsset({ ...newAsset, building: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    value={newAsset.room}
                    onChange={(e) => setNewAsset({ ...newAsset, room: e.target.value })}
                    placeholder="e.g. Lab 101"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Condition Status
                </label>
                <select
                  value={newAsset.condition}
                  onChange={(e) => setNewAsset({ ...newAsset, condition: e.target.value as any })}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="maintenance_required">Maintenance Required</option>
                </select>
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
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
