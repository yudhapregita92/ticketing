import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Building2, 
  UserCheck,
  RotateCw,
  Eye,
  Trash2,
  Clock,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { ITicket, IAdminUser, ICategory } from '../types';
import { getSLAColor, getSLALabel } from '../utils/ticketUtils';
import { HighlightText } from './Common';

interface TicketCardProps {
  ticket: ITicket;
  index: number;
  isDark: boolean;
  themeClasses: any;
  adminUser: IAdminUser | null;
  currentUser?: any;
  selectedTickets: number[];
  setSelectedTickets: React.Dispatch<React.SetStateAction<number[]>>;
  handleSelectTicket: (ticket: ITicket) => void;
  handleDeleteTicket: (id: number) => void;
  handleIntervention: (id: number, type: 'takeover' | 'reassign') => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  formatDate: (date: string) => string;
  searchQuery: string;
  categories?: ICategory[];
  appSettings?: any;
  onForwardWhatsApp?: (ticket: ITicket) => void;
}

export const TicketCard: React.FC<TicketCardProps> = React.memo(({
  ticket,
  index,
  isDark,
  themeClasses,
  adminUser,
  currentUser,
  selectedTickets,
  setSelectedTickets,
  handleSelectTicket,
  handleDeleteTicket,
  handleIntervention,
  getStatusIcon,
  getStatusColor,
  formatDate,
  searchQuery,
  categories = [],
  appSettings,
  onForwardWhatsApp
}) => {
  const cardRadius = appSettings?.ui_card_radius ?? 24;
  const ticketCategory = categories?.find(c => c.name === ticket.category);
  const customDelayed = ticketCategory?.response_time && ticketCategory.response_time > 0 ? ticketCategory.response_time : undefined;

  const isMyTicket = React.useMemo(() => {
    const activeUserObj = currentUser || adminUser;
    
    let activeName = activeUserObj?.full_name || activeUserObj?.username || '';
    let activePhone = activeUserObj?.phone || '';

    if (!activeName && !activePhone) {
      try {
        const savedStaff = localStorage.getItem('currentUser');
        if (savedStaff) {
          const parsed = JSON.parse(savedStaff);
          activeName = activeName || parsed.full_name || parsed.username || '';
          activePhone = activePhone || parsed.phone || '';
        }
        const savedAdmin = localStorage.getItem('adminUser');
        if (savedAdmin) {
          const parsed = JSON.parse(savedAdmin);
          activeName = activeName || parsed.full_name || parsed.username || '';
          activePhone = activePhone || parsed.phone || '';
        }
      } catch (e) {}
    }

    const cleanActiveName = activeName.trim().toLowerCase();
    const cleanActivePhone = activePhone.replace(/\D/g, '');
    
    const tName = (ticket.name || '').trim().toLowerCase();
    const tPhone = (ticket.phone || '').replace(/\D/g, '');

    // Match by Name
    if (cleanActiveName && tName && cleanActiveName === tName) {
      return true;
    }

    // Match by Phone (min 8 digits)
    if (cleanActivePhone.length >= 8 && tPhone.length >= 8 && (cleanActivePhone.endsWith(tPhone) || tPhone.endsWith(cleanActivePhone))) {
      return true;
    }

    return false;
  }, [adminUser, currentUser, ticket]);
  
  let customCritical: number | undefined = undefined;
  if (customDelayed) {
    let ratio = 2.5;
    try {
      const saved = localStorage.getItem('appSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const cHours = parseFloat(parsed.sla_critical_hours);
        const dHours = parseFloat(parsed.sla_delayed_hours);
        if (!isNaN(cHours) && !isNaN(dHours) && dHours > 0) {
          ratio = cHours / dHours;
        }
      }
    } catch (e) {}
    customCritical = customDelayed * ratio;
  }

  // Get status badge badge display text and custom badge background
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'In Progress': 
        return { label: 'Progres', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80' };
      case 'Completed': 
        return { label: 'Selesai', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80' };
      case 'Closed': 
        return { label: 'Closed', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700' };
      case 'Re-opened': 
        return { label: 'Re-Open', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80' };
      case 'Cancelled': 
        return { label: 'Batal', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80' };
      case 'New': 
        return { label: 'Baru', bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80' };
      default: 
        return { label: status, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80' };
    }
  };

  const statusInfo = getStatusDisplay(ticket.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ 
        y: -1, 
        boxShadow: isDark ? "0 8px 20px -4px rgba(0,0,0,0.4)" : "0 8px 20px -4px rgba(0,0,0,0.06)"
      }}
      transition={{ 
        delay: index * 0.02,
        type: "spring",
        stiffness: 300,
        damping: 24
      }}
      style={{ borderRadius: adminUser ? '0px' : `${cardRadius}px` }}
      className={`relative border ${
        selectedTickets.includes(ticket.id) 
          ? 'ring-2 ring-emerald-500 border-emerald-500' 
          : isDark ? 'border-slate-800 bg-slate-900/95 text-slate-100' : 'border-slate-200/90 bg-white text-slate-700'
      } p-3 sm:p-4 shadow-xs transition-all group cursor-pointer overflow-hidden ${adminUser ? 'rounded-none' : ''} ${
        getSLAColor(ticket.created_at, ticket.status, customCritical, customDelayed) || ''
      }`}
      onClick={() => handleSelectTicket(ticket)}
    >
      {/* Baris 1 (Header): Checkbox, Ticket No, Status Badge, ID, Date & Refresh */}
      <div className="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {adminUser && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <input 
                type="checkbox"
                checked={selectedTickets.includes(ticket.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTickets(prev => [...prev, ticket.id]);
                  } else {
                    setSelectedTickets(prev => prev.filter(id => id !== ticket.id));
                  }
                }}
                className="w-3.5 h-3.5 rounded-none border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          )}

          {/* Ticket ID No */}
          <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight shrink-0">
            #<HighlightText text={ticket.ticket_no || `TKT-${ticket.id.toString().padStart(4, '0')}`} highlight={searchQuery} isDark={isDark} />
          </span>

          {/* Status Badge Pill */}
          <span className={`inline-flex items-center justify-center h-5 w-[62px] px-1.5 ${adminUser ? 'rounded-none' : 'rounded-full'} text-[10px] font-extrabold tracking-wide shadow-2xs whitespace-nowrap text-center shrink-0 ${statusInfo.bg}`}>
            {statusInfo.label}
          </span>

          {/* Priority Pill (Always show with fallback to Medium) */}
          {(() => {
            const prio = ticket.priority || 'Medium';
            return (
              <span className={`inline-flex items-center justify-center h-5 px-2 ${adminUser ? 'rounded-none' : 'rounded-full'} text-[9.5px] font-bold uppercase whitespace-nowrap shrink-0 border ${
                prio === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800' :
                prio === 'Urgent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800' :
                prio === 'Low' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' :
                'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}>
                {prio}
              </span>
            );
          })()}

          {/* SLA Badge if active */}
          {getSLALabel(ticket.created_at, ticket.status, customCritical, customDelayed) && (
            <span className={`inline-flex items-center justify-center h-5 px-2 text-[9.5px] font-bold ${adminUser ? 'rounded-none' : 'rounded-full'} bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 leading-none whitespace-nowrap shadow-xs shrink-0`}>
              {getSLALabel(ticket.created_at, ticket.status, customCritical, customDelayed)}
            </span>
          )}

          {/* Ticket DB ID */}
          <span className="text-[11px] text-slate-400 font-medium font-mono shrink-0">
            ID:{ticket.id}
          </span>
        </div>

        {/* Kanan: Date & Refresh Icon */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
            {formatDate(ticket.created_at)}
          </span>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectTicket(ticket);
            }}
            className="w-5 h-5 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Lihat Detail Tiket"
          >
            <RotateCw className="w-3 h-3 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      {/* Baris 2 (Body): Category / Title Request */}
      <div className="mb-1">
        <h3 className="text-sm sm:text-base font-bold text-emerald-800 dark:text-emerald-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 leading-tight">
          <HighlightText text={ticket.category ? `${ticket.category} Request` : 'Hardware Request'} highlight={searchQuery} isDark={isDark} />
        </h3>
      </div>

      {/* Estimasi Waktu jika ada */}
      {ticket.estimated_duration && (
        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
          <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Estimasi: <strong>{ticket.estimated_duration}</strong></span>
        </div>
      )}

      {/* Baris 3 (Footer Gambar 2): Info User | Dept | IT (Kiri) & Tombol Aksi (Kanan) */}
      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 flex-wrap">
        {/* Kiri: User | Dept | Assigned IT */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 min-w-0 flex-wrap">
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              <HighlightText text={ticket.name} highlight={searchQuery} isDark={isDark} />
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700 font-normal">|</span>
          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{ticket.department || '-'}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700 font-normal">|</span>
          <div className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{ticket.assigned_to ? `@${ticket.assigned_to}` : '-'}</span>
          </div>
        </div>

        {/* Kanan: Tombol Aksi (Ambil, Pindah, Hapus, etc) */}
        <div className="flex items-center gap-1 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
          {onForwardWhatsApp && isMyTicket && (
            <button 
              type="button"
              onClick={() => onForwardWhatsApp(ticket)}
              className={`px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold ${adminUser ? 'rounded-none' : 'rounded-lg'} transition-all shadow-xs flex items-center gap-1 cursor-pointer`}
              title="Hubungi via WA"
            >
              <MessageSquare className="w-3 h-3" />
              <span>WA</span>
            </button>
          )}

          {adminUser?.role === 'Super Admin' && (
            <>
              <button 
                type="button"
                onClick={() => handleIntervention(ticket.id, 'takeover')}
                className={`px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold ${adminUser ? 'rounded-none' : 'rounded-lg'} transition-all shadow-xs flex items-center gap-1 cursor-pointer`}
              >
                <span>🖐️</span>
                <span>Ambil</span>
              </button>
              <button 
                type="button"
                onClick={() => handleIntervention(ticket.id, 'reassign')}
                className={`px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold ${adminUser ? 'rounded-none' : 'rounded-lg'} transition-all shadow-xs flex items-center gap-1 cursor-pointer`}
              >
                <span>➡️</span>
                <span>Pindah</span>
              </button>
            </>
          )}

          {adminUser && (
            <button 
              type="button"
              onClick={() => handleDeleteTicket(ticket.id)}
              className={`px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold ${adminUser ? 'rounded-none' : 'rounded-lg'} transition-all shadow-xs flex items-center gap-1 cursor-pointer`}
              title="Hapus Tiket"
            >
              <Trash2 className="w-3 h-3" />
              <span>H</span>
            </button>
          )}

          <button 
            type="button"
            onClick={() => handleSelectTicket(ticket)}
            className={`w-7 h-7 ${adminUser ? 'rounded-none' : 'rounded-lg'} bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer`}
            title="Menu & Detail"
          >
            •••
          </button>
        </div>
      </div>
    </motion.div>
  );
});
