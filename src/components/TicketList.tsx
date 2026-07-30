import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  RefreshCcw,
  ChevronRight,
  Ticket as TicketIcon,
  SlidersHorizontal,
  CheckCircle2,
  Activity,
  AlertCircle
} from 'lucide-react';
import { ITicket, IAdminUser, ICategory } from '../types';
import { TicketCard } from './TicketCard';
import { SkeletonTicket, RollingNumber } from './Common';

interface TicketListProps {
  adminUser: IAdminUser | null;
  isDark: boolean;
  themeClasses: any;
  categories?: ICategory[];
  viewMode: 'today' | 'all' | 'my_tickets' | 'dashboard' | 'assets';
  setViewMode: (mode: any) => void;
  filterDept: string;
  setFilterDept: (dept: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterDate: string;
  setFilterDate: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  tickets: ITicket[];
  filteredTickets: ITicket[];
  paginatedTickets: ITicket[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  itemsPerPage: number;
  handleSelectTicket: (ticket: ITicket) => void;
  handleDeleteTicket: (id: number) => void;
  handleIntervention: (id: number, type: 'takeover' | 'reassign') => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  formatDate: (date: string) => string;
  fetchTickets: (showToast?: boolean) => Promise<void>;
  setShowMobileFilter: (show: boolean) => void;
  setTempFilters: (filters: any) => void;
  selectedTickets: number[];
  setSelectedTickets: React.Dispatch<React.SetStateAction<number[]>>;
  primaryColor: string;
  CurrentLogo: any;
  setShowForm: (show: boolean) => void;
  handleBulkAction: (status: string) => Promise<void>;
}

export const TicketList: React.FC<TicketListProps> = ({
  adminUser,
  isDark,
  themeClasses,
  categories = [],
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
  loading,
  tickets,
  filteredTickets,
  paginatedTickets,
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  handleSelectTicket,
  handleDeleteTicket,
  handleIntervention,
  getStatusIcon,
  getStatusColor,
  formatDate,
  fetchTickets,
  setShowMobileFilter,
  setTempFilters,
  selectedTickets,
  setSelectedTickets,
  primaryColor,
  CurrentLogo,
  setShowForm,
  handleBulkAction
}) => {
  return (
    <div className="lg:col-span-2 space-y-2 sm:space-y-3">
      {/* Mobile Navigation Tabs */}
      <div className="lg:hidden flex flex-col gap-3 mb-4">
        {/* Interactive Stats Quick-Filter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
          {[
            { 
              id: '', 
              label: 'Semua Tiket', 
              count: tickets.length,
              icon: <TicketIcon className="w-5 h-5" />,
              numColor: 'text-blue-600 dark:text-blue-400',
              iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
              activeClass: 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20',
              idleClass: isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'
            },
            { 
              id: 'New', 
              label: 'Tiket Baru', 
              count: tickets.filter(t => t.status === 'New').length,
              icon: <CheckCircle2 className="w-5 h-5" />,
              numColor: 'text-emerald-600 dark:text-emerald-400',
              iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              activeClass: 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20',
              idleClass: isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'
            },
            { 
              id: 'In Progress', 
              label: 'Tiket Progres', 
              count: tickets.filter(t => t.status === 'In Progress').length,
              icon: <Activity className="w-5 h-5" />,
              numColor: 'text-orange-600 dark:text-orange-400',
              iconBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
              activeClass: 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/50 dark:bg-orange-900/20',
              idleClass: isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'
            },
            { 
              id: 'Re-opened', 
              label: 'Tiket Reopen', 
              count: tickets.filter(t => t.status === 'Re-opened').length,
              icon: <AlertCircle className="w-5 h-5" />,
              numColor: 'text-purple-600 dark:text-purple-400',
              iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
              activeClass: 'border-purple-500 ring-1 ring-purple-500 bg-purple-50/50 dark:bg-purple-900/20',
              idleClass: isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'
            }
          ].map((item) => {
            const isActive = filterStatus === item.id;
            return (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus(item.id)}
                className={`p-3 sm:p-4 rounded-md sm:rounded-md border text-left flex items-center justify-between transition-all ${
                  isActive ? item.activeClass : item.idleClass
                }`}
              >
                <div className="flex flex-col h-full justify-between gap-2 sm:gap-3">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {item.label}
                  </span>
                  <span className={`text-xl sm:text-2xl font-black leading-none ${item.numColor}`}>
                    <RollingNumber value={item.count} />
                  </span>
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-md sm:rounded-md flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                  {item.icon}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Quick Actions (Filter and Refresh) */}
        <div className="flex items-center justify-end gap-2 p-1.5 rounded-md">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => {
                setTempFilters({ dept: filterDept, status: filterStatus, date: filterDate, search: searchQuery });
                setShowMobileFilter(true);
              }}
              className={`flex items-center justify-center w-8 h-8 rounded-md border relative ${
                (filterDept || filterStatus || filterDate || searchQuery)
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-800'
                : isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
              title="Filter"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {(filterDept || filterStatus || filterDate || searchQuery) && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
            <button 
              onClick={() => fetchTickets(true)}
              className={`flex items-center justify-center w-8 h-8 rounded-md border ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
              title="Segarkan Antrian"
              aria-label="Refresh tickets"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Filter Controls (Only visible on desktop) */}
      <div className="hidden lg:flex items-center justify-end gap-2 mb-2">
        <button 
          onClick={() => {
            setFilterDept('');
            setFilterStatus('');
            setFilterDate('');
          }}
          className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 capitalize tracking-wider"
        >
          Atur Ulang Filter
        </button>
        <button 
          onClick={() => fetchTickets(true)}
          className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
          title="Segarkan Antrian"
          aria-label="Refresh tickets"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Results Summary & Filter Toggle */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className={`text-[10px] sm:text-xs font-bold ${themeClasses.textMuted} flex items-center gap-1`}>
          Menampilkan 
          <RollingNumber value={Math.min((currentPage - 1) * itemsPerPage + 1, filteredTickets.length)} className={themeClasses.text} /> 
          - 
          <RollingNumber value={Math.min(currentPage * itemsPerPage, filteredTickets.length)} className={themeClasses.text} /> 
          dari 
          <RollingNumber value={filteredTickets.length} className={themeClasses.text} /> 
          tiket
        </div>
        <div className="flex items-center gap-3">
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-[10px] font-bold text-rose-500 hover:underline"
            >
              Hapus Pencarian
            </button>
          )}
          <button
            onClick={() => setShowMobileFilter(true)}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${themeClasses.card} ${themeClasses.border} hover:border-emerald-500 hover:text-emerald-500 ${themeClasses.text}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter Antrian
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map(i => <SkeletonTicket key={i} isDark={isDark} />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-md border border-dashed ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <CurrentLogo className="w-12 h-12 text-slate-200 mb-4" />
          <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No tickets in queue</p>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-4 text-emerald-600 font-bold text-sm hover:underline"
          >
            Be the first to submit
          </button>
        </div>
      ) : (
        <motion.div 
          className="space-y-1.5"
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          style={{ touchAction: 'pan-y' }}
          onDragEnd={(_, info) => {
            const swipeThreshold = 50;
            if (info.offset.x > swipeThreshold) {
              // Swipe Right -> Previous Tab
              if (viewMode === 'all') setViewMode('today');
              else if (viewMode === 'my_tickets') setViewMode('all');
            } else if (info.offset.x < -swipeThreshold) {
              // Swipe Left -> Next Tab
              if (viewMode === 'today') setViewMode('all');
              else if (viewMode === 'all' && adminUser) setViewMode('my_tickets');
            }
          }}
        >
          <AnimatePresence mode="popLayout">
            {filteredTickets.length === 0 ? (
              <motion.div 
                key="no-match"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`flex flex-col items-center justify-center py-20 rounded-md border border-dashed ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <Filter className="w-12 h-12 text-slate-200 mb-4" />
                </motion.div>
                <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No tickets match your filter</p>
                <button 
                  onClick={() => {
                    setFilterDept('');
                    setFilterStatus('');
                    setFilterDate('');
                    setSearchQuery('');
                  }}
                  className="mt-4 text-emerald-600 font-bold text-sm hover:underline"
                >
                  Reset filters
                </button>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {adminUser && filteredTickets.length > 0 && (
                  <div className="flex items-center gap-2 px-2 mb-1">
                    <input 
                      type="checkbox"
                      checked={selectedTickets.length === paginatedTickets.length && paginatedTickets.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTickets(paginatedTickets.map(t => t.id));
                        } else {
                          setSelectedTickets([]);
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={`text-[10px] font-bold ${themeClasses.textMuted} capitalize tracking-wider`}>Pilih Semua di Halaman Ini</span>
                  </div>
                )}
                {paginatedTickets.map((ticket, index) => (
                  <TicketCard 
                    key={ticket.id}
                    ticket={ticket}
                    index={index}
                    isDark={isDark}
                    themeClasses={themeClasses}
                    adminUser={adminUser}
                    selectedTickets={selectedTickets}
                    setSelectedTickets={setSelectedTickets}
                    handleSelectTicket={handleSelectTicket}
                    handleDeleteTicket={handleDeleteTicket}
                    handleIntervention={handleIntervention}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                    searchQuery={searchQuery}
                    categories={categories}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-md border transition-all ${
                  currentPage === 1 
                  ? 'opacity-30 cursor-not-allowed' 
                  : isDark ? 'hover:bg-emerald-900/30 hover:border-emerald-800 text-slate-300' : 'hover:bg-emerald-50 hover:border-emerald-200 text-slate-600'
                } ${themeClasses.card}`}
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-md text-[10px] font-bold transition-all ${
                          currentPage === page
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : `border hover:bg-emerald-50 ${themeClasses.card} ${themeClasses.textMuted}`
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    (page === 2 && currentPage > 3) || 
                    (page === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return <span key={page} className="text-slate-400 px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md border transition-all ${
                  currentPage === totalPages 
                  ? 'opacity-30 cursor-not-allowed' 
                  : isDark ? 'hover:bg-emerald-900/30 hover:border-emerald-800 text-slate-300' : 'hover:bg-emerald-50 hover:border-emerald-200 text-slate-600'
                } ${themeClasses.card}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedTickets.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-lg bg-slate-900 text-white rounded-md p-4 shadow-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-md flex items-center justify-center shadow-lg shadow-emerald-900/40">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black capitalize tracking-widest">{selectedTickets.length} Tiket Terpilih</p>
                <p className="text-[10px] text-slate-400 font-medium">Lakukan aksi massal untuk tiket ini</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={() => handleBulkAction('In Progress')}
                className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-[9px] font-black capitalize tracking-widest transition-all active:scale-95"
              >
                Progres
              </button>
              <button 
                onClick={() => handleBulkAction('Completed')}
                className="flex-1 sm:flex-none px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md text-[9px] font-black capitalize tracking-widest transition-all active:scale-95"
              >
                Selesai
              </button>
              <button 
                onClick={() => handleBulkAction('delete')}
                className="flex-1 sm:flex-none px-3 py-2 bg-rose-600 hover:bg-rose-700 rounded-md text-[9px] font-black capitalize tracking-widest transition-all active:scale-95"
              >
                Hapus
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
