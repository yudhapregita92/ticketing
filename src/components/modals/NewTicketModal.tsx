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
  Camera,
  Trash2,
  Navigation,
  Eye,
  EyeOff,
  AlertTriangle,
  Scan,
  CheckCircle2
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
    face_photo?: string | null;
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
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanComplete, setScanComplete] = React.useState(false);
  const [cameraError, setCameraError] = React.useState(false);
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const scanTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const stopCamera = React.useCallback(() => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = React.useCallback(async () => {
    try {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

      setCameraError(false);
      setPermissionDenied(false);
      setScanComplete(false);
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Start scanning process only if camera is successful
      // We no longer auto-detect. Wait for user to click capture.

    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setCameraError(true);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
      }
    }
  }, [stopCamera]);

  const captureFace = React.useCallback(() => {
    if (!videoRef.current || !streamRef.current) return;
    
    // Capture image from video
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Compress to stay under 30KB
      let quality = 0.6;
      let base64 = canvas.toDataURL('image/jpeg', quality);
      while (base64.length > 40000 && quality > 0.1) {
        quality -= 0.1;
        base64 = canvas.toDataURL('image/jpeg', quality);
      }
      
      setNewTicket({ ...newTicket, face_photo: base64 });
    }

    // Manual capture, bypass AI detection
    setScanComplete(true);
    closeTimerRef.current = setTimeout(() => {
      setIsScanning(false);
      stopCamera();
    }, 1500);
  }, [stopCamera, newTicket, setNewTicket]);

  React.useEffect(() => {
    if (showForm) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showForm, startCamera, stopCamera]);

  const handleRetryCamera = () => {
    startCamera();
  };

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

  const handleClose = () => {
    setNewTicket({
      ...newTicket,
      name: '',
      department: '',
      category: '',
      phone: '',
      priority: 'Medium',
      description: '',
      photo: '',
      face_photo: '',
      latitude: null,
      longitude: null
    });
    setInputIndex('');
    setCorrectIndex('');
    setShowIndex(false);
    setShowForm(false);
  };

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
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors ${themeClasses.card} ${themeClasses.text}`}
      >
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="relative w-48 h-48 mb-6">
                <motion.div
                  animate={{ 
                    borderColor: scanComplete ? '#10b981' : primaryColor,
                    scale: scanComplete ? [1, 1.05, 1] : 1
                  }}
                  className="absolute inset-0 border-2 rounded-3xl border-dashed opacity-50"
                />
                
                <div className="absolute inset-4 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-800">
                  {cameraError ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mb-4">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-black text-white capitalize mb-1">Kamera Wajib Aktif</h4>
                      <p className="text-[10px] font-bold text-slate-400 mb-4">
                        {permissionDenied 
                          ? "Izin kamera ditolak. Mohon izinkan akses kamera di pengaturan browser Anda." 
                          : "Gagal mengakses kamera. Pastikan kamera tidak sedang digunakan aplikasi lain."}
                      </p>
                      <button
                        onClick={handleRetryCamera}
                        className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-xl capitalize tracking-widest shadow-lg active:scale-95 transition-all"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      width={640}
                      height={480}
                      className={`w-full h-full object-cover transition-opacity duration-500 ${scanComplete ? 'opacity-20' : 'opacity-100'}`}
                    />
                  )}
                  
                  {!cameraError && (
                    scanComplete ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute inset-0 flex items-center justify-center text-emerald-500 z-20"
                      >
                        <CheckCircle2 className="w-24 h-24" />
                      </motion.div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <svg width="200" height="250" viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <ellipse cx="100" cy="125" rx="80" ry="110" stroke="rgba(16, 185, 129, 0.8)" strokeWidth="4" strokeDasharray="10 10" />
                        </svg>
                        <motion.div
                          animate={{ 
                            opacity: [0.1, 0.3, 0.1],
                            scale: [0.9, 1.1, 0.9]
                          }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute text-white/10"
                        >
                          <Scan className="w-32 h-32" />
                        </motion.div>
                      </div>
                    )
                  )}
                </div>

                {!scanComplete && !cameraError && (
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10"
                  />
                )}
              </div>

              <motion.div
                key={cameraError ? 'error' : (scanComplete ? 'complete' : 'scanning')}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 relative z-20"
              >
                {cameraError ? (
                  <div className="px-4 py-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                    <p className="text-[10px] font-bold text-rose-500 capitalize tracking-widest">Verifikasi Gagal</p>
                  </div>
                ) : (
                  <>
                    <h3 className={`text-xl font-black tracking-tight ${scanComplete ? 'text-emerald-500' : 'text-white'}`}>
                      {scanComplete ? 'Verifikasi Berhasil' : 'Posisikan Wajah Anda'}
                    </h3>
                    <p className="text-sm font-bold text-slate-400 capitalize tracking-widest">
                      {scanComplete ? 'Foto anda telah tersimpan di sistem' : 'Mohon hadap ke kamera dan paskan dengan garis'}
                    </p>
                    
                    {!scanComplete && (
                      <button
                        onClick={captureFace}
                        className="mt-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-[200px] mx-auto flex items-center justify-center gap-2"
                      >
                        <Camera className="w-5 h-5" />
                        Ambil Gambar
                      </button>
                    )}
                  </>
                )}
              </motion.div>

              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`p-2.5 sm:p-3.5 border-b shrink-0 ${themeClasses.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                <Ticket className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className={`text-sm font-black tracking-tight ${themeClasses.text}`}>Buat Tiket Baru</h2>
                <p className={`text-[8px] font-bold capitalize tracking-widest ${themeClasses.textMuted}`}>Layanan Bantuan IT</p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className={`p-1.5 rounded-full transition-all ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={onFormSubmit} className="p-2.5 sm:p-3.5 overflow-y-auto custom-scrollbar space-y-2 sm:space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-0.5 relative" ref={dropdownRef}>
              <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 capitalize tracking-widest ml-0.5">
                <User className="w-2 h-2" /> Nama Lengkap
              </label>
              <input 
                required
                type="text"
                placeholder="Cari Nama User..."
                className={`w-full px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
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
            <div className="space-y-0.5">
              <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 capitalize tracking-widest ml-0.5">
                <Building2 className="w-2 h-2" /> Bagian / Unit
              </label>
              <input 
                required
                type="text"
                placeholder="Otomatis terisi..."
                className={`w-full px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text} opacity-70 cursor-not-allowed`}
                value={newTicket.department}
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 capitalize tracking-widest ml-0.5">
                <Layers className="w-2 h-2" /> Kategori Masalah
              </label>
              <select 
                required
                className={`w-full px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                value={newTicket.category}
                onChange={e => setNewTicket({...newTicket, category: e.target.value})}
              >
                <option value="">Pilih Kategori...</option>
                {Array.isArray(CATEGORIES) && CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-0.5">
              <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 capitalize tracking-widest ml-0.5">
                <AlertTriangle className="w-2 h-2" /> Prioritas
              </label>
              <select 
                required
                className={`w-full px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                value={newTicket.priority}
                onChange={e => setNewTicket({...newTicket, priority: e.target.value})}
              >
                {PRIORITIES.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 capitalize tracking-widest ml-0.5">
              <MessageSquare className="w-2 h-2" /> Detail Masalah
            </label>
            <textarea 
              required
              rows={2}
              placeholder="Jelaskan kendala Anda secara detail..."
              className={`w-full px-3 py-1.5 rounded-2xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
              value={newTicket.description}
              onChange={e => setNewTicket({...newTicket, description: e.target.value})}
            />
          </div>

          <div className="space-y-0.5">
            <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 capitalize tracking-widest ml-0.5">
              <Camera className="w-2 h-2" /> Lampiran Foto (Opsional)
            </label>
            <div className="flex items-center gap-3">
              <label className={`flex-1 flex flex-col items-center justify-center gap-1 px-3 py-2 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:bg-emerald-50/50 group ${isDark ? 'border-slate-700 hover:border-emerald-500' : 'border-slate-200 hover:border-emerald-500'}`}>
                <Camera className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <span className={`text-[8px] font-bold group-hover:text-emerald-600 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Klik untuk upload foto</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoChange}
                />
              </label>
              {newTicket.photo && (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-lg group">
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
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 capitalize tracking-widest ml-0.5">
              <Ticket className="w-2 h-2" /> Indek Karyawan
            </label>
            <div className="relative">
              <input 
                required
                type={showIndex ? "text" : "password"}
                placeholder="Masukkan Indek Karyawan Anda..."
                className={`w-full px-3 py-1.5 pr-10 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text} ${inputIndex && inputIndex === correctIndex ? 'border-emerald-500 ring-2 ring-emerald-500/20' : inputIndex && inputIndex !== correctIndex ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                value={inputIndex}
                onChange={e => setInputIndex(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowIndex(!showIndex)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-500 transition-colors"
              >
                {showIndex ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {inputIndex && inputIndex === correctIndex ? (
              <p className="text-[8px] font-bold text-emerald-500 capitalize tracking-tight ml-0.5">
                * indek yang anda ketik sudah benar
              </p>
            ) : inputIndex && inputIndex !== correctIndex ? (
              <p className="text-[8px] font-bold text-rose-500 capitalize tracking-tight ml-0.5 animate-pulse">
                ⚠ Indek Karyawan tidak sesuai!
              </p>
            ) : (
              <p className="text-[8px] font-bold text-rose-500 capitalize tracking-tight ml-0.5">
                * Verifikasi indek untuk mengirim tiket
              </p>
            )}
          </div>

          <div className="pt-0.5">
            <button 
              type="submit"
              disabled={isSubmitting || !inputIndex}
              style={{ backgroundColor: inputIndex ? primaryColor : '#94a3b8' }}
              className={`w-full py-2 sm:py-2.5 rounded-2xl text-white font-black capitalize tracking-widest text-[10px] sm:text-xs shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:cursor-not-allowed`}
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
