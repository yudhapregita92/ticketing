import React from 'react';
import { motion } from 'framer-motion';
import { 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Ticket as TicketIcon,
  RotateCcw
} from 'lucide-react';
import { ITicket, IAdminUser } from '../types';
import { TicketCard } from './TicketCard';
import { Shimmer } from './Common';

interface TicketListProps {
  adminUser: IAdminUser | null;
  isDark: boolean;
  themeClasses: any;
  viewMode: 'today' | 'all';
  setViewMode: (mode: 'today' | 'all') => void;
  filterDept: string;
  setFilterDept: (dept: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterDate: string;
  setFilterDate: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  departments: { id: number, name: string }[];
  loading: boolean;
  paginatedTickets: ITicket[];
  filteredTickets: ITicket[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  handleSelectTicket: (ticket: ITicket) => void;
}

export const TicketList: React.FC<TicketListProps> = ({
  adminUser,
  isDark,
  themeClasses,
  viewMode,
  setViewMode,
  filterDept,
  setFilterDept,
  filterStatus,
  setFilterStatus,
  filterDate,
  setFilterDate,
  searchQuery,
  setSearchQuery,
  departments,
  loading,
  paginatedTickets,
  filteredTickets,
  currentPage,
  setCurrentPage,
  totalPages,
  handleSelectTicket
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  return (
    <div className="lg:col-span-3 space-y-4 lg:space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <button 
              onClick={() => setViewMode('today')}
              className={`relative pb-1.5 text-xs font-bold transition-all ${
                viewMode === 'today' ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              Antrian Hari Ini
              {viewMode === 'today' && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                />
              )}
            </button>
            <button 
              onClick={() => setViewMode('all')}
              className={`relative pb-1.5 text-xs font-bold transition-all ${
                viewMode === 'all' ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              Semua Antrian
              {viewMode === 'all' && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                />
              )}
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all text-[9px] font-bold shadow-sm ${
                showFilters 
                  ? 'bg-emerald-500 text-white border-emerald-500' 
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              <Filter className="w-3 h-3" />
              FILTER
            </button>
            <button 
              onClick={() => {
                setSearchQuery('');
                setFilterDept('');
                setFilterStatus('');
                setFilterDate('');
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        {(showFilters || searchQuery) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari tiket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-bold border transition-all outline-none ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-white focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>

            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl text-xs font-bold border transition-all outline-none appearance-none ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-white focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
              }`}
            >
              <option value="">Semua Departemen</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl text-xs font-bold border transition-all outline-none appearance-none ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-white focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
              }`}
            >
              <option value="">Semua Status</option>
              <option value="New">Waiting</option>
              <option value="In Progress">Active</option>
              <option value="Completed">Done</option>
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl text-xs font-bold border transition-all outline-none ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-white focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
              }`}
            />
          </motion.div>
        )}
      </div>

      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
        Menampilkan <span className="text-slate-900">{paginatedTickets.length > 0 ? (currentPage - 1) * 10 + 1 : 0} - {Math.min(currentPage * 10, filteredTickets.length)}</span> dari <span className="text-slate-900">{filteredTickets.length}</span> tiket
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`${themeClasses.card} rounded-2xl border p-5 shadow-sm space-y-4`}>
              <div className="flex justify-between">
                <Shimmer className="w-24 h-4" />
                <Shimmer className="w-16 h-4" />
              </div>
              <Shimmer className="w-1/2 h-6" />
              <div className="flex gap-4">
                <Shimmer className="w-20 h-4" />
                <Shimmer className="w-20 h-4" />
              </div>
            </div>
          ))
        ) : paginatedTickets.length > 0 ? (
          paginatedTickets.map(ticket => (
            <TicketCard 
              key={ticket.id}
              ticket={ticket}
              isDark={isDark}
              themeClasses={themeClasses}
              handleSelectTicket={handleSelectTicket}
            />
          ))
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`rounded-3xl border border-dashed p-12 sm:p-20 text-center ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50/50 border-slate-200'}`}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-6">
              <TicketIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
            </div>
            <h3 className={`text-base sm:text-lg font-black mb-2 ${themeClasses.text}`}>Tidak Ada Tiket</h3>
            <p className="text-xs sm:text-sm font-medium text-slate-400 max-w-xs mx-auto">
              {searchQuery || filterDept || filterStatus || filterDate 
                ? "Tidak ada tiket yang sesuai dengan filter pencarian Anda." 
                : "Belum ada laporan yang masuk saat ini."}
            </p>
          </motion.div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className={`p-2 rounded-xl border transition-all disabled:opacity-30 ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs font-black transition-all ${
                  currentPage === i + 1 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : isDark ? 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:bg-zinc-800' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className={`p-2 rounded-xl border transition-all disabled:opacity-30 ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
