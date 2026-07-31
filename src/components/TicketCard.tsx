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

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  index,
  isDark,
  themeClasses,
  adminUser,
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
        return { label: 'Progres', bg: 'bg-blue-600 text-white' };
      case 'Completed': 
        return { label: 'Selesai', bg: 'bg-emerald-600 text-white' };
      case 'Closed': 
        return { label: 'Closed', bg: 'bg-slate-600 text-white' };
      case 'Re-opened': 
        return { label: 'Re-Open', bg: 'bg-amber-600 text-white' };
      case 'Cancelled': 
        return { label: 'Batal', bg: 'bg-rose-600 text-white' };
      case 'New': 
        return { label: 'Baru', bg: 'bg-indigo-600 text-white' };
      default: 
        return { label: status, bg: 'bg-blue-600 text-white' };
    }
  };

  const statusInfo = getStatusDisplay(ticket.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ 
        y: -2, 
        boxShadow: isDark ? "0 10px 25px -5px rgba(0,0,0,0.4)" : "0 10px 25px -5px rgba(0,0,0,0.06)"
      }}
      transition={{ 
        delay: index * 0.03,
        type: "spring",
        stiffness: 300,
        damping: 24
      }}
      style={{ borderRadius: `${cardRadius}px` }}
      className={`relative border ${
        selectedTickets.includes(ticket.id) 
          ? 'ring-2 ring-emerald-500 border-emerald-500' 
          : isDark ? 'border-slate-800 bg-slate-900/95 text-slate-100' : 'border-slate-200/90 bg-white text-slate-700'
      } p-4 sm:p-5 shadow-xs transition-all group cursor-pointer overflow-hidden ${
        getSLAColor(ticket.created_at, ticket.status, customCritical, customDelayed) || ''
      }`}
      onClick={() => handleSelectTicket(ticket)}
    >
      {/* Top Header Row: Ticket ID + Status Badge + Refresh Circular Button */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
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
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          )}

          {/* Ticket ID */}
          <span className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 tracking-tight">
            #<HighlightText text={ticket.ticket_no || `TKT-${ticket.id.toString().padStart(4, '0')}`} highlight={searchQuery} isDark={isDark} />
          </span>

          {/* Status Badge Pill */}
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-xs ${statusInfo.bg}`}>
            {statusInfo.label}
          </span>

          {/* SLA Badge if active */}
          {getSLALabel(ticket.created_at, ticket.status, customCritical, customDelayed) && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white leading-none whitespace-nowrap shadow-xs">
              {getSLALabel(ticket.created_at, ticket.status, customCritical, customDelayed)}
            </span>
          )}
        </div>

        {/* Circular Action Button */}
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSelectTicket(ticket);
          }}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title="Lihat Detail Tiket"
        >
          <RotateCw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {/* Second Row: Category Title (Left) + Date & Time (Right) */}
      <div className="flex items-baseline justify-between gap-2 mb-2.5 sm:mb-3">
        <h3 className="text-sm sm:text-base font-extrabold text-emerald-900 dark:text-emerald-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
          <HighlightText text={ticket.category ? `${ticket.category} Request` : 'Hardware Request'} highlight={searchQuery} isDark={isDark} />
        </h3>
        <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 font-normal shrink-0">
          {formatDate(ticket.created_at)}
        </span>
      </div>

      {/* Estimated Duration if specified */}
      {ticket.estimated_duration && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-3 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 w-fit">
          <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Estimasi: <strong>{ticket.estimated_duration}</strong></span>
        </div>
      )}

      {/* Fourth Row: Footer Info Grid (Pelapor, Departemen, Petugas IT) */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 grid grid-cols-3 gap-1 sm:gap-2 text-left">
        {/* Column 1: Pelapor */}
        <div className="pr-1">
          <div className="flex items-center gap-1 mb-0.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">PELAPOR</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
            <HighlightText text={ticket.name} highlight={searchQuery} isDark={isDark} />
          </p>
        </div>

        {/* Column 2: Departemen */}
        <div className="border-x border-slate-100 dark:border-slate-800/80 px-2 sm:px-3">
          <div className="flex items-center gap-1 mb-0.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">DEPARTEMEN</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
            {ticket.department || '-'}
          </p>
        </div>

        {/* Column 3: Petugas IT */}
        <div className="pl-1">
          <div className="flex items-center gap-1 mb-0.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">PETUGAS IT</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
            {ticket.assigned_to ? `@${ticket.assigned_to}` : '-'}
          </p>
        </div>
      </div>

      {/* Admin Action Bar if Super Admin or Admin */}
      {adminUser && (
        <div className="mt-3 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="text-[10px] font-mono text-slate-400">
            {ticket.pc_code ? `PC: ${ticket.pc_code}` : `ID: ${ticket.id}`}
          </div>
          <div className="flex items-center gap-1.5">
            {onForwardWhatsApp && (
              <button 
                type="button"
                onClick={() => onForwardWhatsApp(ticket)}
                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-md transition-all shadow-sm flex items-center gap-1 active:scale-95"
                title="Teruskan Tiket ke WhatsApp Agen"
              >
                <MessageSquare className="w-2.5 h-2.5" />
                <span>WA</span>
              </button>
            )}
            {adminUser.role === 'Super Admin' && (
              <>
                <button 
                  type="button"
                  onClick={() => handleIntervention(ticket.id, 'takeover')}
                  className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-md transition-colors"
                >
                  Ambil
                </button>
                <button 
                  type="button"
                  onClick={() => handleIntervention(ticket.id, 'reassign')}
                  className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold rounded-md transition-colors"
                >
                  Pindah
                </button>
              </>
            )}
            <button 
              type="button"
              onClick={() => handleDeleteTicket(ticket.id)}
              className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded-md transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
