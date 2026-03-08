import React from 'react';
import { motion } from 'motion/react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Building2, 
  Eye
} from 'lucide-react';
import { ITicket } from '../types';
import { getSLAColor, getSLALabel } from '../utils';

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

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => handleSelectTicket(ticket)}
      className={`${themeClasses.card} rounded-[1.25rem] border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50/50 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-amber-500/70" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">
              #{ticket.ticket_no.replace('TKT-', '')}
            </span>
            {slaLabel && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[7px] font-black rounded uppercase tracking-tighter">
                {slaLabel}
              </span>
            )}
          </div>
          
          <h3 className="text-sm font-bold text-slate-700 mb-1.5">{ticket.category} Request</h3>
          
          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <User className="w-3 h-3" />
              <span>{ticket.name.toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <Building2 className="w-3 h-3" />
              <span>{ticket.department}</span>
              <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[7px] font-black rounded uppercase">
                {ticket.status}
              </span>
            </div>
            {ticket.assigned_to && (
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500">
                <CheckCircle2 className="w-3 h-3" />
                <span>Assigned to: {ticket.assigned_to}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-slate-50">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300">
                <Clock className="w-2.5 h-2.5" />
                <span>Created: {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}, {new Date(ticket.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {ticket.resolved_at && (
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Done: {new Date(ticket.resolved_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}, {new Date(ticket.resolved_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
            <Eye className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
