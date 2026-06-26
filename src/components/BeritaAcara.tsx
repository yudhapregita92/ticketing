import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Printer, FileText, AlertCircle, Plus, Trash2, Edit2, History } from 'lucide-react';
import { IAdminUser } from '../types';

interface BeritaAcaraProps {
  isDark: boolean;
  themeClasses: any;
  primaryColor: string;
  adminUser: IAdminUser | null;
}

const BeritaAcara: React.FC<BeritaAcaraProps> = ({ isDark, themeClasses, primaryColor, adminUser }) => {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('beritaAcaraSettings');
    const parsed = saved ? JSON.parse(saved) : {};
    
    return {
      recommenderName: adminUser?.name || '',
      recommenderDept: 'IT KDK',
      recommendeeName: '',
      recommendeeDept: '',
      recommendeePosition: '',
      reason: '',
      location: 'Terbanggi Besar',
      date: new Date().toISOString().split('T')[0],
      logo1: parsed.logo1 || null,
      logo2: parsed.logo2 || null,
      headerTitle: parsed.headerTitle || 'KOPKAR DWI KARYA',
      headerSubtitle: parsed.headerSubtitle || 'SURAT REKOMENDASI',
      headerDocNo: parsed.headerDocNo || 'No. Dok: F/KDK/18/XII/2022 Rev. 5, Tanggal 27 September 2024'
    };
  });

  const [savedDocs, setSavedDocs] = useState<any[]>(() => {
    const saved = localStorage.getItem('savedBeritaAcaraList');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentId, setCurrentId] = useState<string>(() => Date.now().toString());

  useEffect(() => {
    localStorage.setItem('savedBeritaAcaraList', JSON.stringify(savedDocs));
  }, [savedDocs]);

  useEffect(() => {
    localStorage.setItem('beritaAcaraSettings', JSON.stringify({
      logo1: formData.logo1,
      logo2: formData.logo2,
      headerTitle: formData.headerTitle,
      headerSubtitle: formData.headerSubtitle,
      headerDocNo: formData.headerDocNo
    }));
  }, [formData.logo1, formData.logo2, formData.headerTitle, formData.headerSubtitle, formData.headerDocNo]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const availableWidth = entry.contentRect.width - 40; // 40px total horizontal padding
        const newScale = availableWidth / 794; // 794px is approx 210mm at 96dpi
        setScale(newScale > 1 ? 1 : newScale);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, logoKey: 'logo1' | 'logo2') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, [logoKey]: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    const newDoc = {
      id: currentId,
      recommenderName: formData.recommenderName,
      recommenderDept: formData.recommenderDept,
      recommendeeName: formData.recommendeeName,
      recommendeeDept: formData.recommendeeDept,
      recommendeePosition: formData.recommendeePosition,
      reason: formData.reason,
      location: formData.location,
      date: formData.date,
    };
    
    setSavedDocs(prev => {
      const exists = prev.findIndex(d => d.id === currentId);
      if (exists >= 0) {
        const next = [...prev];
        next[exists] = newDoc;
        return next;
      }
      return [newDoc, ...prev];
    });

    setTimeout(() => {
      window.print();
    }, 100);
  };

  const loadDoc = (doc: any) => {
    setCurrentId(doc.id);
    setFormData(prev => ({
      ...prev,
      recommenderName: doc.recommenderName,
      recommenderDept: doc.recommenderDept,
      recommendeeName: doc.recommendeeName,
      recommendeeDept: doc.recommendeeDept,
      recommendeePosition: doc.recommendeePosition,
      reason: doc.reason,
      location: doc.location,
      date: doc.date,
    }));
  };

  const deleteDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Hapus dokumen ini?')) {
      setSavedDocs(prev => prev.filter(d => d.id !== id));
      if (currentId === id) {
        handleNew();
      }
    }
  };

  const handleNew = () => {
    setCurrentId(Date.now().toString());
    setFormData(prev => ({
      ...prev,
      recommendeeName: '',
      recommendeeDept: '',
      recommendeePosition: '',
      reason: '',
    }));
  };

  const formattedDate = new Date(formData.date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 print:hidden gap-4">
        <div>
          <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Surat Rekomendasi
          </h2>
          <p className={`text-xs mt-1 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Buat dan cetak surat rekomendasi/berita acara
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNew}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all ${
              isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Buat Baru</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-md hover:opacity-90 transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        {/* Form Section */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}
          >
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
              <FileText className="w-4 h-4" />
              Formulir Data
            </h3>
            
            <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Nama Pemberi (Anda)</label>
                <input
                  type="text"
                  value={formData.recommenderName}
                  onChange={(e) => setFormData({...formData, recommenderName: e.target.value})}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Bagian Pemberi</label>
                <input
                  type="text"
                  value={formData.recommenderDept}
                  onChange={(e) => setFormData({...formData, recommenderDept: e.target.value})}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className={`h-px w-full ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`} />

            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Nama Penerima</label>
                <input
                  type="text"
                  value={formData.recommendeeName}
                  onChange={(e) => setFormData({...formData, recommendeeName: e.target.value})}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                  }`}
                  placeholder="Ex: BAYU AJI"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Bagian Penerima</label>
                  <input
                    type="text"
                    value={formData.recommendeeDept}
                    onChange={(e) => setFormData({...formData, recommendeeDept: e.target.value})}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                    }`}
                    placeholder="Ex: Fleet"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Jabatan Penerima</label>
                  <input
                    type="text"
                    value={formData.recommendeePosition}
                    onChange={(e) => setFormData({...formData, recommendeePosition: e.target.value})}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                    }`}
                    placeholder="Ex: Sub Deb Head"
                  />
                </div>
              </div>
            </div>

            <div className={`h-px w-full ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`} />

            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Isi Keterangan Pengajuan</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all min-h-[120px] ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                  }`}
                  placeholder="Ex: Untuk dapat melakukan pengajuan pembelian Laptop Core i3 series, piranti saat ini akan digunakan oleh Section Head Fleet, dengan mempertimbangkan pekerjaan yang menggunakan monitoring GPS Tracker..."
                />
              </div>
            </div>

            <div className={`h-px w-full ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Lokasi</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Tanggal</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className={`h-px w-full ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`} />

            <div className="space-y-4">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Pengaturan Kop Surat</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Teks Header Utama</label>
                  <input
                    type="text"
                    value={formData.headerTitle}
                    onChange={(e) => setFormData({...formData, headerTitle: e.target.value})}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Teks Sub Header</label>
                  <input
                    type="text"
                    value={formData.headerSubtitle}
                    onChange={(e) => setFormData({...formData, headerSubtitle: e.target.value})}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Teks Nomor Dokumen</label>
                  <input
                    type="text"
                    value={formData.headerDocNo}
                    onChange={(e) => setFormData({...formData, headerDocNo: e.target.value})}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className={`h-px w-full ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Logo Kiri</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e, 'logo1')}
                  className={`w-full px-3 py-1.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Logo Kanan</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e, 'logo2')}
                  className={`w-full px-3 py-1.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                  }`}
                />
              </div>
            </div>

          </div>
        </motion.div>
        </div>

        {/* Preview Section */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Pratinjau Dokumen</h3>
            <div ref={containerRef} className="w-full flex justify-center bg-slate-100/50 rounded-lg overflow-hidden border border-slate-200" style={{ height: `${1123 * scale + 40}px` }}>
              <div 
                className="bg-white text-black shadow-lg" 
                style={{ 
                  width: '210mm', 
                  minHeight: '297mm', 
                  transform: `scale(${scale})`, 
                  transformOrigin: 'top center',
                  margin: '20px 0'
                }}
              >
                <div className="p-[20mm]">
                  <PrintableContent formData={formData} formattedDate={formattedDate} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Riwayat Dokumen */}
      <div className="print:hidden">
        <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
          <History className="w-4 h-4" />
          Daftar Riwayat Rekomendasi
        </h3>
        
        {savedDocs.length === 0 ? (
          <div className={`p-8 rounded-2xl border border-dashed text-center ${isDark ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Belum ada riwayat dokumen yang disimpan.</p>
          </div>
        ) : (
          <div className={`overflow-hidden rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
            <div className={`grid grid-cols-12 gap-4 p-4 text-xs font-bold ${isDark ? 'bg-zinc-800/50 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-700'} border-b`}>
              <div className="col-span-6 sm:col-span-7 flex items-center gap-4">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" disabled />
                <span>Text</span>
              </div>
              <div className="col-span-6 sm:col-span-5 flex items-center justify-end sm:justify-start">
                <span>Actions</span>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {savedDocs.map(doc => (
                <div 
                  key={doc.id}
                  className={`grid grid-cols-12 gap-4 p-4 items-center transition-all ${
                    currentId === doc.id 
                      ? (isDark ? 'bg-emerald-900/10' : 'bg-emerald-50/50')
                      : (isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50')
                  }`}
                >
                  <div className="col-span-6 sm:col-span-7 flex items-center gap-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" 
                      checked={currentId === doc.id}
                      onChange={() => loadDoc(doc)}
                    />
                    <div>
                      <h4 className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                        {doc.recommendeeName || 'Tanpa Nama'} <span className="text-slate-400 font-normal">[{doc.recommendeeDept} {doc.recommendeePosition ? `• ${doc.recommendeePosition}` : ''}]</span>
                      </h4>
                    </div>
                  </div>
                  <div className="col-span-6 sm:col-span-5 flex flex-row items-center justify-end sm:justify-start gap-2 sm:gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <button
                      onClick={() => {
                        loadDoc(doc);
                        setTimeout(() => handlePrint(), 100);
                      }}
                      className="flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Cetak</span>
                    </button>
                    <button
                      onClick={() => loadDoc(doc)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors shrink-0 ${
                        currentId === doc.id ? 'text-emerald-500 cursor-default font-bold' : 'text-blue-500 hover:text-blue-600'
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{currentId === doc.id ? 'Aktif' : 'Edit'}</span>
                    </button>
                    <button
                      onClick={() => {
                        const newDoc = { ...doc, id: Date.now().toString(), date: new Date().toISOString() };
                        setSavedDocs(prev => [newDoc, ...prev]);
                        loadDoc(newDoc);
                      }}
                      className="flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Clone</span>
                    </button>
                    <button
                      onClick={(e) => deleteDoc(doc.id, e)}
                      className="flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors shrink-0"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden print area */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:text-black print:p-8 print:w-full print:h-screen print:z-50 bg-white text-black p-8">
        <PrintableContent formData={formData} formattedDate={formattedDate} />
      </div>
    </div>
  );
};

const PrintableContent = ({ formData, formattedDate }: { formData: any, formattedDate: string }) => {
  return (
    <div className="font-serif text-[12pt] leading-relaxed max-w-4xl mx-auto text-black">
      {/* Header */}
      <div className="border border-black flex mb-8 h-24">
        {/* Logo 1 */}
        <div className="w-[20%] border-r border-black flex items-center justify-center p-2">
          {formData.logo1 ? (
            <img src={formData.logo1} alt="Logo Kiri" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-emerald-600 flex items-center justify-center text-emerald-700 font-bold text-[10px] text-center leading-tight">
              LOGO
            </div>
          )}
        </div>
        
        {/* Text Center */}
        <div className="w-[60%] flex flex-col justify-between items-center text-center">
          <div className="h-1/2 w-full border-b border-black flex items-center justify-center uppercase font-bold text-lg tracking-wider">
            {formData.headerTitle}
          </div>
          <div className="h-1/2 w-full flex flex-col items-center justify-center">
            <div className="uppercase font-bold text-base tracking-wider leading-none">{formData.headerSubtitle}</div>
            <div className="text-[10px] mt-1">{formData.headerDocNo}</div>
          </div>
        </div>

        {/* Logo 2 */}
        <div className="w-[20%] border-l border-black flex items-center justify-center p-2">
          {formData.logo2 ? (
            <img src={formData.logo2} alt="Logo Kanan" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex text-3xl font-black italic tracking-tighter">
                <span className="text-slate-400">K</span>
                <span className="text-rose-600">D</span>
                <span className="text-slate-400">K</span>
              </div>
              <div className="text-[7px] text-center mt-1 leading-tight text-slate-600">Koperasi Karyawan<br/>Dwi Karya</div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center font-bold underline mb-8 text-lg">
        SURAT REKOMENDASI
      </div>

      <div className="mb-6">
        <p className="mb-2">Yang bertandatangan dibawah ini :</p>
        <table className="w-full ml-4">
          <tbody>
            <tr>
              <td className="w-32 py-1">Nama</td>
              <td className="w-4 py-1">:</td>
              <td className="py-1">{formData.recommenderName || <span className="text-gray-300">....................................................................</span>}</td>
            </tr>
            <tr>
              <td className="py-1">Bagian</td>
              <td className="py-1">:</td>
              <td className="py-1">{formData.recommenderDept || <span className="text-gray-300">....................................................................</span>}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-6">
        <p className="mb-2">Dengan ini merekomendasikan kepada :</p>
        <table className="w-full ml-4">
          <tbody>
            <tr>
              <td className="w-32 py-1">Nama</td>
              <td className="w-4 py-1">:</td>
              <td className="py-1">{formData.recommendeeName || <span className="text-gray-300">....................................................................</span>}</td>
            </tr>
            <tr>
              <td className="py-1">Bagian</td>
              <td className="py-1">:</td>
              <td className="py-1">{formData.recommendeeDept || <span className="text-gray-300">....................................................................</span>}</td>
            </tr>
            <tr>
              <td className="py-1">Jabatan</td>
              <td className="py-1">:</td>
              <td className="py-1">{formData.recommendeePosition || <span className="text-gray-300">....................................................................</span>}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-6 text-justify">
        <p>
          {formData.reason ? formData.reason : <span className="text-gray-300">..........................................................................................................................................................................................................................................................................................................................................................................................</span>}
        </p>
      </div>

      <div className="mb-12 text-justify">
        <p>
          Demikian surat ini saya buat agar dapat digunakan sebagai lampiran pendukung pengajuan piranti unit operasional KDK.
        </p>
      </div>

      <div className="mb-4">
        {formData.location || <span className="text-gray-300">....................</span>} {formattedDate}
      </div>

      <table className="w-full text-center text-sm">
        <tbody>
          <tr>
            <td className="py-2 w-1/3">Direkomendasikan</td>
            <td className="py-2 w-1/3 text-white">.</td>
            <td className="py-2 w-1/3 text-white">.</td>
          </tr>
          <tr>
            <td className="h-28 align-bottom pb-2">
              <span className="font-bold underline">{formData.recommenderName || <span className="text-gray-300">....................</span>}</span>
            </td>
            <td className="h-28 align-bottom pb-2"></td>
            <td className="h-28 align-bottom pb-2"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default BeritaAcara;
