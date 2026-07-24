import React, { useState, useMemo } from 'react';
import { 
  MonitorSmartphone, 
  Search, 
  BarChart3, 
  Filter, 
  Download, 
  AlertTriangle,
  Monitor,
  Smartphone,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { ITicket, IAdminUser } from '../types';

interface ReportPerangkatProps {
  tickets: ITicket[];
  isDark: boolean;
  themeClasses: any;
  adminUser: IAdminUser | null;
  masterUsers: any[];
  categories?: any[];
}

export const ReportPerangkat: React.FC<ReportPerangkatProps> = ({ 
  tickets, 
  isDark, 
  themeClasses,
  adminUser,
  masterUsers,
  categories = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDeviceType, setFilterDeviceType] = useState('all'); // all, pc, smartphone
  const [filterJenisMasalah, setFilterJenisMasalah] = useState('all');
  
  // Create a mapping from category name to jenis_masalah
  const categoryToJenis = useMemo(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(categories)) {
      categories.forEach(c => {
        if (c.name && c.jenis_masalah) {
          map[c.name] = c.jenis_masalah;
        }
      });
    }
    return map;
  }, [categories]);

  // Aggregate data
  const deviceStats = useMemo(() => {
    const stats: Record<string, any> = {};
    
    tickets.forEach(ticket => {
      // Determine device identifier
      let deviceId = '';
      let deviceName = '';
      let type = ticket.device_type || 'unknown';
      
      if (type === 'pc' && ticket.pc_code) {
        deviceId = `PC_${ticket.pc_code}`;
        deviceName = `PC: ${ticket.pc_code}`;
      } else if (type === 'smartphone') {
        // Fallback for smartphone since they usually don't have pc_code
        // We might group by user for smartphones
        deviceId = `PHONE_${ticket.name}`;
        deviceName = `Phone: ${ticket.name}`;
      } else {
        deviceId = `UNKNOWN_${ticket.name}`;
        deviceName = `Unknown: ${ticket.name}`;
      }
      
      if (!deviceId) return;

      if (!stats[deviceId]) {
        stats[deviceId] = {
          id: deviceId,
          name: deviceName,
          type: type,
          totalTickets: 0,
          hardwareIssues: 0,
          aplikasiIssues: 0,
          categories: {} as Record<string, number>,
          users: new Set<string>()
        };
      }
      
      stats[deviceId].totalTickets++;
      stats[deviceId].users.add(ticket.name);
      
      const cat = ticket.category || 'Uncategorized';
      stats[deviceId].categories[cat] = (stats[deviceId].categories[cat] || 0) + 1;

      const jenis = ticket.jenis_masalah || categoryToJenis[cat] || 'Unknown';
      if (jenis === 'Hardware') stats[deviceId].hardwareIssues++;
      else if (jenis === 'Aplikasi') stats[deviceId].aplikasiIssues++;
      
    });
    
    let result = Object.values(stats).map(stat => ({
      ...stat,
      users: Array.from(stat.users).join(', ')
    }));
    
    if (filterDeviceType !== 'all') {
      result = result.filter(s => s.type === filterDeviceType);
    }
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.users.toLowerCase().includes(q)
      );
    }
    
    // Sort by total tickets descending
    result.sort((a, b) => b.totalTickets - a.totalTickets);
    
    return result;
  }, [tickets, searchTerm, filterDeviceType, categoryToJenis]);

  const handleExportCSV = () => {
    if (deviceStats.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    const headers = ['Perangkat', 'Tipe', 'Total Kendala', 'Hardware', 'Aplikasi', 'Pengguna'];
    const rows = deviceStats.map(stat => [
      `"${stat.name}"`,
      `"${stat.type}"`,
      stat.totalTickets,
      stat.hardwareIssues,
      stat.aplikasiIssues,
      `"${stat.users}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Report_Perangkat_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-3`}>
            <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
              <MonitorSmartphone className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            Report Perangkat
          </h1>
          <p className={`mt-1 sm:mt-1.5 text-xs sm:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Analisis perangkat yang paling sering mengalami kendala
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className={`${themeClasses.card} rounded-[1.5rem] p-4 border shadow-sm`}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input 
              type="text"
              placeholder="Cari perangkat atau pengguna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            <select 
              className={`px-3 py-2 rounded-xl border text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-w-[140px] ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              value={filterDeviceType}
              onChange={(e) => setFilterDeviceType(e.target.value)}
            >
              <option value="all">Semua Tipe</option>
              <option value="pc">Komputer PC</option>
              <option value="smartphone">Smartphone/Laptop</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {deviceStats.slice(0, 4).map((stat, idx) => (
          <div key={stat.id} className={`${themeClasses.card} rounded-[1.5rem] p-4 border shadow-sm relative overflow-hidden group`}>
            {idx === 0 && (
              <div className="absolute top-0 right-0 p-2">
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-1 rounded-lg">
                  <AlertTriangle className="w-3 h-3" /> Paling Sering
                </span>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                stat.type === 'pc' 
                  ? (isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-200')
                  : (isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200')
              }`}>
                {stat.type === 'pc' ? <Monitor className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.name}</h3>
                <p className={`text-[10px] font-bold truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {stat.users}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-dashed flex items-end justify-between" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total Tiket</p>
                <div className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {stat.totalTickets}
                </div>
              </div>
              <div className="flex items-center gap-2 text-right">
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>HW</span>
                  <span className={`text-xs font-black ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>{stat.hardwareIssues}</span>
                </div>
                <div className={`w-px h-6 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>App</span>
                  <span className={`text-xs font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{stat.aplikasiIssues}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`${themeClasses.card} rounded-[1.5rem] border shadow-sm overflow-hidden`}>
        <div className="p-4 border-b border-dashed flex items-center justify-between" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Detail Perangkat Bermasalah</h3>
          <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Menampilkan {deviceStats.length} data
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                <th className={`p-4 text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Perangkat</th>
                <th className={`p-4 text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Kendala</th>
                <th className={`p-4 text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hardware / Aplikasi</th>
                <th className={`p-4 text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Top Kategori</th>
                <th className={`p-4 text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pengguna</th>
              </tr>
            </thead>
            <tbody className="divide-y border-t" style={{ borderColor: isDark ? '#1e293b' : '#e2e8f0' }}>
              {deviceStats.length > 0 ? (
                deviceStats.map((stat, idx) => {
                  const topCat = Object.entries(stat.categories).sort((a: any, b: any) => b[1] - a[1])[0];
                  return (
                    <tr key={stat.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            stat.type === 'pc' 
                              ? (isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-200')
                              : (isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200')
                          }`}>
                            {stat.type === 'pc' ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'} ${idx < 3 ? 'text-rose-500 dark:text-rose-400' : ''}`}>
                              {stat.name}
                            </div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {stat.type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {stat.totalTickets} <span className="text-xs font-bold text-slate-400">tiket</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5" title="Hardware">
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{stat.hardwareIssues}</span>
                          </div>
                          <div className="flex items-center gap-1.5" title="Aplikasi">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{stat.aplikasiIssues}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {topCat ? (
                          <div className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold border ${
                            isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {topCat[0]} ({topCat[1]})
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className={`text-xs font-medium max-w-[200px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`} title={stat.users}>
                          {stat.users}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search className="w-8 h-8 mb-3 opacity-20" />
                      <p className="text-sm font-bold">Tidak ada data perangkat bermasalah</p>
                    </div>
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
