import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { 
  User, Lock, Sparkles, CheckCircle2, AlertCircle, 
  RotateCcw, ArrowRight, BookOpen, Shield, ChevronDown
} from 'lucide-react';

interface MembershipJournalFormProps {
  isDark: boolean;
  themeClasses: any;
  primaryColor: string;
}

export const MembershipJournalForm: React.FC<MembershipJournalFormProps> = ({
  isDark,
  themeClasses,
  primaryColor
}) => {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Manual fallback inputs if name is not found/not registered
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualKode, setManualKode] = useState('');
  const [manualBagian, setManualBagian] = useState('');
  const [manualGgf, setManualGgf] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');

  // Signature Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Load memberships & check URL query params
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/memberships');
        if (response.ok) {
          const data = await response.json();
          setMembers(data);

          // Check if member_id is in URL
          const urlParams = new URLSearchParams(window.location.search);
          const memberIdStr = urlParams.get('member_id');
          if (memberIdStr) {
            const memberId = parseInt(memberIdStr, 10);
            const found = data.find((m: any) => m.id === memberId);
            if (found) {
              setSelectedMember(found);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load memberships:', err);
        toast.error('Gagal mengambil data anggota');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      
      // Prevent scrolling on mobile when drawing
      const preventDefault = (e: Event) => {
        if (e.target === canvas) {
          e.preventDefault();
        }
      };
      document.body.addEventListener('touchstart', preventDefault, { passive: false });
      document.body.addEventListener('touchmove', preventDefault, { passive: false });
      document.body.addEventListener('touchend', preventDefault, { passive: false });

      return () => {
        document.body.removeEventListener('touchstart', preventDefault);
        document.body.removeEventListener('touchmove', preventDefault);
        document.body.removeEventListener('touchend', preventDefault);
      };
    }
  }, [canvasRef, isDark, success, isManualInput, selectedMember]);

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSigned(true);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let nama = '';
    let kode_lokal = '';
    let indek_ggf = '';
    let bagian = '';
    let barcode = '';
    let member_id = null;

    if (isManualInput) {
      if (!manualName.trim()) {
        toast.error('Silakan isi nama Anda');
        return;
      }
      nama = manualName;
      kode_lokal = manualKode;
      bagian = manualBagian;
      indek_ggf = manualGgf;
      barcode = manualBarcode;
    } else {
      if (!selectedMember) {
        toast.error('Silakan pilih nama Anda dari daftar');
        return;
      }
      nama = selectedMember.nama;
      kode_lokal = selectedMember.kode_lokal || '';
      indek_ggf = selectedMember.indek_ggf || '';
      bagian = selectedMember.bagian || '';
      barcode = selectedMember.barcode || '';
      member_id = selectedMember.id;
    }

    if (!hasSigned) {
      toast.error('Silakan bubuhkan tanda tangan Anda terlebih dahulu');
      return;
    }

    // Get signature image from canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signature = canvas.toDataURL('image/png');

    try {
      setSubmitting(true);
      const res = await fetch('/api/memberships/journals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id,
          nama,
          kode_lokal,
          indek_ggf,
          bagian,
          barcode,
          signature,
          keterangan: keterangan || 'Cetak Kartu Member'
        })
      });

      if (res.ok) {
        setSuccess(true);
        toast.success('Buku jurnal berhasil ditandatangani!');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal mengirim jurnal');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat mengirim data');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMembers = members.filter(m =>
    m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.kode_lokal && m.kode_lokal.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (m.bagian && m.bagian.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-3 relative overflow-hidden bg-slate-900 text-slate-100">
      {/* Background patterns */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Toaster position="top-center" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative z-10 my-4"
      >
        {success ? (
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="text-center py-8 space-y-4"
          >
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-indigo-500/30">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Terima Kasih!</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Tanda tangan buku jurnal Anda untuk proses cetak kartu telah berhasil disimpan ke database sistem.
            </p>
            <div className="pt-4">
              <button
                onClick={() => {
                  setSuccess(false);
                  setSelectedMember(null);
                  setHasSigned(false);
                  setKeterangan('');
                  setManualName('');
                  setManualKode('');
                  setManualBagian('');
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all active:scale-95"
              >
                Isi Jurnal Baru
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-11 h-11 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-2.5 mx-auto">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-base font-bold text-slate-100">Jurnal Cetak Kartu Digital</h1>
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                Silakan isi data Anda dan bubuhkan tanda tangan sebagai tanda bukti penerimaan cetak kartu.
              </p>
            </div>

            <div className="flex border-b border-slate-800 pb-1 justify-center gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsManualInput(false);
                  clearCanvas();
                }}
                className={`pb-1.5 transition-colors relative ${!isManualInput ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Pilih Dari Daftar
                {!isManualInput && (
                  <motion.div layoutId="formTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsManualInput(true);
                  clearCanvas();
                }}
                className={`pb-1.5 transition-colors relative ${isManualInput ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Isi Manual
                {isManualInput && (
                  <motion.div layoutId="formTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                )}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isManualInput ? (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                      Nama Lengkap
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Masukkan nama lengkap..."
                      value={manualName}
                      onChange={e => setManualName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                        Kode Lokal (NIK)
                      </label>
                      <input
                        type="text"
                        placeholder="Kode..."
                        value={manualKode}
                        onChange={e => setManualKode(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                        Bagian / Dept
                      </label>
                      <input
                        type="text"
                        placeholder="Bagian..."
                        value={manualBagian}
                        onChange={e => setManualBagian(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                        Index GGF
                      </label>
                      <input
                        type="text"
                        placeholder="GGF..."
                        value={manualGgf}
                        onChange={e => setManualGgf(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                        Barcode
                      </label>
                      <input
                        type="text"
                        placeholder="Barcode..."
                        value={manualBarcode}
                        onChange={e => setManualBarcode(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Nama Anggota
                  </label>
                  <div 
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-800 border ${
                      showMemberDropdown ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-700'
                    } rounded-lg cursor-pointer text-xs`}
                    onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <User className={`w-4 h-4 text-indigo-400`} />
                      <span className={selectedMember ? 'text-slate-100 font-medium' : 'text-slate-400'}>
                        {selectedMember ? selectedMember.nama : 'Pilih Nama Anda...'}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showMemberDropdown ? 'rotate-180' : ''}`} />
                  </div>

                  <AnimatePresence>
                    {showMemberDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
                      >
                        <div className="p-1.5 border-b border-slate-700 bg-slate-850">
                          <input 
                            type="text"
                            placeholder="Cari nama atau NIK..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto p-1.5 space-y-0.5">
                          {filteredMembers.length > 0 ? (
                            filteredMembers.map(m => (
                              <div 
                                key={m.id}
                                onClick={() => {
                                  setSelectedMember(m);
                                  setShowMemberDropdown(false);
                                  setSearchQuery('');
                                }}
                                className={`px-2.5 py-2 rounded cursor-pointer flex flex-col transition-colors ${
                                  selectedMember?.id === m.id ? 'bg-indigo-600/30 text-indigo-400' : 'hover:bg-slate-700 text-slate-300'
                                }`}
                              >
                                <span className="font-semibold text-xs">{m.nama}</span>
                                <span className="text-[10px] opacity-70">
                                  {m.bagian} {m.kode_lokal ? `• NIK: ${m.kode_lokal}` : ''}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-center text-xs text-slate-500">
                              Data tidak ditemukan
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Pre-filled info cards */}
                  {selectedMember && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2.5 p-2.5 bg-slate-800/50 border border-slate-800 rounded-lg space-y-1 text-[10px] text-slate-400 leading-relaxed"
                    >
                      <div className="flex justify-between"><span className="font-medium">NIK / Kode:</span> <span className="text-slate-200">{selectedMember.kode_lokal || '-'}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Bagian / Dept:</span> <span className="text-slate-200">{selectedMember.bagian || '-'}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Index GGF:</span> <span className="text-slate-200">{selectedMember.indek_ggf || '-'}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Barcode:</span> <span className="text-slate-200">{selectedMember.barcode || '-'}</span></div>
                    </motion.div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                  Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Keterangan (contoh: Cetak ID Card baru)..."
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>

              {/* Signature Area */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Bubuhkan Tanda Tangan Anda
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
                
                <div className="bg-slate-200 border border-slate-300 rounded-xl overflow-hidden shadow-inner flex justify-center relative">
                  <canvas
                    ref={canvasRef}
                    width={350}
                    height={160}
                    className="cursor-crosshair w-full max-w-[350px] bg-slate-200 touch-none block"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSigned && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-600 text-[11px] font-medium tracking-wide">
                      Tanda tangan di sini
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: primaryColor }}
                className="w-full mt-2 py-2.5 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/10 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Simpan & Kirim Tanda Tangan
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};
