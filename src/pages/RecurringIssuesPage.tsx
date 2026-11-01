import React, { useState, useEffect, useMemo } from 'react';
import { DataService } from '../services/dataService';
import { Complaint } from '../types';
import { PriorityBadge, StatusBadge } from '../components/common/Badges';
import {
  AlertOctagon,
  Building,
  Wrench,
  Search,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface RecurringGroup {
  key: string;
  type: 'room' | 'asset' | 'category';
  location: string;
  category: string;
  complaintCount: number;
  complaints: Complaint[];
  rootCauseRecommendation: string;
  severity: 'high' | 'critical' | 'medium';
}

export const RecurringIssuesPage: React.FC<{ onSelectComplaint: (id: string) => void }> = ({
  onSelectComplaint,
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    DataService.getComplaints().then(setComplaints);
  }, []);

  // Algorithm: group complaints by location & asset
  const recurringGroups: RecurringGroup[] = useMemo(() => {
    const groups: Record<string, Complaint[]> = {};

    complaints.forEach((c) => {
      // 1. Group by Building + Room
      const locKey = `loc:${c.campusBuilding}:${c.roomNumber}`;
      if (!groups[locKey]) groups[locKey] = [];
      groups[locKey].push(c);

      // 2. Group by Asset if asset exists
      if (c.assetId) {
        const assetKey = `asset:${c.assetId}`;
        if (!groups[assetKey]) groups[assetKey] = [];
        groups[assetKey].push(c);
      }
    });

    const results: RecurringGroup[] = [];

    // Filter groups with 2 or more occurrences
    Object.entries(groups).forEach(([key, items]) => {
      if (items.length >= 2) {
        const first = items[0];
        const isAsset = key.startsWith('asset:');

        let rec = '';
        let severity: 'high' | 'critical' | 'medium' = 'medium';

        if (first.categoryName.includes('Projector') || first.categoryName.includes('Equipment')) {
          rec = 'Perform complete electrical ballast testing and check voltage fluctuations on this circuit rather than replacing individual lamps.';
          severity = 'high';
        } else if (first.categoryName.includes('Plumbing') || first.categoryName.includes('Water')) {
          rec = 'Perform full pipeline endoscopy or riser pressure valve replacement; repeated joint seepage indicates line overpressurization.';
          severity = 'critical';
        } else if (first.categoryName.includes('AC') || first.categoryName.includes('HVAC')) {
          rec = 'Check condenser coil micro-fractures and replace refrigerant thermistor sensor.';
          severity = 'high';
        } else {
          rec = 'Conduct joint engineering inspection with facility contractor to address structural root causes.';
          severity = 'medium';
        }

        results.push({
          key,
          type: isAsset ? 'asset' : 'room',
          location: `${first.campusBuilding} (${first.roomNumber})`,
          category: first.categoryName,
          complaintCount: items.length,
          complaints: items,
          rootCauseRecommendation: rec,
          severity,
        });
      }
    });

    return results.sort((a, b) => b.complaintCount - a.complaintCount);
  }, [complaints]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <AlertOctagon className="w-6 h-6 text-amber-500" />
          Recurring Issue Detection & Root-Cause Analysis
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Automated pattern detection identifies repeated failures in identical rooms, assets, or conduits.
        </p>
      </div>

      {/* Advisory Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-amber-950 dark:text-amber-200">
            Smart Preventative Intelligence Advisory
          </p>
          <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
            The detection engine groups complaints across time windows. Department heads are advised to initiate root-cause overhauls rather than resolving repeated tickets independently.
          </p>
        </div>
      </div>

      {/* Recurring Incident Clusters */}
      <div className="space-y-4">
        {recurringGroups.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No recurring incident patterns identified at this time.
          </div>
        ) : (
          recurringGroups.map((group) => (
            <div
              key={group.key}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      group.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {group.complaintCount} Repeated Incidents
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {group.location}
                  </span>
                  <span className="text-xs text-slate-400">• {group.category}</span>
                </div>

                <span className="text-xs text-slate-400">
                  Cluster Type: <strong className="text-slate-600 dark:text-slate-300 uppercase">{group.type}</strong>
                </span>
              </div>

              {/* Recommended Action */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5 text-xs">
                <Wrench className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Recommended Root-Cause Action:</span>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {group.rootCauseRecommendation}
                  </p>
                </div>
              </div>

              {/* Linked Complaints in cluster */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Associated Incident Records
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {group.complaints.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onSelectComplaint(c.id)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-blue-600">
                            {c.complaintCode}
                          </span>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {c.title}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
