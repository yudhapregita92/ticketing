import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Phone, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ITicket } from '../../types';
import { formatPhoneNumber, findAgentPhoneNumber, generateTicketWhatsAppText } from '../../utils/whatsapp';

interface ForwardWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: ITicket | null;
  adminUsers?: any[];
  teamMembers?: any[];
  masterUsers?: any[];
  isDark?: boolean;
}

export const ForwardWhatsAppModal: React.FC<ForwardWhatsAppModalProps> = ({
  isOpen,
  onClose,
  ticket,
  adminUsers = [],
  teamMembers = [],
  masterUsers = [],
  isDark = false
}) => {
  if (!isOpen || !ticket) return null;

  // Build list of all available IT agents/admins
  const agentList = useMemo(() => {
    const list: { name: string; username: string; phone: string; role: string; type: string }[] = [];
    const seen = new Set<string>();

    // From adminUsers
    if (Array.isArray(adminUsers)) {
      adminUsers.forEach(u => {
        if (!u.username) return;
        const key = u.username.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            name: u.full_name || u.username,
            username: u.username,
            phone: u.phone ? formatPhoneNumber(u.phone) : '',
            role: u.role || 'Admin IT',
            type: 'admin'
          });
        }
      });
    }

    // From teamMembers
    if (Array.isArray(teamMembers)) {
      teamMembers.forEach(m => {
        if (!m.name) return;
        const key = m.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            name: m.name,
            username: m.name,
            phone: m.phone ? formatPhoneNumber(m.phone) : '',
            role: m.subRoleTitle || m.role || 'Tim IT',
            type: 'team'
          });
        }
      });
    }

    return list;
  }, [adminUsers, teamMembers]);

  // Initial agent detection
  const detectedAgent = useMemo(() => {
    if (!ticket.assigned_to) return null;
    const cleanAssigned = ticket.assigned_to.replace(/^@/, '').trim().toLowerCase();
    return agentList.find(a => a.username.toLowerCase() === cleanAssigned || a.name.toLowerCase() === cleanAssigned) || null;
  }, [ticket.assigned_to, agentList]);

  const [selectedAgentKey, setSelectedAgentKey] = useState<string>('');
  const [customPhone, setCustomPhone] = useState<string>('');

  useEffect(() => {
    if (detectedAgent) {
      setSelectedAgentKey(detectedAgent.username);
      setCustomPhone(detectedAgent.phone);
    } else if (agentList.length > 0) {
      setSelectedAgentKey(agentList[0].username);
      setCustomPhone(agentList[0].phone);
    } else {
      setSelectedAgentKey('');
      setCustomPhone('');
    }
  }, [ticket, detectedAgent, agentList]);

  const handleAgentChange = (key: string) => {
    setSelectedAgentKey(key);
    const agent = agentList.find(a => a.username === key);
    if (agent) {
      setCustomPhone(agent.phone);
    }
  };

  const messageText = useMemo(() => generateTicketWhatsAppText(ticket), [ticket]);

  const handleSend = () => {
    const finalPhone = formatPhoneNumber(customPhone);
    if (!finalPhone) {
      alert('Nomor WhatsApp tidak boleh kosong. Silakan isi nomor WhatsApp agen.');
      return;
    }
    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`relative w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-600/10 dark:bg-emerald-500/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-md">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                  Teruskan Tiket ke WhatsApp
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kirim detail tiket #{ticket.ticket_no || ticket.id} langsung ke WhatsApp Agen
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* Agent Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                Pilih Agen / Petugas IT Target:
              </label>
              <select
                value={selectedAgentKey}
                onChange={e => handleAgentChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                {agentList.map(a => (
                  <option key={a.username} value={a.username}>
                    {a.name} ({a.role}) {a.phone ? `— ${a.phone}` : '(No HP Belum Diisi)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Phone Number Input */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-500" />
                No. WhatsApp Agen:
              </label>
              <input
                type="text"
                placeholder="Contoh: 081234567890"
                value={customPhone}
                onChange={e => setCustomPhone(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
              {!customPhone && (
                <p className="text-[10px] text-amber-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Agen ini belum memiliki nomor HP. Silakan masukkan nomor WhatsApp secara manual.
                </p>
              )}
            </div>

            {/* Message Preview */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Pratinjau Pesan WhatsApp:
              </label>
              <div
                className={`p-3 rounded-xl border text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {messageText}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Send className="w-4 h-4" />
              Kirim ke WhatsApp
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
