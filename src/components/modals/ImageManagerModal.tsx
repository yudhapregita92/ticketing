import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Trash2, RefreshCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ImageManagerModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
  isDark: boolean;
  themeClasses: any;
  primaryColor: string;
}

interface TicketImage {
  id: number;
  ticket_no: string;
  name: string;
  created_at: string;
  has_photo: number;
  has_face_photo: number;
}

export const ImageManagerModal: React.FC<ImageManagerModalProps> = ({
  show,
  setShow,
  isDark,
  themeClasses,
  primaryColor
}) => {
  const [images, setImages] = useState<TicketImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/images');
      if (res.ok) {
        const data = await res.json();
        setImages(data);
      }
    } catch (error) {
      console.error('Failed to fetch images', error);
      toast.error('Gagal memuat daftar gambar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchImages();
    }
  }, [show]);

  const handleDelete = async (id: number, type: 'photo' | 'face_photo') => {
    if (!window.confirm('Yakin ingin menghapus foto ini?')) return;
    
    setDeletingId(`${id}-${type}`);
    try {
      const res = await fetch(`/api/images/${id}?type=${type}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Foto berhasil dihapus');
        fetchImages(); // Refresh the list to reflect changes
      } else {
        toast.error('Gagal menghapus foto');
      }
    } catch (error) {
      console.error('Failed to delete image', error);
      toast.error('Gagal menghapus foto');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('Yakin ingin menghapus SEMUA foto yang berumur lebih dari 24 jam?')) return;
    
    setCleaningUp(true);
    try {
      const res = await fetch('/api/images/cleanup', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.count} foto lama berhasil dihapus`);
        fetchImages();
      } else {
        toast.error('Gagal membersihkan foto lama');
      }
    } catch (error) {
      console.error('Failed to cleanup images', error);
      toast.error('Gagal membersihkan foto lama');
    } finally {
      setCleaningUp(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShow(false)}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden ${themeClasses.card} border ${themeClasses.border}`}
      >
        <div className={`p-4 sm:p-6 border-b shrink-0 flex items-center justify-between ${themeClasses.border}`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-black tracking-tight ${themeClasses.text}`}>Manajemen Gambar</h2>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${themeClasses.textMuted}`}>Kelola foto tiket yang tersimpan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCleanup}
              disabled={cleaningUp}
              className="px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {cleaningUp ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              <span className="hidden sm:inline">Hapus Foto &gt; 24 Jam</span>
            </button>
            <button 
              onClick={() => setShow(false)}
              className={`p-2 rounded-xl transition-all ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <RefreshCcw className={`w-8 h-8 animate-spin ${themeClasses.textMuted}`} />
            </div>
          ) : images.length === 0 ? (
            <div className={`text-center p-12 ${themeClasses.textMuted}`}>
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-bold">Tidak ada gambar tersimpan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img) => (
                <React.Fragment key={img.id}>
                  {img.has_photo === 1 && (
                    <div className={`p-4 rounded-2xl border ${themeClasses.border} ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} flex flex-col gap-3`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-xs font-bold ${themeClasses.text}`}>{img.ticket_no}</p>
                          <p className={`text-[10px] ${themeClasses.textMuted}`}>{img.name} (Lampiran)</p>
                          <p className={`text-[10px] ${themeClasses.textMuted}`}>{new Date(img.created_at).toLocaleString('id-ID')}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(img.id, 'photo')}
                          disabled={deletingId === `${img.id}-photo`}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50"
                          title="Hapus Lampiran"
                        >
                          {deletingId === `${img.id}-photo` ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="aspect-video bg-black/10 rounded-xl overflow-hidden relative group">
                        <img 
                          src={`/api/tickets/${img.id}/photo`} 
                          alt={`Lampiran ${img.ticket_no}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Not+Found';
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {img.has_face_photo === 1 && (
                    <div className={`p-4 rounded-2xl border ${themeClasses.border} ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} flex flex-col gap-3`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-xs font-bold ${themeClasses.text}`}>{img.ticket_no}</p>
                          <p className={`text-[10px] ${themeClasses.textMuted}`}>{img.name} (Wajah)</p>
                          <p className={`text-[10px] ${themeClasses.textMuted}`}>{new Date(img.created_at).toLocaleString('id-ID')}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(img.id, 'face_photo')}
                          disabled={deletingId === `${img.id}-face_photo`}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50"
                          title="Hapus Wajah"
                        >
                          {deletingId === `${img.id}-face_photo` ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="aspect-video bg-black/10 rounded-xl overflow-hidden relative group">
                        <img 
                          src={`/api/tickets/${img.id}/face_photo`} 
                          alt={`Wajah ${img.ticket_no}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Not+Found';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
