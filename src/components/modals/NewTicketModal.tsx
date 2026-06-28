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
  CheckCircle2,
  Upload,
  Smartphone,
  Monitor
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
    device_type?: string | null;
    pc_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  setNewTicket: (ticket: any) => void;
  DEPARTMENTS: string[];
  CATEGORIES: string[];
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  primaryColor: string;
  masterUsers: {id: number, full_name: string, department: string, phone: string, employee_index?: string, jenis_piranti?: string, kode_piranti?: string}[];
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
  const [deviceSelected, setDeviceSelected] = React.useState<string | null>(newTicket.device_type || null);
  const [inputIndex, setInputIndex] = React.useState('');
  const [correctIndex, setCorrectIndex] = React.useState('');
  const [showIndex, setShowIndex] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanComplete, setScanComplete] = React.useState(false);
  const [cameraError, setCameraError] = React.useState(false);
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [cameraTarget, setCameraTarget] = React.useState<'face_photo' | 'photo'>('photo');
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const scanTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const [showIndexSuccess, setShowIndexSuccess] = React.useState(true);

  React.useEffect(() => {
    if (inputIndex && correctIndex && inputIndex === correctIndex) {
      setShowIndexSuccess(true);
      const timer = setTimeout(() => {
        setShowIndexSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowIndexSuccess(true);
    }
  }, [inputIndex, correctIndex]);

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

  const startCamera = React.useCallback(async (target: 'face_photo' | 'photo' = 'photo') => {
    try {
      setCameraTarget(target);
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

      setCameraError(false);
      setPermissionDenied(false);
      setScanComplete(false);
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: target === 'face_photo' ? 'user' : 'environment',
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
      // Mirror the image to match the video preview (only for front camera / face photo)
      if (cameraTarget === 'face_photo') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Reset transformation for any future drawing
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Draw watermark on canvas for standard photo attachment
      if (cameraTarget === 'photo') {
        const lat = newTicket.latitude || 0;
        const lng = newTicket.longitude || 0;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        const padding = 10;
        const fontSize = Math.max(10, Math.floor(canvas.width / 35));
        ctx.font = `${fontSize}px sans-serif`;
        const text1 = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
        const text2 = `Time: ${new Date().toLocaleString()}`;
        const text3 = `Google Maps Location`;
        
        const metrics1 = ctx.measureText(text1);
        const metrics2 = ctx.measureText(text2);
        const metrics3 = ctx.measureText(text3);
        const bgWidth = Math.max(metrics1.width, metrics2.width, metrics3.width) + padding * 2;
        const bgHeight = fontSize * 3 + padding * 3;

        ctx.fillRect(8, canvas.height - bgHeight - 8, bgWidth, bgHeight);

        ctx.fillStyle = 'white';
        ctx.fillText(text3, padding + 8, canvas.height - bgHeight + fontSize);
        ctx.fillText(text1, padding + 8, canvas.height - bgHeight + fontSize * 2 + padding / 2);
        ctx.fillText(text2, padding + 8, canvas.height - bgHeight + fontSize * 3 + padding);
      }
      
      // Compress to stay under 40KB
      let quality = 0.6;
      let base64 = canvas.toDataURL('image/jpeg', quality);
      while (base64.length > 40000 && quality > 0.1) {
        quality -= 0.1;
        base64 = canvas.toDataURL('image/jpeg', quality);
      }
      
      if (cameraTarget === 'photo') {
        setNewTicket({ ...newTicket, photo: base64 });
      } else {
        setNewTicket({ ...newTicket, face_photo: base64 });
      }
    }

    // Manual capture, bypass AI detection
    setScanComplete(true);
    closeTimerRef.current = setTimeout(() => {
      setIsScanning(false);
      stopCamera();
    }, 1500);
  }, [stopCamera, newTicket, setNewTicket, cameraTarget]);

  const handleFacePhotoUpload = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 480;
        const MAX_HEIGHT = 480;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          let quality = 0.6;
          let base64 = canvas.toDataURL('image/jpeg', quality);
          while (base64.length > 40000 && quality > 0.1) {
            quality -= 0.1;
            base64 = canvas.toDataURL('image/jpeg', quality);
          }
          setNewTicket({ ...newTicket, face_photo: base64 });
          setScanComplete(true);
          closeTimerRef.current = setTimeout(() => {
            setIsScanning(false);
            stopCamera();
          }, 1500);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [stopCamera, newTicket, setNewTicket]);

  const closeScan = React.useCallback(() => {
    stopCamera();
    setIsScanning(false);
  }, [stopCamera]);

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleRetryCamera = () => {
    startCamera(cameraTarget);
  };

  React.useEffect(() => {
    if (showForm) {
      setDeviceSelected(null);
      setNewTicket(prev => ({
        ...prev,
        device_type: '',
        pc_code: ''
      }));
    }
  }, [showForm, setNewTicket]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const filteredUsers = React.useMemo(() => {
    if (!Array.isArray(masterUsers)) return [];
    const search = newTicket.name || '';
    return masterUsers.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()));
  }, [masterUsers, newTicket.name]);

  const matchedMasterUser = React.useMemo(() => {
    if (!newTicket.name || !Array.isArray(masterUsers)) return null;
    return masterUsers.find(
      u => u.full_name?.trim().toLowerCase() === newTicket.name.trim().toLowerCase()
    );
  }, [masterUsers, newTicket.name]);

  const isPcCodeMatched = React.useMemo(() => {
    if (!matchedMasterUser || !newTicket.pc_code) return false;
    const userCode = (matchedMasterUser.kode_piranti || '').trim().toLowerCase();
    const inputCode = (newTicket.pc_code || '').trim().toLowerCase();
    if (!userCode || userCode === '-' || userCode === '(tidak ada)') return false;
    
    // Check direct match
    if (userCode === inputCode) return true;
    
    // Check cleaned match (remove leading hyphens/spaces)
    const cleanUser = userCode.replace(/^[- \t]+/g, '').trim();
    const cleanInput = inputCode.replace(/^[- \t]+/g, '').trim();
    return cleanUser !== '' && cleanUser === cleanInput;
  }, [matchedMasterUser, newTicket.pc_code]);

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
      device_type: '',
      pc_code: '',
      latitude: null,
      longitude: null
    });
    setInputIndex('');
    setCorrectIndex('');
    setShowIndex(false);
    setDeviceSelected(null);
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
    if (!newTicket.device_type) {
      alert('Silakan pilih tipe piranti yang Anda gunakan.');
      return;
    }
    if (newTicket.device_type === 'pc' && !newTicket.pc_code?.trim()) {
      alert('Kode Komputer wajib diisi jika menggunakan Komputer PC.');
      return;
    }
    handleSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
              className="absolute inset-0 z-[60] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
            >
              {/* Floating Close Button for Scan Overlay */}
              <button 
                type="button"
                onClick={closeScan}
                className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all z-[70]"
              >
                <X className="w-4 h-4" />
              </button>

              {cameraError ? (
                <div className="w-full max-w-sm p-6 bg-slate-800/80 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center">
                  <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mb-4 animate-bounce">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Kamera Tidak Aktif / Error</h3>
                  <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                    {permissionDenied 
                      ? (cameraTarget === 'photo' 
                          ? "Izin kamera ditolak. Anda tetap dapat mengunggah file foto lampiran secara manual." 
                          : "Izin kamera ditolak. Anda tetap dapat mengunggah file foto wajah (selfie) secara manual.")
                      : (cameraTarget === 'photo' 
                          ? "Gagal mengakses kamera. Anda tetap dapat mengunggah file foto lampiran secara manual." 
                          : "Gagal mengakses kamera. Anda tetap dapat mengunggah file foto wajah (selfie) secara manual.")
                    }
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <label className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      {cameraTarget === 'photo' ? 'Upload Foto Lampiran' : 'Upload Foto Wajah'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (cameraTarget === 'photo') {
                            handlePhotoChange(e);
                            setIsScanning(false);
                            stopCamera();
                          } else {
                            handleFacePhotoUpload(e);
                          }
                        }}
                      />
                    </label>
                    
                    <button
                      type="button"
                      onClick={handleRetryCamera}
                      className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-bold rounded-xl shadow-lg transition-all"
                    >
                      Coba Lagi
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={closeScan}
                    className="mt-6 text-[10px] font-bold text-slate-400 hover:text-slate-200 capitalize tracking-widest"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative w-48 h-48 mb-6">
                    <motion.div
                      animate={{ 
                        borderColor: scanComplete ? '#10b981' : primaryColor,
                        scale: scanComplete ? [1, 1.05, 1] : 1
                      }}
                      className="absolute inset-0 border-2 rounded-3xl border-dashed opacity-50"
                    />
                    
                    <div className="absolute inset-4 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-800">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        width={640}
                        height={480}
                        className={`w-full h-full object-cover transition-opacity duration-500 ${cameraTarget === 'face_photo' ? 'scale-x-[-1]' : ''} ${scanComplete ? 'opacity-20' : 'opacity-100'}`}
                      />
                      
                      {scanComplete && (
                        <motion.div
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="absolute inset-0 flex items-center justify-center text-emerald-500 z-20"
                        >
                          <CheckCircle2 className="w-24 h-24" />
                        </motion.div>
                      )}
                    </div>

                    {!scanComplete && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <svg width="200" height="250" viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {cameraTarget === 'face_photo' ? (
                            <ellipse cx="100" cy="125" rx="80" ry="110" stroke="rgba(16, 185, 129, 0.8)" strokeWidth="4" strokeDasharray="10 10" />
                          ) : (
                            <rect x="20" y="45" width="160" height="160" rx="20" stroke="rgba(16, 185, 129, 0.8)" strokeWidth="4" strokeDasharray="10 10" />
                          )}
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
                    )}

                    {!scanComplete && (
                      <motion.div
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10"
                      />
                    )}
                  </div>

                  <motion.div
                    key={scanComplete ? 'complete' : 'scanning'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 relative z-20"
                  >
                    <h3 className={`text-xl font-black tracking-tight ${scanComplete ? 'text-emerald-500' : 'text-white'}`}>
                      {cameraTarget === 'photo' 
                        ? (scanComplete ? 'Foto Tersimpan' : 'Ambil Foto Lampiran')
                        : (scanComplete ? 'Verifikasi Berhasil' : 'Posisikan Wajah Anda')
                      }
                    </h3>
                    <p className="text-sm font-bold text-slate-400 capitalize tracking-widest">
                      {cameraTarget === 'photo'
                        ? (scanComplete ? 'Foto lampiran berhasil ditambahkan' : 'Posisikan objek/kamera dengan benar dan ambil gambar')
                        : (scanComplete ? 'Foto anda telah tersimpan di sistem' : 'Mohon hadap ke kamera dan paskan dengan garis')
                      }
                    </p>
                    
                    {!scanComplete && (
                      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-4 w-full px-4 max-w-[360px] mx-auto">
                        <button
                          type="button"
                          onClick={captureFace}
                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 flex-1 w-full"
                        >
                          <Camera className="w-4 h-4" />
                          Ambil Gambar
                        </button>
                      </div>
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
                </>
              )}
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

        {deviceSelected === null ? (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[70vh]">
            <h3 className={`text-xs sm:text-sm font-black text-center ${themeClasses.text} tracking-tight`}>
              Pilih tipe piranti yang Anda gunakan saat ini:
            </h3>

            <div className="grid grid-cols-1 gap-3 w-full max-w-sm mx-auto">
              {/* Option A: Smartphone/Tablet/Laptop */}
              <button
                type="button"
                onClick={() => {
                  setDeviceSelected('smartphone');
                  setNewTicket({ ...newTicket, device_type: 'smartphone' });
                  // Trigger face scan right away
                  startCamera('face_photo');
                }}
                className={`p-4 rounded-2xl border-2 border-dashed flex items-center text-left gap-3.5 transition-all hover:bg-emerald-50/20 hover:border-emerald-500 group ${isDark ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50/50'}`}
              >
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-black ${themeClasses.text} mb-0.5`}>Smartphone / Tab / Laptop</h4>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-tight">
                    Memiliki kamera bawaan. Wajib melakukan Scan Wajah (Selfie) untuk membuat tiket.
                  </p>
                </div>
              </button>

              {/* Option B: Komputer PC */}
              <button
                type="button"
                onClick={() => {
                  setDeviceSelected('pc');
                  setNewTicket({ ...newTicket, device_type: 'pc' });
                }}
                className={`p-4 rounded-2xl border-2 border-dashed flex items-center text-left gap-3.5 transition-all hover:bg-emerald-50/20 hover:border-emerald-500 group ${isDark ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50/50'}`}
              >
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-black ${themeClasses.text} mb-0.5`}>Komputer PC (Desktop)</h4>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-tight">
                    Komputer meja tanpa kamera bawaan. Wajib menginput Kode Nomor PC di monitor Anda.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-200 capitalize tracking-widest"
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onFormSubmit} className="p-2.5 sm:p-3.5 overflow-y-auto custom-scrollbar space-y-2 sm:space-y-2.5">
            {/* Device Type Reset Header */}
            <div className={`flex items-center justify-between pb-1 px-1 border-b border-dashed ${themeClasses.border}`}>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'} flex items-center gap-1`}>
                Piranti: {deviceSelected === 'smartphone' ? <><Smartphone className="w-2.5 h-2.5 text-emerald-500" /> Smartphone/Laptop</> : <><Monitor className="w-2.5 h-2.5 text-blue-500" /> Komputer PC</>}
              </span>
              <button
                type="button"
                onClick={() => {
                  setDeviceSelected(null);
                  setNewTicket({ ...newTicket, device_type: '', pc_code: '' });
                }}
                className="text-[9px] font-black text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 underline capitalize tracking-wider"
              >
                Ubah tipe piranti
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-0.5 relative" ref={dropdownRef}>
              <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 capitalize tracking-widest ml-0.5">
                <User className="w-2 h-2" /> Nama Lengkap
              </label>
              <input 
                required
                type="text"
                autoComplete="off"
                placeholder="Cari Nama User..."
                className={`w-full px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                value={newTicket.name}
                onChange={e => handleNameChange(e.target.value)}
                onFocus={() => setShowUserDropdown(true)}
              />
              {showUserDropdown && filteredUsers.length > 0 && (
                <div className={`absolute top-full left-0 right-0 z-[100] mt-1 max-h-48 overflow-y-auto rounded-xl border shadow-xl ${isDark ? 'bg-slate-800' : 'bg-white'} ${themeClasses.border}`}>
                  {filteredUsers.map(user => (
                    <div 
                      key={user.id} 
                      className={`px-4 py-2 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors border-b last:border-0 ${themeClasses.border}`}
                      onMouseDown={(e) => e.preventDefault()}
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

          {deviceSelected === 'pc' && (
            <div className="space-y-0.5">
              <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 capitalize tracking-widest ml-0.5">
                <Monitor className="w-2.5 h-2.5 text-blue-500" /> Kode Komputer (Berlabel di Monitor) <span className="text-rose-500 font-bold">* Wajib</span>
              </label>
              <div className="relative flex items-center">
                <input 
                  required
                  type="text"
                  placeholder="Contoh: PC-05, PC-LAB-01, dll..."
                  className={`w-full px-3 py-1.5 pr-16 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                  value={newTicket.pc_code || ''}
                  onChange={e => setNewTicket({...newTicket, pc_code: e.target.value})}
                />
                {isPcCodeMatched && (
                  <div className="absolute right-2 text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-500/10" />
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Cocok</span>
                  </div>
                )}
              </div>
               <p className="text-[9px] font-bold text-amber-500 dark:text-amber-400 capitalize tracking-wide ml-0.5">
                * Masukkan nomor PC yang tertera pada stiker label di casing/layar monitor Anda.
              </p>
            </div>
          )}

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
              <Camera className="w-2 h-2" /> Lampiran Foto Selfie (Opsional)
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => startCamera('photo')}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 px-3 py-2 border-2 border-dashed rounded-2xl transition-all hover:bg-emerald-50/50 group ${isDark ? 'border-slate-700 hover:border-emerald-500' : 'border-slate-200 hover:border-emerald-500'}`}
                >
                  <Camera className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  <span className={`text-[8px] font-bold group-hover:text-emerald-600 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ambil via Kamera</span>
                </button>
              </div>

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

          {deviceSelected === 'smartphone' && (
            <div className={`p-3 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-xs font-bold">Foto Selfie Tersimpan</p>
                <p className="text-[10px] opacity-80 leading-relaxed">Foto selfie Anda sudah tersimpan dan terverifikasi secara aman di database.</p>
              </div>
            </div>
          )}

          <div className="space-y-0.5">
            <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 capitalize tracking-widest ml-0.5">
              <Ticket className="w-2 h-2" /> Indek Karyawan
            </label>
            <div className="relative">
              <input 
                required
                type={showIndex ? "text" : "password"}
                placeholder="Masukkan Indek Karyawan Anda..."
                className={`w-full px-3 py-1.5 pr-10 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text} ${inputIndex && correctIndex && inputIndex === correctIndex ? 'border-emerald-500 ring-2 ring-emerald-500/20' : inputIndex && correctIndex && inputIndex !== correctIndex ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
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
            <div className="min-h-[16px] mt-1 relative">
                {!correctIndex ? (
                  <p className="text-[9px] font-bold text-rose-500 capitalize tracking-tight ml-0.5">
                    * Pilih nama Anda dari daftar di atas terlebih dahulu
                  </p>
                ) : !inputIndex ? (
                  <p className="text-[9px] font-bold text-rose-500 capitalize tracking-tight ml-0.5">
                    * Masukkan indek karyawan untuk verifikasi
                  </p>
                ) : inputIndex === correctIndex ? (
                  showIndexSuccess ? (
                    <p className="text-[9px] font-bold text-emerald-500 capitalize tracking-tight ml-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Indek yang Anda ketik sudah benar
                    </p>
                  ) : null
                ) : (
                  <p className="text-[9px] font-bold text-rose-500 capitalize tracking-tight ml-0.5 animate-pulse">
                    ⚠ Indek Karyawan tidak sesuai!
                  </p>
                )}
            </div>
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
      )}
      </motion.div>
    </div>
  );
});
