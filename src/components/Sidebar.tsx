import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  BarChart3, 
  ChevronUp, 
  ChevronDown, 
  Zap,
  Send
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { IAdminUser, ITicket, COLORS } from '../types';
import { Counter } from './Common';

interface SidebarProps {
  adminUser: IAdminUser | null;
  isDark: boolean;
  themeClasses: any;
  tickets: ITicket[];
  filteredTickets: ITicket[];
  categoryStats: { name: string, value: number }[];
  showDistribution: boolean;
  setShowDistribution: (show: boolean) => void;
  primaryColor: string;
  setShowForm: (show: boolean) => void;
  fetchTickets: (showLoading?: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  adminUser,
  isDark,
  themeClasses,
  tickets,
  filteredTickets,
  categoryStats,
  showDistribution,
  setShowDistribution,
  primaryColor,
  setShowForm,
  fetchTickets
}) => {
  return (
    <div className="lg:col-span-1 space-y-4 lg:space-y-6">
      {/* Admin Notifications */}
      {adminUser && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, boxShadow: isDark ? "0 20px 40px -10px rgba(0,0,0,0.5)" : "0 20px 40px -10px rgba(0,0,0,0.05)" }}
          className={`${themeClasses.card} rounded-3xl border p-4 sm:p-6 shadow-sm overflow-hidden relative`}
        >
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Bell className={`w-24 h-24 ${isDark ? 'text-white' : 'text-slate-900'}`} />
          </div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${isDark ? 'bg-rose-900/30 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className={`text-xs font-bold capitalize tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} whitespace-nowrap`}>Smart Notifications</h2>
                <p className="text-[9px] text-slate-400 font-medium">Real-time system alerts</p>
              </div>
            </div>
            {typeof window !== 'undefined' && "Notification" in window && Notification.permission !== "granted" && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => Notification.requestPermission().then(() => fetchTickets())}
                className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all group"
                title="Aktifkan Notifikasi Browser"
              >
                <Bell className="w-4 h-4 animate-bounce group-hover:animate-none" />
              </motion.button>
            )}
          </div>
          
          <div className="space-y-3">
            {tickets.filter(t => t.status === 'New').length > 0 ? (
              <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 group hover:bg-rose-50 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-rose-600 capitalize tracking-wider whitespace-nowrap">
                    <motion.div
                      animate={{ rotate: [-10, 10, -10, 10, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 2 }}
                    >
                      <AlertCircle className="w-3 h-3" />
                    </motion.div>
                    Action Required
                  </span>
                  <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-bold rounded-full animate-pulse shadow-sm shadow-rose-200">
                    {tickets.filter(t => t.status === 'New').length}
                  </span>
                </div>
                <p className="text-[10px] text-rose-700 font-semibold leading-tight">Ada tiket yang menunggu respon Anda segera.</p>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <p className="text-xs text-emerald-700 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Inbox Zero! Semua tiket telah direspon.
                </p>
              </div>
            )}

            {(() => {
              const today = new Date().toLocaleDateString('en-CA');
              const newToday = tickets.filter(t => new Date(t.created_at).toLocaleDateString('en-CA') === today).length;
              if (newToday > 0) {
                return (
                  <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 group hover:bg-blue-50 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5 text-[9px] font-bold text-blue-600 capitalize tracking-wider whitespace-nowrap">
                        <TrendingUp className="w-3 h-3" /> Traffic Update
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-full shadow-sm shadow-blue-200">
                        {newToday}
                      </span>
                    </div>
                    <p className="text-[10px] text-blue-700 font-semibold leading-tight">Tiket baru masuk hari ini.</p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </motion.section>
      )}

      {/* Queue Statistics */}
      <section className={`${themeClasses.card} rounded-[1.5rem] border p-5 shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-bold ${themeClasses.text}`}>Status Antrian</h2>
          <BarChart3 className="w-4 h-4 text-slate-300" />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <motion.div 
            whileHover={{ y: -2, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`${themeClasses.card} ${themeClasses.border} border rounded-xl p-1.5 flex flex-col items-center justify-center text-center`}
          >
            <Counter value={filteredTickets.length} className={`text-sm font-black leading-none mb-0.5 ${themeClasses.text}`} />
            <span className="text-[8px] font-bold text-slate-400 capitalize tracking-tight whitespace-nowrap">Total</span>
          </motion.div>
          <motion.div 
            whileHover={{ y: -2, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'} border rounded-xl p-1.5 flex flex-col items-center justify-center text-center`}
          >
            <Counter value={filteredTickets.filter(t => t.status === 'New').length} className="text-sm font-black text-amber-500 leading-none mb-0.5" />
            <span className="text-[8px] font-bold text-amber-500 capitalize tracking-tight whitespace-nowrap">Baru</span>
          </motion.div>
          <motion.div 
            whileHover={{ y: -2, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'} border rounded-xl p-1.5 flex flex-col items-center justify-center text-center`}
          >
            <Counter value={filteredTickets.filter(t => t.status === 'In Progress').length} className="text-sm font-black text-blue-500 leading-none mb-0.5" />
            <span className="text-[8px] font-bold text-blue-500 capitalize tracking-tight whitespace-nowrap">Progres</span>
          </motion.div>
          <motion.div 
            whileHover={{ y: -2, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'} border rounded-xl p-1.5 flex flex-col items-center justify-center text-center`}
          >
            <Counter value={filteredTickets.filter(t => t.status === 'Completed').length} className="text-sm font-black text-emerald-500 leading-none mb-0.5" />
            <span className="text-[8px] font-bold text-emerald-500 capitalize tracking-tight whitespace-nowrap">Selesai</span>
          </motion.div>
        </div>
      </section>

      {/* Issue Distribution (Pie Chart) */}
      {adminUser && categoryStats.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${themeClasses.card} rounded-3xl border p-4 sm:p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className={`text-sm font-bold capitalize tracking-wider ${themeClasses.text}`}>Distribusi Masalah</h2>
            <button 
              onClick={() => setShowDistribution(!showDistribution)}
              className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
            >
              {showDistribution ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showDistribution && (
            <div className="h-48 w-full min-w-0" style={{ minHeight: '192px' }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={192}>
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#ffffff' : '#000000'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="grid grid-cols-2 gap-y-2 mt-4">
            {categoryStats.map((stat, idx) => (
              <div key={stat.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className={`text-[10px] font-bold capitalize truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.name}</span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Help CTA */}
      <section 
        className="hidden lg:block rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group transition-all"
        style={{ backgroundColor: primaryColor, boxShadow: `0 20px 25px -5px ${primaryColor}30` }}
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <Zap className="w-20 h-20" />
        </div>
        <h3 className="font-black text-xl mb-3">Butuh Bantuan?</h3>
        <p className="text-white/80 text-sm leading-relaxed mb-6 font-medium">
          Kirim tiket untuk masalah teknis. Tim IT kami akan memproses permintaan Anda sesegera mungkin.
        </p>
        <button 
          onClick={() => setShowForm(true)}
          className={`w-full font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
            isDark ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-900 hover:bg-slate-50'
          }`}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [1, 0.8, 1]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Send className="w-4 h-4 text-emerald-500" />
          </motion.div>
          Buat Tiket Sekarang
        </button>
      </section>
    </div>
  );
};
