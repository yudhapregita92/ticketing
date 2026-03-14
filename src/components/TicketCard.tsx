import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Building2, 
  Eye
} from 'lucide-react';
import { ITicket, PRIORITIES } from '../types';
import { getSLAColor, getSLALabel, getStatusColor } from '../utils';

interface TicketCardProps {
  ticket: ITicket;
  isDark: boolean;
  themeClasses: any;
  handleSelectTicket: (ticket: ITicket) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  isDark,
  themeClasses,
  handleSelectTicket
}) => {
  const slaColor = getSLAColor(ticket.created_at, ticket.status);
  const slaLabel = getSLALabel(ticket.created_at, ticket.status);
  const priorityInfo = PRIORITIES.find(p => p.id === (ticket.priority || 'Medium')) || PRIORITIES[1];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => handleSelectTicket(ticket)}
      className={`${themeClasses.card} rounded-2xl border border-slate-100 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden`}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-50/50 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 text-amber-500/70" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold text-slate-400 capitalize tracking-tight">
                #{ticket.ticket_no.replace('TKT-', '')}
              </span>
              {slaLabel && (
                <span className="px-1 py-0.5 bg-rose-500 text-white text-[6px] font-black rounded capitalize tracking-tighter">
                  {slaLabel}
                </span>
              )}
              <span className={`px-1 py-0.5 ${priorityInfo.color} text-white text-[6px] font-black rounded capitalize tracking-tighter`}>
                {priorityInfo.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400">
              <Clock className="w-2 h-2" />
              <span>{new Date(ticket.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}, {new Date(ticket.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          
          <h3 className={`text-xs font-black mb-1 truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{ticket.category} Request</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                <User className="w-2.5 h-2.5" />
                <span className="truncate max-w-[60px]">{ticket.name.toLowerCase()}</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                <Building2 className="w-2.5 h-2.5" />
                <span className="truncate max-w-[80px]">{ticket.department}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 ${getStatusColor(ticket.status)} text-[7px] font-black rounded-full capitalize text-center min-w-[65px] inline-block`}>
                {ticket.status === 'In Progress' ? 'Progres' : 
                 ticket.status === 'Completed' ? 'Selesai' : 
                 ticket.status === 'Cancelled' ? 'Batal' : 
                 ticket.status === 'New' ? 'Baru' : ticket.status}
              </span>
              <Eye className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {ticket.assigned_to && (
            <div className="mt-1 flex items-center gap-1 text-[8px] font-bold text-emerald-500">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Assigned: {ticket.assigned_to}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
