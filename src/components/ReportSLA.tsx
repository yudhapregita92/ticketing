import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Filter, 
  Download, 
  Printer, 
  Search, 
  ArrowUpRight, 
  Timer, 
  Users, 
  Zap, 
  ShieldCheck, 
  TrendingUp,
  Building2,
  Tag,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { ITicket, IAdminUser } from '../types';

interface ReportSLAProps {
  tickets: ITicket[];
  isDark: boolean;
  themeClasses: any;
  adminUser: IAdminUser | null;
  masterUsers?: any[];
  onSelectTicket?: (ticket: ITicket) => void;
}

// Utility to calculate duration in minutes between two ISO/date strings
const calculateDurationMins = (startStr?: string | null, endStr?: string | null): number | null => {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr.includes('T') ? startStr : startStr.replace(' ', 'T')).getTime();
  const end = new Date(endStr.includes('T') ? endStr : endStr.replace(' ', 'T')).getTime();
  if (isNaN(start) || isNaN(end)) return null;
  if (end < start) return 0;
  return Math.round((end - start) / (1000 * 60));
};

// Option C: Helper to get effective start time for Resolution SLA (active work time)
const getWorkStartTime = (t: ITicket, respondedTime?: string | null): string | null => {
  if (t.estimated_start_at) {
    return t.estimated_start_at;
  }
  return respondedTime || t.created_at;
};

// Option C: Helper to get effective start time for Total Resolution Time
const getTotalStartTime = (t: ITicket): string => {
  if (t.estimated_start_at) {
    return t.estimated_start_at;
  }
  return t.created_at;
};

// Utility to format duration in minutes to human readable string (Indonesian)
const formatDurationHuman = (minutes: number | null): string => {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return '-';
  if (minutes < 1) return '< 1 mnt';
  
  const days = Math.floor(minutes / (24 * 60));
  const remainingMinsAfterDays = minutes % (24 * 60);
  const hours = Math.floor(remainingMinsAfterDays / 60);
  const mins = remainingMinsAfterDays % 60;

  if (days > 0) {
    return `${days} hr ${hours > 0 ? `${hours} jm` : ''}`.trim();
  }
  if (hours > 0) {
    return `${hours} jm ${mins > 0 ? `${mins} mnt` : ''}`.trim();
  }
  return `${mins} mnt`;
};

// Format Date for display
const formatDateFormatted = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
};

