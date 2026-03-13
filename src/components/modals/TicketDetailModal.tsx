import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Ticket, 
  User, 
  Building2, 
  Phone, 
  Layers, 
  MessageSquare, 
  ShieldCheck, 
  MapPin, 
  History, 
  Settings2, 
  Lock,
  Calendar,
  Image as ImageIcon,
  Eye,
  Trash2,
  Scan
} from 'lucide-react';

import { ITicket, PRIORITIES } from '../../types';

interface TicketDetailModalProps {
  selectedTicket: ITicket | null;
  setSelectedTicket: (ticket: ITicket | null) => void;
  isDark: boolean;
  themeClasses: any;
  getStatusColor: (status: string) => string;
  formatDate: (date: string) => string;
  getDeviceInfo: (ua: string) => string;
  adminUser: any;
  ticketLogs: any[];
  users: any[];
  STATUSES: string[];
  modalStatus: string;
  setModalStatus: (status: string) => void;
  modalPriority: string;
  setModalPriority: (priority: string) => void;
  handleUpdateClick: (id: number, status: string, assigned_to: string | null, reply: string | null, internal: string | null, priority?: string) => void;
  handleIntervention: (id: number, type: 'takeover' | 'reassign') => void;
  primaryColor: string;
}

export const TicketDetailModal = React.memo(({
  selectedTicket,
  setSelectedTicket,
  isDark,
  themeClasses,
  getStatusColor,
  formatDate,
  getDeviceInfo,
  adminUser,
  ticketLogs,
  users,
  STATUSES,
  modalStatus,
  setModalStatus,
  modalPriority,
  setModalPriority,
  handleUpdateClick,
  handleIntervention,
  primaryColor
}: TicketDetailModalProps) => {
  if (!selectedTicket) return null;

  const priorityInfo = PRIORITIES.find((p: any) => p.id === (selectedTicket.priority || 'Medium')) || PRIORITIES[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setSelectedTicket(null)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh] transition-colors ${themeClasses.card} ${themeClasses.text}`}
      >
        <div className={`p-3 sm:p-5 border-b shrink-0 ${themeClasses.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center text-emerald-600">
                <Ticket className="w-3.5 h-3.5 sm:w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className={`text-[8px] sm:text-[9px] font-bold ${themeClasses.textMuted}`}>#{selectedTicket.ticket_no || selectedTicket.id.toString().padStart(4, '0')}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-bold uppercase tracking-wider border text-center min-w-[65px] inline-block ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status === 'In Progress' ? 'PROGRES' : 
                     selectedTicket.status === 'Completed' ? 'SELESAI' : 
                     selectedTicket.status === 'Cancelled' ? 'BATAL' : 
                     selectedTicket.status === 'New' ? 'BARU' : selectedTicket.status}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-white ${priorityInfo.color}`}>
                    {priorityInfo.label}
                  </span>
                </div>
                <h2 className={`text-xs sm:text-base font-black tracking-tight ${themeClasses.text}`}>{selectedTicket.category} Request</h2>
              </div>
            </div>
            <button 
              onClick={() => setSelectedTicket(null)}
              className={`p-1.5 rounded-full transition-all ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <X className="w-4 h-4 sm:w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-5 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">
            {/* Left Column: Info & Description */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-5">
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                <div className={`p-1.5 sm:p-2.5 rounded-xl border flex items-center gap-2 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className={`text-[6px] sm:text-[7px] font-bold ${themeClasses.textMuted} uppercase tracking-widest truncate`}>Pengguna</p>
                    <p className={`text-[9px] sm:text-[11px] font-bold ${themeClasses.text} truncate`}>{selectedTicket.name}</p>
                  </div>
                </div>
                <div className={`p-1.5 sm:p-2.5 rounded-xl border flex items-center gap-2 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                  <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className={`text-[6px] sm:text-[7px] font-bold ${themeClasses.textMuted} uppercase tracking-widest truncate`}>Bagian</p>
                    <p className={`text-[9px] sm:text-[11px] font-bold ${themeClasses.text} truncate`}>{selectedTicket.department}</p>
                  </div>
                </div>
                <div className={`p-1.5 sm:p-2.5 rounded-xl border flex items-center gap-2 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                  <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className={`text-[6px] sm:text-[7px] font-bold ${themeClasses.textMuted} uppercase tracking-widest truncate`}>Telepon</p>
                    <p className={`text-[9px] sm:text-[11px] font-bold ${themeClasses.text} truncate`}>
                      {adminUser ? selectedTicket.phone : '••••••••'}
                    </p>
                  </div>
                </div>
                <div className={`p-1.5 sm:p-2.5 rounded-xl border flex items-center gap-2 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                  <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className={`text-[6px] sm:text-[7px] font-bold ${themeClasses.textMuted} uppercase tracking-widest truncate`}>Kategori</p>
                    <p className={`text-[9px] sm:text-[11px] font-bold ${themeClasses.text} truncate`}>{selectedTicket.category}</p>
                  </div>
                </div>
              </div>

              <div className={`p-2.5 sm:p-3.5 rounded-2xl border ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                <div className="flex items-center gap-2 text-slate-400 mb-1 sm:mb-1.5">
                  <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">Masalah / Detail</span>
                </div>
                <p className={`text-[11px] sm:text-xs whitespace-pre-wrap leading-relaxed ${themeClasses.text}`}>
                  {selectedTicket.description}
                </p>
              </div>

              {adminUser && (
                <div className={`p-2.5 sm:p-3.5 rounded-2xl border ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                  <div className="flex items-center gap-2 text-slate-400 mb-1.5 sm:mb-2">
                    <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">Audit Log</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div>
                      <p className={`text-[6px] sm:text-[7px] font-bold ${themeClasses.textMuted} uppercase tracking-widest`}>IP</p>
                      <p className={`text-[8px] sm:text-[9px] font-mono font-bold ${themeClasses.text}`}>
                        {selectedTicket.ip_address || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-[6px] sm:text-[7px] font-bold ${themeClasses.textMuted} uppercase tracking-widest`}>Device</p>
                      <p className={`text-[8px] sm:text-[9px] font-mono font-bold ${themeClasses.text} truncate`}>
                        {getDeviceInfo(selectedTicket.user_agent || '')}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[6px] sm:text-[7px] font-bold text-slate-400 uppercase tracking-widest">GPS</p>
                      {selectedTicket.latitude ? (
                        <a 
                          href={`https://www.google.com/maps?q=${selectedTicket.latitude},${selectedTicket.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-blue-500 hover:underline"
                        >
                          <MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                          {selectedTicket.latitude.toFixed(2)}, {selectedTicket.longitude?.toFixed(2)}
                        </a>
                      ) : (
                        <p className="text-[8px] sm:text-[9px] font-bold text-rose-500">No Data</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(selectedTicket.assigned_to || selectedTicket.admin_reply) && (
                <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/30">
                  <div className="bg-emerald-100/50 px-3 py-1 border-b border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest">Tim Respon IT</span>
                    </div>
                  </div>
                  <div className="p-2.5 sm:p-3.5">
                    {selectedTicket.admin_reply ? (
                      <div className="space-y-1">
                        <p className="text-[11px] sm:text-xs text-emerald-900 leading-relaxed font-semibold italic">
                          "{selectedTicket.admin_reply}"
                        </p>
                        <p className="text-[7px] sm:text-[8px] text-emerald-600 font-black uppercase tracking-widest pt-1 border-t border-emerald-100">Balasan Resmi</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-600/70">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
                        <p className="text-[9px] sm:text-[11px] font-bold italic">
                          {selectedTicket.status === 'New' 
                            ? `Mohon ditunggu, ${selectedTicket.assigned_to || 'Tim IT'} akan segera merespon` 
                            : `Sedang ditangani oleh ${selectedTicket.assigned_to || 'Tim IT'}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-1 p-2 bg-white rounded-xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[6px] sm:text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Diajukan</span>
                  <span className="text-[8px] sm:text-[9px] font-medium text-slate-600 truncate">{formatDate(selectedTicket.created_at)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[6px] sm:text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Respon</span>
                  <span className="text-[8px] sm:text-[9px] font-medium text-slate-600 truncate">{selectedTicket.responded_at ? formatDate(selectedTicket.responded_at) : '-'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[6px] sm:text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Selesai</span>
                  <span className="text-[8px] sm:text-[9px] font-medium text-slate-600 truncate">{selectedTicket.resolved_at ? formatDate(selectedTicket.resolved_at) : '-'}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Photo & Admin Actions */}
            <div className="lg:col-span-5 space-y-3 sm:space-y-5">
              {(selectedTicket.photo || selectedTicket.face_photo) && (
                <div className="space-y-3">
                  {selectedTicket.photo && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">Lampiran Foto</span>
                      </div>
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center">
                        <img 
                          src={selectedTicket.photo} 
                          alt="Ticket attachment" 
                          className="max-w-full max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}

                  {selectedTicket.face_photo && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Scan className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">Foto Verifikasi Wajah</span>
                      </div>
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center">
                        <img 
                          src={selectedTicket.face_photo} 
                          alt="Face verification" 
                          className="max-w-full max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ticket History / Logs */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <History className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">Riwayat Tiket</span>
                </div>
                <div className={`rounded-2xl border p-2.5 sm:p-3.5 space-y-2.5 sm:space-y-3.5 max-h-[180px] sm:max-h-[250px] overflow-y-auto custom-scrollbar ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  {(!Array.isArray(ticketLogs) || ticketLogs.length === 0) ? (
                    <p className="text-[8px] sm:text-[9px] text-slate-400 italic text-center py-3">Belum ada riwayat aktivitas.</p>
                  ) : (
                    <div className="space-y-2.5 sm:space-y-3.5 relative before:absolute before:left-[6px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                      {ticketLogs.map((log, idx) => (
                        <div key={idx} className="relative pl-4.5 sm:pl-5.5">
                          <div className={`absolute left-0 top-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center ${
                            log.action.includes('Status') ? 'bg-emerald-500' :
                            log.action.includes('Tugaskan') ? 'bg-blue-500' :
                            log.action.includes('Ambil Alih') ? 'bg-amber-500' :
                            'bg-slate-400'
                          }`}>
                            <div className="w-0.5 h-0.5 bg-white rounded-full" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-[8px] sm:text-[9px] font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{log.action}</p>
                              <span className="text-[6px] sm:text-[7px] font-bold text-slate-400 whitespace-nowrap">{formatDate(log.created_at)}</span>
                            </div>
                            <p className="text-[7px] sm:text-[8px] font-medium text-slate-500 leading-relaxed">
                              Oleh: <span className="font-bold text-slate-600 dark:text-slate-400">{log.performed_by}</span>
                            </p>
                            {log.note && (
                              <div className={`mt-0.5 p-1 sm:p-1.5 rounded-lg text-[7px] sm:text-[8px] font-medium italic leading-relaxed ${isDark ? 'bg-slate-900/50 text-slate-400' : 'bg-white text-slate-500'}`}>
                                "{log.note}"
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {adminUser && (
                <div className="bg-slate-900 rounded-2xl p-3.5 sm:p-4.5 shadow-xl space-y-2.5 sm:space-y-3.5">
                  <div className="flex items-center gap-2 text-white mb-0.5">
                    <Settings2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                    <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Tindakan Admin</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:gap-3.5">
                    {adminUser.role === 'Super Admin' && selectedTicket.assigned_to && selectedTicket.assigned_to !== adminUser.username && (
                      <button
                        onClick={() => handleIntervention(selectedTicket.id, 'takeover')}
                        className="w-full bg-amber-500 text-white font-black py-1.5 sm:py-2 rounded-xl hover:bg-amber-600 transition-all uppercase tracking-widest text-[7px] sm:text-[8px] shadow-lg shadow-amber-900/20 active:scale-[0.98]"
                      >
                        Ambil Alih Tiket
                      </button>
                    )}
                    <div className="space-y-0.5">
                      <label className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tugaskan IT</label>
                      {adminUser.role === 'Super Admin' ? (
                        <select 
                          id={`modal-assignee-${selectedTicket.id}`}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-1.5 sm:py-2 px-2.5 text-[9px] sm:text-[11px] outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
                          defaultValue={selectedTicket.assigned_to || ''}
                        >
                          <option value="">Pilih IT...</option>
                          {Array.isArray(users) && users.map(u => (
                            <option key={u.id} value={u.username}>{u.full_name || u.username}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="relative">
                          <input 
                            id={`modal-assignee-${selectedTicket.id}`}
                            type="text"
                            readOnly
                            className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-xl py-1.5 sm:py-2 px-2.5 text-[9px] sm:text-[11px] outline-none font-bold"
                            value={selectedTicket.assigned_to || adminUser.username}
                          />
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                            <Lock className="w-2.5 h-2.5 text-slate-500" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioritas</label>
                      <div className="flex gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700 overflow-x-auto no-scrollbar">
                        {PRIORITIES.map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => setModalPriority(p.id)}
                            className={`flex-1 min-w-[50px] py-1 rounded-lg text-[6px] sm:text-[7px] font-black uppercase tracking-tighter transition-all ${
                              (modalPriority || selectedTicket.priority || 'Medium') === p.id 
                              ? `${p.color} text-white shadow-lg` 
                              : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                      <div className="flex gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700 overflow-x-auto no-scrollbar">
                        {Array.isArray(STATUSES) && STATUSES.map(status => (
                          <button
                            key={status}
                            onClick={() => setModalStatus(status)}
                            className={`flex-1 min-w-[50px] py-1 rounded-lg text-[6px] sm:text-[7px] font-black uppercase tracking-tighter transition-all ${
                              (modalStatus || selectedTicket.status) === status 
                              ? (
                                status === 'New' ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/40' :
                                status === 'In Progress' ? 'bg-blue-500 text-white shadow-lg shadow-blue-900/40' :
                                status === 'Completed' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' :
                                'bg-rose-500 text-white shadow-lg shadow-rose-900/40'
                              )
                              : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                          >
                            {status === 'In Progress' ? 'PROGRES' : 
                             status === 'Completed' ? 'SELESAI' : 
                             status === 'Cancelled' ? 'BATAL' : 
                             status === 'New' ? 'BARU' : status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Balasan Resolusi (Publik)</label>
                    <textarea 
                      id={`modal-reply-${selectedTicket.id}`}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all font-medium placeholder:text-slate-600"
                      placeholder="Tulis solusi di sini..."
                      rows={2}
                      defaultValue={selectedTicket.admin_reply || ''}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Internal (Private)</label>
                    <textarea 
                      id={`modal-internal-${selectedTicket.id}`}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all font-medium placeholder:text-slate-600"
                      placeholder="Catatan rahasia tim IT..."
                      rows={2}
                      defaultValue={selectedTicket.internal_notes || ''}
                    />
                  </div>

                  <button
                    onClick={() => {
                      const assignee = adminUser.role === 'Super Admin' 
                        ? (document.getElementById(`modal-assignee-${selectedTicket.id}`) as HTMLSelectElement).value 
                        : (selectedTicket.assigned_to || adminUser.username);
                      const reply = (document.getElementById(`modal-reply-${selectedTicket.id}`) as HTMLTextAreaElement).value;
                      const internal = (document.getElementById(`modal-internal-${selectedTicket.id}`) as HTMLTextAreaElement).value;
                      const status = modalStatus || selectedTicket.status;
                      const priority = modalPriority || selectedTicket.priority || 'Medium';
                      handleUpdateClick(selectedTicket.id, status, assignee, reply, internal, priority);
                      setSelectedTicket(null);
                      setModalStatus('');
                      setModalPriority('');
                    }}
                    style={{ backgroundColor: primaryColor }}
                    className="w-full text-white font-black py-2.5 sm:py-3 rounded-xl hover:opacity-90 transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest text-[9px] sm:text-[10px]"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});
