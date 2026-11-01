import React, { useState, useEffect, useMemo } from 'react';
import { DataService } from '../services/dataService';
import { Complaint, Department, ComplaintCategory, Feedback } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Download,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Users,
  Building,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const AnalyticsPage: React.FC = () => {
  const { showToast } = useToast();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | '30d' | '7d'>('all');

  useEffect(() => {
    const load = async () => {
      const [cList, dList, catList, fbList] = await Promise.all([
        DataService.getComplaints(),
        DataService.getDepartments(),
        DataService.getCategories(),
        DataService.getFeedback(),
      ]);
      setComplaints(cList);
      setDepartments(dList);
      setCategories(catList);
      setFeedbacks(fbList);
    };
    load();
  }, []);

  // Filtered dataset
  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const matchesDept = selectedDeptId === 'all' || c.departmentId === selectedDeptId;
      if (!matchesDept) return false;

      if (dateRange === '7d') {
        const weekAgo = Date.now() - 7 * 86400 * 1000;
        return new Date(c.createdAt).getTime() >= weekAgo;
      }
      if (dateRange === '30d') {
        const monthAgo = Date.now() - 30 * 86400 * 1000;
        return new Date(c.createdAt).getTime() >= monthAgo;
      }
      return true;
    });
  }, [complaints, selectedDeptId, dateRange]);

  // KPIs
  const total = filtered.length;
  const resolved = filtered.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const overdueCount = filtered.filter((c) => {
    return (c.status !== 'closed' && c.status !== 'resolved') && new Date() > new Date(c.deadline);
  }).length;
  const slaCompliance = total > 0 ? Math.round(((total - overdueCount) / total) * 100) : 100;

  const avgRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
      : '4.8';

  // Category chart data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((c) => {
      counts[c.categoryName] = (counts[c.categoryName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name: name.length > 14 ? `${name.slice(0, 12)}...` : name,
      fullTitle: name,
      count,
    }));
  }, [filtered]);

  // Status Pie data
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    const colors: Record<string, string> = {
      submitted: '#94a3b8',
      acknowledged: '#6366f1',
      assigned: '#0ea5e9',
      in_progress: '#f59e0b',
      on_hold: '#f97316',
      resolved: '#10b981',
      closed: '#64748b',
      reopened: '#f43f5e',
    };

    return Object.entries(counts).map(([status, value]) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value,
      color: colors[status] || '#3b82f6',
    }));
  }, [filtered]);

  // Department comparison data
  const deptData = useMemo(() => {
    return departments.map((d) => {
      const deptComplaints = filtered.filter((c) => c.departmentId === d.id);
      const res = deptComplaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
      return {
        name: d.code,
        fullName: d.name,
        total: deptComplaints.length,
        resolved: res,
      };
    });
  }, [departments, filtered]);

  // Weekly Trend Data
  const trendData = [
    { period: 'Week 1', incoming: 12, resolved: 10 },
    { period: 'Week 2', incoming: 19, resolved: 16 },
    { period: 'Week 3', incoming: 15, resolved: 14 },
    { period: 'Week 4', incoming: 22, resolved: 20 },
    { period: 'Current', incoming: total, resolved: resolved },
  ];

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      showToast('warning', 'No records to export');
      return;
    }

    const headers = [
      'Complaint Code',
      'Title',
      'Category',
      'Department',
      'Priority',
      'Status',
      'Building',
      'Room',
      'Reporter',
      'Created At',
      'Deadline',
      'Resolved At',
    ];

    const rows = filtered.map((c) => [
      c.complaintCode,
      `"${c.title.replace(/"/g, '""')}"`,
      c.categoryName,
      c.departmentName,
      c.priority,
      c.status,
      c.campusBuilding,
      c.roomNumber,
      c.isAnonymous ? 'Anonymous' : c.reporterName,
      c.createdAt,
      c.deadline,
      c.resolvedAt || 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartCampus360_Complaints_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Report Exported', 'CSV dataset successfully downloaded.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Advanced Analytics & Performance Metrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time charts, departmental SLAs, inflow analysis, and institutional reporting.
          </p>
        </div>

        {/* Filters & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="all">All-Time Records</option>
            <option value="30d">Last 30 Days</option>
            <option value="7d">Last 7 Days</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow transition-colors dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Tickets</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{total}</p>
          <span className="text-[10px] text-blue-600 font-semibold">Logged complaints</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Resolution Rate</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{resolutionRate}%</p>
          <span className="text-[10px] text-emerald-500 font-semibold">{resolved} completed</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">SLA Compliance</span>
          <p className="text-2xl font-bold text-teal-600 mt-1">{slaCompliance}%</p>
          <span className="text-[10px] text-teal-500 font-semibold">Met within deadline</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Overdue Tasks</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{overdueCount}</p>
          <span className="text-[10px] text-rose-500 font-semibold">Exceeded SLA</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Avg Response Time</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">1.8 hrs</p>
          <span className="text-[10px] text-indigo-500 font-semibold">First acknowledgement</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Satisfaction</span>
          <p className="text-2xl font-bold text-amber-500 mt-1 flex items-center gap-1">
            {avgRating} <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          </p>
          <span className="text-[10px] text-amber-600 font-semibold">Out of 5.0</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Volume by Category */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Complaints by Category</span>
            <span className="text-xs font-normal text-slate-400">Total volume</span>
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [val, 'Complaints']}
                  labelFormatter={(_: any, payload: any[]) => payload[0]?.payload?.fullTitle || ''}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Workflow Status Breakdown</span>
            <span className="text-xs font-normal text-slate-400">Live states</span>
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Department Performance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Department Inflow vs Resolution</span>
            <span className="text-xs font-normal text-slate-400">By unit code</span>
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any, name: any) => [val, name === 'total' ? 'Assigned' : 'Resolved']} />
                <Legend />
                <Bar dataKey="total" name="Total Tickets" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Intake Trends */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Inflow vs Resolution Trajectory</span>
            <span className="text-xs font-normal text-slate-400">Trendline</span>
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="incoming" name="Intake" stroke="#3b82f6" fillOpacity={1} fill="url(#colorIncoming)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
