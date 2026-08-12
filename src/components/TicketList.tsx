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
  AlertCircle,
  ArrowUpDown,
  User,
  Users,
  Calendar,
  History
} from 'lucide-react';
import { ITicket, IAdminUser, ICategory, ViewMode } from '../types';
import { TicketCard } from './TicketCard';
import { SkeletonTicket, RollingNumber } from './Common';
import { UserHeroBanner } from './UserHeroBanner';
import { isSubDeptHeadOrSuperAdmin, getPendingApprovalCount, canViewTeamTickets, isTeamTicketForUser, isPelaksana } from '../utils/rbacUtils';
import { isUserTicket } from '../utils/ticketUtils';
import { parseSafeDate } from '../utils/dateUtils';

interface TicketListProps {
  adminUser: IAdminUser | null;
  currentUser?: any;
  isDark: boolean;
  themeClasses: any;
  categories?: ICategory[];
  viewMode: ViewMode;
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
  appSettings?: any;
  onForwardWhatsApp?: (ticket: ITicket) => void;
  masterUsers?: any[];
}

export const TicketList: React.FC<TicketListProps> = ({
  adminUser,
  currentUser,
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
  handleBulkAction,
  appSettings,
  onForwardWhatsApp,
  masterUsers
}) => {
  const cardRadius = appSettings?.ui_card_radius ?? 24;

  return (
    <div className="lg:col-span-2 space-y-2 sm:space-y-3">
      {/* Banner Hero - Displayed only for Users (not Admin) */}
      {!adminUser && (
        <UserHeroBanner 
          currentUser={currentUser}
          tickets={tickets}
          isDark={isDark}
          primaryColor={primaryColor}
          appSettings={appSettings}
        />
      )}

      {/* Compact Interactive Menu Cards (Exact requested layout and card styling) */}
      <div className="mb-3 sm:mb-4">
        <div className={`grid grid-cols-2 ${isSubDeptHeadOrSuperAdmin(adminUser || currentUser) ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-2.5 sm:gap-3 w-full`}>
          {[
            { 
              key: 'all_tickets',
              label: 'SEMUA TIKET', 
              count: tickets.length,
              icon: <TicketIcon className="w-4 h-4 sm:w-5 sm:h-5" />,
              numColor: 'text-blue-600 dark:text-blue-400',
              iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
              activeClass: 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm',
              idleClass: isDark ? 'bg-slate-900/90 border-slate-800 hover:bg-slate-850' : 'bg-white border-slate-200/90 hover:bg-slate-50',
              pulsePing: 'bg-blue-400',
              pulseDot: 'bg-blue-500',
              dotActive: 'bg-blue-500',
              isActive: viewMode === 'all' && !filterStatus,
              isFullWidth: isSubDeptHeadOrSuperAdmin(adminUser || currentUser),
              onClick: () => { setViewMode('all'); setFilterStatus(''); }
            },
            { 
              key: 'my_tickets',
              label: 'TIKET SAYA', 
              count: tickets.filter(t => isUserTicket(t, currentUser)).length,
              icon: <User className="w-4 h-4 sm:w-5 sm:h-5" />,
              numColor: 'text-emerald-600 dark:text-emerald-400',
              iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              activeClass: 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm',
              idleClass: isDark ? 'bg-slate-900/90 border-slate-800 hover:bg-slate-850' : 'bg-white border-slate-200/90 hover:bg-slate-50',
              pulsePing: 'bg-emerald-400',
              pulseDot: 'bg-emerald-500',
              dotActive: 'bg-emerald-500',
              isActive: viewMode === 'my_tickets' && !filterStatus,
              isFullWidth: false,
              onClick: () => { setViewMode('my_tickets'); setFilterStatus(''); }
            },
            ...(isSubDeptHeadOrSuperAdmin(adminUser || currentUser) ? [{
              key: 'approval_pending',
              label: 'SETUJUI PENGADAAN',
              count: getPendingApprovalCount(tickets),
              icon: <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />,
              numColor: 'text-amber-600 dark:text-amber-400',
              iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
              activeClass: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm',
              idleClass: isDark ? 'bg-slate-900/90 border-slate-800 hover:bg-slate-850' : 'bg-white border-slate-200/90 hover:bg-slate-50',
              pulsePing: 'bg-amber-400',
              pulseDot: 'bg-amber-500',
              dotActive: 'bg-amber-500',
              isActive: viewMode === 'Setujui Pengadaan' && !filterStatus,
              isFullWidth: false,
              onClick: () => { setViewMode('Setujui Pengadaan'); setFilterStatus(''); }
            }] : []),
            { 
              key: 'team_tickets',
              label: isPelaksana(currentUser || adminUser) ? 'TIKET BAGIAN SAYA' : 'TIKET TIM SAYA', 
              count: tickets.filter(t => isTeamTicketForUser(t, currentUser || adminUser, masterUsers || [])).length,
              icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
              numColor: 'text-teal-600 dark:text-teal-400',
              iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
              activeClass: 'border-teal-500 ring-2 ring-teal-500/30 bg-teal-50/70 dark:bg-teal-950/40 shadow-sm',
              idleClass: isDark ? 'bg-slate-900/90 border-slate-800 hover:bg-slate-850' : 'bg-white border-slate-200/90 hover:bg-slate-50',
              pulsePing: 'bg-teal-400',
              pulseDot: 'bg-teal-500',
              dotActive: 'bg-teal-500',
              isActive: viewMode === 'team_tickets' && !filterStatus,
              isFullWidth: false,
              onClick: () => { setViewMode('team_tickets'); setFilterStatus(''); }
            },
            { 
              key: 'today_tickets',
              label: 'TIKET HARI INI', 
              count: tickets.filter(t => parseSafeDate(t.created_at).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')).length,
              icon: <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />,
              numColor: 'text-purple-600 dark:text-purple-400',
              iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
              activeClass: 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-50/70 dark:bg-purple-950/40 shadow-sm',
              idleClass: isDark ? 'bg-slate-900/90 border-slate-800 hover:bg-slate-850' : 'bg-white border-slate-200/90 hover:bg-slate-50',
              pulsePing: 'bg-purple-400',
              pulseDot: 'bg-purple-500',
              dotActive: 'bg-purple-500',
              isActive: viewMode === 'today' && !filterStatus,
              isFullWidth: false,
              onClick: () => { setViewMode('today'); setFilterStatus(''); }
            }
          ].map((item, idx) => {
            return (
              <motion.button
                key={`stat-card-${item.key}-${idx}`}
                whileTap={{ scale: 0.97 }}
                onClick={item.onClick}
                className={`p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border text-left flex items-center justify-between transition-all relative overflow-hidden group cursor-pointer ${
                  item.isFullWidth ? 'col-span-2 md:col-span-1' : 'col-span-1'
                } ${
                  item.isActive ? item.activeClass : item.idleClass
                }`}
              >
                <div className="flex flex-col h-full justify-between gap-2 z-10">
                  <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    {item.label}
                    {item.isActive && (
                      <span className={`inline-block w-2 h-2 rounded-full ${item.dotActive} animate-pulse`} />
                    )}
                  </span>
                  <span className={`text-2xl sm:text-3xl font-black leading-none ${item.numColor} ${item.isActive ? 'animate-pulse' : ''}`}>
                    <RollingNumber value={item.count} />
                  </span>
                </div>

                <div className="relative flex items-center justify-center shrink-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  {/* Status dot in top right corner of icon circle */}
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.pulsePing} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${item.pulseDot} border-2 border-white dark:border-slate-900`}></span>
                  </span>
                </div>
              </motion.button>
            );
          })}
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

      {/* Results Summary & Filter Toggle - Clean Top/Bottom Bordered Bar */}
      <div className={`py-2.5 px-2 my-2 border-y flex items-center justify-between text-xs sm:text-sm font-medium ${
        isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200/80 text-slate-500'
      }`}>
        <div className="flex items-center gap-1">
          Menampilkan{' '}
          <span className="font-extrabold text-slate-800 dark:text-slate-100">
            {filteredTickets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
          </span>{' '}
          -{' '}
          <span className="font-extrabold text-slate-800 dark:text-slate-100">
            {Math.min(currentPage * itemsPerPage, filteredTickets.length)}
          </span>{' '}
          dari{' '}
          <span className="font-extrabold text-slate-800 dark:text-slate-100">
            {filteredTickets.length}
          </span>{' '}
          tiket
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Vertical Separator Line */}
          <div className={`h-4 w-[1px] ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

          {/* Filter Button */}
          <button 
            type="button"
            onClick={() => {
              setTempFilters({ dept: filterDept, status: filterStatus, date: filterDate, search: searchQuery });
              setShowMobileFilter(true);
            }}
            className={`p-1 transition-colors relative ${
              (filterDept || filterStatus || filterDate || searchQuery)
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Filter Tiket"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {(filterDept || filterStatus || filterDate || searchQuery) && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Sort Button */}
          <button 
            type="button"
            onClick={() => fetchTickets(true)}
            className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            title="Urutkan / Segarkan"
          >
            <ArrowUpDown className="w-4 h-4" />
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
                    key={`${ticket.id}-${index}`}
                    ticket={ticket}
                    index={index}
                    isDark={isDark}
                    themeClasses={themeClasses}
                    adminUser={adminUser}
                    currentUser={currentUser}
                    masterUsers={masterUsers}
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
                    appSettings={appSettings}
                    onForwardWhatsApp={onForwardWhatsApp}
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
                        key={`t-page-${page}`}
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
                    return <span key={`ellipsis-${page}`} className="text-slate-400 px-1">...</span>;
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
                style={{ borderRadius: 'var(--admin-btn-radius, 14px)' }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-[10px] font-black capitalize tracking-widest transition-all active:scale-95 shadow-md shadow-blue-500/20"
              >
                Progres
              </button>
              <button 
                onClick={() => handleBulkAction('Completed')}
                style={{ borderRadius: 'var(--admin-btn-radius, 14px)' }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md text-[10px] font-black capitalize tracking-widest transition-all active:scale-95 shadow-md shadow-emerald-500/20"
              >
                Selesai
              </button>
              <button 
                onClick={() => handleBulkAction('delete')}
                style={{ borderRadius: 'var(--admin-btn-radius, 14px)' }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-600 hover:bg-rose-700 rounded-md text-[10px] font-black capitalize tracking-widest transition-all active:scale-95 shadow-md shadow-rose-500/20"
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
