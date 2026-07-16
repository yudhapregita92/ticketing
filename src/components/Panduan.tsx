import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Info, 
  Edit3, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  RefreshCw,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

interface PanduanProps {
  isDark: boolean;
  primaryColor: string;
  appSettings?: any;
  setAppSettings?: (settings: any) => void;
  adminUser?: any;
}

export const Panduan: React.FC<PanduanProps> = ({ 
  isDark, 
  primaryColor, 
  appSettings, 
  setAppSettings,
  adminUser 
}) => {
  const [openSections, setOpenSections] = useState<string[]>(['panduan_1']);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editableGuides, setEditableGuides] = useState<any[]>([]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const defaultGuidesText = [
    {
      id: 'panduan_1',
      title: '1. Panduan buat tiket bantuan IT',
      content: `Berikut adalah langkah-langkah untuk membuat tiket bantuan IT:

1. Pastikan Anda telah mengaktifkan layanan lokasi (GPS) pada perangkat Anda.
2. Klik tombol ikon "Buat Tiket" pada menu navigasi.
3. Isi form tiket dengan informasi yang diperlukan: Nama, Departemen, Kategori, dan Deskripsi kendala.
4. Gunakan fitur foto untuk memfoto wajah atau kondisi kendala. Foto wajah adalah wajib.
5. Setelah semua data terisi, tekan tombol "Kirim".
6. Anda akan menerima nomor tiket untuk melacak status penanganan.

Catatan: Mohon pastikan GPS aktif karena kami memerlukan lokasi Anda untuk penanganan yang lebih cepat.`
    },
    {
      id: 'panduan_2',
      title: '2. Cara melihat status tiket',
      content: `Untuk memantau status tiket yang telah Anda buat:

- Buka menu "Riwayat" pada navigasi bawah.
- Masukkan nomor WhatsApp atau identitas yang Anda gunakan saat membuat tiket.
- Anda dapat melihat semua riwayat tiket yang terkait beserta status terbarunya.`
    }
  ];

  // Initialize editable guides when edit mode is opened
  useEffect(() => {
    if (isEditMode) {
      try {
        if (appSettings?.panduan_guides) {
          const parsed = JSON.parse(appSettings.panduan_guides);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEditableGuides(parsed);
          } else {
            setEditableGuides(defaultGuidesText);
          }
        } else {
          setEditableGuides(defaultGuidesText);
        }
      } catch (e) {
        setEditableGuides(defaultGuidesText);
      }
    }
  }, [isEditMode, appSettings]);

  // Load guides for display
  const getGuides = () => {
    try {
      if (appSettings?.panduan_guides) {
        const parsed = JSON.parse(appSettings.panduan_guides);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse panduan_guides", e);
    }
    return defaultGuidesText;
  };

  const guides = getGuides();

  const handleAddGuide = () => {
    setEditableGuides(prev => [
      ...prev,
      {
        id: `panduan_${Date.now()}`,
        title: `${prev.length + 1}. Panduan Baru`,
        content: ''
      }
    ]);
  };

  const handleRemoveGuide = (index: number) => {
    setEditableGuides(prev => prev.filter((_, i) => i !== index));
  };

  const handleGuideChange = (index: number, field: string, value: string) => {
    setEditableGuides(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    // Validate guides
    if (editableGuides.some(g => !g.title.trim())) {
      toast.error('Semua judul panduan harus diisi!');
      return;
    }

    setIsSaving(true);
    try {
      const updatedSettings = {
        ...appSettings,
        panduan_guides: JSON.stringify(editableGuides)
      };

      // Safely serialize array fields in settings for the server
      const payload = {
        ...updatedSettings,
        notification_emails: Array.isArray(appSettings?.notification_emails) 
          ? JSON.stringify(appSettings.notification_emails) 
          : appSettings?.notification_emails,
        telegram_chat_ids: Array.isArray(appSettings?.telegram_chat_ids) 
          ? JSON.stringify(appSettings.telegram_chat_ids) 
          : appSettings?.telegram_chat_ids
      };

      const response = await api.updateSettings(payload);
      
      if (response) {
        if (setAppSettings) {
          setAppSettings(updatedSettings);
        }
        toast.success('Panduan berhasil disimpan!');
        setIsEditMode(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menyimpan panduan: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl transition-all ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-slate-100'}`}>
      
      {/* Header */}
      <div className={`p-6 sm:p-8 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: primaryColor }}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEditMode ? 'Kelola Panduan' : 'Panduan Penggunaan'}
              </h2>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {isEditMode ? 'Tambah, ubah, atau hapus panduan bantuan sistem IT' : 'Kumpulan panduan untuk mempermudah penggunaan sistem IT Helpdesk'}
              </p>
            </div>
          </div>

          {/* Admin Controls */}
          {adminUser && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isEditMode ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{ backgroundColor: primaryColor }}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Simpan
                  </button>
                  <button
                    onClick={() => setIsEditMode(false)}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                  >
                    <X className="w-3.5 h-3.5" />
                    Batal
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditMode(true)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                >
                  <Edit3 className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  Kelola Panduan
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {isEditMode ? (
            /* ================= EDIT MODE ================= */
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Daftar Panduan</span>
                <button
                  onClick={handleAddGuide}
                  className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer text-emerald-500 border-emerald-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Panduan Baru
                </button>
              </div>

              <div className="space-y-4">
                {editableGuides.map((guide, index) => (
                  <div 
                    key={guide.id || index} 
                    className={`p-5 rounded-2xl border ${isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-slate-50/50 border-slate-200'}`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Panduan #{index + 1}
                        </span>
                        <button
                          onClick={() => handleRemoveGuide(index)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer"
                          title="Hapus Panduan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Title Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Sub Judul / Pertanyaan
                        </label>
                        <input
                          type="text"
                          value={guide.title}
                          onChange={(e) => handleGuideChange(index, 'title', e.target.value)}
                          placeholder="Contoh: 1. Cara buat tiket bantuan"
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold outline-none focus:ring-2 transition-all ${isDark ? 'bg-zinc-900 border-zinc-800 text-white focus:ring-zinc-700' : 'bg-white border-slate-200 text-slate-800 focus:ring-slate-300'}`}
                        />
                      </div>

                      {/* Content Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Isi Panduan
                        </label>
                        <textarea
                          value={guide.content}
                          onChange={(e) => handleGuideChange(index, 'content', e.target.value)}
                          rows={6}
                          placeholder="Ketik detail langkah-langkah di sini..."
                          className={`w-full px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 transition-all font-mono whitespace-pre-wrap ${isDark ? 'bg-zinc-900 border-zinc-800 text-white focus:ring-zinc-700' : 'bg-white border-slate-200 text-slate-800 focus:ring-slate-300'}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {editableGuides.length === 0 && (
                  <div className="text-center py-12 border border-dashed rounded-2xl border-slate-200 dark:border-zinc-800">
                    <p className="text-xs text-slate-400 italic">Belum ada panduan. Tekan tombol di atas untuk menambahkan panduan baru.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* ================= VIEW MODE ================= */
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {guides.map((guide, idx) => {
                const isOpen = openSections.includes(guide.id);
                return (
                  <div 
                    key={guide.id || idx}
                    className={`rounded-2xl border overflow-hidden transition-all duration-300 ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <button
                      onClick={() => toggleSection(guide.id)}
                      className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-100'}`}
                    >
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {guide.title}
                      </h3>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-slate-500 shadow-sm'}`}>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className={`p-4 sm:p-5 pt-0 border-t ${isDark ? 'border-zinc-800 text-zinc-300' : 'border-slate-200 text-slate-600'}`}>
                            {typeof guide.content === 'string' ? (
                              <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                                {guide.content}
                              </div>
                            ) : (
                              guide.content
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {guides.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-xs text-slate-400 italic">Belum ada panduan penggunaan.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
