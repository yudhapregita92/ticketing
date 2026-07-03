import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { IMembership } from '../types';
import { 
  Plus, Search, Edit2, Trash2, Printer, 
  X, Image as ImageIcon, CreditCard, UploadCloud,
  Sparkles, ChevronDown, ChevronUp, RefreshCw, Copy, Check, Barcode as BarcodeIcon,
  ZoomIn, ZoomOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';

interface MembershipManagementProps {
  isDark: boolean;
  themeClasses: any;
  primaryColor: string;
}

export const MembershipManagement: React.FC<MembershipManagementProps> = ({ 
  isDark, 
  themeClasses,
  primaryColor 
}) => {
  const [memberships, setMemberships] = useState<IMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Partial<IMembership>>({
    kode_lokal: '',
    indek_kdk: '',
    indek_ggf: '',
    nama: '',
    bagian: '',
    barcode: '',
    foto: ''
  });

  const [printMember, setPrintMember] = useState<IMembership | null>(null);
  const [templateBg, setTemplateBg] = useState<string>("url('/template-id-card.png')");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultLayout = {
    barcodeX: 4, barcodeY: 23, barcodeScale: 1.1,
    photoX: 59.6, photoY: 15, photoW: 20, photoH: 25,
    photoScale: 1, photoOffsetX: 50, photoOffsetY: 50,
    infoX: 27.1, infoY: 36, infoW: 55,
    fontName: 3.2, fontIndex: 2.5, fontDept: 2,
    localX: 27.1, localY: 41.5, localScale: 2.5,
    deptX: 27.1, deptY: 47, deptScale: 2,
    useIndividualLayout: true
  };
  const [layout, setLayout] = useState(defaultLayout);

  // States and Helpers for EAN-8 Barcode Generation
  const [showGeneratorPanel, setShowGeneratorPanel] = useState(false);
  const [simLocalCode, setSimLocalCode] = useState('');
  const [simRandomDigits, setSimRandomDigits] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const calculateEan8Checksum = (digits7: string): number => {
    if (digits7.length !== 7) return 0;
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const digit = parseInt(digits7[i], 10);
      if (isNaN(digit)) return 0;
      const weight = (i % 2 === 0) ? 3 : 1;
      sum += digit * weight;
    }
    return (10 - (sum % 10)) % 10;
  };

  const generateEan8FromLocal = (localCode: string, existingRandom?: string) => {
    const cleanLocal = localCode.replace(/\D/g, '');
    const prefix = '8';
    
    let localPart = cleanLocal;
    if (localPart.length > 5) {
      localPart = localPart.substring(0, 5);
    }
    
    const neededRandom = Math.max(0, 7 - (1 + localPart.length));
    
    let randomPart = '';
    if (existingRandom && existingRandom.length === neededRandom) {
      randomPart = existingRandom;
    } else {
      for (let i = 0; i < neededRandom; i++) {
        randomPart += Math.floor(Math.random() * 10).toString();
      }
    }
    
    const digits7 = prefix + localPart + randomPart;
    const checksum = calculateEan8Checksum(digits7);
    const fullCode = digits7 + checksum.toString();
    
    return {
      prefix,
      localPart,
      randomPart,
      checksum: checksum.toString(),
      fullCode,
      isValid: cleanLocal.length > 0 && fullCode.length === 8,
      neededRandom
    };
  };

  const { 
    prefix: simPrefix, 
    localPart: simLocalPart, 
    randomPart: simRandomPart, 
    checksum: simChecksum, 
    fullCode: fullSimCode, 
    isValid: isSimValid,
    neededRandom: simNeededRandom
  } = generateEan8FromLocal(simLocalCode, simRandomDigits);

  useEffect(() => {
    if (simRandomDigits.length !== simNeededRandom) {
      let r = '';
      for (let i = 0; i < simNeededRandom; i++) {
        r += Math.floor(Math.random() * 10).toString();
      }
      setSimRandomDigits(r);
    }
  }, [simLocalCode, simRandomDigits.length, simNeededRandom]);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const data = await api.getMemberships();
      setMemberships(data);
    } catch (err: any) {
      toast.error('Gagal mengambil data memberships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
    api.getSettings().then(settings => {
      if (settings.member_card_template) {
        setTemplateBg(`url('${settings.member_card_template}')`);
      }
      if (settings.card_layout) {
        try {
          setLayout(JSON.parse(settings.card_layout));
        } catch(e) {}
      }
    }).catch(console.error);
  }, []);

  const handleSaveLayout = async (newLayout: any) => {
    try {
      await api.updateSettings({ card_layout: JSON.stringify(newLayout) });
      setLayout(newLayout);
      toast.success('Layout disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan layout');
    }
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Str = event.target?.result as string;
      try {
        await api.updateSettings({ member_card_template: base64Str });
        setTemplateBg(`url('${base64Str}')`);
        toast.success('Template berhasil diupload!');
      } catch (err) {
        toast.error('Gagal menyimpan template');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenForm = (member?: IMembership, prefill?: Partial<IMembership>) => {
    if (member) {
      setFormData(member);
      setEditingId(member.id);
    } else {
      setFormData({
        kode_lokal: prefill?.kode_lokal || '',
        indek_kdk: '',
        indek_ggf: '',
        nama: '',
        bagian: '',
        barcode: prefill?.barcode || '',
        foto: ''
      });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Hapus member ini?')) {
      try {
        await api.deleteMembership(id);
        toast.success('Berhasil dihapus');
        fetchMemberships();
      } catch (err) {
        toast.error('Gagal menghapus');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) {
      toast.error('Nama wajib diisi');
      return;
    }
    try {
      if (editingId) {
        await api.updateMembership(editingId, formData);
        toast.success('Berhasil diupdate');
      } else {
        await api.addMembership(formData);
        toast.success('Berhasil ditambahkan');
      }
      setShowForm(false);
      fetchMemberships();
    } catch (err) {
      toast.error('Gagal menyimpan');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, foto: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const filteredMemberships = memberships.filter(m => 
    m.nama.toLowerCase().includes(search.toLowerCase()) ||
    (m.barcode && m.barcode.toLowerCase().includes(search.toLowerCase())) ||
    (m.bagian && m.bagian.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={`space-y-4 ${themeClasses.text}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            Manajemen Membership
          </h2>
          <p className={`text-sm ${themeClasses.textMuted}`}>Kelola anggota dan cetak kartu.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleTemplateUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`px-4 py-2 ${themeClasses.bgSecondary} hover:bg-slate-200 dark:hover:bg-slate-700 ${themeClasses.text} rounded-lg font-medium transition-colors flex items-center gap-2 border ${themeClasses.border}`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload Template
          </button>
          
          <button 
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Member
          </button>
        </div>
      </div>

      {/* TOOL GENERATOR BARCODE EAN-8 */}
      <div className={`p-4 rounded-xl ${themeClasses.card} ${themeClasses.border} border shadow-sm`}>
        <button
          onClick={() => setShowGeneratorPanel(!showGeneratorPanel)}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                Generator Barcode EAN-8 Otomatis
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/15 text-emerald-600 rounded-full font-black uppercase">Baru</span>
              </h3>
              <p className={`text-xs ${themeClasses.textMuted} mt-0.5`}>
                Buat barcode EAN-8 (8 digit) dari Kode Lokal dengan prefix '8' dan digit acak di akhir secara instan.
              </p>
            </div>
          </div>
          <div>
            {showGeneratorPanel ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {showGeneratorPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`pt-4 mt-4 border-t ${themeClasses.border} grid grid-cols-1 md:grid-cols-2 gap-6`}>
                {/* Input & Step Breakdown */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">Masukkan Kode Lokal (Angka saja)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={simLocalCode}
                        onChange={e => setSimLocalCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Contoh: 12345"
                        className={`flex-1 px-3 py-2 rounded-lg text-sm border ${themeClasses.input}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          let r = '';
                          for (let i = 0; i < simNeededRandom; i++) {
                            r += Math.floor(Math.random() * 10).toString();
                          }
                          setSimRandomDigits(r);
                          toast.success('Digit acak diperbarui!');
                        }}
                        disabled={!simLocalCode}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Acak Ulang
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Maksimal 5 digit. Jika lebih, akan diambil 5 digit pertama agar tersisa minimal 1 digit acak di akhir.
                    </p>
                  </div>

                  {simLocalCode ? (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-400 block">Visualisasi Struktur EAN-8:</span>
                      
                      {/* Visual blocks */}
                      <div className="flex items-stretch rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm text-center">
                        {/* Prefix */}
                        <div className="flex-1 bg-indigo-500/10 border-r border-slate-200 dark:border-slate-700 p-2 flex flex-col justify-between">
                          <span className="text-[9px] font-black text-indigo-500 uppercase">Prefix</span>
                          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{simPrefix}</span>
                          <span className="text-[8px] text-slate-400">1 digit</span>
                        </div>

                        {/* Local Code */}
                        <div className="flex-[2] bg-emerald-500/10 border-r border-slate-200 dark:border-slate-700 p-2 flex flex-col justify-between">
                          <span className="text-[9px] font-black text-emerald-500 uppercase">Kode Lokal</span>
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-wider">{simLocalPart}</span>
                          <span className="text-[8px] text-slate-400">{simLocalPart.length} digit</span>
                        </div>

                        {/* Random digits */}
                        <div className="flex-[1.5] bg-amber-500/10 border-r border-slate-200 dark:border-slate-700 p-2 flex flex-col justify-between">
                          <span className="text-[9px] font-black text-amber-500 uppercase">Acak (Random)</span>
                          <span className="text-lg font-black text-amber-600 dark:text-amber-400 tracking-wider">{simRandomPart || '-'}</span>
                          <span className="text-[8px] text-slate-400">{simRandomPart.length} digit</span>
                        </div>

                        {/* Checksum */}
                        <div className="flex-1 bg-purple-500/10 p-2 flex flex-col justify-between">
                          <span className="text-[9px] font-black text-purple-500 uppercase">Check Digit</span>
                          <span className="text-lg font-black text-purple-600 dark:text-purple-400">{simChecksum}</span>
                          <span className="text-[8px] text-slate-400">1 digit</span>
                        </div>
                      </div>

                      {/* Math Breakdown */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                        <div className="font-bold text-slate-600 dark:text-slate-300">Bagaimana check digit '{simChecksum}' dihitung?</div>
                        <div className="text-slate-400 text-[10px] leading-relaxed">
                          EAN-8 Checksum dihitung dengan memberi bobot bergantian <span className="font-semibold text-slate-600 dark:text-slate-300">3</span> dan <span className="font-semibold text-slate-600 dark:text-slate-300">1</span> pada 7 digit pertama dari kiri ke kanan:
                          <br />
                          <span className="font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-150 inline-block mt-1">
                            {(() => {
                              const digits = (simPrefix + simLocalPart + simRandomPart).split('');
                              return digits.map((d, i) => `(${d}×${i % 2 === 0 ? 3 : 1})`).join('+');
                            })()} = {(() => {
                              const digits = (simPrefix + simLocalPart + simRandomPart).split('');
                              let sum = 0;
                              const parts = digits.map((d, i) => {
                                const val = parseInt(d, 10) * (i % 2 === 0 ? 3 : 1);
                                sum += val;
                                return val;
                              });
                              return sum;
                            })()}
                          </span>
                          <br />
                          Selisih jumlah total ({(() => {
                            const digits = (simPrefix + simLocalPart + simRandomPart).split('');
                            let sum = 0;
                            digits.forEach((d, i) => {
                              sum += parseInt(d, 10) * (i % 2 === 0 ? 3 : 1);
                            });
                            return sum;
                          })()}) ke kelipatan 10 terdekat berikutnya ({(() => {
                            const digits = (simPrefix + simLocalPart + simRandomPart).split('');
                            let sum = 0;
                            digits.forEach((d, i) => {
                              sum += parseInt(d, 10) * (i % 2 === 0 ? 3 : 1);
                            });
                            return Math.ceil(sum / 10) * 10;
                          })()}) adalah <span className="font-bold text-purple-500">{simChecksum}</span>.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-400 p-4">
                      <Sparkles className="w-5 h-5 text-indigo-400 mb-1.5 animate-pulse" />
                      Ketik Kode Lokal di atas untuk melihat visualisasi pembentukan kode EAN-8 live!
                    </div>
                  )}
                </div>

                {/* Barcode Preview & Action Card */}
                <div className="flex flex-col justify-between border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-inner min-h-[220px]">
                  <div className="flex flex-col items-center justify-center flex-1 py-4">
                    {isSimValid ? (
                      <div className="flex flex-col items-center bg-white p-4 rounded-xl border border-slate-100">
                        <Barcode 
                          value={fullSimCode}
                          width={1.6}
                          height={50}
                          fontSize={11}
                          background="transparent"
                          format="EAN8"
                          lineColor="#1e3a8a"
                        />
                        <div className="mt-2 text-[10px] text-slate-500 font-bold bg-slate-50 px-2.5 py-0.5 rounded-full border flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          Barcode EAN-8 Valid
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 py-6">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 border">
                          <BarcodeIcon className="w-6 h-6 opacity-30 text-slate-500" />
                        </div>
                        <p className="text-xs">Silakan masukkan kode lokal numerik untuk merender barcode.</p>
                      </div>
                    )}
                  </div>

                  {isSimValid && (
                    <div className={`mt-4 pt-4 border-t ${themeClasses.border} flex flex-wrap gap-2 justify-center`}>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(fullSimCode);
                          setIsCopied(true);
                          toast.success('Barcode disalin ke clipboard!');
                          setTimeout(() => setIsCopied(false), 2000);
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            Tersalin
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Salin Kode
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenForm(undefined, { kode_lokal: simLocalCode, barcode: fullSimCode })}
                        className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Buat Member Baru
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`p-4 rounded-xl ${themeClasses.card} ${themeClasses.border} border shadow-sm`}>
        <div className="flex justify-end mb-4">
          <div className="relative w-full sm:w-64">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.textMuted}`} />
            <input 
              type="text" 
              placeholder="Cari nama / bagian / barcode..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm transition-colors border ${themeClasses.input}`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`border-b ${themeClasses.border}`}>
              <tr>
                <th className={`pb-3 font-semibold ${themeClasses.textMuted}`}>Foto</th>
                <th className={`pb-3 font-semibold ${themeClasses.textMuted}`}>Nama</th>
                <th className={`pb-3 font-semibold ${themeClasses.textMuted}`}>Kode/Indek</th>
                <th className={`pb-3 font-semibold ${themeClasses.textMuted}`}>Bagian</th>
                <th className={`pb-3 font-semibold ${themeClasses.textMuted}`}>Barcode</th>
                <th className={`pb-3 font-semibold ${themeClasses.textMuted} text-right`}>Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${themeClasses.border}`}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center">Loading...</td>
                </tr>
              ) : filteredMemberships.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`py-8 text-center ${themeClasses.textMuted}`}>
                    Data tidak ditemukan
                  </td>
                </tr>
              ) : filteredMemberships.map(member => (
                <tr key={member.id} className={`hover:${themeClasses.bgSecondary} transition-colors`}>
                  <td className="py-3">
                    {member.foto ? (
                      <img src={member.foto} alt={member.nama} className="w-10 h-10 rounded-full object-cover border" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${themeClasses.bgSecondary}`}>
                        <ImageIcon className={`w-5 h-5 ${themeClasses.textMuted}`} />
                      </div>
                    )}
                  </td>
                  <td className="py-3 font-medium">{member.nama}</td>
                  <td className="py-3">
                    <div className="text-xs">Lokal: {member.kode_lokal || '-'}</div>
                    <div className="text-xs">KDK: {member.indek_kdk || '-'}</div>
                    <div className="text-xs">GGF: {member.indek_ggf || '-'}</div>
                  </td>
                  <td className="py-3">{member.bagian || '-'}</td>
                  <td className="py-3 font-mono text-xs">{member.barcode || '-'}</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setPrintMember(member)}
                        title="Cetak Kartu"
                        className="p-1.5 bg-blue-500/10 text-blue-600 rounded hover:bg-blue-500/20 transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenForm(member)}
                        className="p-1.5 bg-amber-500/10 text-amber-600 rounded hover:bg-amber-500/20 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(member.id)}
                        className="p-1.5 bg-rose-500/10 text-rose-600 rounded hover:bg-rose-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-lg ${themeClasses.card} rounded-xl shadow-xl overflow-hidden`}
            >
              <div className={`p-4 border-b ${themeClasses.border} flex items-center justify-between`}>
                <h3 className="font-bold">{editingId ? 'Edit Member' : 'Tambah Member'}</h3>
                <button 
                  onClick={() => setShowForm(false)}
                  className={`p-1 rounded-full hover:${themeClasses.bgSecondary} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nama Lengkap *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${themeClasses.input}`}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Kode Lokal</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan angka..."
                      value={formData.kode_lokal || ''}
                      onChange={e => setFormData({ ...formData, kode_lokal: e.target.value.replace(/\D/g, '') })}
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${themeClasses.input}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Indek KDK</label>
                    <input 
                      type="text" 
                      value={formData.indek_kdk || ''}
                      onChange={e => setFormData({ ...formData, indek_kdk: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${themeClasses.input}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Indek GGF</label>
                    <input 
                      type="text" 
                      value={formData.indek_ggf || ''}
                      onChange={e => setFormData({ ...formData, indek_ggf: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${themeClasses.input}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 flex items-center justify-between">
                      <span>Barcode (No)</span>
                      {formData.kode_lokal && (
                        <button
                          type="button"
                          onClick={() => {
                            const res = generateEan8FromLocal(formData.kode_lokal || '');
                            if (res.isValid) {
                              setFormData(prev => ({ ...prev, barcode: res.fullCode }));
                              toast.success('Barcode EAN-8 berhasil di-generate!');
                            } else {
                              toast.error('Kode lokal harus mengandung angka!');
                            }
                          }}
                          className="text-[10px] text-indigo-500 hover:text-indigo-600 font-bold flex items-center gap-0.5"
                        >
                          <Sparkles className="w-3 h-3" />
                          Auto EAN-8
                        </button>
                      )}
                    </label>
                    <input 
                      type="text" 
                      placeholder="EAN-8 atau no barcode..."
                      value={formData.barcode || ''}
                      onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${themeClasses.input}`}
                    />
                  </div>
                </div>

                {/* Live barcode preview if it's a valid 8-digit code */}
                {formData.barcode && formData.barcode.length === 8 && /^\d+$/.test(formData.barcode) && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center">
                    <div className="bg-white p-3 rounded-lg border">
                      <Barcode 
                        value={formData.barcode}
                        width={1.4}
                        height={35}
                        fontSize={10}
                        background="transparent"
                        format="EAN8"
                        lineColor="#1e3a8a"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium mt-1.5">Live Preview Barcode EAN-8</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-1">Bagian (Department)</label>
                  <input 
                    type="text" 
                    value={formData.bagian || ''}
                    onChange={e => setFormData({ ...formData, bagian: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${themeClasses.input}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Foto</label>
                  <div className="flex items-center gap-4">
                    {formData.foto && (
                      <img src={formData.foto} alt="Preview" className="w-16 h-16 object-cover rounded-md border" />
                    )}
                    <label className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm cursor-pointer transition-colors border border-indigo-200">
                      Pilih Foto
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PRINT CARD */}
      <AnimatePresence>
        {printMember && (
          <PrintCardModal 
            member={printMember} 
            onClose={() => setPrintMember(null)}
            isDark={isDark}
            themeClasses={themeClasses}
            templateBg={templateBg}
            layout={layout}
            onSaveLayout={handleSaveLayout}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const PrintCardModal = ({ member, onClose, isDark, themeClasses, templateBg, layout, onSaveLayout }: { member: IMembership, onClose: () => void, isDark: boolean, themeClasses: any, templateBg: string, layout: any, onSaveLayout: (l: any) => void }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [localLayout, setLocalLayout] = useState(layout);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fallbacks and safe merging for newly added layout fields
  const localLayoutMerged = {
    barcodeX: localLayout.barcodeX ?? 4,
    barcodeY: localLayout.barcodeY ?? 23,
    barcodeScale: localLayout.barcodeScale ?? 1.1,
    photoX: localLayout.photoX ?? 59.6,
    photoY: localLayout.photoY ?? 15,
    photoW: localLayout.photoW ?? 20,
    photoH: localLayout.photoH ?? 25,
    photoScale: localLayout.photoScale ?? 1,
    photoOffsetX: localLayout.photoOffsetX ?? 50,
    photoOffsetY: localLayout.photoOffsetY ?? 50,
    infoX: localLayout.infoX ?? 27.1,
    infoY: localLayout.infoY ?? 36,
    infoW: localLayout.infoW ?? 55,
    fontName: localLayout.fontName ?? 3.2,
    fontIndex: localLayout.fontIndex ?? 2.5,
    fontDept: localLayout.fontDept ?? 2,

    // Coordinates and zoom values for Kode Lokal and Bagian
    localX: localLayout.localX ?? 27.1,
    localY: localLayout.localY ?? 41.5,
    localScale: localLayout.localScale ?? 2.5,
    deptX: localLayout.deptX ?? 27.1,
    deptY: localLayout.deptY ?? 47,
    deptScale: localLayout.deptScale ?? 2,
    useIndividualLayout: localLayout.useIndividualLayout ?? true
  };

  const handlePrint = () => {
    if (printRef.current) {
      const content = printRef.current.innerHTML;
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Member Card</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
                body {
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  background-color: #fff;
                  font-family: 'Inter', sans-serif;
                }
                .card {
                  width: 85.6mm;
                  height: 53.98mm;
                  background-color: white;
                  border-radius: 3mm;
                  box-sizing: border-box;
                  position: relative;
                  overflow: hidden;
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                  border: 1px solid #e2e8f0;
                }
                .print-only {
                  border: none !important;
                  box-shadow: none !important;
                }
                @media print {
                  @page { size: 85.6mm 53.98mm; margin: 0; }
                  body { padding: 0; margin: 0; }
                  .card { border: none; border-radius: 3mm; }
                }
                /* Top Banner & Logo */
                .logo-container {
                  position: absolute;
                  top: 3mm;
                  left: 4mm;
                }
                .logo-kdk {
                  font-size: 6mm;
                  font-weight: 900;
                  letter-spacing: 0.5px;
                  line-height: 1;
                }
                .logo-kdk span:nth-child(1) { color: #6b7280; } /* K */
                .logo-kdk span:nth-child(2) { color: #6b7280; } /* D */
                .logo-kdk span:nth-child(3) { color: #ea580c; } /* K */
                .logo-sub {
                  font-size: 1.5mm;
                  color: #9ca3af;
                  margin-top: 0.5mm;
                  font-weight: 600;
                }
                /* Top Right Shapes */
                .shape-orange {
                  position: absolute;
                  top: 0;
                  right: 15mm;
                  width: 30mm;
                  height: 10mm;
                  background-color: #f59e0b;
                  transform: skewX(-45deg);
                  transform-origin: top;
                }
                .shape-blue {
                  position: absolute;
                  top: 0;
                  right: -5mm;
                  width: 25mm;
                  height: 12mm;
                  background-color: #1e293b;
                  transform: skewX(-45deg);
                  transform-origin: top;
                }
                .badge-48 {
                  position: absolute;
                  top: 2mm;
                  right: 3mm;
                  background-color: white;
                  border-radius: 2mm;
                  padding: 0.5mm 2.5mm;
                  font-size: 4.5mm;
                  font-weight: 900;
                  color: #10b981;
                  display: flex;
                  align-items: flex-start;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                  z-index: 2;
                }
                .badge-48 span {
                  font-size: 2mm;
                  color: #6b7280;
                  margin-top: 0.5mm;
                  margin-left: 0.5mm;
                }
                /* Titles */
                .title-container {
                  position: absolute;
                  top: 13mm;
                  left: 4mm;
                }
                .title-main {
                  font-size: 5mm;
                  font-weight: 900;
                  color: #314470;
                  margin: 0;
                  line-height: 1.1;
                  letter-spacing: 0.5px;
                }
                .title-sub {
                  font-size: 3.5mm;
                  font-weight: 600;
                  color: #4b5563;
                  margin: 0;
                }
                /* Barcode */
                .barcode-wrapper {
                  position: absolute;
                  top: ${localLayoutMerged.barcodeY}mm;
                  left: ${localLayoutMerged.barcodeX}mm;
                }
                /* Photo */
                .photo-wrapper {
                  position: absolute;
                  top: ${localLayoutMerged.photoY}mm;
                  left: ${localLayoutMerged.photoX}mm;
                  width: ${localLayoutMerged.photoW}mm;
                  height: ${localLayoutMerged.photoH}mm;
                  border-radius: 2mm;
                  overflow: hidden;
                  border: 1.5px solid #314470;
                  background-color: #f3f4f6;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .photo-wrapper img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  transform: scale(${localLayoutMerged.photoScale || 1}) translate(${(localLayoutMerged.photoOffsetX || 50) - 50}%, ${(localLayoutMerged.photoOffsetY || 50) - 50}%);
                }
                /* User Info (Right Aligned under photo) */
                .info-block {
                  position: absolute;
                  top: ${localLayoutMerged.infoY}mm;
                  left: ${localLayoutMerged.infoX}mm;
                  width: ${localLayoutMerged.infoW}mm;
                  text-align: center;
                }
                .info-name {
                  font-size: ${localLayoutMerged.fontName || 3.2}mm;
                  font-weight: 800;
                  color: #1e3a8a;
                  margin: 0;
                  text-transform: uppercase;
                }
                .info-index {
                  position: ${localLayoutMerged.useIndividualLayout ? 'absolute' : 'static'};
                  top: ${localLayoutMerged.useIndividualLayout ? `${localLayoutMerged.localY}mm` : 'auto'};
                  left: ${localLayoutMerged.useIndividualLayout ? `${localLayoutMerged.localX}mm` : 'auto'};
                  width: ${localLayoutMerged.useIndividualLayout ? `${localLayoutMerged.infoW}mm` : 'auto'};
                  font-size: ${localLayoutMerged.useIndividualLayout ? `${localLayoutMerged.localScale}mm` : `${localLayoutMerged.fontIndex}mm`};
                  font-weight: 700;
                  color: #4b5563;
                  margin: ${localLayoutMerged.useIndividualLayout ? '0' : '0.5mm 0'};
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  gap: 1mm;
                  text-align: center;
                }
                .info-index p {
                  margin: 0;
                  font-size: inherit;
                  font-weight: inherit;
                  color: inherit;
                }
                .info-index .dot {
                  width: 1.5mm;
                  height: 1.5mm;
                  background-color: #3b82f6;
                  border-radius: 50%;
                }
                .info-dept {
                  position: ${localLayoutMerged.useIndividualLayout ? 'absolute' : 'static'};
                  top: ${localLayoutMerged.useIndividualLayout ? `${localLayoutMerged.deptY}mm` : 'auto'};
                  left: ${localLayoutMerged.useIndividualLayout ? `${localLayoutMerged.deptX}mm` : 'auto'};
                  width: ${localLayoutMerged.useIndividualLayout ? `${localLayoutMerged.infoW}mm` : 'auto'};
                  font-size: ${localLayoutMerged.useIndividualLayout ? `${localLayoutMerged.deptScale}mm` : `${localLayoutMerged.fontDept}mm`};
                  font-weight: 700;
                  color: #6b7280;
                  margin: 0;
                  text-transform: uppercase;
                  text-align: center;
                }
                .info-dept p {
                  margin: 0;
                  font-size: inherit;
                  font-weight: inherit;
                  color: inherit;
                }
              </style>
            </head>
            <body>
              <div class="card print-only" style="background-image: ${templateBg}; background-size: cover; background-position: center; background-repeat: no-repeat;">
                ${content}
              </div>
              <script>
                window.onload = function() {
                  window.setTimeout(function() {
                    window.print();
                    window.close();
                  }, 500); // Wait for background image to load
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative ${themeClasses.card} rounded-xl shadow-xl overflow-hidden flex flex-col w-full max-w-4xl`}
      >
        <div className={`p-4 border-b ${themeClasses.border} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <h3 className="font-bold">Cetak Kartu Member</h3>
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                isEditMode ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : `${themeClasses.bgSecondary} border-transparent`
              }`}
            >
              {isEditMode ? 'Tutup Edit Layout' : 'Edit Layout'}
            </button>
          </div>
          <button 
            onClick={onClose}
            className={`p-1 rounded-full hover:${themeClasses.bgSecondary} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          <div className="p-8 flex justify-center bg-gray-100 overflow-auto flex-1">
            {/* Virtual Card View matching print dimensions roughly */}
            <div 
              ref={printRef}
              className="bg-white rounded-lg shadow-lg relative overflow-hidden" 
              style={{ 
                width: '85.6mm', 
                height: '53.98mm',
                backgroundImage: templateBg,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Barcode */}
              <div className="barcode-wrapper" style={{ position: 'absolute', top: `${localLayoutMerged.barcodeY}mm`, left: `${localLayoutMerged.barcodeX}mm` }}>
                {member.barcode ? (
                  <Barcode 
                    value={member.barcode} 
                    width={localLayoutMerged.barcodeScale} 
                    height={28} 
                    fontSize={10} 
                    margin={0}
                    background="transparent"
                    displayValue={true}
                    textMargin={2}
                    lineColor="#1e3a8a"
                  />
                ) : (
                  <div style={{ width: '35mm', height: '12mm', backgroundColor: 'rgba(243, 244, 246, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5mm', color: '#6b7280' }}>No Barcode</div>
                )}
              </div>

              {/* Photo */}
              <div className="photo-wrapper" style={{ position: 'absolute', top: `${localLayoutMerged.photoY}mm`, left: `${localLayoutMerged.photoX}mm`, width: `${localLayoutMerged.photoW}mm`, height: `${localLayoutMerged.photoH}mm`, borderRadius: '2mm', overflow: 'hidden', border: '1.5px solid #314470', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                {member.foto ? (
                  <img 
                    src={member.foto} 
                    alt="Member" 
                    style={{ 
                      width: '100%', height: '100%', objectFit: 'cover',
                      transform: `scale(${localLayoutMerged.photoScale || 1}) translate(${(localLayoutMerged.photoOffsetX || 50) - 50}%, ${(localLayoutMerged.photoOffsetY || 50) - 50}%)`
                    }} 
                  />
                ) : (
                  <ImageIcon style={{ width: '8mm', height: '8mm', color: '#9ca3af' }} />
                )}
              </div>

              {/* User Info */}
              {localLayoutMerged.useIndividualLayout ? (
                <>
                  {/* Name (Nama) */}
                  <div className="info-block" style={{ position: 'absolute', top: `${localLayoutMerged.infoY}mm`, left: `${localLayoutMerged.infoX}mm`, width: `${localLayoutMerged.infoW}mm`, textAlign: 'center' }}>
                    <p className="info-name" style={{ fontSize: `${localLayoutMerged.fontName || 3.2}mm`, fontWeight: 800, color: '#1e3a8a', margin: 0, textTransform: 'uppercase' }}>{member.nama}</p>
                  </div>
                  
                  {/* Kode Lokal */}
                  <div className="info-index" style={{ position: 'absolute', top: `${localLayoutMerged.localY}mm`, left: `${localLayoutMerged.localX}mm`, width: `${localLayoutMerged.infoW}mm`, display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 0 }}>
                    <p style={{ fontSize: `${localLayoutMerged.localScale}mm`, fontWeight: 700, color: '#4b5563', margin: 0, textTransform: 'uppercase', textAlign: 'center', width: '100%' }}>
                      {member.indek_kdk || member.indek_ggf || member.kode_lokal || '-'}
                    </p>
                  </div>

                  {/* Bagian (Dept) */}
                  <div className="info-dept" style={{ position: 'absolute', top: `${localLayoutMerged.deptY}mm`, left: `${localLayoutMerged.deptX}mm`, width: `${localLayoutMerged.infoW}mm`, display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 0 }}>
                    <p style={{ fontSize: `${localLayoutMerged.deptScale}mm`, fontWeight: 700, color: '#6b7280', margin: 0, textTransform: 'uppercase', textAlign: 'center', width: '100%' }}>
                      {member.bagian}
                    </p>
                  </div>
                </>
              ) : (
                <div className="info-block" style={{ position: 'absolute', top: `${localLayoutMerged.infoY}mm`, left: `${localLayoutMerged.infoX}mm`, width: `${localLayoutMerged.infoW}mm`, textAlign: 'center' }}>
                  <p className="info-name" style={{ fontSize: `${localLayoutMerged.fontName || 3.2}mm`, fontWeight: 800, color: '#1e3a8a', margin: 0, textTransform: 'uppercase' }}>{member.nama}</p>
                  <p className="info-index" style={{ fontSize: `${localLayoutMerged.fontIndex || 2.5}mm`, fontWeight: 700, color: '#4b5563', margin: '0.5mm 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1mm' }}>
                    {member.indek_kdk || member.indek_ggf || member.kode_lokal || '-'}
                  </p>
                  <p className="info-dept" style={{ fontSize: `${localLayoutMerged.fontDept || 2}mm`, fontWeight: 700, color: '#6b7280', margin: 0, textTransform: 'uppercase' }}>{member.bagian}</p>
                </div>
              )}
            </div>
          </div>

          {isEditMode && (
            <div className={`w-full md:w-80 p-4 border-l ${themeClasses.border} overflow-y-auto max-h-[60vh] space-y-4 bg-slate-50/50 dark:bg-slate-900/30`}>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-xs font-bold uppercase text-slate-400">Pengaturan Posisi</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                  <input 
                    type="checkbox" 
                    checked={localLayoutMerged.useIndividualLayout} 
                    onChange={e => setLocalLayout({...localLayout, useIndividualLayout: e.target.checked})}
                    className="rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  Letak Mandiri
                </label>
              </div>

              {/* BARCODE CONTROLLER WITH ZOOM IN / ZOOM OUT BUTTONS */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b pb-1">
                  <div className="w-1.5 h-3 bg-rose-500 rounded-full" />
                  <span className="font-black text-xs text-rose-500 uppercase tracking-wider">Barcode</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70">Posisi X:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, barcodeX: Math.max(0, Number(((prev.barcodeX ?? 4) - 0.5).toFixed(2)))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        step="0.5" 
                        value={localLayoutMerged.barcodeX} 
                        onChange={e => setLocalLayout({...localLayout, barcodeX: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, barcodeX: Number(((prev.barcodeX ?? 4) + 0.5).toFixed(2))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">mm</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70">Posisi Y:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, barcodeY: Math.max(0, Number(((prev.barcodeY ?? 23) - 0.5).toFixed(2)))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        step="0.5" 
                        value={localLayoutMerged.barcodeY} 
                        onChange={e => setLocalLayout({...localLayout, barcodeY: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, barcodeY: Number(((prev.barcodeY ?? 23) + 0.5).toFixed(2))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">mm</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70 font-semibold text-rose-500">Zoom Lebar:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, barcodeScale: Math.max(0.1, Number(((prev.barcodeScale ?? 1.1) - 0.05).toFixed(2)))}))}
                        className="w-6 h-6 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                        title="Zoom Out Barcode"
                      >
                        <ZoomOut className="w-3 h-3" />
                      </button>
                      <input 
                        type="number" 
                        step="0.05" 
                        value={localLayoutMerged.barcodeScale} 
                        onChange={e => setLocalLayout({...localLayout, barcodeScale: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, barcodeScale: Number(((prev.barcodeScale ?? 1.1) + 0.05).toFixed(2))}))}
                        className="w-6 h-6 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                        title="Zoom In Barcode"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">x</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* KODE LOKAL CONTROLLER WITH ZOOM IN / ZOOM OUT BUTTONS */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b pb-1">
                  <div className="w-1.5 h-3 bg-blue-500 rounded-full" />
                  <span className="font-black text-xs text-blue-500 uppercase tracking-wider">Kode Lokal</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70">Posisi X:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, localX: Math.max(0, Number(((prev.localX ?? 27.1) - 0.5).toFixed(2)))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        step="0.5" 
                        value={localLayoutMerged.localX} 
                        onChange={e => setLocalLayout({...localLayout, localX: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, localX: Number(((prev.localX ?? 27.1) + 0.5).toFixed(2))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">mm</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70">Posisi Y:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, localY: Math.max(0, Number(((prev.localY ?? 41.5) - 0.5).toFixed(2)))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        step="0.5" 
                        value={localLayoutMerged.localY} 
                        onChange={e => setLocalLayout({...localLayout, localY: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, localY: Number(((prev.localY ?? 41.5) + 0.5).toFixed(2))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">mm</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70 font-semibold text-blue-500">Zoom Font:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, localScale: Math.max(0.5, Number(((prev.localScale ?? 2.5) - 0.1).toFixed(2)))}))}
                        className="w-6 h-6 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                        title="Zoom Out Kode Lokal"
                      >
                        <ZoomOut className="w-3 h-3" />
                      </button>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={localLayoutMerged.localScale} 
                        onChange={e => setLocalLayout({...localLayout, localScale: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, localScale: Number(((prev.localScale ?? 2.5) + 0.1).toFixed(2))}))}
                        className="w-6 h-6 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                        title="Zoom In Kode Lokal"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">mm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BAGIAN CONTROLLER WITH ZOOM IN / ZOOM OUT BUTTONS */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b pb-1">
                  <div className="w-1.5 h-3 bg-purple-500 rounded-full" />
                  <span className="font-black text-xs text-purple-500 uppercase tracking-wider">Bagian (Dept)</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70">Posisi X:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, deptX: Math.max(0, Number(((prev.deptX ?? 27.1) - 0.5).toFixed(2)))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        step="0.5" 
                        value={localLayoutMerged.deptX} 
                        onChange={e => setLocalLayout({...localLayout, deptX: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, deptX: Number(((prev.deptX ?? 27.1) + 0.5).toFixed(2))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">mm</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70">Posisi Y:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, deptY: Math.max(0, Number(((prev.deptY ?? 47) - 0.5).toFixed(2)))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        step="0.5" 
                        value={localLayoutMerged.deptY} 
                        onChange={e => setLocalLayout({...localLayout, deptY: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, deptY: Number(((prev.deptY ?? 47) + 0.5).toFixed(2))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">mm</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70 font-semibold text-purple-500">Zoom Font:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, deptScale: Math.max(0.5, Number(((prev.deptScale ?? 2) - 0.1).toFixed(2)))}))}
                        className="w-6 h-6 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 text-purple-600 dark:text-purple-400 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                        title="Zoom Out Bagian"
                      >
                        <ZoomOut className="w-3 h-3" />
                      </button>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={localLayoutMerged.deptScale} 
                        onChange={e => setLocalLayout({...localLayout, deptScale: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, deptScale: Number(((prev.deptScale ?? 2) + 0.1).toFixed(2))}))}
                        className="w-6 h-6 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 text-purple-600 dark:text-purple-400 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                        title="Zoom In Bagian"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">mm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHOTO CONTROLLER (Originally configured) */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b pb-1">
                  <div className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                  <span className="font-black text-xs text-indigo-500 uppercase tracking-wider font-bold">Foto</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block mb-1 opacity-70">X (Kiri)</label>
                    <input type="number" step="0.5" value={localLayoutMerged.photoX} onChange={e => setLocalLayout({...localLayout, photoX: Number(e.target.value)})} className={`w-full px-2 py-1 rounded border ${themeClasses.input}`} />
                  </div>
                  <div>
                    <label className="block mb-1 opacity-70">Y (Atas)</label>
                    <input type="number" step="0.5" value={localLayoutMerged.photoY} onChange={e => setLocalLayout({...localLayout, photoY: Number(e.target.value)})} className={`w-full px-2 py-1 rounded border ${themeClasses.input}`} />
                  </div>
                  <div>
                    <label className="block mb-1 opacity-70">Lebar</label>
                    <input type="number" step="0.5" value={localLayoutMerged.photoW} onChange={e => setLocalLayout({...localLayout, photoW: Number(e.target.value)})} className={`w-full px-2 py-1 rounded border ${themeClasses.input}`} />
                  </div>
                  <div>
                    <label className="block mb-1 opacity-70">Tinggi</label>
                    <input type="number" step="0.5" value={localLayoutMerged.photoH} onChange={e => setLocalLayout({...localLayout, photoH: Number(e.target.value)})} className={`w-full px-2 py-1 rounded border ${themeClasses.input}`} />
                  </div>
                  <div className="col-span-2">
                    <label className="block mb-1 opacity-70">Zoom/Scale Foto</label>
                    <input type="number" step="0.1" value={localLayoutMerged.photoScale} onChange={e => setLocalLayout({...localLayout, photoScale: Number(e.target.value)})} className={`w-full px-2 py-1 rounded border ${themeClasses.input}`} />
                  </div>
                </div>
              </div>

              {/* NAME / CONTAINER WIDTH CONTROLLERS */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b pb-1">
                  <div className="w-1.5 h-3 bg-emerald-500 rounded-full" />
                  <span className="font-black text-xs text-emerald-500 uppercase tracking-wider font-bold">Nama & Wadah</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block mb-1 opacity-70">Nama X</label>
                    <input type="number" step="0.5" value={localLayoutMerged.infoX} onChange={e => setLocalLayout({...localLayout, infoX: Number(e.target.value)})} className={`w-full px-2 py-1 rounded border ${themeClasses.input}`} />
                  </div>
                  <div>
                    <label className="block mb-1 opacity-70">Nama Y</label>
                    <input type="number" step="0.5" value={localLayoutMerged.infoY} onChange={e => setLocalLayout({...localLayout, infoY: Number(e.target.value)})} className={`w-full px-2 py-1 rounded border ${themeClasses.input}`} />
                  </div>
                  <div className="col-span-2">
                    <label className="block mb-1 opacity-70">Lebar Wadah Teks</label>
                    <input type="number" step="0.5" value={localLayoutMerged.infoW} onChange={e => setLocalLayout({...localLayout, infoW: Number(e.target.value)})} className={`w-full px-2 py-1 rounded border ${themeClasses.input}`} />
                  </div>
                  <div className="col-span-2">
                    <label className="block mb-1 opacity-70">Ukuran Font Nama</label>
                    <input type="number" step="0.1" value={localLayoutMerged.fontName} onChange={e => setLocalLayout({...localLayout, fontName: Number(e.target.value)})} className={`w-full px-2 py-1 rounded border ${themeClasses.input}`} />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onSaveLayout(localLayoutMerged)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-md active:scale-[0.98]"
                >
                  Simpan Layout
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`p-4 border-t ${themeClasses.border} flex justify-end gap-2`}>
          <button 
            onClick={onClose}
            className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            Tutup
          </button>
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-md active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            Cetak
          </button>
        </div>
      </motion.div>
    </div>
  );
};
