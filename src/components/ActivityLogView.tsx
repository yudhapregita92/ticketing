import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Trash2, 
  PlusCircle, 
  Edit3, 
  LogIn, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  UserCheck, 
  Layers, 
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Trash
} from 'lucide-react';
import { IActivityLog, IAdminUser } from '../types';
import { getActivityLogs, clearActivityLogs } from '../utils/activityLogger';
import toast from 'react-hot-toast';

interface ActivityLogViewProps {
  isDark: boolean;
  currentUser?: IAdminUser | any;
  adminThemeColor?: string;
  adminThemeLayout?: string;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  isDark,
  currentUser,
  adminThemeColor = 'blue',
  adminThemeLayout = 'modern'
}) => {
  const [logs, setLogs] = useState<IActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');

  const loadLogs = () => {
    setLogs(getActivityLogs());
  };

  useEffect(() => {
    loadLogs();
    const handleLogUpdate = () => {
      loadLogs();
    };
    window.addEventListener('kdk_activity_log_updated', handleLogUpdate);
    return () => {
      window.removeEventListener('kdk_activity_log_updated', handleLogUpdate);
    };
  }, []);

  // Filtering logic
  const filteredLogs = logs.filter(log => {
    // Search query
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      log.user_name.toLowerCase().includes(query) ||
      log.description.toLowerCase().includes(query) ||
      log.module.toLowerCase().includes(query) ||
      log.action_type.toLowerCase().includes(query) ||
      (log.ip_address && log.ip_address.includes(query));

    // Module
    const matchesModule = selectedModule === 'ALL' || log.module === selectedModule;

    // Action Type
    const matchesAction = selectedAction === 'ALL' || log.action_type === selectedAction;

    // Date
    let matchesDate = true;
    if (dateFilter !== 'ALL') {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      if (dateFilter === 'TODAY') {
        matchesDate = logDate.toDateString() === now.toDateString();
      } else if (dateFilter === '7DAYS') {
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        matchesDate = diffDays <= 7;
      } else if (dateFilter === '30DAYS') {
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        matchesDate = diffDays <= 30;
      }
    }

    return matchesSearch && matchesModule && matchesAction && matchesDate;
  });

  // Unique Modules
  const modules = Array.from(new Set(logs.map(l => l.module))).filter(Boolean);

  // Statistics
  const totalLogs = logs.length;
  const createCount = logs.filter(l => l.action_type === 'CREATE').length;
  const updateCount = logs.filter(l => l.action_type === 'UPDATE' || l.action_type === 'STATUS_CHANGE').length;
  const deleteCount = logs.filter(l => l.action_type === 'DELETE').length;

  const handleClearLogs = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh log aktivitas IT? Tindakan ini tidak dapat dibatalkan.')) {
      clearActivityLogs();
      setLogs([]);
    }
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['ID', 'Waktu', 'Nama User', 'Role', 'Modul', 'Tipe Aksi', 'Deskripsi', 'IP Address'];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.timestamp).toLocaleString('id-ID'),
      `"${l.user_name}"`,
      `"${l.user_role || '-'}"`,
      `"${l.module}"`,
      l.action_type,
      `"${l.description.replace(/"/g, '""')}"`,
      l.ip_address || '-'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Log_Aktivitas_IT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: IActivityLog['action_type']) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
            <PlusCircle className="w-3 h-3" /> Tambah
          </span>
        );
      case 'UPDATE':
      case 'STATUS_CHANGE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
            <Edit3 className="w-3 h-3" /> Edit
          </span>
        );
      case 'DELETE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
            <Trash2 className="w-3 h-3" /> Hapus
          </span>
        );
      case 'LOGIN':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1 w-fit">
            <LogIn className="w-3 h-3" /> Login
          </span>
        );
      case 'EXPORT':
      case 'IMPORT':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1 w-fit">
            <FileSpreadsheet className="w-3 h-3" /> {action}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 flex items-center gap-1 w-fit">
            <Activity className="w-3 h-3" /> {action}
          </span>
        );
    }
  };

  const formatIndoDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).replace('.', ':') + ' WIB';
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Title */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Log Aktivitas Tim IT</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rekaman histori aksi tambah, ubah, hapus, dan aktivitas tim IT secara real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadLogs}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title="Refresh Log"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {currentUser?.role === 'Super Admin' && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Trash className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bersihkan Log</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Log</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black mt-1">{totalLogs}</div>
        </div>

        <div className={`p-3.5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Aksi Tambah</span>
            <PlusCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{createCount}</div>
        </div>

        <div className={`p-3.5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Aksi Edit</span>
            <Edit3 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">{updateCount}</div>
        </div>

        <div className={`p-3.5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Aksi Hapus</span>
            <Trash2 className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black mt-1 text-rose-600 dark:text-rose-400">{deleteCount}</div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className={`p-3 sm:p-4 rounded-2xl border space-y-3 transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari user, aksi, deskripsi..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-500/20'
              }`}
            />
          </div>

          {/* Module Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-semibold border appearance-none focus:outline-none focus:ring-2 transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-500/20'
              }`}
            >
              <option value="ALL">Semua Modul</option>
              {modules.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-semibold border appearance-none focus:outline-none focus:ring-2 transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-500/20'
              }`}
            >
              <option value="ALL">Semua Tipe Aksi</option>
              <option value="CREATE">Tambah (CREATE)</option>
              <option value="UPDATE">Edit / Status (UPDATE)</option>
              <option value="DELETE">Hapus (DELETE)</option>
              <option value="LOGIN">Login</option>
              <option value="EXPORT">Export</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Clock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-semibold border appearance-none focus:outline-none focus:ring-2 transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-500/20'
              }`}
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="7DAYS">7 Hari Terakhir</option>
              <option value="30DAYS">30 Hari Terakhir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Log Table / Cards */}
      <div className={`rounded-2xl border overflow-hidden transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Belum ada data log aktivitas yang sesuai filter.</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau reset filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b font-bold ${
                isDark ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Petugas / User</th>
                  <th className="py-3 px-4">Modul</th>
                  <th className="py-3 px-4">Tipe Aksi</th>
                  <th className="py-3 px-4">Detail Aktivitas</th>
                  <th className="py-3 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredLogs.map(log => (
                  <tr key={log.id} className={`hover:bg-slate-500/5 transition-colors ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {formatIndoDate(log.timestamp)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-200 text-[10px]">
                          {log.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs">{log.user_name}</div>
                          {log.user_role && (
                            <span className="text-[10px] text-slate-400 font-normal">{log.user_role}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {log.module}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action_type)}
                    </td>

                    <td className="py-3 px-4 min-w-[240px]">
                      <div className="text-xs font-semibold">{log.description}</div>
                      {log.details && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{log.details}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
