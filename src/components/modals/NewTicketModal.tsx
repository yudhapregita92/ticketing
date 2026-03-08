import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Building2, 
  Layers, 
  Phone, 
  MessageSquare, 
  Camera, 
  MapPin, 
  RefreshCcw, 
  Send 
} from 'lucide-react';
import { IAppSettings } from '../../types';

interface NewTicketModalProps {
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  isDark: boolean;
  themeClasses: any;
  primaryColor: boolean; // wait, primaryColor is string
  formData: any;
  setFormData: (data: any) => void;
  departments: { id: number, name: string }[];
  categories: { id: number, name: string }[];
  gpsStatus: 'idle' | 'loading' | 'success' | 'error';
  gpsError: string | null;
  getGPSLocation: () => void;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  photoLoading: boolean;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  appSettings: IAppSettings;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  showForm,
  setShowForm,
  isDark,
  themeClasses,
  formData,
  setFormData,
  departments,
  categories,
  gpsStatus,
  gpsError,
  getGPSLocation,
  handlePhotoUpload,
  photoLoading,
  submitting,
  handleSubmit,
  appSettings
}) => {
  const primaryColor = appSettings.primary_color;

  return (
    <AnimatePresence>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border ${themeClasses.card}`}
          >
            <div className={`sticky top-0 z-10 p-4 sm:p-6 border-b flex items-center justify-between backdrop-blur-md ${themeClasses.header}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-lg sm:text-xl font-black tracking-tight ${themeClasses.text}`}>Buat Tiket Baru</h2>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Lengkapi detail laporan Anda</p>
                </div>
              </div>
              <button 
                onClick={() => setShowForm(false)}
                className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3 h-3" /> Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    required
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-4 py-3 sm:py-4 rounded-2xl border transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm sm:text-base font-medium ${themeClasses.input}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Building2 className="w-3 h-3" /> Departemen <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className={`w-full px-4 py-3 sm:py-4 rounded-2xl border transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm sm:text-base font-medium appearance-none ${themeClasses.input}`}
                  >
                    <option value="">Pilih Departemen</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-3 h-3" /> Kategori Masalah <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className={`w-full px-4 py-3 sm:py-4 rounded-2xl border transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm sm:text-base font-medium appearance-none ${themeClasses.input}`}
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Phone className="w-3 h-3" /> No. Telepon/WA <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    required
                    type="tel"
                    placeholder="Contoh: 08123456789"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={`w-full px-4 py-3 sm:py-4 rounded-2xl border transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm sm:text-base font-medium ${themeClasses.input}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" /> Deskripsi Masalah <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Jelaskan masalah Anda secara detail agar kami dapat membantu lebih cepat..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`w-full px-4 py-3 sm:py-4 rounded-2xl border transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm sm:text-base font-medium resize-none ${themeClasses.input}`}
                />
              </div>

              {/* GPS & Photo Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Camera className="w-3 h-3" /> Foto Bukti (Opsional)
                  </label>
                  <div className="relative">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label 
                      htmlFor="photo-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 sm:h-40 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
                        formData.photo 
                          ? 'border-emerald-500 bg-emerald-50/10' 
                          : isDark ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      {photoLoading ? (
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCcw className="w-6 h-6 text-emerald-500 animate-spin" />
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Memproses...</span>
                        </div>
                      ) : formData.photo ? (
                        <div className="relative w-full h-full p-2">
                          <img src={formData.photo} alt="Preview" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                            <span className="text-white text-[10px] font-bold uppercase tracking-widest">Ganti Foto</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Camera className="w-6 h-6 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ambil Foto</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Lokasi GPS
                  </label>
                  <div className={`w-full h-32 sm:h-40 rounded-3xl border flex flex-col items-center justify-center p-4 text-center transition-all ${
                    gpsStatus === 'success' 
                      ? 'bg-emerald-50/10 border-emerald-500/30' 
                      : gpsStatus === 'error'
                      ? 'bg-rose-50/10 border-rose-500/30'
                      : isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50/50 border-slate-200'
                  }`}>
                    {gpsStatus === 'loading' ? (
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCcw className="w-6 h-6 text-emerald-500 animate-spin" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Mencari Sinyal...</span>
                      </div>
                    ) : gpsStatus === 'success' ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Lokasi Terkunci</span>
                        <p className="text-[9px] text-slate-400 font-medium truncate w-full">Lat: {formData.latitude?.toFixed(4)}, Lng: {formData.longitude?.toFixed(4)}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${gpsStatus === 'error' ? 'text-rose-500' : 'text-slate-400'}`}>
                          {gpsError || 'GPS diperlukan untuk watermark'}
                        </p>
                        <button 
                          type="button"
                          onClick={getGPSLocation}
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                          Aktifkan GPS
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  disabled={submitting || photoLoading}
                  type="submit"
                  style={{ backgroundColor: primaryColor }}
                  className="w-full text-white font-black py-4 sm:py-5 rounded-2xl text-sm sm:text-base shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {submitting ? (
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      Kirim Laporan Sekarang
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
                  Dengan mengirim, Anda setuju untuk diproses oleh tim IT Support.
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Plus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
