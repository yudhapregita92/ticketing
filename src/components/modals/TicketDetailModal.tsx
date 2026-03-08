import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Building2, 
  Layers, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Globe, 
  Cpu, 
  Camera,
  History, 
  Trash2, 
  RefreshCcw, 
  Send, 
  ExternalLink, 
  ShieldCheck 
} from 'lucide-react';
import { ITicket, IAdminUser, STATUSES } from '../../types';

interface TicketDetailModalProps {
  selectedTicket: ITicket | null;
  setSelectedTicket: (ticket: ITicket | null) => void;
  isDark: boolean;
  themeClasses: any;
  adminUser: IAdminUser | null;
  adminReply: string;
  setAdminReply: (reply: string) => void;
  internalNotes: string;
  setInternalNotes: (notes: string) => void;
  assignedTo: string;
  setAssignedTo: (name: string) => void;
  itPersonnel: { id: number, name: string }[];
  updating: boolean;
  handleUpdateTicket: (status: string) => void;
  handleDeleteTicket: (id: number) => void;
  primaryColor: string;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  selectedTicket,
  setSelectedTicket,
  isDark,
  themeClasses,
  adminUser,
  adminReply,
  setAdminReply,
  internalNotes,
  setInternalNotes,
  assignedTo,
  setAssignedTo,
  itPersonnel,
  updating,
  handleUpdateTicket,
  handleDeleteTicket,
  primaryColor
}) => {
  if (!selectedTicket) return null;

  return (
    <AnimatePresence>
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTicket(null)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border ${themeClasses.card}`}
          >
            <div className={`sticky top-0 z-10 p-4 sm:p-6 border-b flex items-center justify-between backdrop-blur-md ${themeClasses.header}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                  selectedTicket.status === 'New' ? 'bg-amber-500 shadow-amber-500/20' :
                  selectedTicket.status === 'In Progress' ? 'bg-blue-500 shadow-blue-500/20' :
                  selectedTicket.status === 'Completed' ? 'bg-emerald-500 shadow-emerald-500/20' :
                  'bg-rose-500 shadow-rose-500/20'
                }`}>
                  {selectedTicket.status === 'New' && <Clock className="w-5 h-5" />}
                  {selectedTicket.status === 'In Progress' && <History className="w-5 h-5 animate-spin-slow" />}
                  {selectedTicket.status === 'Completed' && <CheckCircle2 className="w-5 h-5" />}
                  {selectedTicket.status === 'Cancelled' && <AlertCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className={`text-lg sm:text-xl font-black tracking-tight ${themeClasses.text}`}>Detail Tiket {selectedTicket.ticket_no}</h2>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Informasi lengkap laporan</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-8 space-y-8 sm:space-y-10">
              {/* Ticket Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                <div className="space-y-6 sm:space-y-8">
                  <div className="space-y-4">
                    <h3 className={`text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4`}>
                      <User className="w-3 h-3" /> Informasi Pelapor
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50/50 border-slate-100'}`}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Lengkap</p>
                        <p className={`text-sm sm:text-base font-bold ${themeClasses.text}`}>{selectedTicket.name}</p>
                      </div>
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50/50 border-slate-100'}`}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Departemen</p>
                        <p className={`text-sm sm:text-base font-bold ${themeClasses.text}`}>{selectedTicket.department}</p>
                      </div>
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50/50 border-slate-100'}`}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">No. Telepon</p>
                        <a href={`tel:${selectedTicket.phone}`} className="text-sm sm:text-base font-bold text-emerald-500 hover:underline flex items-center gap-2">
                          {selectedTicket.phone} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className={`text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4`}>
                      <Layers className="w-3 h-3" /> Detail Masalah
                    </h3>
                    <div className={`p-5 rounded-2xl border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50/50 border-slate-100'}`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kategori: {selectedTicket.category}</p>
                      <p className={`text-sm sm:text-base leading-relaxed font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{selectedTicket.description}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 sm:space-y-8">
                  <div className="space-y-4">
                    <h3 className={`text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4`}>
                      <Camera className="w-3 h-3" /> Bukti Foto & Metadata
                    </h3>
                    {selectedTicket.photo ? (
                      <div className="relative group">
                        <img 
                          src={selectedTicket.photo} 
                          alt="Evidence" 
                          className="w-full h-48 sm:h-64 object-cover rounded-3xl border shadow-lg"
                          referrerPolicy="no-referrer"
                        />
                        <a 
                          href={selectedTicket.photo} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl"
                        >
                          <span className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" /> Lihat Ukuran Penuh
                          </span>
                        </a>
                      </div>
                    ) : (
                      <div className={`w-full h-48 sm:h-64 rounded-3xl border border-dashed flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50/50 border-slate-200'}`}>
                        <Camera className="w-8 h-8 text-slate-300" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tidak Ada Foto</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50/50 border-slate-100'}`}>
                        <Globe className="w-4 h-4 text-slate-400" />
                        <div className="min-w-0">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">IP Address</p>
                          <p className="text-[10px] font-bold truncate text-slate-500">{selectedTicket.ip_address || 'N/A'}</p>
                        </div>
                      </div>
                      <div className={`p-3 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50/50 border-slate-100'}`}>
                        <Cpu className="w-4 h-4 text-slate-400" />
                        <div className="min-w-0">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">User Agent</p>
                          <p className="text-[10px] font-bold truncate text-slate-500" title={selectedTicket.user_agent || 'N/A'}>{selectedTicket.user_agent || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedTicket.latitude && selectedTicket.longitude && (
                      <a 
                        href={`https://www.google.com/maps?q=${selectedTicket.latitude},${selectedTicket.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full p-3 rounded-2xl border flex items-center justify-between group transition-all ${isDark ? 'bg-emerald-900/10 border-emerald-900/30 hover:bg-emerald-900/20' : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100'}`}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Lokasi GPS Terdeteksi</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Section */}
              {adminUser && (
                <div className={`pt-8 sm:pt-10 border-t space-y-8 sm:space-y-10 ${themeClasses.border}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <h3 className={`text-base sm:text-lg font-black tracking-tight ${themeClasses.text}`}>Admin Management</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <User className="w-3 h-3" /> Tugaskan Ke (Personnel)
                        </label>
                        <select 
                          value={assignedTo}
                          onChange={(e) => setAssignedTo(e.target.value)}
                          className={`w-full px-4 py-3 rounded-2xl border transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm font-medium appearance-none ${themeClasses.input}`}
                        >
                          <option value="">Pilih Personel</option>
                          {itPersonnel.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <MessageSquare className="w-3 h-3" /> Catatan Internal (Hanya Admin)
                        </label>
                        <textarea 
                          rows={3}
                          placeholder="Tambahkan catatan internal..."
                          value={internalNotes}
                          onChange={(e) => setInternalNotes(e.target.value)}
                          className={`w-full px-4 py-3 rounded-2xl border transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm font-medium resize-none ${themeClasses.input}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Send className="w-3 h-3" /> Balasan Admin (Dilihat User)
                      </label>
                      <textarea 
                        rows={6}
                        placeholder="Tulis balasan atau solusi untuk pelapor..."
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                        className={`w-full px-4 py-3 rounded-2xl border transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm font-medium resize-none h-full ${themeClasses.input}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-4">
                    <div className="flex-1 flex flex-wrap gap-3">
                      {STATUSES.map(status => (
                        <button
                          key={status}
                          disabled={updating}
                          onClick={() => handleUpdateTicket(status)}
                          className={`px-4 sm:px-6 py-3 sm:py-4 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 ${
                            selectedTicket.status === status 
                              ? (status === 'New' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' :
                                 status === 'In Progress' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' :
                                 status === 'Completed' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                                 'bg-rose-500 text-white shadow-lg shadow-rose-500/20')
                              : isDark ? 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {updating && selectedTicket.status !== status ? <RefreshCcw className="w-3 h-3 animate-spin" /> : null}
                          {status}
                        </button>
                      ))}
                    </div>
                    <button 
                      disabled={updating}
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                      className="p-3 sm:p-4 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm"
                      title="Hapus Tiket"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* User View Reply */}
              {!adminUser && selectedTicket.admin_reply && (
                <div className={`pt-8 sm:pt-10 border-t space-y-4 ${themeClasses.border}`}>
                  <h3 className={`text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2`}>
                    <Send className="w-3 h-3" /> Balasan dari Tim IT
                  </h3>
                  <div className={`p-5 rounded-3xl border-2 ${isDark ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100'}`}>
                    <p className={`text-sm sm:text-base leading-relaxed font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{selectedTicket.admin_reply}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Official IT Response</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
