import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Building2, 
  Eye,
  Trash2,
  Calendar,
  Clock
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
  categories = []
}) => {
  const ticketCategory = categories?.find(c => c.name === ticket.category);
  const customDelayed = ticketCategory?.response_time && ticketCategory.response_time > 0 ? ticketCategory.response_time : undefined;
  
  let customCritical: number | undefined = undefined;
  if (customDelayed) {
    let ratio = 2.5; // Default: 5h critical / 2h delayed
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ 
        y: -2, 
        scale: 1.01,
        boxShadow: isDark ? "0 10px 30px -10px rgba(0,0,0,0.5)" : "0 10px 30px -10px rgba(16,185,129,0.1)"
      }}
      whileTap={{ scale: 0.99 }}
      transition={{ 
        delay: index * 0.04,
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      className={`${themeClasses.card} rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 ${
        selectedTickets.includes(ticket.id) ? 'ring-2 ring-emerald-500 border-emerald-500' : ''
      } ${
        getSLAColor(ticket.created_at, ticket.status, customCritical, customDelayed) || (isDark ? 'hover:border-emerald-900' : 'hover:border-emerald-100')
      }`}
      onClick={() => handleSelectTicket(ticket)}
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {adminUser && (
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
          </div>
        )}
        <div className="flex-shrink-0">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={ticket.status === 'New' ? {
              scale: [1, 1.03, 1],
              boxShadow: ["0 0 0px rgba(99, 102, 241, 0)", "0 0 4px rgba(99, 102, 241, 0.2)", "0 0 0px rgba(99, 102, 241, 0)"]
            } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center border ${
              ticket.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/40' :
              ticket.status === 'New' ? 'bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/40' :
              ticket.status === 'Cancelled' ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40' :
              'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/40'
            }`}
          >
            {getStatusIcon(ticket.status)}
          </motion.div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-0.5 sm:mb-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-zinc-500 tracking-tight">
                #<HighlightText text={ticket.ticket_no || ticket.id.toString().padStart(4, '0')} highlight={searchQuery} isDark={isDark} />
              </span>
              {adminUser?.role === 'Super Admin' && ticket.assigned_to && (
                <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded capitalize leading-none ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>@{ticket.assigned_to}</span>
              )}
              {getSLALabel(ticket.created_at, ticket.status, customCritical, customDelayed) && (
                <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded capitalize bg-rose-500 text-white leading-none whitespace-nowrap">{getSLALabel(ticket.created_at, ticket.status, customCritical, customDelayed)}</span>
              )}
              {(ticket.estimated_duration || ticket.estimated_target_at) && (
                <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded capitalize bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 leading-none whitespace-nowrap flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  Est: {ticket.estimated_duration || 'Jadwal Khusus'}
                </span>
              )}
            </div>
            <div className="flex items-center sm:items-end flex-wrap gap-1.5 sm:gap-2">
              <span className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs text-slate-400 dark:text-zinc-500 font-medium whitespace-nowrap">
                <Calendar className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" /> {formatDate(ticket.created_at)}
              </span>
              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold capitalize tracking-wide sm:tracking-wider border text-center min-w-[50px] sm:min-w-[70px] inline-block ${getStatusColor(ticket.status)}`}>
                {ticket.status === 'In Progress' ? 'Progres' : 
                 ticket.status === 'Completed' ? 'Selesai' : 
                 ticket.status === 'Cancelled' ? 'Batal' : 
                 ticket.status === 'New' ? 'Baru' : ticket.status}
              </span>
            </div>
          </div>
          <h3 className={`text-xs sm:text-sm font-bold truncate group-hover:text-emerald-500 transition-colors mb-1 sm:mb-1.5 ${themeClasses.text}`}>
            <HighlightText text={`${ticket.category} Request`} highlight={searchQuery} isDark={isDark} />
          </h3>
          
          {(ticket.estimated_duration || ticket.estimated_target_at) && (
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1.5 bg-emerald-500/10 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-500/20 dark:border-emerald-800/60 w-fit">
              <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Estimasi: <strong className="font-extrabold text-emerald-600 dark:text-emerald-400">{ticket.estimated_duration || 'Jadwal Khusus'}</strong></span>
              {ticket.estimated_target_at && (
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  • Target: {formatDate(ticket.estimated_target_at)}
                </span>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between gap-1 mt-1 sm:mt-2">
            <div className={`flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-0.5 text-[10px] sm:text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                <User className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400 shrink-0" /> <HighlightText text={ticket.name} highlight={searchQuery} isDark={isDark} />
              </span>
              <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                <Building2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400 shrink-0" /> {ticket.department}
              </span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleSelectTicket(ticket);
              }}
              className={`p-1 sm:p-1.5 rounded-lg transition-all ${isDark ? 'text-slate-400 hover:text-emerald-400 hover:bg-zinc-800' : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'}`}
              title="View Details"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className={`flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-dashed sm:border-t-0 sm:pl-3 sm:border-l ${isDark ? 'border-zinc-805' : 'border-slate-100'}`}>
        {adminUser?.role === 'Super Admin' && (
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleIntervention(ticket.id, 'takeover');
              }}
              className="px-2 py-1 bg-emerald-500 text-white text-[8px] font-black capitalize rounded hover:bg-emerald-600 transition-colors"
            >
              Ambil
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleIntervention(ticket.id, 'reassign');
              }}
              className="px-2 py-1 bg-blue-500 text-white text-[8px] font-black capitalize rounded hover:bg-blue-600 transition-colors"
            >
              Pindah
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
