import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { CampusBuilding, Complaint } from '../types';
import { StatusBadge, PriorityBadge } from '../components/common/Badges';
import {
  MapPin,
  Building2,
  AlertTriangle,
  CheckCircle,
  Eye,
  ExternalLink,
  Flame,
  Info,
} from 'lucide-react';

interface CampusMapPageProps {
  onSelectComplaint: (id: string) => void;
  onFilterBuilding: (buildingName: string) => void;
}

export const CampusMapPage: React.FC<CampusMapPageProps> = ({
  onSelectComplaint,
  onFilterBuilding,
}) => {
  const [buildings, setBuildings] = useState<CampusBuilding[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);

  useEffect(() => {
    const load = async () => {
      const [bList, cList] = await Promise.all([
        DataService.getBuildings(),
        DataService.getComplaints(),
      ]);
      setBuildings(bList);
      setComplaints(cList);
      if (bList.length > 0) {
        setSelectedBuilding(bList[0]);
      }
    };
    load();
  }, []);

  const totalActive = complaints.filter((c) => c.status !== 'closed' && c.status !== 'resolved').length;
  const criticalComplaints = complaints.filter(
    (c) => (c.priority === 'critical' || c.isSafetyHazard) && c.status !== 'closed' && c.status !== 'resolved'
  );

  // Check if a building has critical safety hazards
  const hasCriticalHazard = (bldgName: string) => {
    return criticalComplaints.some((c) => c.campusBuilding.toLowerCase().includes(bldgName.toLowerCase()));
  };

  const selectedBuildingComplaints = selectedBuilding
    ? complaints.filter((c) => c.campusBuilding.toLowerCase().includes(selectedBuilding.name.toLowerCase()))
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <MapPin className="w-6 h-6 text-teal-600" />
          Campus Map & Location Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Interactive schematic overview showing real-time complaint distribution and safety hotspots.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Total Buildings</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{buildings.length}</p>
          <span className="text-[11px] text-teal-600 font-medium">Mapped facilities</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Active Campus Complaints</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalActive}</p>
          <span className="text-[11px] text-blue-600 font-medium">Currently in resolution</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Critical Safety Flags</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{criticalComplaints.length}</p>
          <span className="text-[11px] text-rose-500 font-medium">Immediate response needed</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Highest Inflow Zone</span>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 truncate">
            Tech Hostel North
          </p>
          <span className="text-[11px] text-amber-600 font-medium">5 active issues</span>
        </div>
      </div>

      {/* Map & Detail Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Schematic SVG Map (Takes 2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Apex Institute Schematic Campus Layout
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Nominal
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium
              </span>
              <span className="flex items-center gap-1 text-rose-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Hazard / High
              </span>
            </div>
          </div>

          {/* SVG Vector Map Canvas */}
          <div className="w-full overflow-x-auto rounded-xl bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
            <svg
              viewBox="0 0 820 580"
              className="w-full h-auto min-w-[650px] transition-all select-none"
            >
              {/* Campus Grounds & Paths */}
              <rect x="10" y="10" width="800" height="560" rx="16" fill="transparent" />
              
              {/* Walkways and roads */}
              <line x1="40" y1="240" x2="780" y2="240" stroke="#cbd5e1" strokeWidth="12" strokeDasharray="6,6" opacity="0.4" />
              <line x1="290" y1="40" x2="290" y2="540" stroke="#cbd5e1" strokeWidth="12" strokeDasharray="6,6" opacity="0.4" />
              <line x1="560" y1="40" x2="560" y2="540" stroke="#cbd5e1" strokeWidth="12" strokeDasharray="6,6" opacity="0.4" />

              {/* Central Green Quadrangle */}
              <circle cx="420" cy="240" r="45" fill="#10b981" opacity="0.15" />
              <text x="420" y="244" textAnchor="middle" fontSize="11" fill="#059669" fontWeight="bold">
                CENTRAL PLAZA
              </text>

              {/* Render Building Blocks */}
              {buildings.map((b) => {
                const isSelected = selectedBuilding?.id === b.id;
                const isHazard = hasCriticalHazard(b.name);
                const hasHighActive = b.activeComplaints >= 3;

                let fillColor = isSelected
                  ? '#3b82f6' // Active selection
                  : isHazard
                  ? '#ef4444' // Critical hazard
                  : hasHighActive
                  ? '#f59e0b' // High backlog
                  : '#0d9488'; // Normal

                return (
                  <g
                    key={b.id}
                    onClick={() => setSelectedBuilding(b)}
                    className="cursor-pointer transition-transform hover:scale-[1.015]"
                  >
                    {/* Shadow */}
                    <rect
                      x={b.x + 3}
                      y={b.y + 4}
                      width={b.width}
                      height={b.height}
                      rx="14"
                      fill="#000"
                      opacity="0.1"
                    />

                    {/* Building Body */}
                    <rect
                      x={b.x}
                      y={b.y}
                      width={b.width}
                      height={b.height}
                      rx="14"
                      fill={isSelected ? '#1e40af' : '#1e293b'}
                      stroke={fillColor}
                      strokeWidth={isSelected ? '3.5' : '2'}
                      className="transition-colors"
                    />

                    {/* Accent strip */}
                    <rect
                      x={b.x}
                      y={b.y}
                      width={b.width}
                      height="8"
                      rx="4"
                      fill={fillColor}
                    />

                    {/* Building Code & Name */}
                    <text
                      x={b.x + 16}
                      y={b.y + 34}
                      fontSize="14"
                      fill="#ffffff"
                      fontWeight="bold"
                    >
                      {b.code}
                    </text>
                    <text
                      x={b.x + 16}
                      y={b.y + 54}
                      fontSize="11"
                      fill="#94a3b8"
                      fontWeight="medium"
                    >
                      {b.name}
                    </text>

                    {/* Floor count tag */}
                    <text
                      x={b.x + 16}
                      y={b.y + b.height - 18}
                      fontSize="10"
                      fill="#64748b"
                    >
                      {b.floors} Floors • {b.type.toUpperCase()}
                    </text>

                    {/* Active Complaint Badge Pin */}
                    <g transform={`translate(${b.x + b.width - 42}, ${b.y + 16})`}>
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        fill={isHazard ? '#ef4444' : hasHighActive ? '#f59e0b' : '#0f766e'}
                      />
                      <text
                        x="16"
                        y="20"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="bold"
                        fill="#ffffff"
                      >
                        {b.activeComplaints}
                      </text>
                    </g>

                    {/* Hazard pulsating ring if critical */}
                    {isHazard && (
                      <circle
                        cx={b.x + b.width - 26}
                        cy={b.y + 32}
                        r="18"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        opacity="0.8"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            * Schematic floor layout rendered for demonstration. Click any facility block to inspect floor metrics and active complaints.
          </p>
        </div>

        {/* Selected Building Details Drawer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-5">
          {selectedBuilding ? (
            <>
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                    {selectedBuilding.code}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      selectedBuilding.activeComplaints > 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    }`}
                  >
                    {selectedBuilding.activeComplaints} Active Issues
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {selectedBuilding.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedBuilding.floors} Levels • Lifetime total: {selectedBuilding.totalComplaints} tickets
                </p>
              </div>

              {/* Action: Filter in Directory */}
              <button
                onClick={() => onFilterBuilding(selectedBuilding.name)}
                className="w-full py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800/80 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Filter Complaint Directory by {selectedBuilding.code}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {/* List of active complaints in this building */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Issues in {selectedBuilding.code}
                </h4>

                {selectedBuildingComplaints.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    No active complaints recorded in this building.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {selectedBuildingComplaints.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => onSelectComplaint(c.id)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-blue-600">
                            {c.complaintCode}
                          </span>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {c.title}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{c.roomNumber} ({c.floor})</span>
                          <PriorityBadge priority={c.priority} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400">Select a building on the map.</p>
          )}
        </div>
      </div>
    </div>
  );
};