export const ReportSLA: React.FC<ReportSLAProps> = ({
  tickets,
  isDark,
  themeClasses,
  adminUser,
  masterUsers = [],
  onSelectTicket
}) => {
  // Preset dates default to current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [selectedIT, setSelectedIT] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePreset, setActivePreset] = useState<'this_month' | 'today' | 'last_7' | 'last_30' | 'all'>('this_month');

  // Extract unique IT Staff options
  const itStaffList = useMemo(() => {
    const set = new Set<string>();
    
    // From masterUsers if available
    masterUsers.forEach(u => {
      if (u.role === 'Super Admin' || u.role === 'Staff IT Support' || u.role === 'IT Staff') {
        if (u.full_name) set.add(u.full_name);
        if (u.username) set.add(u.username);
      }
    });

    // From actual ticket assignments
    tickets.forEach(t => {
      if (t.assigned_to) set.add(t.assigned_to);
    });

    return Array.from(set).sort();
  }, [tickets, masterUsers]);

  // Handle Quick Date Presets
  const handleSetPreset = (preset: 'this_month' | 'today' | 'last_7' | 'last_30' | 'all') => {
    setActivePreset(preset);
    const now = new Date();
    if (preset === 'today') {
      const s = now.toISOString().split('T')[0];
      setStartDate(s);
      setEndDate(s);
    } else if (preset === 'last_7') {
      const past = new Date();
      past.setDate(now.getDate() - 6);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'last_30') {
      const past = new Date();
      past.setDate(now.getDate() - 29);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'this_month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filtered Tickets based on date, IT staff, priority, status
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // Date Range Filter (based on created_at)
      if (startDate) {
        const ticketDate = t.created_at.split('T')[0].split(' ')[0];
        if (ticketDate < startDate) return false;
      }
      if (endDate) {
        const ticketDate = t.created_at.split('T')[0].split(' ')[0];
        if (ticketDate > endDate) return false;
      }

      // IT Staff Filter
      if (selectedIT !== 'ALL') {
        if (!t.assigned_to || t.assigned_to.toLowerCase() !== selectedIT.toLowerCase()) {
          return false;
        }
      }

      // Priority Filter
      if (selectedPriority !== 'ALL') {
        if (t.priority !== selectedPriority) return false;
      }

      // Status Filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'Resolved' || selectedStatus === 'Completed' || selectedStatus === 'Selesai') {
          if (t.status !== 'Completed' && t.status !== 'Resolved' && t.status !== 'Selesai') return false;
        } else if (selectedStatus === 'In Progress' || selectedStatus === 'Progres') {
          if (t.status !== 'In Progress' && t.status !== 'Progres' && t.status !== 'Assigned') return false;
        } else if (selectedStatus === 'New' || selectedStatus === 'Baru') {
          if (t.status !== 'New' && t.status !== 'Baru') return false;
        }
      }

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchNo = t.ticket_no ? t.ticket_no.toLowerCase().includes(q) : false;
        const matchName = t.name ? t.name.toLowerCase().includes(q) : false;
        const matchDept = t.department ? t.department.toLowerCase().includes(q) : false;
        const matchCat = t.category ? t.category.toLowerCase().includes(q) : false;
        const matchIT = t.assigned_to ? t.assigned_to.toLowerCase().includes(q) : false;
        const matchDesc = t.description ? t.description.toLowerCase().includes(q) : false;

        if (!matchNo && !matchName && !matchDept && !matchCat && !matchIT && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, startDate, endDate, selectedIT, selectedPriority, selectedStatus, searchQuery]);

  // Overall Calculated SLA Metrics
  const metrics = useMemo(() => {
    let totalResponseMins = 0;
    let countResponse = 0;

    let totalResolutionMins = 0;
    let countResolution = 0;

    let totalFullMins = 0;
    let countFull = 0;

    let totalResolved = 0;
    let totalInProgress = 0;

    filteredTickets.forEach(t => {
      const isCompleted = t.status === 'Completed' || t.status === 'Resolved' || t.status === 'Selesai';
      const isProgress = t.status === 'In Progress' || t.status === 'Progres' || t.status === 'Assigned';

      if (isCompleted) {
        totalResolved++;
      } else if (isProgress) {
        totalInProgress++;
      }

      const respondedTime = t.responded_at || (t.status !== 'New' && t.status !== 'Baru' ? t.updated_at : null);
      const resolvedTime = t.resolved_at || (isCompleted ? t.updated_at : null);
      const workStart = getWorkStartTime(t, respondedTime);
      const totalStart = getTotalStartTime(t);

      // Response SLA: created_at -> respondedTime
      const respTime = calculateDurationMins(t.created_at, respondedTime);
      if (respTime !== null) {
        totalResponseMins += respTime;
        countResponse++;
      }

      // Resolution SLA: workStart -> resolvedTime (Option C: uses scheduled start if present)
      const resTime = calculateDurationMins(workStart, resolvedTime);
      if (resTime !== null && isCompleted) {
        totalResolutionMins += resTime;
        countResolution++;
      }

      // Total Resolution Time: totalStart -> resolvedTime (Option C: uses scheduled start if present)
      const fullTime = calculateDurationMins(totalStart, resolvedTime);
      if (fullTime !== null && isCompleted) {
        totalFullMins += fullTime;
        countFull++;
      }
    });

    const avgResponseMins = countResponse > 0 ? Math.round(totalResponseMins / countResponse) : null;
    const avgResolutionMins = countResolution > 0 ? Math.round(totalResolutionMins / countResolution) : null;
    const avgTotalFullMins = countFull > 0 ? Math.round(totalFullMins / countFull) : null;

    // Compliance Rate (Target: Total Resolution Time <= 24 hours / 1440 mins)
    const compliantCount = filteredTickets.filter(t => {
      const isCompleted = t.status === 'Completed' || t.status === 'Resolved' || t.status === 'Selesai';
      if (!isCompleted) return false;
      const resolvedTime = t.resolved_at || t.updated_at;
      const totalStart = getTotalStartTime(t);
      const fullTime = calculateDurationMins(totalStart, resolvedTime);
      return fullTime !== null && fullTime <= 1440; // 24 hours target
    }).length;

    const complianceRate = countFull > 0 ? Math.round((compliantCount / countFull) * 100) : 100;

    return {
      totalTickets: filteredTickets.length,
      totalResolved,
      totalInProgress,
      avgResponseMins,
      avgResolutionMins,
      avgTotalFullMins,
      complianceRate,
      countResponse,
      countResolution,
      countFull
    };
  }, [filteredTickets]);

  // IT Staff Performance Breakdown Metrics
  const itBreakdown = useMemo(() => {
    const statsMap: { [key: string]: {
      name: string;
      total: number;
      resolved: number;
      inProgress: number;
      respMins: number[];
      resMins: number[];
      fullMins: number[];
    } } = {};

    filteredTickets.forEach(t => {
      const itName = t.assigned_to || 'Belum Ditugaskan';
      if (!statsMap[itName]) {
        statsMap[itName] = {
          name: itName,
          total: 0,
          resolved: 0,
          inProgress: 0,
          respMins: [],
          resMins: [],
          fullMins: []
        };
      }

      const st = statsMap[itName];
      st.total++;

      const isCompleted = t.status === 'Completed' || t.status === 'Resolved' || t.status === 'Selesai';
      const isProgress = t.status === 'In Progress' || t.status === 'Progres' || t.status === 'Assigned';

      if (isCompleted) {
        st.resolved++;
      } else if (isProgress) {
        st.inProgress++;
      }

      const respondedTime = t.responded_at || (t.status !== 'New' && t.status !== 'Baru' ? t.updated_at : null);
      const resolvedTime = t.resolved_at || (isCompleted ? t.updated_at : null);
      const workStart = getWorkStartTime(t, respondedTime);
      const totalStart = getTotalStartTime(t);

      const resp = calculateDurationMins(t.created_at, respondedTime);
      if (resp !== null) st.respMins.push(resp);

      const res = calculateDurationMins(workStart, resolvedTime);
      if (res !== null && isCompleted) st.resMins.push(res);

      const full = calculateDurationMins(totalStart, resolvedTime);
      if (full !== null && isCompleted) st.fullMins.push(full);
    });

    return Object.values(statsMap).map(st => {
      const avgResp = st.respMins.length > 0 ? Math.round(st.respMins.reduce((a, b) => a + b, 0) / st.respMins.length) : null;
      const avgRes = st.resMins.length > 0 ? Math.round(st.resMins.reduce((a, b) => a + b, 0) / st.resMins.length) : null;
      const avgFull = st.fullMins.length > 0 ? Math.round(st.fullMins.reduce((a, b) => a + b, 0) / st.fullMins.length) : null;
      const completionRate = st.total > 0 ? Math.round((st.resolved / st.total) * 100) : 0;

      return {
        ...st,
        avgResp,
        avgRes,
        avgFull,
        completionRate
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredTickets]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['No Tiket', 'Pemohon', 'Departemen', 'Kategori', 'Prioritas', 'Petugas IT', 'Status', 'Tgl Dibuat', 'Tgl Respon', 'Tgl Selesai', 'Response SLA (Mnt)', 'Resolution SLA (Mnt)', 'Total Resolution Time (Mnt)'];
    const rows = filteredTickets.map(t => {
      const isCompleted = t.status === 'Completed' || t.status === 'Resolved' || t.status === 'Selesai';
      const respondedTime = t.responded_at || (t.status !== 'New' && t.status !== 'Baru' ? t.updated_at : null);
      const resolvedTime = t.resolved_at || (isCompleted ? t.updated_at : null);
      const workStart = getWorkStartTime(t, respondedTime);
      const totalStart = getTotalStartTime(t);

      const respMins = calculateDurationMins(t.created_at, respondedTime);
      const resMins = isCompleted ? calculateDurationMins(workStart, resolvedTime) : null;
      const fullMins = isCompleted ? calculateDurationMins(totalStart, resolvedTime) : null;

      return [
        `"${t.ticket_no || t.id}"`,
        `"${t.name || ''}"`,
        `"${t.department || ''}"`,
        `"${t.category || ''}"`,
        `"${t.priority || 'Medium'}"`,
        `"${t.assigned_to || 'Unassigned'}"`,
        `"${t.status}"`,
        `"${formatDateFormatted(t.created_at)}"`,
        `"${formatDateFormatted(respondedTime)}"`,
        `"${formatDateFormatted(resolvedTime)}"`,
        respMins !== null ? respMins : '',
        resMins !== null ? resMins : '',
        fullMins !== null ? fullMins : ''
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Report_SLA_IT_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 print:p-0">
      {/* Header Bar */}
      <div className={`p-4 sm:p-6 rounded-[1.5rem] border ${themeClasses.card} shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden`}>
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-lg sm:text-xl font-black capitalize tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Laporan Response & Resolution SLA IT
              </h1>
              <p className={`text-xs font-semibold ${themeClasses.textMuted}`}>
                Analisis durasi penanganan tiket, performa tim IT, dan tingkat kepatuhan Service Level Agreement
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor CSV / Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className={`px-3.5 py-2.5 rounded-xl border ${themeClasses.bgSecondary} ${themeClasses.border} hover:bg-slate-100 dark:hover:bg-slate-800 ${themeClasses.text} text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all shrink-0`}
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className={`p-4 sm:p-5 rounded-[1.5rem] border ${themeClasses.card} shadow-sm space-y-4 print:hidden`}>
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <Filter className="w-4 h-4" />
            <span>Filter Tanggal & Parameter SLA</span>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSetPreset('this_month')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                activePreset === 'this_month'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => handleSetPreset('today')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                activePreset === 'today'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => handleSetPreset('last_7')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                activePreset === 'last_7'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => handleSetPreset('last_30')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                activePreset === 'last_30'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => handleSetPreset('all')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                activePreset === 'all'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Tanggal Mulai */}
          <div>
            <label className={`block text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider mb-1`}>
              Dari Tanggal
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setActivePreset('all');
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
            </div>
          </div>

          {/* Tanggal Sampai */}
          <div>
            <label className={`block text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider mb-1`}>
              Sampai Tanggal
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setActivePreset('all');
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
            </div>
          </div>

          {/* Dropdown Petugas IT */}
          <div>
            <label className={`block text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider mb-1`}>
              Nama Petugas IT
            </label>
            <select
              value={selectedIT}
              onChange={e => setSelectedIT(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            >
              <option value="ALL">Semua Petugas IT</option>
              {itStaffList.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Filter Prioritas */}
          <div>
            <label className={`block text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider mb-1`}>
              Tingkat Prioritas
            </label>
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main SLA Summary Metric Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Response SLA */}
        <div className={`p-4 sm:p-5 rounded-[1.5rem] border ${themeClasses.card} shadow-sm relative overflow-hidden group`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${themeClasses.textMuted}`}>
              Response SLA
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${themeClasses.text}`}>
              {formatDurationHuman(metrics.avgResponseMins)}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Rata-rata waktu tiket direspon</span>
          </p>
          <div className="mt-2 text-[10px] font-bold text-slate-400">
            {metrics.countResponse} tiket terhitung respon
          </div>
        </div>

        {/* Card 2: Resolution SLA */}
        <div className={`p-4 sm:p-5 rounded-[1.5rem] border ${themeClasses.card} shadow-sm relative overflow-hidden group`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${themeClasses.textMuted}`}>
              Resolution SLA
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${themeClasses.text}`}>
              {formatDurationHuman(metrics.avgResolutionMins)}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Waktu perbaikan setelah respon</span>
          </p>
          <div className="mt-2 text-[10px] font-bold text-slate-400">
            {metrics.countResolution} tiket selesai dievaluasi
          </div>
        </div>

        {/* Card 3: Total Resolution Time */}
        <div className={`p-4 sm:p-5 rounded-[1.5rem] border ${themeClasses.card} shadow-sm relative overflow-hidden group`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${themeClasses.textMuted}`}>
              Total Resolution Time
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400`}>
              {formatDurationHuman(metrics.avgTotalFullMins)}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Total durasi dari buat s/d selesai</span>
          </p>
          <div className="mt-2 text-[10px] font-bold text-slate-400">
            {metrics.totalResolved} dari {metrics.totalTickets} tiket diselesaikan
          </div>
        </div>

        {/* Card 4: Rate Kepatuhan SLA */}
        <div className={`p-4 sm:p-5 rounded-[1.5rem] border ${themeClasses.card} shadow-sm relative overflow-hidden group`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${themeClasses.textMuted}`}>
              Tingkat SLA Compliance
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${metrics.complianceRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
              {metrics.complianceRate}%
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${metrics.complianceRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span>Target penyelesaian &lt; 24 jam</span>
          </p>
          <div className="mt-2 text-[10px] font-bold text-slate-400">
            Target standar SLA operasional
          </div>
        </div>
      </div>

      {/* IT Staff Breakdown Section */}
      <div className={`p-5 rounded-[1.5rem] border ${themeClasses.card} shadow-sm space-y-4`}>
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className={`text-sm font-black capitalize tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Performansi Perpetugas IT Support
            </h2>
          </div>
          <span className="text-[11px] font-extrabold text-slate-400">
            {itBreakdown.length} Personel Terdaftar
          </span>
        </div>

        {/* Cards Grid / Table for IT Staff */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {itBreakdown.map((it, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-2xl border ${themeClasses.bgSecondary} ${themeClasses.border} space-y-3 relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm border border-emerald-500/20">
                    {it.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className={`text-xs font-black ${themeClasses.text} truncate`}>{it.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400">{it.total} Total Tiket Ditangani</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  it.completionRate >= 80 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}>
                  {it.completionRate}% Selesai
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t dark:border-slate-800 text-center">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Response SLA</p>
                  <p className={`text-xs font-extrabold mt-0.5 ${themeClasses.text}`}>
                    {formatDurationHuman(it.avgResp)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Resolution SLA</p>
                  <p className={`text-xs font-extrabold mt-0.5 ${themeClasses.text}`}>
                    {formatDurationHuman(it.avgRes)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Time</p>
                  <p className="text-xs font-black mt-0.5 text-emerald-600 dark:text-emerald-400">
                    {formatDurationHuman(it.avgFull)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {itBreakdown.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs font-semibold text-slate-400">
              Tidak ada data penanganan tiket oleh petugas IT pada periode ini.
            </div>
          )}
        </div>
      </div>

      {/* Detailed Tickets SLA Table */}
      <div className={`p-5 rounded-[1.5rem] border ${themeClasses.card} shadow-sm space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className={`text-sm font-black capitalize tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Rincian Tiket & Rekapitulasi Waktu Penanganan ({filteredTickets.length})
            </h2>
          </div>

          {/* Table Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari no tiket, pemohon, IT..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-semibold border ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${themeClasses.textMuted} dark:border-slate-800`}>
                <th className="py-2.5 px-3">No Tiket</th>
                <th className="py-2.5 px-3">Pemohon & Dept</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3">Petugas IT</th>
                <th className="py-2.5 px-3 text-center">Tgl Dibuat</th>
                <th className="py-2.5 px-3 text-center">Response SLA</th>
                <th className="py-2.5 px-3 text-center">Resolution SLA</th>
                <th className="py-2.5 px-3 text-center">Total Resolution Time</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800/60 text-xs">
              {filteredTickets.map(ticket => {
                const isCompleted = ticket.status === 'Completed' || ticket.status === 'Resolved' || ticket.status === 'Selesai';
                const respondedTime = ticket.responded_at || (ticket.status !== 'New' && ticket.status !== 'Baru' ? ticket.updated_at : null);
                const resolvedTime = ticket.resolved_at || (isCompleted ? ticket.updated_at : null);
                const workStart = getWorkStartTime(ticket, respondedTime);
                const totalStart = getTotalStartTime(ticket);

                const respMins = calculateDurationMins(ticket.created_at, respondedTime);
                const resMins = isCompleted ? calculateDurationMins(workStart, resolvedTime) : null;
                const fullMins = isCompleted ? calculateDurationMins(totalStart, resolvedTime) : null;

                return (
                  <tr 
                    key={ticket.id} 
                    onClick={() => onSelectTicket && onSelectTicket(ticket)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      #{ticket.ticket_no || ticket.id}
                      {ticket.estimated_start_at && (
                        <span className="block text-[9px] font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                          🌙 Luar Jam Kerja
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <p className={`font-extrabold ${themeClasses.text}`}>{ticket.name}</p>
                      <p className="text-[10px] font-semibold text-slate-400">{ticket.department}</p>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${themeClasses.bgSecondary} ${themeClasses.border} border`}>
                        {ticket.category}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <p className={`font-bold ${themeClasses.text}`}>{ticket.assigned_to || 'Unassigned'}</p>
                    </td>

                    <td className="py-3 px-3 text-center text-[10px] font-mono text-slate-400">
                      {formatDateFormatted(ticket.created_at)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">
                        {formatDurationHuman(respMins)}
                      </span>
                      {respondedTime && (
                        <p className="text-[9px] font-mono text-slate-400 block">{formatDateFormatted(respondedTime)}</p>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                        {formatDurationHuman(resMins)}
                      </span>
                      {resolvedTime && (
                        <p className="text-[9px] font-mono text-slate-400 block">{formatDateFormatted(resolvedTime)}</p>
                      )}
                      {ticket.estimated_start_at && (
                        <p className="text-[9px] font-semibold text-purple-500 block">Mulai: {formatDateFormatted(ticket.estimated_start_at)}</p>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                        {formatDurationHuman(fullMins)}
                      </span>
                      {ticket.estimated_start_at && (
                        <p className="text-[9px] font-semibold text-purple-500 block mt-0.5">Mulai: {formatDateFormatted(ticket.estimated_start_at)}</p>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : ticket.status === 'In Progress' || ticket.status === 'Progres' || ticket.status === 'Assigned'
                          ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {ticket.status === 'Completed' ? 'Selesai' : ticket.status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs font-semibold text-slate-400">
                    Tidak ada tiket yang cocok dengan filter parameter SLA saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
