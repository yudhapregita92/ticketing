import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Building2, 
  Eye,
  Trash2,
  Calendar
} from 'lucide-react';
import { ITicket, IAdminUser } from '../types';
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
  searchQuery
}) => {
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
      className={`${themeClasses.card} rounded-xl p-1.5 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 ${
        selectedTickets.includes(ticket.id) ? 'ring-2 ring-emerald-500 border-emerald-500' : ''
      } ${
        getSLAColor(ticket.created_at, ticket.status) || (isDark ? 'hover:border-emerald-900' : 'hover:border-emerald-100')
      }`}
      onClick={() => handleSelectTicket(ticket)}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center gap-2 min-w-0 flex-1">
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
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={ticket.status === 'New' ? {
              scale: [1, 1.05, 1],
              boxShadow: ["0 0 0px rgba(245, 158, 11, 0)", "0 0 8px rgba(245, 158, 11, 0.3)", "0 0 0px rgba(245, 158, 11, 0)"]
            } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              ticket.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
              ticket.status === 'New' ? 'bg-amber-50 border-amber-100 text-amber-600' :
              'bg-blue-50 border-blue-100 text-blue-600'
            }`}
          >
            {getStatusIcon(ticket.status)}
          </motion.div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-black text-slate-400 tracking-tighter">
                #<HighlightText text={ticket.ticket_no || ticket.id.toString().padStart(4, '0')} highlight={searchQuery} isDark={isDark} />
              </span>
              {adminUser?.role === 'Super Admin' && ticket.assigned_to && (
                <span className={`text-[8px] font-black px-1 py-0.5 rounded capitalize leading-none ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>@{ticket.assigned_to}</span>
              )}
              {getSLALabel(ticket.created_at, ticket.status) && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded capitalize bg-rose-500 text-white leading-none whitespace-nowrap">{getSLALabel(ticket.created_at, ticket.status)}</span>
              )}
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1">
              <span className="flex items-center gap-1 text-[8px] sm:text-[9px] text-slate-400 font-medium whitespace-nowrap">
                <Calendar className="w-2.5 h-2.5 shrink-0" /> {formatDate(ticket.created_at)}
              </span>
              <span className={`px-1.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black capitalize tracking-widest border text-center min-w-[55px] sm:min-w-[65px] inline-block ${getStatusColor(ticket.status)}`}>
                {ticket.status === 'In Progress' ? 'Progres' : 
                 ticket.status === 'Completed' ? 'Selesai' : 
                 ticket.status === 'Cancelled' ? 'Batal' : 
                 ticket.status === 'New' ? 'Baru' : ticket.status}
              </span>
            </div>
          </div>
          <h3 className={`text-[11px] font-black truncate group-hover:text-emerald-600 transition-colors mb-1 ${themeClasses.text}`}>
            <HighlightText text={`${ticket.category} Request`} highlight={searchQuery} isDark={isDark} />
          </h3>
          
          <div className="flex items-center justify-between gap-2">
            <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1 truncate">
                <User className="w-2.5 h-2.5 text-slate-400 shrink-0" /> <HighlightText text={ticket.name} highlight={searchQuery} isDark={isDark} />
              </span>
              <span className="flex items-center gap-1 truncate">
                <Building2 className="w-2.5 h-2.5 text-slate-400 shrink-0" /> {ticket.department}
              </span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleSelectTicket(ticket);
              }}
              className={`p-1 rounded-md transition-all ${isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-400 hover:text-emerald-600'}`}
              title="View Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 sm:pl-3 sm:border-l border-slate-50">
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
        <div className="flex items-center gap-1">
          {adminUser && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTicket(ticket.id);
              }}
              className={`p-1.5 rounded-md transition-all ${isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-900/30' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
              title="Delete Ticket"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
