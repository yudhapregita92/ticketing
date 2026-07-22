import React, { useState, useEffect } from 'react';
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
  Scan,
  Clock
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
  handleUpdateClick: (
    id: number, 
    status: string, 
    assigned_to: string | null, 
    reply: string | null, 
    internal: string | null, 
    priority?: string,
    estimated_duration?: string | null,
    estimated_start_at?: string | null,
    estimated_target_at?: string | null
  ) => void;
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

  const toLocalISOString = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const tzOffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
  };

  const [estMode, setEstMode] = useState<'quick' | 'range' | 'none'>(() => {
    if (selectedTicket?.estimated_start_at) return 'range';
    if (selectedTicket?.estimated_duration) return 'quick';
    return 'none';
  });

  const [estQuickMins, setEstQuickMins] = useState<number>(() => {
    if (selectedTicket?.estimated_duration?.includes('120')) return 120;
    if (selectedTicket?.estimated_duration?.includes('60')) return 60;
    if (selectedTicket?.estimated_duration?.includes('30')) return 30;
    return 30;
  });

  const [estStartAt, setEstStartAt] = useState<string>(() => {
    return toLocalISOString(selectedTicket?.estimated_start_at);
  });

  const [estTargetAt, setEstTargetAt] = useState<string>(() => {
    return toLocalISOString(selectedTicket?.estimated_target_at);
  });

  useEffect(() => {
    if (selectedTicket) {
      if (selectedTicket.estimated_start_at) {
        setEstMode('range');
      } else if (selectedTicket.estimated_duration) {
        setEstMode('quick');
      } else {
        setEstMode('none');
      }

      if (selectedTicket.estimated_duration?.includes('120')) setEstQuickMins(120);
      else if (selectedTicket.estimated_duration?.includes('60')) setEstQuickMins(60);
      else if (selectedTicket.estimated_duration?.includes('30')) setEstQuickMins(30);

      setEstStartAt(toLocalISOString(selectedTicket.estimated_start_at));
      setEstTargetAt(toLocalISOString(selectedTicket.estimated_target_at));
    }
  }, [selectedTicket]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className={`relative rounded-3xl shadow-2xl w-full max-w-4xl sm:max-w-5xl lg:max-w-6xl overflow-hidden flex flex-col max-h-[92vh] transition-colors ${themeClasses.card} ${themeClasses.text}`}
      >
        {/* Header Modal */}
        <div className={`px-5 py-4 sm:px-7 sm:py-5 border-b shrink-0 ${themeClasses.border}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50">
                <Ticket className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold font-mono ${themeClasses.textMuted}`}>#{selectedTicket.ticket_no || selectedTicket.id.toString().padStart(4, '0')}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold capitalize tracking-wider border text-center ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status === 'In Progress' ? 'Progres' : 
                     selectedTicket.status === 'Completed' ? 'Selesai' : 
                     selectedTicket.status === 'Cancelled' ? 'Batal' : 
                     selectedTicket.status === 'New' ? 'Baru' : selectedTicket.status}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold capitalize tracking-wider text-center border border-transparent text-white ${priorityInfo.color}`}>
                    Prioritas {priorityInfo.label}
                  </span>
                </div>
                <h2 className={`text-base sm:text-xl font-black tracking-tight mt-0.5 ${themeClasses.text}`}>{selectedTicket.category} Request</h2>
              </div>
            </div>
            <button 
              onClick={() => setSelectedTicket(null)}
              className={`p-2 rounded-full transition-all ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              title="Tutup Modal"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-start">
            
            {/* Left Column: Info & Detail Request */}
            <div className="lg:col-span-7 space-y-5">
              {/* User & Request Info Grid */}
              {adminUser ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                  <div className={`p-3 sm:p-3.5 rounded-2xl border flex items-center gap-3 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider`}>Pengguna</p>
                      <p className={`text-xs sm:text-sm font-extrabold ${themeClasses.text} truncate`}>{selectedTicket.name}</p>
                    </div>
                  </div>

                  <div className={`p-3 sm:p-3.5 rounded-2xl border flex items-center gap-3 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Building2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider`}>Bagian / Dept</p>
                      <p className={`text-xs sm:text-sm font-extrabold ${themeClasses.text} truncate`}>{selectedTicket.department}</p>
                    </div>
                  </div>

                  <div className={`p-3 sm:p-3.5 rounded-2xl border flex items-center gap-3 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Phone className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider`}>Nomor Telepon</p>
                      <p className={`text-xs sm:text-sm font-bold ${themeClasses.text} font-mono truncate`}>
                        {selectedTicket.phone || '••••••••'}
                      </p>
                    </div>
                  </div>

                  <div className={`p-3 sm:p-3.5 rounded-2xl border flex items-center gap-3 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Layers className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider`}>Kategori</p>
                      <p className={`text-xs sm:text-sm font-extrabold ${themeClasses.text} truncate`}>{selectedTicket.category}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`p-3.5 sm:p-4 rounded-2xl border flex items-center gap-3.5 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider`}>Nama Pengguna</p>
                    <p className={`text-sm sm:text-base font-black ${themeClasses.text} truncate`}>{selectedTicket.name}</p>
                  </div>
                </div>
              )}

              {/* Deskripsi Masalah */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${themeClasses.bgSecondary} ${themeClasses.border} space-y-2`}>
                <div className="flex items-center gap-2 text-slate-400">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Detail Permasalahan</span>
                </div>
                <p className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${themeClasses.text}`}>
                  {selectedTicket.description}
                </p>
              </div>

              {/* Audit Log (IP / Device / GPS) */}
              {adminUser && (
                <div className={`p-4 rounded-2xl border ${themeClasses.bgSecondary} ${themeClasses.border} space-y-2`}>
                  <div className="flex items-center gap-2 text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Audit Log & Perangkat</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <p className={`text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider`}>IP Address</p>
                      <p className={`text-xs font-mono font-bold ${themeClasses.text}`}>
                        {selectedTicket.ip_address || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider`}>Perangkat</p>
                      <p className={`text-xs font-mono font-bold ${themeClasses.text} truncate`}>
                        {getDeviceInfo(selectedTicket.user_agent || '')}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokasi GPS</p>
                      {selectedTicket.latitude ? (
                        <a 
                          href={`https://www.google.com/maps?q=${selectedTicket.latitude},${selectedTicket.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-blue-500 hover:underline mt-0.5"
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {selectedTicket.latitude.toFixed(3)}, {selectedTicket.longitude?.toFixed(3)}
                        </a>
                      ) : (
                        <p className="text-xs font-bold text-rose-500 mt-0.5">Tidak ada data GPS</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Banner Status Respon & SLA IT */}
              {(selectedTicket.assigned_to || selectedTicket.admin_reply || selectedTicket.estimated_duration || selectedTicket.estimated_target_at) && (
                <div className="overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30">
                  <div className="bg-emerald-100/60 dark:bg-emerald-900/40 px-4 py-2 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs font-extrabold uppercase tracking-wider">Status Penanganan IT</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {selectedTicket.admin_reply && (
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 leading-relaxed font-semibold italic">
                          "{selectedTicket.admin_reply}"
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">Balasan Resmi Petugas</p>
                      </div>
                    )}

                    {(selectedTicket.estimated_duration || selectedTicket.estimated_target_at) && (
                      <div className="p-3 rounded-xl bg-white/80 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3 shadow-sm">
                        <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-100 block">
                            Estimasi Pengerjaan: <span className="font-extrabold text-emerald-700 dark:text-emerald-300">{selectedTicket.estimated_duration || 'Jadwal Khusus'}</span>
                          </span>
                          {selectedTicket.estimated_start_at && selectedTicket.estimated_target_at && (
                            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                              📅 Jadwal Pengerjaan: <span className="font-mono font-semibold">{formatDate(selectedTicket.estimated_start_at)}</span> s/d <span className="font-mono font-semibold">{formatDate(selectedTicket.estimated_target_at)}</span>
                            </p>
                          )}
                          {!selectedTicket.estimated_start_at && selectedTicket.estimated_target_at && (
                            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                              🎯 Target Selesai: <span className="font-mono font-semibold">{formatDate(selectedTicket.estimated_target_at)}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {!selectedTicket.admin_reply && !(selectedTicket.estimated_duration || selectedTicket.estimated_target_at) && (
                      <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
                        <div className="w-5 h-5 rounded-full border-2 border-emerald-300 border-t-emerald-600 animate-spin" />
                        <p className="text-xs font-bold italic">
                          {selectedTicket.status === 'New' 
                            ? `Mohon ditunggu, ${selectedTicket.assigned_to || 'Tim IT'} akan segera merespon` 
                            : `Sedang ditangani oleh ${selectedTicket.assigned_to || 'Tim IT'}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline Info (Diajukan, Respon, Selesai) */}
              <div className={`grid grid-cols-3 gap-3 p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Diajukan</span>
                  <span className={`text-xs font-semibold font-mono truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{formatDate(selectedTicket.created_at)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Direspon</span>
                  <span className={`text-xs font-semibold font-mono truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{selectedTicket.responded_at ? formatDate(selectedTicket.responded_at) : '-'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Selesai</span>
                  <span className={`text-xs font-semibold font-mono truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{selectedTicket.resolved_at ? formatDate(selectedTicket.resolved_at) : '-'}</span>
                </div>
              </div>

              {/* Attachments */}
              {(selectedTicket.photo || selectedTicket.face_photo) && (
                <div className="space-y-3">
                  {selectedTicket.photo && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Lampiran Foto Tiket</span>
                      </div>
                      <div className={`relative rounded-2xl overflow-hidden border aspect-video flex items-center justify-center p-2 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-100'}`}>
                        <img 
                          src={selectedTicket.photo} 
                          alt="Ticket attachment" 
                          className="max-w-full max-h-full object-contain rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}

                  {selectedTicket.face_photo && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Verifikasi Wajah</span>
                      </div>
                      <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold">Foto verifikasi wajah tersimpan</span>
                        </div>
                        {adminUser && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-500/30 bg-black/20 shrink-0">
                            <img 
                              src={selectedTicket.face_photo} 
                              alt="Face preview" 
                              className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                              referrerPolicy="no-referrer"
                              onClick={() => window.open(selectedTicket.face_photo!, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Riwayat Aktivitas Tiket */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <History className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Riwayat Aktivitas Tiket</span>
                </div>
                <div className={`rounded-2xl border p-4 space-y-3.5 max-h-[220px] overflow-y-auto custom-scrollbar ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  {(!Array.isArray(ticketLogs) || ticketLogs.length === 0) ? (
                    <p className="text-xs text-slate-400 italic text-center py-3">Belum ada riwayat aktivitas.</p>
                  ) : (
                    <div className="space-y-3 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300 dark:before:bg-slate-700">
                      {ticketLogs.map((log, idx) => (
                        <div key={idx} className="relative pl-6">
                          <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center ${
                            log.action.includes('Status') ? 'bg-emerald-500' :
                            log.action.includes('Tugaskan') ? 'bg-blue-500' :
                            log.action.includes('Ambil Alih') ? 'bg-amber-500' :
                            'bg-slate-400'
                          }`}>
                            <div className="w-1 h-1 bg-white rounded-full" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{log.action}</p>
                              <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">{formatDate(log.created_at)}</span>
                            </div>
                            <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              Oleh: <span className="font-bold text-slate-700 dark:text-slate-300">{log.performed_by}</span>
                            </p>
                            {log.note && (
                              <div className={`mt-1 p-2 rounded-xl text-xs font-medium italic ${isDark ? 'bg-slate-900/60 text-slate-300 border border-slate-800' : 'bg-white text-slate-700 border border-slate-200'}`}>
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
            </div>

            {/* Right Column: Panel Tindakan Admin */}
            <div className="lg:col-span-5">
              {adminUser ? (
                <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-800 space-y-5 text-slate-100 sticky top-0">
                  {/* Panel Header */}
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Settings2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide">Tindakan Admin & SLA</h3>
                      <p className="text-[11px] text-slate-400">Atur petugas, prioritas, status & estimasi</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Ambil Alih Tiket (Super Admin) */}
                    {adminUser.role === 'Super Admin' && selectedTicket.assigned_to && selectedTicket.assigned_to !== adminUser.username && (
                      <button
                        type="button"
                        onClick={() => handleIntervention(selectedTicket.id, 'takeover')}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold py-2.5 px-4 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all text-xs tracking-wider uppercase shadow-lg shadow-amber-950/40 active:scale-[0.98]"
                      >
                        ⚡ Ambil Alih Tiket
                      </button>
                    )}

                    {/* Tugaskan IT */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        Tugaskan ke Petugas IT
                      </label>
                      {adminUser.role === 'Super Admin' ? (
                        <select 
                          id={`modal-assignee-${selectedTicket.id}`}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 px-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold cursor-pointer"
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
                            className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-xl py-2.5 px-3 text-xs sm:text-sm outline-none font-semibold"
                            value={selectedTicket.assigned_to || adminUser.username}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Prioritas Tiket */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 tracking-wider">Tingkat Prioritas</label>
                      <div className="grid grid-cols-4 gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                        {PRIORITIES.map((p: any) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setModalPriority(p.id)}
                            className={`py-1.5 px-1 rounded-lg text-xs font-black capitalize tracking-tight transition-all text-center ${
                              (modalPriority || selectedTicket.priority || 'Medium') === p.id 
                              ? `${p.color} text-white shadow-md ring-1 ring-white/20` 
                              : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status Tiket */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 tracking-wider">Status Tiket</label>
                      <div className="grid grid-cols-4 gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                        {Array.isArray(STATUSES) && STATUSES.map(status => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setModalStatus(status)}
                            className={`py-1.5 px-1 rounded-lg text-xs font-black capitalize tracking-tight transition-all text-center ${
                              (modalStatus || selectedTicket.status) === status 
                              ? (
                                status === 'New' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50' :
                                status === 'In Progress' ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50' :
                                status === 'Completed' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50' :
                                'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                              )
                              : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                            }`}
                          >
                            {status === 'In Progress' ? 'Progres' : 
                             status === 'Completed' ? 'Selesai' : 
                             status === 'Cancelled' ? 'Batal' : 
                             status === 'New' ? 'Baru' : status}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Estimasi Waktu Pengerjaan / SLA Options */}
                    <div className="space-y-2.5 p-3.5 sm:p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 tracking-wider flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-emerald-400" />
                          Estimasi Waktu Pengerjaan
                        </label>
                      </div>

                      {/* Mode Toggle Buttons */}
                      <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
                        <button
                          type="button"
                          onClick={() => setEstMode('quick')}
                          className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                            estMode === 'quick' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Opsi 1: Cepat
                        </button>
                        <button
                          type="button"
                          onClick={() => setEstMode('range')}
                          className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                            estMode === 'range' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Opsi 2: Rentang
                        </button>
                        <button
                          type="button"
                          onClick={() => setEstMode('none')}
                          className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                            estMode === 'none' ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Kosongkan
                        </button>
                      </div>

                      {/* Option 1: Quick Duration */}
                      {estMode === 'quick' && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[11px] font-medium text-slate-400">Pilih durasi cepat dari saat ini:</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[30, 60, 120].map(mins => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => setEstQuickMins(mins)}
                                className={`py-2 px-2 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
                                  estQuickMins === mins
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                <Clock className="w-3 h-3 shrink-0" />
                                {mins === 60 ? '1 Jam (60m)' : mins === 120 ? '2 Jam (120m)' : `${mins} Mnt`}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Option 2: Date & Time Range Picker */}
                      {estMode === 'range' && (
                        <div className="space-y-2 pt-1">
                          <p className="text-[11px] font-medium text-slate-400">Tentukan jadwal tanggal & jam pengerjaan:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-1">Mulai Pengerjaan</label>
                              <input
                                type="datetime-local"
                                value={estStartAt}
                                onChange={e => setEstStartAt(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2 text-xs font-mono outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-1">Target Selesai</label>
                              <input
                                type="datetime-local"
                                value={estTargetAt}
                                onChange={e => setEstTargetAt(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2 text-xs font-mono outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Balasan Resolusi (Publik) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 tracking-wider">Balasan Resolusi (Publik untuk User)</label>
                      <textarea 
                        id={`modal-reply-${selectedTicket.id}`}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 px-3.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all font-medium placeholder:text-slate-500"
                        placeholder="Tulis solusi atau informasi untuk pengguna..."
                        rows={3}
                        defaultValue={selectedTicket.admin_reply || ''}
                      />
                    </div>

                    {/* Catatan Internal (Private) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 tracking-wider">Catatan Internal (Rahasia Tim IT)</label>
                      <textarea 
                        id={`modal-internal-${selectedTicket.id}`}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 px-3.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all font-medium placeholder:text-slate-500"
                        placeholder="Catatan internal tim IT..."
                        rows={2}
                        defaultValue={selectedTicket.internal_notes || ''}
                      />
                    </div>

                    {/* Button Simpan */}
                    <button
                      type="button"
                      onClick={() => {
                        const assignee = adminUser.role === 'Super Admin' 
                          ? (document.getElementById(`modal-assignee-${selectedTicket.id}`) as HTMLSelectElement).value 
                          : (selectedTicket.assigned_to || adminUser.username);
                        const reply = (document.getElementById(`modal-reply-${selectedTicket.id}`) as HTMLTextAreaElement).value;
                        const internal = (document.getElementById(`modal-internal-${selectedTicket.id}`) as HTMLTextAreaElement).value;
                        const status = modalStatus || selectedTicket.status;
                        const priority = modalPriority || selectedTicket.priority || 'Medium';

                        let finalEstDuration: string | null = null;
                        let finalEstStartAt: string | null = null;
                        let finalEstTargetAt: string | null = null;

                        if (estMode === 'quick') {
                          finalEstDuration = `${estQuickMins} menit`;
                          const now = new Date();
                          const target = new Date(now.getTime() + estQuickMins * 60000);
                          finalEstStartAt = now.toISOString();
                          finalEstTargetAt = target.toISOString();
                        } else if (estMode === 'range') {
                          if (estStartAt && estTargetAt) {
                            finalEstStartAt = new Date(estStartAt).toISOString();
                            finalEstTargetAt = new Date(estTargetAt).toISOString();
                            const diffMs = new Date(estTargetAt).getTime() - new Date(estStartAt).getTime();
                            if (diffMs > 0) {
                              const diffMins = Math.round(diffMs / 60000);
                              if (diffMins >= 60) {
                                const hours = (diffMins / 60).toFixed(1).replace('.0', '');
                                finalEstDuration = `Jadwal Khusus (${hours} jam)`;
                              } else {
                                finalEstDuration = `Jadwal Khusus (${diffMins} menit)`;
                              }
                            } else {
                              finalEstDuration = 'Jadwal Khusus';
                            }
                          } else if (estTargetAt) {
                            finalEstTargetAt = new Date(estTargetAt).toISOString();
                            finalEstDuration = 'Target Khusus';
                          }
                        }

                        handleUpdateClick(
                          selectedTicket.id, 
                          status, 
                          assignee, 
                          reply, 
                          internal, 
                          priority,
                          finalEstDuration,
                          finalEstStartAt,
                          finalEstTargetAt
                        );
                        setSelectedTicket(null);
                        setModalStatus('');
                        setModalPriority('');
                      }}
                      style={{ backgroundColor: primaryColor }}
                      className="w-full text-white font-extrabold py-3 px-4 rounded-xl hover:opacity-90 transition-all shadow-xl active:scale-[0.98] uppercase tracking-wider text-xs sm:text-sm cursor-pointer mt-2"
                    >
                      💾 Simpan Perubahan
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`p-5 rounded-3xl border ${themeClasses.bgSecondary} ${themeClasses.border} text-center space-y-2`}>
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className={`text-xs font-bold ${themeClasses.text}`}>Sistem Penanganan Tiket IT</p>
                  <p className={`text-[11px] ${themeClasses.textMuted}`}>Hanya admin dan tim IT bertugas yang dapat mengubah status tiket.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
});
