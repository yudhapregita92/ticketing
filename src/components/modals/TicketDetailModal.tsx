import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
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
  Clock,
  CheckCircle2,
  RotateCcw,
  Send,
  Star
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
  currentUser?: any;
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
    estimated_target_at?: string | null,
    require_rating?: number | null
  ) => void;
  handleIntervention: (id: number, type: 'takeover' | 'reassign') => void;
  primaryColor: string;
  onRefreshTickets?: () => void;
  onForwardWhatsApp?: (ticket: ITicket) => void;
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
  currentUser,
  ticketLogs,
  users,
  STATUSES,
  modalStatus,
  setModalStatus,
  modalPriority,
  setModalPriority,
  handleUpdateClick,
  handleIntervention,
  primaryColor,
  onRefreshTickets,
  onForwardWhatsApp
}: TicketDetailModalProps) => {
  if (!selectedTicket) return null;

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
    
    const tName = (selectedTicket.name || '').trim().toLowerCase();
    const tPhone = (selectedTicket.phone || '').replace(/\D/g, '');

    // Match by Name
    if (cleanActiveName && tName && cleanActiveName === tName) {
      return true;
    }

    // Match by Phone (min 8 digits)
    if (cleanActivePhone.length >= 8 && tPhone.length >= 8 && (cleanActivePhone.endsWith(tPhone) || tPhone.endsWith(cleanActivePhone))) {
      return true;
    }

    return false;
  }, [adminUser, currentUser, selectedTicket]);

  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const handleConfirmClose = async () => {
    if (!selectedTicket) return;
    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Closed',
          performed_by: selectedTicket.name || 'Pengguna (User)',
          note: 'Pengguna mengonfirmasi penanganan tiket tuntas dan menutup tiket.'
        })
      });
      if (res.ok) {
        toast.success('Terima kasih! Tiket resmi ditutup (Closed).');
        setSelectedTicket({
          ...selectedTicket,
          status: 'Closed'
        });
        if (onRefreshTickets) onRefreshTickets();
      } else {
        toast.error('Gagal memperbarui status tiket.');
      }
    } catch (err) {
      console.error('Confirm close error:', err);
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleUserReopen = async () => {
    if (!selectedTicket || !reopenReason.trim()) return;
    setIsSubmittingAction(true);
    try {
      const existingReply = selectedTicket.admin_reply || '';
      const newReply = existingReply 
        ? `${existingReply}\n\n[Re-Open Pengguna]: ${reopenReason.trim()}`
        : `[Re-Open Pengguna]: ${reopenReason.trim()}`;

      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Re-opened',
          admin_reply: newReply,
          performed_by: selectedTicket.name || 'Pengguna (User)',
          note: `Re-Open oleh Pengguna: ${reopenReason.trim()}`
        })
      });
      if (res.ok) {
        toast.success('Permohonan Re-Open berhasil dikirim ke tim IT!');
        setSelectedTicket({
          ...selectedTicket,
          status: 'Re-opened',
          admin_reply: newReply
        });
        setShowReopenForm(false);
        setReopenReason('');
        if (onRefreshTickets) onRefreshTickets();
      } else {
        toast.error('Gagal mengajukan re-open tiket.');
      }
    } catch (err) {
      console.error('Re-open error:', err);
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

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

  const [requireRating, setRequireRating] = useState<boolean>(() => {
    return selectedTicket?.require_rating === 1;
  });

  useEffect(() => {
    if (selectedTicket) {
      setRequireRating(selectedTicket.require_rating === 1);
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

  const handleSave = () => {
    if (!selectedTicket || !adminUser) return;
    const assignee = adminUser.role === 'Super Admin' 
      ? ((document.getElementById(`modal-assignee-${selectedTicket.id}`) as HTMLSelectElement)?.value || '') 
      : (selectedTicket.assigned_to || adminUser.username);
    const reply = (document.getElementById(`modal-reply-${selectedTicket.id}`) as HTMLTextAreaElement)?.value || '';
    const internal = (document.getElementById(`modal-internal-${selectedTicket.id}`) as HTMLTextAreaElement)?.value || '';
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
      finalEstTargetAt,
      requireRating ? 1 : 0
    );
    setSelectedTicket(null);
    setModalStatus('');
    setModalPriority('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <motion.div 
        key="ticket-detail-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setSelectedTicket(null)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        key="ticket-detail-content"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`relative rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] my-auto transition-colors ${themeClasses.card} ${themeClasses.text}`}
      >
        {/* Header Modal */}
        <div className={`px-4 py-3 sm:px-6 sm:py-3.5 border-b shrink-0 ${themeClasses.border}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50 mt-0.5">
                <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="space-y-1.5 min-w-0">
                {/* Baris 1: ID Tiket & Judul/Kategori Tiket */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs sm:text-sm font-bold font-mono ${themeClasses.textMuted}`}>
                    #{selectedTicket.ticket_no || selectedTicket.id.toString().padStart(4, '0')}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                  <h2 className={`text-sm sm:text-base font-black tracking-tight leading-snug truncate ${themeClasses.text}`}>
                    {selectedTicket.category} Request
                  </h2>
                </div>

                {/* Baris 2: Kelompok Badge Informasi (Status, Priority) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center justify-center h-5 min-w-[60px] px-2 rounded-full text-[10px] font-extrabold tracking-wide shadow-2xs whitespace-nowrap text-center ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status === 'In Progress' ? 'Progres' : 
                     selectedTicket.status === 'Completed' ? 'Selesai' : 
                     selectedTicket.status === 'Cancelled' ? 'Batal' : 
                     selectedTicket.status === 'New' ? 'Baru' : selectedTicket.status}
                  </span>
                  <span className={`inline-flex items-center justify-center h-5 px-2 rounded-full text-[9.5px] font-bold uppercase whitespace-nowrap border ${priorityInfo.color}`}>
                    {priorityInfo.label}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedTicket(null)}
              className={`p-1.5 rounded-full transition-all shrink-0 ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3 sm:p-4 lg:p-5 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            
            {/* Left Column: Info & Detail Request */}
            <div className="lg:col-span-6 space-y-2">
              {/* User & Request Info Grid (Single Box with vertical dividers like Image 1) */}
              {adminUser ? (
                <div className={`rounded-xl border ${themeClasses.bgSecondary} ${themeClasses.border} overflow-hidden shadow-xs`}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
                    <div className="p-2 sm:p-2.5 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[9px] font-medium ${themeClasses.textMuted} leading-tight`}>Pengguna:</p>
                        <p className={`text-xs sm:text-sm font-extrabold ${themeClasses.text} truncate`}>{selectedTicket.name}</p>
                      </div>
                    </div>

                    <div className="p-2 sm:p-2.5 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[9px] font-medium ${themeClasses.textMuted} leading-tight`}>Dept:</p>
                        <p className={`text-xs sm:text-sm font-extrabold ${themeClasses.text} truncate`}>{selectedTicket.department}</p>
                      </div>
                    </div>

                    <div className="p-2 sm:p-2.5 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[9px] font-medium ${themeClasses.textMuted} leading-tight`}>Telpon:</p>
                        <p className={`text-xs sm:text-sm font-bold ${themeClasses.text} font-mono truncate`}>
                          {selectedTicket.phone || '••••••••'}
                        </p>
                      </div>
                    </div>

                    <div className="p-2 sm:p-2.5 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[9px] font-medium ${themeClasses.textMuted} leading-tight`}>Kategori:</p>
                        <p className={`text-xs sm:text-sm font-extrabold ${themeClasses.text} truncate`}>{selectedTicket.category}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`p-2 sm:p-2.5 rounded-xl border flex items-center gap-2 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[8px] font-bold ${themeClasses.textMuted} uppercase tracking-wider truncate`}>Nama Pengguna</p>
                    <p className={`text-xs font-black ${themeClasses.text} truncate`}>{selectedTicket.name}</p>
                  </div>
                </div>
              )}

              {/* Deskripsi Masalah */}
              <div className={`p-2.5 sm:p-3 rounded-xl border ${themeClasses.bgSecondary} ${themeClasses.border} space-y-0.5`}>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MessageSquare className="w-3 h-3" />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Detail Permasalahan</span>
                </div>
                <p className={`text-xs whitespace-pre-wrap leading-snug ${themeClasses.text}`}>
                  {selectedTicket.description}
                </p>
              </div>

              {/* Rating & Ulasan Pelayanan */}
              {selectedTicket.rating && Number(selectedTicket.rating) > 0 ? (
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Penilaian & Kepuasan Layanan
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={`star-${selectedTicket.id || 't'}-${s}`}
                          className={`w-4 h-4 ${
                            s <= Number(selectedTicket.rating || 0)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-black text-amber-900 dark:text-amber-200 ml-1">
                        {selectedTicket.rating}/5 Bintang
                      </span>
                    </div>
                  </div>
                  {selectedTicket.rating_feedback && (
                    <p className="text-xs italic text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/60">
                      "{selectedTicket.rating_feedback}"
                    </p>
                  )}
                </div>
              ) : null}

              {/* Audit Log (IP / Device / GPS) */}
              {adminUser && (
                <div className={`p-2.5 sm:p-3 rounded-xl border ${themeClasses.bgSecondary} ${themeClasses.border} space-y-1.5`}>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Audit Log & Perangkat</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                    <div>
                      <p className={`text-[9px] sm:text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider`}>IP Address</p>
                      <p className={`text-xs font-mono font-bold ${themeClasses.text}`}>
                        {selectedTicket.ip_address || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-[9px] sm:text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider`}>Perangkat</p>
                      <p className={`text-xs font-mono font-bold ${themeClasses.text} truncate`}>
                        {getDeviceInfo(selectedTicket.user_agent || '')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokasi GPS</p>
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

              {/* Konfirmasi Penanganan Tiket (User) / Re-Open Section */}
              {(selectedTicket.status === 'Completed' || selectedTicket.status === 'Done' || selectedTicket.status === 'Solved' || selectedTicket.status === 'Selesai') && (
                <div className="p-3.5 sm:p-5 rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900/40 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                        Konfirmasi Penanganan Tiket (User)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 animate-pulse">
                      Menunggu Konfirmasi Anda
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                    Tim IT telah mengubah status ke <strong className="text-emerald-600 dark:text-emerald-400">Selesai / Done</strong>. Silakan periksa hasil pekerjaan IT dan konfirmasikan apakah masalah Anda sudah benar-benar tuntas.
                  </p>

                  {selectedTicket.admin_reply && (
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800 space-y-1">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Solusi / Catatan dari IT:</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 italic">"{selectedTicket.admin_reply}"</p>
                    </div>
                  )}

                  {!showReopenForm ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        disabled={isSubmittingAction}
                        onClick={handleConfirmClose}
                        className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        <span>Ya, Masalah Tuntas (Close Tiket)</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmittingAction}
                        onClick={() => setShowReopenForm(true)}
                        className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        <span>Belum Tuntas (Ajukan Re-Open)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/95 border border-amber-500/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                          Jelaskan Alasan Re-Open Tiket
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowReopenForm(false)}
                          className="text-xs font-bold text-slate-400 hover:text-white"
                        >
                          Batal
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={reopenReason}
                        onChange={e => setReopenReason(e.target.value)}
                        placeholder="Detailkan masalah yang belum selesai atau masih terkendala..."
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-amber-500 font-medium placeholder:text-slate-500"
                      />

                      <button
                        type="button"
                        disabled={isSubmittingAction || !reopenReason.trim()}
                        onClick={handleUserReopen}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Pengajuan Re-Open ke Tim IT</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Banner Tiket Status Closed */}
              {selectedTicket.status === 'Closed' && (
                <div className="p-4 rounded-2xl border border-slate-700 bg-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tiket Resmi Ditutup (Closed)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowReopenForm(prev => !prev)}
                      className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Re-Open Tiket Ini
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">Pengguna telah mengonfirmasi bahwa penanganan kendala selesai dan tuntas.</p>

                  {showReopenForm && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/40 space-y-2 mt-2">
                      <textarea
                        rows={2}
                        value={reopenReason}
                        onChange={e => setReopenReason(e.target.value)}
                        placeholder="Tuliskan alasan re-open tiket ini..."
                        className="w-full p-2 rounded-lg bg-slate-800 text-white text-xs border border-slate-700 outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        disabled={isSubmittingAction || !reopenReason.trim()}
                        onClick={handleUserReopen}
                        className="w-full py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-500 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Kirim Re-Open Tiket
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Banner Tiket Status Re-opened */}
              {selectedTicket.status === 'Re-opened' && (
                <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 space-y-1">
                  <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-amber-400" /> Tiket Dalam Status Re-Open
                  </span>
                  <p className="text-xs text-amber-200 font-medium">Tiket diajukan kembali oleh pengguna dan sedang menunggu tindak lanjut ulang dari Tim IT.</p>
                </div>
              )}

              {/* Banner Status Respon & SLA IT */}
              {(selectedTicket.assigned_to || selectedTicket.admin_reply || selectedTicket.estimated_duration || selectedTicket.estimated_target_at) && (
                <div className="overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30">
                  <div className="bg-emerald-100/60 dark:bg-emerald-900/40 px-3 py-1.5 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">Status Penanganan IT</span>
                    </div>
                  </div>
                  <div className="p-2.5 space-y-2">
                    {selectedTicket.admin_reply && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-tight font-semibold italic">
                          "{selectedTicket.admin_reply}"
                        </p>
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider pt-0.5 border-t border-emerald-200/60 dark:border-emerald-800/60">Balasan Resmi Petugas</p>
                      </div>
                    )}

                    {(selectedTicket.estimated_duration || selectedTicket.estimated_target_at) && (
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2 shadow-sm">
                        <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-emerald-950 dark:text-emerald-100 block">
                            Estimasi Pengerjaan: <span className="font-extrabold text-emerald-700 dark:text-emerald-300">{selectedTicket.estimated_duration || 'Jadwal Khusus'}</span>
                          </span>
                          {selectedTicket.estimated_start_at && selectedTicket.estimated_target_at && (
                            <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                              📅 Jadwal Pengerjaan: <span className="font-mono font-semibold">{formatDate(selectedTicket.estimated_start_at)}</span> s/d <span className="font-mono font-semibold">{formatDate(selectedTicket.estimated_target_at)}</span>
                            </p>
                          )}
                          {!selectedTicket.estimated_start_at && selectedTicket.estimated_target_at && (
                            <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                              🎯 Target Selesai: <span className="font-mono font-semibold">{formatDate(selectedTicket.estimated_target_at)}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {!selectedTicket.admin_reply && !(selectedTicket.estimated_duration || selectedTicket.estimated_target_at) && (
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <div className="w-4 h-4 rounded-full border-2 border-emerald-300 border-t-emerald-600 animate-spin" />
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
              <div className={`grid grid-cols-3 gap-2 p-2 sm:p-2.5 rounded-xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Diajukan</span>
                  <span className={`text-[11px] font-semibold font-mono truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{formatDate(selectedTicket.created_at)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Direspon</span>
                  <span className={`text-[11px] font-semibold font-mono truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{selectedTicket.responded_at ? formatDate(selectedTicket.responded_at) : '-'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Selesai</span>
                  <span className={`text-[11px] font-semibold font-mono truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{selectedTicket.resolved_at ? formatDate(selectedTicket.resolved_at) : '-'}</span>
                </div>
              </div>

              {/* Attachments */}
              {(selectedTicket.photo || selectedTicket.face_photo) && (
                <div className="space-y-2">
                  {selectedTicket.photo && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Lampiran Foto Tiket</span>
                      </div>
                      <div className={`relative rounded-xl overflow-hidden border max-h-[120px] flex items-center justify-center p-1.5 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-100'}`}>
                        <img 
                          src={selectedTicket.photo} 
                          alt="Ticket attachment" 
                          className="max-w-full max-h-[110px] object-contain rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}

                  {selectedTicket.face_photo && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Verifikasi Wajah</span>
                      </div>
                      <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold">Foto verifikasi wajah tersimpan</span>
                        </div>
                        {adminUser && (
                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-emerald-500/30 bg-black/20 shrink-0">
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
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <History className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Riwayat Aktivitas Tiket</span>
                </div>
                <div className={`rounded-xl border p-2.5 space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  {(!Array.isArray(ticketLogs) || ticketLogs.length === 0) ? (
                    <p className="text-[11px] text-slate-400 italic text-center py-2">Belum ada riwayat aktivitas.</p>
                  ) : (
                    <div className="space-y-2 relative before:absolute before:left-[6px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-300 dark:before:bg-slate-700">
                      {ticketLogs.map((log, idx) => (
                        <div key={`tlog-${log.id || 'log'}-${idx}`} className="relative pl-5">
                          <div className={`absolute left-0 top-1 w-3 h-3 rounded-full border border-white dark:border-slate-800 shadow-sm flex items-center justify-center ${
                            log.action.includes('Status') ? 'bg-emerald-500' :
                            log.action.includes('Tugaskan') ? 'bg-blue-500' :
                            log.action.includes('Ambil Alih') ? 'bg-amber-500' :
                            'bg-slate-400'
                          }`}>
                            <div className="w-1 h-1 bg-white rounded-full" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between gap-1.5">
                              <p className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{log.action}</p>
                              <span className="text-[9px] font-semibold text-slate-400 whitespace-nowrap">{formatDate(log.created_at)}</span>
                            </div>
                            <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              Oleh: <span className="font-bold text-slate-700 dark:text-slate-300">{log.performed_by}</span>
                            </p>
                            {log.note && (
                              <div className={`mt-0.5 p-1.5 rounded-lg text-[10px] font-medium italic ${isDark ? 'bg-slate-900/60 text-slate-300 border border-slate-800' : 'bg-white text-slate-700 border border-slate-200'}`}>
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
            <div className="lg:col-span-6">
              {adminUser ? (
                <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-2.5 sm:p-3 shadow-2xl border border-slate-800 space-y-2 text-slate-100">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                        <Settings2 className="w-3 h-3" />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-extrabold text-white tracking-wide uppercase">Tindakan Admin & SLA</h3>
                        <p className="text-[8px] text-slate-400">Atur petugas, prioritas, status & estimasi</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                      {adminUser.role}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Action buttons row */}
                    {(onForwardWhatsApp || (adminUser.role === 'Super Admin' && selectedTicket.assigned_to && selectedTicket.assigned_to !== adminUser.username)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {onForwardWhatsApp && (
                          <button
                            type="button"
                            onClick={() => onForwardWhatsApp(selectedTicket)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1.5 px-2.5 rounded-lg transition-all text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WA Agen</span>
                          </button>
                        )}
                        {adminUser.role === 'Super Admin' && selectedTicket.assigned_to && selectedTicket.assigned_to !== adminUser.username && (
                          <button
                            type="button"
                            onClick={() => handleIntervention(selectedTicket.id, 'takeover')}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold py-1.5 px-2.5 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all text-[11px] uppercase tracking-wider shadow-sm cursor-pointer"
                          >
                            ⚡ Ambil Alih
                          </button>
                        )}
                      </div>
                    )}

                    {/* Side-by-side Tugaskan IT & Prioritas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Tugaskan IT */}
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-300 tracking-wider flex items-center gap-1">
                          <User className="w-3 h-3 text-emerald-400" />
                          Petugas IT
                        </label>
                        {adminUser.role === 'Super Admin' ? (
                          <select 
                            id={`modal-assignee-${selectedTicket.id}`}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-1 px-2 text-[11px] outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-semibold cursor-pointer"
                            defaultValue={selectedTicket.assigned_to || ''}
                          >
                            <option value="">Pilih IT...</option>
                            {Array.isArray(users) && users.map((u, idx) => (
                              <option key={`it-user-${u.id || u.username}-${idx}`} value={u.username}>{u.full_name || u.username}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="relative">
                            <input 
                              id={`modal-assignee-${selectedTicket.id}`}
                              type="text"
                              readOnly
                              className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-lg py-1 px-2 text-[11px] outline-none font-semibold"
                              value={selectedTicket.assigned_to || adminUser.username}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <Lock className="w-2.5 h-2.5 text-slate-500" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Prioritas Tiket */}
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-300 tracking-wider">Tingkat Prioritas</label>
                        <div className="grid grid-cols-4 gap-0.5 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700">
                          {PRIORITIES.map((p: any, idx: number) => (
                            <button
                              key={`pri-${p.id}-${idx}`}
                              type="button"
                              onClick={() => setModalPriority(p.id)}
                              className={`py-1 px-0.5 rounded text-[9px] font-black capitalize tracking-tight transition-all text-center cursor-pointer ${
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
                    </div>

                    {/* Status Tiket */}
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-bold text-slate-300 tracking-wider">Status Tiket</label>
                      <div className="grid grid-cols-4 gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700">
                        {Array.isArray(STATUSES) && STATUSES.map((status, idx) => (
                          <button
                            key={`st-${status}-${idx}`}
                            type="button"
                            onClick={() => setModalStatus(status)}
                            className={`py-1 px-1 rounded-md text-[10px] font-black capitalize tracking-tight transition-all text-center cursor-pointer ${
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

                    {/* Side-by-side Rating & SLA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Toggle Request Rating dari User */}
                      <div className="p-1.5 rounded-lg bg-slate-800/80 border border-amber-500/30 flex items-center justify-between gap-1.5">
                        <div className="space-y-0 pr-1 min-w-0">
                          <label className="text-[10px] font-bold text-amber-300 flex items-center gap-1 cursor-pointer truncate" onClick={() => setRequireRating(prev => !prev)}>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                            Minta Rating
                          </label>
                          <p className="text-[8px] text-slate-400 leading-none truncate">
                            Wajibkan nilai bintang
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRequireRating(prev => !prev)}
                          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            requireRating ? 'bg-amber-500' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              requireRating ? 'translate-x-3' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Estimasi SLA */}
                      <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-1">
                        <label className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          Estimasi SLA
                        </label>
                        <div className="grid grid-cols-3 gap-0.5 bg-slate-900/90 p-0.5 rounded border border-slate-700">
                          <button
                            type="button"
                            onClick={() => setEstMode('quick')}
                            className={`py-0.5 px-0.5 rounded text-[9px] font-bold transition-all text-center cursor-pointer ${
                              estMode === 'quick' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            Cepat
                          </button>
                          <button
                            type="button"
                            onClick={() => setEstMode('range')}
                            className={`py-0.5 px-0.5 rounded text-[9px] font-bold transition-all text-center cursor-pointer ${
                              estMode === 'range' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            Jadwal
                          </button>
                          <button
                            type="button"
                            onClick={() => setEstMode('none')}
                            className={`py-0.5 px-0.5 rounded text-[9px] font-bold transition-all text-center cursor-pointer ${
                              estMode === 'none' ? 'bg-slate-700 text-slate-200' : 'text-slate-500'
                            }`}
                          >
                            Off
                          </button>
                        </div>
                        {estMode === 'quick' && (
                          <div className="grid grid-cols-3 gap-1 pt-0.5">
                            {[30, 60, 120].map((mins, idx) => (
                              <button
                                key={`mins-${mins}-${idx}`}
                                type="button"
                                onClick={() => setEstQuickMins(mins)}
                                className={`py-0.5 text-[9px] font-bold rounded border cursor-pointer ${
                                  estQuickMins === mins
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                    : 'bg-slate-900/60 border-slate-700 text-slate-400'
                                }`}
                              >
                                {mins === 60 ? '1 Jam' : mins === 120 ? '2 Jam' : `${mins}m`}
                              </button>
                            ))}
                          </div>
                        )}
                        {estMode === 'range' && (
                          <div className="grid grid-cols-2 gap-1 pt-0.5">
                            <input
                              type="datetime-local"
                              value={estStartAt}
                              onChange={e => setEstStartAt(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded p-0.5 text-[9px] font-mono outline-none"
                            />
                            <input
                              type="datetime-local"
                              value={estTargetAt}
                              onChange={e => setEstTargetAt(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded p-0.5 text-[9px] font-mono outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Side-by-side Balasan & Catatan Internal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Balasan Resolusi (Publik) */}
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-300 tracking-wider">Balasan Resolusi (Publik)</label>
                        <textarea 
                          id={`modal-reply-${selectedTicket.id}`}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-1 px-2 text-[10px] outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-medium placeholder:text-slate-500"
                          placeholder="Tulis solusi untuk pengguna..."
                          rows={2}
                          defaultValue={selectedTicket.admin_reply || ''}
                        />
                      </div>

                      {/* Catatan Internal (Private) */}
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-300 tracking-wider">Catatan Internal (Private)</label>
                        <textarea 
                          id={`modal-internal-${selectedTicket.id}`}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-1 px-2 text-[10px] outline-none focus:ring-1 focus:ring-blue-500 resize-none font-medium placeholder:text-slate-500"
                          placeholder="Catatan rahasia IT..."
                          rows={2}
                          defaultValue={selectedTicket.internal_notes || ''}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-xl border ${themeClasses.bgSecondary} ${themeClasses.border} text-center space-y-2`}>
                  <ShieldCheck className="w-7 h-7 text-emerald-500 mx-auto" />
                  <p className={`text-xs font-bold ${themeClasses.text}`}>Sistem Penanganan Tiket IT</p>
                  <p className={`text-[10px] ${themeClasses.textMuted}`}>Hanya admin dan tim IT bertugas yang dapat mengubah status tiket.</p>
                  
                  {isMyTicket && onForwardWhatsApp && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => onForwardWhatsApp(selectedTicket)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-lg transition-all text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Kirim / Hubungi IT via WhatsApp</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Sticky / Pinned Modal Footer */}
        <div className={`px-4 py-2.5 sm:px-5 border-t shrink-0 flex items-center justify-between gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">
              No. Tiket: <span className="font-mono font-extrabold text-slate-700 dark:text-slate-200">#{selectedTicket.ticket_no || selectedTicket.id}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedTicket(null)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              Tutup
            </button>
            {adminUser && (
              <button
                type="button"
                onClick={handleSave}
                style={{ backgroundColor: primaryColor }}
                className="px-5 py-1.5 rounded-lg text-white text-xs font-black uppercase tracking-wider shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>💾 Simpan Perubahan</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
});
