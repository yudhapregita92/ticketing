import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  Copy, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Plus, 
  RefreshCw, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Terminal, 
  Filter,
  Code
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  BugLog, 
  getBugLogs, 
  deleteBugLog, 
  clearBugLogs, 
  toggleBugResolved, 
  addBugLog, 
  formatBugForAgent, 
  formatAllBugsForAgent 
} from '../../utils/bugLogger';

interface BugLogTabProps {
  isDark: boolean;
  themeClasses: any;
  adminUser?: any;
}

export const BugLogTab: React.FC<BugLogTabProps> = ({ isDark, themeClasses, adminUser }) => {
  const [logs, setLogs] = useState<BugLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  
  // Manual bug form
  const [manualMessage, setManualMessage] = useState('');
  const [manualSource, setManualSource] = useState('');
  const [manualStack, setManualStack] = useState('');

  const reloadLogs = () => {
    setLogs(getBugLogs());
  };

  useEffect(() => {
    reloadLogs();
  }, []);

  const handleCopySingle = (log: BugLog) => {
    const text = formatBugForAgent(log);
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    toast.success('Log bug berhasil disalin dalam format AI Agent!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyAll = () => {
    const text = formatAllBugsForAgent(filteredLogs);
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success(`${filteredLogs.length} Log bug berhasil disalin untuk AI Agent!`);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bug_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('File JSON Log Bug berhasil diunduh');
  };

  const handleDelete = (id: string) => {
    const updated = deleteBugLog(id);
    setLogs(updated);
    toast.success('Log bug berhasil dihapus');
  };

  const handleClearAll = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua log bug?')) {
      clearBugLogs();
      setLogs([]);
      toast.success('Semua log bug berhasil dibersihkan');
    }
  };

  const handleToggleResolved = (id: string) => {
    const updated = toggleBugResolved(id);
    setLogs(updated);
  };

  const handleAddDemoBug = () => {
    addBugLog({
      message: 'Demo Runtime Error: Uncaught TypeError: Cannot read properties of undefined (reading "status")',
      stack: 'TypeError: Cannot read properties of undefined (reading "status")\n    at TicketCard (src/components/TicketCard.tsx:142:21)\n    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:16305:18)',
      source: 'src/components/TicketCard.tsx',
      line: 142,
      col: 21,
      type: 'runtime',
      userEmail: adminUser?.email || 'admin@test.com',
      userRole: 'admin',
    });
    reloadLogs();
    toast.success('Demo Bug Log berhasil ditambahkan untuk pengujian');
  };

  const handleAddManualBug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMessage.trim()) {
      toast.error('Pesan bug/error wajib diisi');
      return;
    }
    addBugLog({
      message: manualMessage.trim(),
      source: manualSource.trim() || 'Manual Report',
      stack: manualStack.trim(),
      type: 'manual',
      userEmail: adminUser?.email || 'admin@test.com',
      userRole: 'admin',
    });
    setManualMessage('');
    setManualSource('');
    setManualStack('');
    setShowManualModal(false);
    reloadLogs();
    toast.success('Bug manual berhasil dicatat dalam log!');
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (log.source && log.source.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (log.stack && log.stack.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterStatus === 'open') return matchesSearch && !log.resolved;
    if (filterStatus === 'resolved') return matchesSearch && log.resolved;
    return matchesSearch;
  });

  const openCount = logs.filter(l => !l.resolved).length;
  const resolvedCount = logs.filter(l => l.resolved).length;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${themeClasses.border} ${themeClasses.bgSecondary}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
              <Bug className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-base font-black ${themeClasses.text} flex items-center gap-2`}>
                <span>System Bug Log (Production)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-500">
                  {openCount} Open
                </span>
              </h3>
              <p className={`text-xs font-semibold ${themeClasses.textMuted} mt-0.5`}>
                Mencatat otomatis runtime error, promise rejection, dan laporan bug manual untuk diperbaharui oleh AI Agent.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAddDemoBug}
              className="px-3 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
              title="Buat sampel bug error untuk pengujian"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>+ Test Bug Demo</span>
            </button>
            <button
              type="button"
              onClick={() => setShowManualModal(true)}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Bug Manual</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200/20">
          <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/60' : 'bg-white'} border border-slate-200/20`}>
            <p className="text-[10px] font-black uppercase text-slate-400">Total Bug Recorded</p>
            <p className={`text-lg font-black ${themeClasses.text} mt-0.5`}>{logs.length}</p>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/60' : 'bg-white'} border border-slate-200/20`}>
            <p className="text-[10px] font-black uppercase text-rose-500">Perlu Dibenahi (Open)</p>
            <p className="text-lg font-black text-rose-500 mt-0.5">{openCount}</p>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/60' : 'bg-white'} border border-slate-200/20`}>
            <p className="text-[10px] font-black uppercase text-emerald-500">Selesai (Resolved)</p>
            <p className="text-lg font-black text-emerald-500 mt-0.5">{resolvedCount}</p>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/60' : 'bg-white'} border border-slate-200/20`}>
            <p className="text-[10px] font-black uppercase text-blue-500">Format AI Ready</p>
            <p className="text-lg font-black text-blue-500 mt-0.5">100% Format</p>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pesan bug, file source, atau stack trace..."
            className={`w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl border ${themeClasses.border} ${themeClasses.bgSecondary} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-rose-500/50`}
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 shrink-0">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${filterStatus === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            Semua ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${filterStatus === 'open' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-400 hover:text-rose-500'}`}
          >
            Open ({openCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${filterStatus === 'resolved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-emerald-500'}`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAll}
            disabled={filteredLogs.length === 0}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 active:scale-95"
          >
            {copiedAll ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedAll ? 'Tersalin untuk AI Agent!' : 'Salin Semua untuk AI Agent'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            disabled={logs.length === 0}
            className={`px-3.5 py-2 border ${themeClasses.border} ${themeClasses.bgSecondary} ${themeClasses.text} hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-xs font-black rounded-xl transition-all flex items-center gap-2 active:scale-95`}
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Unduh JSON</span>
          </button>
        </div>

        {logs.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="px-3 py-2 text-rose-500 hover:bg-rose-500/10 text-xs font-black rounded-xl transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Semua Log</span>
          </button>
        )}
      </div>

      {/* Bug Log List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className={`p-8 rounded-2xl border ${themeClasses.border} ${themeClasses.bgSecondary} text-center`}>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className={`text-sm font-black ${themeClasses.text}`}>Tidak Ada Bug Record Log</h4>
            <p className={`text-xs font-semibold ${themeClasses.textMuted} mt-1 max-w-md mx-auto`}>
              {searchQuery ? 'Tidak ada bug yang cocok dengan kata kunci pencarian Anda.' : 'Aplikasi berjalan lancar tanpa terdeteksi runtime error.'}
            </p>
          </div>
        ) : (
          filteredLogs.map((bug) => {
            const isExpanded = expandedLogId === bug.id;
            const isJustCopied = copiedId === bug.id;

            return (
              <div 
                key={bug.id} 
                className={`p-4 rounded-2xl border transition-all ${
                  bug.resolved 
                    ? `${isDark ? 'bg-slate-900/40 border-slate-800/80 opacity-75' : 'bg-slate-50 border-slate-200/80'}`
                    : `${isDark ? 'bg-slate-900 border-rose-900/40 shadow-sm' : 'bg-white border-rose-200 shadow-sm'}`
                }`}
              >
                {/* Log Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        bug.type === 'runtime' ? 'bg-rose-500/20 text-rose-500' :
                        bug.type === 'unhandledrejection' ? 'bg-purple-500/20 text-purple-400' :
                        bug.type === 'manual' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'
                      }`}>
                        {bug.type}
                      </span>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        bug.resolved ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500 animate-pulse'
                      }`}>
                        {bug.resolved ? 'RESOLVED' : 'OPEN BUG'}
                      </span>

                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(bug.timestamp).toLocaleString('id-ID')}
                      </span>

                      {bug.source && (
                        <span className="text-[10px] font-mono font-extrabold text-blue-500 dark:text-blue-400 truncate max-w-[200px]">
                          📍 {bug.source}{bug.line ? `:${bug.line}` : ''}
                        </span>
                      )}
                    </div>

                    {/* Main Error Message */}
                    <div className="p-3 rounded-xl bg-slate-900 text-rose-400 font-mono text-xs font-bold leading-relaxed break-all select-all border border-slate-800">
                      {bug.message}
                    </div>
                  </div>

                  {/* Top Action Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopySingle(bug)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        isJustCopied 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:scale-95'
                      }`}
                      title="Salin prompt bug untuk AI Agent"
                    >
                      {isJustCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isJustCopied ? 'Tersalin!' : 'Copy AI Agent'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleResolved(bug.id)}
                      className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
                        bug.resolved 
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-emerald-500' 
                          : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                      }`}
                      title={bug.resolved ? 'Tandai Belum Selesai (Open)' : 'Tandai Selesai (Resolved)'}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(bug.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-500/10 transition-all"
                      title="Hapus Log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/20 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <div className="flex items-center gap-3">
                    <span>User: <strong className="text-slate-300">{bug.userEmail || 'Guest'}</strong></span>
                    <span>URL: <span className="font-mono text-[10px] text-slate-400">{bug.url}</span></span>
                  </div>

                  {bug.stack && (
                    <button
                      type="button"
                      onClick={() => setExpandedLogId(isExpanded ? null : bug.id)}
                      className="text-xs font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Sembunyikan Stack Trace' : 'Lihat Stack Trace'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Stack Trace Box */}
                {isExpanded && bug.stack && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 whitespace-pre-wrap select-all">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">--- Stack Trace Complete ---</p>
                    {bug.stack}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tambah Manual Bug */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl space-y-4 ${themeClasses.card} ${themeClasses.text} ${themeClasses.border}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black flex items-center gap-2">
                <Bug className="w-5 h-5 text-rose-500" />
                <span>Lapor Bug Manual</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualBug} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-400 block mb-1">Pesan Error / Deskripsi Bug *</label>
                <textarea
                  required
                  rows={3}
                  value={manualMessage}
                  onChange={(e) => setManualMessage(e.target.value)}
                  placeholder="Contoh: Tombol simpan di Master Perangkat tidak merespons saat diklik..."
                  className={`w-full p-3 text-xs font-semibold rounded-xl border ${themeClasses.border} ${themeClasses.bgSecondary} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-rose-500/50`}
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-400 block mb-1">Lokasi Component / Halaman (Opsional)</label>
                <input
                  type="text"
                  value={manualSource}
                  onChange={(e) => setManualSource(e.target.value)}
                  placeholder="Contoh: src/components/MasterPerangkat.tsx"
                  className={`w-full p-2.5 text-xs font-semibold rounded-xl border ${themeClasses.border} ${themeClasses.bgSecondary} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-rose-500/50`}
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-400 block mb-1">Stack Trace / Log Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  value={manualStack}
                  onChange={(e) => setManualStack(e.target.value)}
                  placeholder="Paste error log jika ada..."
                  className={`w-full p-2.5 text-xs font-mono text-[11px] rounded-xl border ${themeClasses.border} ${themeClasses.bgSecondary} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-rose-500/50`}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20"
                >
                  Simpan Log Bug
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
