import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Ticket, 
  User, 
  Building2, 
  Phone, 
  Layers, 
  MessageSquare, 
  Camera,
  Trash2,
  Send
} from 'lucide-react';

interface NewTicketModalProps {
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  isDark: boolean;
  themeClasses: any;
  newTicket: {
    name: string;
    department: string;
    phone: string;
    category: string;
    description: string;
    photo: string | null;
  };
  setNewTicket: (ticket: any) => void;
  DEPARTMENTS: string[];
  CATEGORIES: string[];
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  primaryColor: string;
}

export const NewTicketModal = React.memo(({
  showForm,
  setShowForm,
  isDark,
  themeClasses,
  newTicket,
  setNewTicket,
  DEPARTMENTS,
  CATEGORIES,
  handlePhotoChange,
  handleSubmit,
  isSubmitting,
  primaryColor
}: NewTicketModalProps) => {
  if (!showForm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowForm(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors ${themeClasses.card} ${themeClasses.text}`}
      >
        <div className={`p-4 sm:p-6 border-b shrink-0 ${themeClasses.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-lg font-black tracking-tight ${themeClasses.text}`}>Buat Tiket Baru</h2>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${themeClasses.textMuted}`}>Layanan Bantuan IT</p>
              </div>
            </div>
            <button 
              onClick={() => setShowForm(false)}
              className={`p-2 rounded-full transition-all ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                <User className="w-3 h-3" /> Nama Lengkap
              </label>
              <input 
                required
                type="text"
                placeholder="Contoh: Budi Santoso"
                className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                value={newTicket.name}
                onChange={e => setNewTicket({...newTicket, name: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                <Building2 className="w-3 h-3" /> Bagian / Unit
              </label>
              <select 
                required
                className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                value={newTicket.department}
                onChange={e => setNewTicket({...newTicket, department: e.target.value})}
              >
                <option value="">Pilih Bagian...</option>
                {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                <Phone className="w-3 h-3" /> Nomor Telepon / WA
              </label>
              <input 
                required
                type="tel"
                placeholder="0812xxxx"
                className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                value={newTicket.phone}
                onChange={e => setNewTicket({...newTicket, phone: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                <Layers className="w-3 h-3" /> Kategori Masalah
              </label>
              <select 
                required
                className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                value={newTicket.category}
                onChange={e => setNewTicket({...newTicket, category: e.target.value})}
              >
                <option value="">Pilih Kategori...</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              <MessageSquare className="w-3 h-3" /> Detail Masalah
            </label>
            <textarea 
              required
              rows={4}
              placeholder="Jelaskan kendala Anda secara detail..."
              className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
              value={newTicket.description}
              onChange={e => setNewTicket({...newTicket, description: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              <Camera className="w-3 h-3" /> Lampiran Foto (Opsional)
            </label>
            <div className="flex items-center gap-4">
              <label className={`flex-1 flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:bg-emerald-50/50 group ${isDark ? 'border-slate-700 hover:border-emerald-500' : 'border-slate-200 hover:border-emerald-500'}`}>
                <Camera className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-emerald-600">Klik untuk upload foto</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoChange}
                />
              </label>
              {newTicket.photo && (
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-lg group">
                  <img 
                    src={newTicket.photo} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    type="button"
                    onClick={() => setNewTicket({...newTicket, photo: null})}
                    className="absolute inset-0 bg-rose-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-6 h-6 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: primaryColor }}
              className={`w-full py-3 sm:py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs sm:text-sm shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Kirim Tiket
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
});
