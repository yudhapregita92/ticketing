import React from 'react';
import { motion } from 'framer-motion';
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
  Navigation,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { PRIORITIES } from '../../types';

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
    priority: string;
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
  masterUsers: {id: number, full_name: string, department: string, phone: string, employee_index?: string}[];
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
  primaryColor,
  masterUsers
}: NewTicketModalProps) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);
  const [inputIndex, setInputIndex] = React.useState('');
  const [correctIndex, setCorrectIndex] = React.useState('');
  const [showIndex, setShowIndex] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = React.useMemo(() => {
    if (!Array.isArray(masterUsers)) return [];
    const search = newTicket.name || '';
    return masterUsers.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()));
  }, [masterUsers, newTicket.name]);

  if (!showForm) return null;

  const handleSelectUser = (user: any) => {
    setNewTicket({
      ...newTicket,
      name: user.full_name,
      department: user.department,
      phone: user.phone
    });
    setCorrectIndex(user.employee_index || '');
    setShowUserDropdown(false);
  };

  const handleNameChange = (name: string) => {
    setNewTicket({ ...newTicket, name });
    setShowUserDropdown(true);
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctIndex) {
      alert('Silakan cari dan pilih nama Anda dari daftar terlebih dahulu.');
      return;
    }
    if (inputIndex !== correctIndex) {
      alert('Indek Karyawan yang Anda masukkan salah. Mohon periksa kembali.');
      return;
    }
    handleSubmit(e);
  };

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
        className={`relative rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] transition-colors ${themeClasses.card} ${themeClasses.text}`}
      >
        <div className={`p-3 sm:p-5 border-b shrink-0 ${themeClasses.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <h2 className={`text-base font-black tracking-tight ${themeClasses.text}`}>Buat Tiket Baru</h2>
                <p className={`text-[9px] font-bold uppercase tracking-widest ${themeClasses.textMuted}`}>Layanan Bantuan IT</p>
              </div>
            </div>
            <button 
              onClick={() => setShowForm(false)}
              className={`p-1.5 rounded-full transition-all ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={onFormSubmit} className="p-3 sm:p-5 overflow-y-auto custom-scrollbar space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 relative" ref={dropdownRef}>
              <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                <User className="w-2.5 h-2.5" /> Nama Lengkap
              </label>
              <input 
                required
                type="text"
                placeholder="Cari Nama User..."
                className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                value={newTicket.name}
                onChange={e => handleNameChange(e.target.value)}
                onFocus={() => setShowUserDropdown(true)}
              />
              {showUserDropdown && filteredUsers.length > 0 && (
                <div className={`absolute top-full left-0 z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-xl border shadow-xl ${isDark ? 'bg-slate-900' : 'bg-white'} ${themeClasses.border}`}>
                  {filteredUsers.map(user => (
                    <div 
                      key={user.id} 
                      className={`px-4 py-2 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors border-b last:border-0 ${themeClasses.border}`}
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className={`text-xs font-bold ${themeClasses.text}`}>{user.full_name}</div>
                      <div className={`text-[10px] ${themeClasses.textMuted}`}>{user.department}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                <Building2 className="w-2.5 h-2.5" /> Bagian / Unit
              </label>
              <input 
                required
                type="text"
                placeholder="Otomatis terisi..."
                className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                value={newTicket.department}
                onChange={e => setNewTicket({...newTicket, department: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                <Layers className="w-2.5 h-2.5" /> Kategori Masalah
              </label>
              <select 
                required
                className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                value={newTicket.category}
                onChange={e => setNewTicket({...newTicket, category: e.target.value})}
              >
                <option value="">Pilih Kategori...</option>
                {Array.isArray(CATEGORIES) && CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                <AlertTriangle className="w-2.5 h-2.5" /> Prioritas
              </label>
              <select 
                required
                className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                value={newTicket.priority}
                onChange={e => setNewTicket({...newTicket, priority: e.target.value})}
              >
                {PRIORITIES.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              <MessageSquare className="w-2.5 h-2.5" /> Detail Masalah
            </label>
            <textarea 
              required
              rows={3}
              placeholder="Jelaskan kendala Anda secara detail..."
              className={`w-full px-3 py-2 rounded-2xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
              value={newTicket.description}
              onChange={e => setNewTicket({...newTicket, description: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              <Camera className="w-2.5 h-2.5" /> Lampiran Foto (Opsional)
            </label>
            <div className="flex items-center gap-3">
              <label className={`flex-1 flex flex-col items-center justify-center gap-1 px-3 py-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:bg-emerald-50/50 group ${isDark ? 'border-slate-700 hover:border-emerald-500' : 'border-slate-200 hover:border-emerald-500'}`}>
                <Camera className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <span className="text-[9px] font-bold text-slate-500 group-hover:text-emerald-600">Klik untuk upload foto</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoChange}
                />
              </label>
              {newTicket.photo && (
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-lg group">
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

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              <Ticket className="w-2.5 h-2.5" /> Indek Karyawan
            </label>
            <div className="relative">
              <input 
                required
                type={showIndex ? "text" : "password"}
                placeholder="Masukkan Indek Karyawan Anda..."
                className={`w-full px-3 py-2 pr-10 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text} ${inputIndex && inputIndex !== correctIndex ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                value={inputIndex}
                onChange={e => setInputIndex(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowIndex(!showIndex)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
              >
                {showIndex ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {inputIndex && inputIndex !== correctIndex ? (
              <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tight ml-1 animate-pulse">
                ⚠ Indek Karyawan tidak sesuai!
              </p>
            ) : (
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight ml-1">
                * Verifikasi identitas untuk mengirim tiket
              </p>
            )}
          </div>

          <div className="pt-1">
            <button 
              type="submit"
              disabled={isSubmitting || !inputIndex}
              style={{ backgroundColor: inputIndex ? primaryColor : '#94a3b8' }}
              className={`w-full py-2.5 sm:py-3 rounded-2xl text-white font-black uppercase tracking-widest text-xs sm:text-sm shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Navigation className="w-4 h-4" /> Kirim Tiket
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
});
