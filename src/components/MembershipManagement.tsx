import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { IMembership } from '../types';
import { 
  Plus, Search, Edit2, Trash2, Printer, 
  X, Image as ImageIcon, CreditCard, UploadCloud,
  Sparkles, ChevronDown, ChevronUp, RefreshCw, Copy, Check, Barcode as BarcodeIcon,
  ZoomIn, ZoomOut, Download, Upload, History, Camera, Video,
  BookOpen, User, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';
import * as XLSX from 'xlsx';

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
  const [activeTab, setActiveTab] = useState<'members' | 'journals'>('members');
  const [journals, setJournals] = useState<any[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(false);
  const [journalSearch, setJournalSearch] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopyLink = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(key);
    toast.success('Link berhasil disalin!');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const [memberships, setMemberships] = useState<IMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllPassword, setDeleteAllPassword] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [excludeWithPhotoAndSignature, setExcludeWithPhotoAndSignature] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState<{ duplicatesInFile: any[], duplicatesWithDb: any[] } | null>(null);
  
  const [formData, setFormData] = useState<Partial<IMembership> & { keterangan_update?: string }>({
    kode_lokal: '',
    indek_kdk: '',
    indek_ggf: '',
    nama: '',
    bagian: '',
    barcode: '',
    foto: '',
    nik_ktp: '',
    no_hp: '',
    keterangan_update: ''
  });

  const [printMember, setPrintMember] = useState<IMembership | null>(null);
  const [showLogsFor, setShowLogsFor] = useState<IMembership | null>(null);
  const [templateBg, setTemplateBg] = useState<string>(() => {
    try {
      return localStorage.getItem('membershipTemplateBg') || "url('/template-id-card.png')";
    } catch {
      return "url('/template-id-card.png')";
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const startCamera = async (deviceId?: string) => {
    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);

      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameraDevices(videoDevices);
      if (videoDevices.length > 0 && !deviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      toast.error('Gagal mengakses kamera: ' + (err.message || err.name || 'Pastikan izin kamera diberikan'));
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setFormData(prev => ({ ...prev, foto: dataUrl }));
        toast.success('Foto berhasil diambil!');
        stopCamera();
      }
    }
  };

  useEffect(() => {
    if (!showForm) {
      stopCamera();
    }
  }, [showForm]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
  const [layout, setLayout] = useState(() => {
    try {
      const saved = localStorage.getItem('membershipLayout');
      if (saved) {
        return { ...defaultLayout, ...JSON.parse(saved) };
      }
    } catch {}
    return defaultLayout;
  });

  useEffect(() => {
    try {
      localStorage.setItem('membershipTemplateBg', templateBg);
    } catch {}
  }, [templateBg]);

  useEffect(() => {
    try {
      localStorage.setItem('membershipLayout', JSON.stringify(layout));
    } catch {}
  }, [layout]);

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
    if (localPart.length > 6) {
      localPart = localPart.substring(0, 6);
    } else if (localPart.length < 6) {
      localPart = localPart.padStart(6, '0');
    }
    
    const neededRandom = 1;
    
    let randomPart = '';
    if (existingRandom && existingRandom.length === neededRandom) {
      randomPart = existingRandom;
    } else {
      for (let i = 0; i < neededRandom; i++) {
        randomPart += Math.floor(Math.random() * 10).toString();
      }
    }
    
    const fullCode = prefix + localPart + randomPart;
    
    return {
      prefix,
      localPart,
      randomPart,
      checksum: '',
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

  const fetchJournals = async () => {
    try {
      setJournalsLoading(true);
      const res = await fetch('/api/memberships/journals/list');
      if (res.ok) {
        const data = await res.json();
        setJournals(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data jurnal');
    } finally {
      setJournalsLoading(false);
    }
  };

  const deleteJournal = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan jurnal ini?')) return;
    try {
      const res = await fetch(`/api/memberships/journals/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Jurnal berhasil dihapus');
        fetchJournals();
      } else {
        toast.error('Gagal menghapus jurnal');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat menghapus');
    }
  };

  useEffect(() => {
    if (activeTab === 'journals') {
      fetchJournals();
    }
  }, [activeTab]);

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

  const handleSaveLayout = async (newLayout: any, memberPhotoLayout?: { scale: number, offsetX: number, offsetY: number }) => {
    try {
      await api.updateSettings({ card_layout: JSON.stringify(newLayout) });
      setLayout(newLayout);

      if (memberPhotoLayout && printMember) {
        const updatedMember = {
          ...printMember,
          photo_scale: memberPhotoLayout.scale,
          photo_offset_x: memberPhotoLayout.offsetX,
          photo_offset_y: memberPhotoLayout.offsetY
        };
        await api.updateMembership(printMember.id, updatedMember);
        setMemberships(prev => prev.map(m => m.id === printMember.id ? { ...m, ...updatedMember } : m));
        setPrintMember(updatedMember);
      }

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
      setFormData({ ...member, keterangan_update: '' });
      setEditingId(member.id);
    } else {
      setFormData({
        kode_lokal: prefill?.kode_lokal || '',
        indek_kdk: '',
        indek_ggf: '',
        nama: '',
        bagian: '',
        barcode: prefill?.barcode || '',
        foto: '',
        nik_ktp: '',
        no_hp: '',
        keterangan_update: ''
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

  const handleDeleteAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteAllPassword !== 'root') {
      toast.error('Password salah!');
      return;
    }

    try {
      setIsDeletingAll(true);
      const res = await api.deleteAllMemberships(deleteAllPassword, excludeWithPhotoAndSignature);
      toast.success(res.message || 'Semua data membership berhasil dihapus');
      setShowDeleteAllModal(false);
      setDeleteAllPassword('');
      setExcludeWithPhotoAndSignature(false);
      fetchMemberships();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus semua data membership');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = memberships.map(m => ({
        'Kode': m.kode_lokal || '',
        'Index KDK': m.indek_kdk || '',
        'Index GGF': m.indek_ggf || '',
        'Nama Lengkap': m.nama,
        'Bagian': m.bagian || '',
        'Barcode': m.barcode || '',
        'NIK KTP': m.nik_ktp || '',
        'No HP': m.no_hp || ''
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Memberships");
      XLSX.writeFile(wb, "Data_Memberships.xlsx");
      toast.success('Berhasil mengekspor data ke Excel');
    } catch (err: any) {
      toast.error('Gagal mengekspor: ' + err.message);
    }
  };

  const handleExportJournalsExcel = () => {
    try {
      if (journals.length === 0) {
        toast.error('Tidak ada data jurnal untuk diekspor');
        return;
      }
      const exportData = journals.map(j => ({
        'ID Jurnal': j.id,
        'Waktu': new Date(j.created_at).toLocaleString('id-ID'),
        'Nama Lengkap': j.nama,
        'Kode Lokal (NIK)': j.kode_lokal || '',
        'Index GGF': j.indek_ggf || '',
        'Bagian / Dept': j.bagian || '',
        'Barcode': j.barcode || '',
        'Keterangan': j.keterangan || ''
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Jurnal_Cetak_Kartu");
      XLSX.writeFile(wb, "Jurnal_Cetak_Kartu_Member.xlsx");
      toast.success('Berhasil mengekspor data jurnal ke Excel');
    } catch (err: any) {
      toast.error('Gagal mengekspor: ' + err.message);
    }
  };

  const excelImportRef = useRef<HTMLInputElement>(null);
  
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const res = await api.uploadMemberships(file);
      if (res.success) {
        toast.success(`Berhasil mengimpor ${res.count} data`);
        fetchMemberships();
      } else {
        if (res.duplicatesInFile || res.duplicatesWithDb) {
          setDuplicateData({
            duplicatesInFile: res.duplicatesInFile || [],
            duplicatesWithDb: res.duplicatesWithDb || []
          });
          setShowDuplicateModal(true);
          toast.error(res.error || 'Gagal mengimpor: Ditemukan data duplikat!');
        } else {
          toast.error(res.error || 'Gagal mengimpor data');
        }
      }
    } catch (err: any) {
      toast.error('Gagal mengimpor data: ' + err.message);
    } finally {
      setLoading(false);
      if (excelImportRef.current) excelImportRef.current.value = '';
    }
  };

  const handleDownloadTemplateExcel = () => {
    try {
      const exportData = [{
        'Kode Lokal': '123',
        'Index KDK': 'A',
        'Index GGF': 'B',
        'Nama Lengkap': 'John Doe',
        'Bagian': 'IT',
        'Barcode': '12345678',
        'NIK KTP': '3200000000000001',
        'No HP': '08123456789'
      }];
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, "Template_Import_Membership.xlsx");
      toast.success('Berhasil mendownload template Excel');
    } catch (err: any) {
      toast.error('Gagal mendownload template: ' + err.message);
    }
  };

  // Check for duplicates
  const duplicateLocal = React.useMemo(() => {
    if (!formData.kode_lokal) return null;
    return memberships.find(m => m.id !== editingId && m.kode_lokal === formData.kode_lokal);
  }, [formData.kode_lokal, memberships, editingId]);

  const duplicateKdk = React.useMemo(() => {
    if (!formData.indek_kdk) return null;
    const cleanKdk = formData.indek_kdk.trim().toLowerCase();
    return memberships.find(m => m.id !== editingId && m.indek_kdk?.trim().toLowerCase() === cleanKdk);
  }, [formData.indek_kdk, memberships, editingId]);

  const duplicateGgf = React.useMemo(() => {
    if (!formData.indek_ggf) return null;
    const cleanGgf = formData.indek_ggf.trim().toLowerCase();
    return memberships.find(m => m.id !== editingId && m.indek_ggf?.trim().toLowerCase() === cleanGgf);
  }, [formData.indek_ggf, memberships, editingId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) {
      toast.error('Nama wajib diisi');
      return;
    }

    if (duplicateLocal) {
      toast.error(`Kode Lokal "${formData.kode_lokal}" sudah terdaftar pada member "${duplicateLocal.nama}"!`);
      return;
    }
    if (duplicateKdk) {
      toast.error(`Index KDK "${formData.indek_kdk}" sudah terdaftar pada member "${duplicateKdk.nama}"!`);
      return;
    }
    if (duplicateGgf) {
      toast.error(`Index GGF "${formData.indek_ggf}" sudah terdaftar pada member "${duplicateGgf.nama}"!`);
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

  const filteredMemberships = React.useMemo(() => {
    const filtered = memberships.filter(m => 
      m.nama.toLowerCase().includes(search.toLowerCase()) ||
      (m.barcode && m.barcode.toLowerCase().includes(search.toLowerCase())) ||
      (m.bagian && m.bagian.toLowerCase().includes(search.toLowerCase())) ||
      (m.indek_ggf && m.indek_ggf.toLowerCase().includes(search.toLowerCase())) ||
      (m.kode_lokal && m.kode_lokal.toLowerCase().includes(search.toLowerCase()))
    );
    
    return filtered.sort((a, b) => {
      const aHasPhoto = !!a.foto;
      const bHasPhoto = !!b.foto;
      if (aHasPhoto && !bHasPhoto) return -1;
      if (!aHasPhoto && bHasPhoto) return 1;
      return 0;
    });
  }, [memberships, search]);

  const paginatedMemberships = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMemberships.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMemberships, currentPage]);

  const totalPages = Math.ceil(filteredMemberships.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className={`space-y-4 ${themeClasses.text}`}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            Manajemen Membership
          </h2>
          <p className={`text-sm ${themeClasses.textMuted}`}>Kelola anggota, cetak kartu, dan tanda tangan buku jurnal.</p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Daftar Anggota
          </button>
          <button
            onClick={() => setActiveTab('journals')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'journals'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Buku Jurnal Cetak Kartu
          </button>
        </div>

        {activeTab === 'members' ? (
          <div className="flex flex-wrap sm:justify-end items-center gap-2 mt-2 sm:mt-0 w-full lg:w-auto">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleTemplateUpload} 
            />
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              ref={excelImportRef}
              onChange={handleImportExcel}
            />
            <button 
              onClick={handleDownloadTemplateExcel}
              className={`px-3 py-1.5 text-sm ${themeClasses.bgSecondary} hover:bg-slate-200 dark:hover:bg-slate-700 ${themeClasses.text} rounded-lg font-medium transition-colors flex items-center gap-1.5 border ${themeClasses.border}`}
            >
              <Download className="w-4 h-4" />
              Template Excel
            </button>
            <button 
              onClick={() => excelImportRef.current?.click()}
              className={`px-3 py-1.5 text-sm ${themeClasses.bgSecondary} hover:bg-slate-200 dark:hover:bg-slate-700 ${themeClasses.text} rounded-lg font-medium transition-colors flex items-center gap-1.5 border ${themeClasses.border}`}
            >
              <Upload className="w-4 h-4" />
              Import Excel
            </button>
            <button 
              onClick={handleExportExcel}
              className={`px-3 py-1.5 text-sm ${themeClasses.bgSecondary} hover:bg-slate-200 dark:hover:bg-slate-700 ${themeClasses.text} rounded-lg font-medium transition-colors flex items-center gap-1.5 border ${themeClasses.border}`}
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-1.5 text-sm ${themeClasses.bgSecondary} hover:bg-slate-200 dark:hover:bg-slate-700 ${themeClasses.text} rounded-lg font-medium transition-colors flex items-center gap-1.5 border ${themeClasses.border}`}
            >
              <ImageIcon className="w-4 h-4" />
              BG Kartu
            </button>
            
            <button 
              onClick={() => handleOpenForm()}
              className="px-3 py-1.5 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tambah Member
            </button>

            <button 
              onClick={() => setShowDeleteAllModal(true)}
              className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Semua
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap sm:justify-end items-center gap-2 mt-2 sm:mt-0 w-full lg:w-auto">
            <button 
              onClick={() => setShowQrModal(true)}
              className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <BarcodeIcon className="w-4 h-4" />
              Tampilkan QR Jurnal
            </button>
            <button 
              onClick={handleExportJournalsExcel}
              className={`px-3 py-1.5 text-sm ${themeClasses.bgSecondary} hover:bg-slate-200 dark:hover:bg-slate-700 ${themeClasses.text} rounded-lg font-medium transition-colors flex items-center gap-1.5 border ${themeClasses.border}`}
            >
              <Download className="w-4 h-4" />
              Export Jurnal Excel
            </button>
            <button 
              onClick={fetchJournals}
              className={`p-1.5 rounded-lg border ${themeClasses.border} ${themeClasses.bgSecondary} hover:opacity-85 transition-all`}
              title="Refresh Jurnal"
            >
              <RefreshCw className={`w-4 h-4 ${journalsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {activeTab === 'members' && (
        <>
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

        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
            <thead className={`border-b ${themeClasses.border}`}>
              <tr>
                <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted}`}>Foto</th>
                <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted}`}>Nama</th>
                <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted}`}>Bagian</th>
                <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted}`}>Index KDK</th>
                <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted}`}>Index GGF</th>
                <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted}`}>Update Terakhir</th>
                <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted} text-right`}>Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${themeClasses.border}`}>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-4 px-4 text-center">Loading...</td>
                </tr>
              ) : filteredMemberships.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`py-8 px-4 text-center ${themeClasses.textMuted}`}>
                    Data tidak ditemukan
                  </td>
                </tr>
              ) : paginatedMemberships.map(member => (
                <tr key={member.id} className={`hover:${themeClasses.bgSecondary} transition-colors`}>
                  <td className="py-3 px-4">
                    {member.foto ? (
                      <img src={member.foto} alt={member.nama} className="w-10 h-10 rounded-full object-cover border min-w-[40px]" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center min-w-[40px] ${themeClasses.bgSecondary}`}>
                        <ImageIcon className={`w-5 h-5 ${themeClasses.textMuted}`} />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium">{member.nama}</td>
                  <td className="py-3 px-4">{member.bagian || '-'}</td>
                  <td className="py-3 px-4">{member.indek_kdk || '-'}</td>
                  <td className="py-3 px-4">{member.indek_ggf || '-'}</td>
                  <td className="py-3 px-4 text-xs">
                    {member.updated_at ? new Date(member.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(member.created_at || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setShowLogsFor(member)}
                        title="Lihat Riwayat Update"
                        className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded hover:bg-emerald-500/20 transition-colors"
                      >
                        <History className="w-4 h-4" />
                      </button>
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
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between p-4 border-t ${themeClasses.border}`}>
            <span className={`text-sm ${themeClasses.textMuted}`}>
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredMemberships.length)} dari {filteredMemberships.length} data
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === 1 
                    ? `opacity-50 cursor-not-allowed ${themeClasses.bgSecondary} ${themeClasses.textMuted}` 
                    : `bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50`
                }`}
              >
                Sebelumnya
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  // Handle page sliding if more than 5 pages
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                      if (pageNum > totalPages) {
                        pageNum = totalPages - (4 - i);
                      }
                    }
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white'
                          : `hover:bg-indigo-50 dark:hover:bg-indigo-900/30 ${themeClasses.textMuted}`
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === totalPages 
                    ? `opacity-50 cursor-not-allowed ${themeClasses.bgSecondary} ${themeClasses.textMuted}` 
                    : `bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50`
                }`}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {activeTab === 'journals' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl ${themeClasses.card} ${themeClasses.border} border shadow-sm`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Catatan Buku Jurnal Digital (Tanda Tangan Penerimaan Kartu)
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.textMuted}`} />
                <input 
                  type="text" 
                  placeholder="Cari nama / bagian / kode..." 
                  value={journalSearch}
                  onChange={e => setJournalSearch(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm transition-colors border ${themeClasses.input}`}
                />
              </div>
            </div>

            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                <thead className={`border-b ${themeClasses.border}`}>
                  <tr>
                    <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted}`}>Waktu</th>
                    <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted}`}>Nama Anggota</th>
                    <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted}`}>Kode Lokal / NIK</th>
                    <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted}`}>Index GGF</th>
                    <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted}`}>Bagian</th>
                    <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted}`}>Tanda Tangan Digital</th>
                    <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted}`}>Keterangan</th>
                    <th className={`pb-3 font-semibold px-4 ${themeClasses.textMuted} text-right`}>Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${themeClasses.border}`}>
                  {journalsLoading && journals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 px-4 text-center">Loading data jurnal...</td>
                    </tr>
                  ) : journals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={`py-12 px-4 text-center ${themeClasses.textMuted}`}>
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 border">
                          <BookOpen className="w-6 h-6 opacity-40" />
                        </div>
                        <p className="font-semibold text-sm">Belum Ada Tanda Tangan Buku Jurnal</p>
                        <p className="text-xs opacity-75 mt-0.5">Berikan QR Code Jurnal kepada anggota yang mencetak kartu agar mereka bisa menandatangani langsung dari HP.</p>
                      </td>
                    </tr>
                  ) : journals
                      .filter(j => 
                        j.nama.toLowerCase().includes(journalSearch.toLowerCase()) ||
                        (j.kode_lokal && j.kode_lokal.toLowerCase().includes(journalSearch.toLowerCase())) ||
                        (j.bagian && j.bagian.toLowerCase().includes(journalSearch.toLowerCase())) ||
                        (j.keterangan && j.keterangan.toLowerCase().includes(journalSearch.toLowerCase()))
                      )
                      .map(journal => (
                        <tr key={journal.id} className={`hover:${themeClasses.bgSecondary} transition-colors`}>
                          <td className="py-3 px-4 text-xs font-semibold">
                            {new Date(journal.created_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-4 font-bold text-indigo-500 dark:text-indigo-400">{journal.nama}</td>
                          <td className="py-3 px-4">{journal.kode_lokal || '-'}</td>
                          <td className="py-3 px-4">{journal.indek_ggf || '-'}</td>
                          <td className="py-3 px-4">{journal.bagian || '-'}</td>
                          <td className="py-2 px-4">
                            {journal.signature ? (
                              <div className="bg-slate-950 p-1 rounded border border-slate-800/80 w-24 h-10 flex items-center justify-center">
                                <img 
                                  src={journal.signature} 
                                  alt={`Sign ${journal.nama}`} 
                                  className="h-full object-contain filter invert dark:invert-0" 
                                />
                              </div>
                            ) : (
                              <span className="text-xs text-rose-500 font-bold">Tidak ada tanda tangan</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs italic text-slate-500 dark:text-slate-400">
                            {journal.keterangan || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => deleteJournal(journal.id)}
                              className="p-1.5 bg-rose-500/10 text-rose-600 rounded hover:bg-rose-500/20 transition-colors"
                              title="Hapus Jurnal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL JURNAL QR CODE MODAL */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setShowQrModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative ${themeClasses.card} rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center border ${themeClasses.border} z-10`}
            >
              <button 
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center text-indigo-600 mb-3">
                <BarcodeIcon className="w-6 h-6" />
              </div>

              <h3 className="font-bold text-base">QR Code Buku Jurnal Digital</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
                Arahkan kamera HP anggota Anda ke QR Code di bawah untuk menandatangani buku jurnal serah terima kartu.
              </p>

              <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-inner flex justify-center inline-block mx-auto mb-4">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/jurnal')}`} 
                  alt="QR Code Jurnal" 
                  className="w-48 h-48 object-contain"
                />
              </div>

              <div className="space-y-2 mt-2">
                <a 
                  href={`${window.location.origin}/jurnal`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline break-all font-mono bg-indigo-500/10 dark:bg-indigo-500/5 py-2 px-3 rounded-xl border border-indigo-500/20 transition-all hover:bg-indigo-500/15"
                >
                  {window.location.origin}/jurnal
                </a>
                
                <button
                  type="button"
                  onClick={() => handleCopyLink(`${window.location.origin}/jurnal`, 'global_jurnal')}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-all"
                >
                  {copiedLink === 'global_jurnal' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Tersalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Link Jurnal</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL HAPUS SEMUA DATA MEMBERSHIP */}
      <AnimatePresence>
        {showDeleteAllModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowDeleteAllModal(false);
                setDeleteAllPassword('');
                setExcludeWithPhotoAndSignature(false);
              }}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-md ${themeClasses.card} rounded-xl shadow-xl overflow-hidden`}
            >
              <div className={`p-4 border-b ${themeClasses.border} flex items-center justify-between`}>
                <h3 className="font-bold text-red-600 flex items-center gap-1.5">
                  <Trash2 className="w-5 h-5" />
                  Hapus Semua Data Membership
                </h3>
                <button 
                  onClick={() => {
                    setShowDeleteAllModal(false);
                    setDeleteAllPassword('');
                    setExcludeWithPhotoAndSignature(false);
                  }}
                  className={`p-1 rounded-full hover:${themeClasses.bgSecondary} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDeleteAll} className="p-4 space-y-4">
                <p className={`text-xs ${themeClasses.textMuted} leading-relaxed`}>
                  Apakah Anda yakin ingin menghapus <span className="font-bold text-red-600">SEMUA</span> data membership? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
                </p>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-500 dark:text-slate-400">
                    Masukkan Password untuk Konfirmasi
                  </label>
                  <input 
                    type="password" 
                    required
                    placeholder="Masukkan password..."
                    value={deleteAllPassword}
                    onChange={e => setDeleteAllPassword(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                  />
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="excludeWithPhotoAndSignature"
                    checked={excludeWithPhotoAndSignature}
                    onChange={e => setExcludeWithPhotoAndSignature(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300 cursor-pointer"
                  />
                  <label 
                    htmlFor="excludeWithPhotoAndSignature" 
                    className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none leading-relaxed"
                  >
                    Kecualikan data yang memiliki foto atau tanda tangan buku jurnal
                  </label>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteAllModal(false);
                      setDeleteAllPassword('');
                      setExcludeWithPhotoAndSignature(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg ${themeClasses.bgSecondary} hover:bg-slate-200 dark:hover:bg-slate-700 transition-all`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isDeletingAll || !deleteAllPassword}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {isDeletingAll ? 'Menghapus...' : 'Hapus Semua'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PERINGATAN DUPLIKASI DATA IMPORT */}
      <AnimatePresence>
        {showDuplicateModal && duplicateData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDuplicateModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-lg ${themeClasses.card} rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10`}
            >
              <div className={`p-4 border-b ${themeClasses.border} flex items-center justify-between bg-red-50 dark:bg-red-950/20`}>
                <h3 className="font-bold text-red-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5" />
                  Gagal Upload: Duplikasi Index KDK
                </h3>
                <button 
                  onClick={() => setShowDuplicateModal(false)}
                  className={`p-1 rounded-full hover:${themeClasses.bgSecondary} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4 flex-1">
                <p className={`text-xs ${themeClasses.textMuted} leading-relaxed`}>
                  Seluruh proses impor Excel dibatalkan karena ditemukan duplikasi pada nilai <span className="font-semibold text-slate-850 dark:text-slate-100">Index KDK</span>. Harap perbaiki data pada berkas Excel Anda dan lakukan upload ulang.
                </p>

                {duplicateData.duplicatesInFile.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-red-650 flex items-center gap-1">
                      <span>•</span> Duplikasi di Dalam File Excel ({duplicateData.duplicatesInFile.length})
                    </h4>
                    <div className="text-xs space-y-1.5 pl-3 border-l-2 border-red-300">
                      {duplicateData.duplicatesInFile.map((dup, idx) => (
                        <div key={idx} className="p-2 rounded bg-amber-500/5 border border-amber-500/10">
                          <div>Index KDK: <span className="font-mono font-bold text-red-650">{dup.indek_kdk}</span></div>
                          <div className={`text-[11px] ${themeClasses.textMuted}`}>
                            Dimiliki oleh: <span className="font-semibold text-slate-700 dark:text-slate-300">{dup.names.join(', ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {duplicateData.duplicatesWithDb.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-red-650 flex items-center gap-1">
                      <span>•</span> Bentrok dengan Database ({duplicateData.duplicatesWithDb.length})
                    </h4>
                    <div className="text-xs space-y-1.5 pl-3 border-l-2 border-red-300">
                      {duplicateData.duplicatesWithDb.map((dup, idx) => (
                        <div key={idx} className="p-2 rounded bg-rose-500/5 border border-rose-500/10">
                          <div>Index KDK: <span className="font-mono font-bold text-red-650">{dup.indek_kdk}</span></div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                            <div>Nama di Excel: <span className="font-semibold text-slate-700 dark:text-slate-300">{dup.excelName}</span></div>
                            <div>Nama di Database: <span className="font-semibold text-red-500">{dup.dbName}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={`p-3 border-t ${themeClasses.border} flex justify-end bg-slate-50 dark:bg-slate-900`}>
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="px-4 py-1.5 text-xs font-bold text-white rounded-lg bg-slate-600 hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${
                        duplicateLocal ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500 bg-rose-500/5' : themeClasses.input
                      }`}
                    />
                    {duplicateLocal && (
                      <p className="text-[10px] text-rose-500 font-semibold mt-1">
                        ⚠️ Sudah ada ({duplicateLocal.nama})
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Index KDK</label>
                    <input 
                      type="text" 
                      value={formData.indek_kdk || ''}
                      onChange={e => setFormData({ ...formData, indek_kdk: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${
                        duplicateKdk ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500 bg-rose-500/5' : themeClasses.input
                      }`}
                    />
                    {duplicateKdk && (
                      <p className="text-[10px] text-rose-500 font-semibold mt-1">
                        ⚠️ Sudah ada ({duplicateKdk.nama})
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Index GGF</label>
                    <input 
                      type="text" 
                      value={formData.indek_ggf || ''}
                      onChange={e => setFormData({ ...formData, indek_ggf: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${
                        duplicateGgf ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500 bg-rose-500/5' : themeClasses.input
                      }`}
                    />
                    {duplicateGgf && (
                      <p className="text-[10px] text-rose-500 font-semibold mt-1">
                        ⚠️ Sudah ada ({duplicateGgf.nama})
                      </p>
                    )}
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
                              toast.success('Barcode berhasil di-generate!');
                            } else {
                              toast.error('Kode lokal harus mengandung angka!');
                            }
                          }}
                          className="text-[10px] text-indigo-500 hover:text-indigo-600 font-bold flex items-center gap-0.5"
                        >
                          <Sparkles className="w-3 h-3" />
                          Auto Barcode
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
                        format="CODE128"
                        lineColor="#1e3a8a"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium mt-1.5">Live Preview Barcode (8 Digit)</span>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">NIK KTP (Data Diri)</label>
                    <input 
                      type="text" 
                      value={formData.nik_ktp || ''}
                      onChange={e => setFormData({ ...formData, nik_ktp: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${themeClasses.input}`}
                      placeholder="Tidak dicetak di ID Card"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">No HP (Data Diri)</label>
                    <input 
                      type="text" 
                      value={formData.no_hp || ''}
                      onChange={e => setFormData({ ...formData, no_hp: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${themeClasses.input}`}
                      placeholder="Tidak dicetak di ID Card"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Foto</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      {formData.foto && (
                        <div className="relative group">
                          <img src={formData.foto} alt="Preview" className="w-16 h-16 object-cover rounded-md border" />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, foto: '' }))}
                            className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-md hover:bg-rose-600 transition-colors flex items-center justify-center"
                            title="Hapus Foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        <label className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm cursor-pointer transition-colors border border-indigo-200 flex items-center gap-1.5 font-medium">
                          <ImageIcon className="w-4 h-4" />
                          Pilih Foto
                          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                        </label>

                        {isCameraOpen ? (
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm transition-colors border border-rose-200 flex items-center gap-1.5 font-medium"
                          >
                            <X className="w-4 h-4" />
                            Batal Kamera
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startCamera()}
                            className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm transition-colors border border-emerald-200 flex items-center gap-1.5 font-medium"
                          >
                            <Camera className="w-4 h-4" />
                            Kamera Langsung
                          </button>
                        )}
                      </div>
                    </div>

                    {isCameraOpen && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3">
                        {cameraDevices.length > 1 && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">PILIH KAMERA</label>
                            <select
                              value={selectedDeviceId}
                              onChange={(e) => {
                                setSelectedDeviceId(e.target.value);
                                startCamera(e.target.value);
                              }}
                              className={`w-full text-xs px-2 py-1.5 rounded border ${themeClasses.input}`}
                            >
                              {cameraDevices.map((device) => (
                                <option key={device.deviceId} value={device.deviceId}>
                                  {device.label || `Kamera ${device.deviceId.substring(0, 5)}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="relative overflow-hidden rounded-lg bg-black aspect-video flex items-center justify-center border max-w-sm mx-auto">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded flex items-center gap-1 shadow animate-pulse">
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                            LIVE
                          </div>
                        </div>

                        <div className="flex gap-2 max-w-sm mx-auto">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98]"
                          >
                            <Camera className="w-4 h-4" />
                            Ambil Foto
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Tutup
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-semibold mb-1 text-emerald-600 dark:text-emerald-400">Keterangan Update (Riwayat)</label>
                  <input 
                    type="text" 
                    value={formData.keterangan_update || ''}
                    onChange={e => setFormData({ ...formData, keterangan_update: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${themeClasses.input}`}
                    placeholder="Contoh: Update foto, perbaikan nama, member baru, dll..."
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Isi keterangan ini untuk menyimpan riwayat perubahan data member.</p>
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
      
      {/* MODAL LOGS */}
      <AnimatePresence>
        {showLogsFor && (
          <MembershipLogsModal
            member={showLogsFor}
            onClose={() => setShowLogsFor(null)}
            themeClasses={themeClasses}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const MembershipLogsModal = ({ member, onClose, themeClasses }: { member: IMembership, onClose: () => void, themeClasses: any }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.getMembershipLogs(member.id);
        setLogs(data);
      } catch (err) {
        toast.error('Gagal memuat riwayat');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [member.id]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`w-full max-w-lg ${themeClasses.card} rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
      >
        <div className={`p-4 border-b flex justify-between items-center ${themeClasses.border}`}>
          <div>
            <h3 className="font-bold text-lg">Riwayat Update Member</h3>
            <p className={`text-xs ${themeClasses.textMuted}`}>{member.nama} ({member.barcode || '-'})</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900/50">
          {loading ? (
            <div className="flex justify-center p-8">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className={`text-center p-8 ${themeClasses.textMuted}`}>
              Belum ada riwayat update.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className={`p-3 rounded-xl border ${themeClasses.card} ${themeClasses.border} relative shadow-sm`}>
                  <div className="flex gap-3">
                    <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></div>
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${themeClasses.text}`}>
                        {log.keterangan || 'Update data member'}
                      </p>
                      <p className={`text-xs mt-1 opacity-70 ${themeClasses.textMuted}`}>
                        {new Date(log.created_at).toLocaleString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div className={`p-3 rounded-xl border ${themeClasses.card} ${themeClasses.border} relative shadow-sm`}>
                <div className="flex gap-3">
                  <div className="mt-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20"></div>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${themeClasses.text}`}>
                      Member didaftarkan
                    </p>
                    <p className={`text-xs mt-1 opacity-70 ${themeClasses.textMuted}`}>
                      {new Date(member.created_at || new Date()).toLocaleString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const PrintCardModal = ({ member, onClose, isDark, themeClasses, templateBg, layout, onSaveLayout }: { member: IMembership, onClose: () => void, isDark: boolean, themeClasses: any, templateBg: string, layout: any, onSaveLayout: (l: any, memberPhoto?: { scale: number, offsetX: number, offsetY: number }) => void }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [localLayout, setLocalLayout] = useState<{ [key: string]: any }>(() => ({
    ...layout,
    photoScale: member.photo_scale ?? layout.photoScale ?? 1,
    photoOffsetX: member.photo_offset_x ?? layout.photoOffsetX ?? 50,
    photoOffsetY: member.photo_offset_y ?? layout.photoOffsetY ?? 50,
  }));
  const [isEditMode, setIsEditMode] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopyLink = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(key);
    toast.success('Link berhasil disalin!');
    setTimeout(() => setCopiedLink(null), 2000);
  };

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
                  color: #1e3a8a;
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
                  color: #1e3a8a;
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
        className={`relative ${themeClasses.card} rounded-xl shadow-xl overflow-hidden flex flex-col w-full max-w-4xl max-h-[95vh]`}
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

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          <div className="p-6 flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-900/60 overflow-auto flex-1 h-full min-h-[300px] space-y-6">
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
                    <p style={{ fontSize: `${localLayoutMerged.localScale}mm`, fontWeight: 700, color: '#1e3a8a', margin: 0, textTransform: 'uppercase', textAlign: 'center', width: '100%' }}>
                      {member.kode_lokal || '-'}
                    </p>
                  </div>

                  {/* Bagian (Dept) */}
                  <div className="info-dept" style={{ position: 'absolute', top: `${localLayoutMerged.deptY}mm`, left: `${localLayoutMerged.deptX}mm`, width: `${localLayoutMerged.infoW}mm`, display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 0 }}>
                    <p style={{ fontSize: `${localLayoutMerged.deptScale}mm`, fontWeight: 700, color: '#1e3a8a', margin: 0, textTransform: 'uppercase', textAlign: 'center', width: '100%' }}>
                      {member.bagian}
                    </p>
                  </div>
                </>
              ) : (
                <div className="info-block" style={{ position: 'absolute', top: `${localLayoutMerged.infoY}mm`, left: `${localLayoutMerged.infoX}mm`, width: `${localLayoutMerged.infoW}mm`, textAlign: 'center' }}>
                  <p className="info-name" style={{ fontSize: `${localLayoutMerged.fontName || 3.2}mm`, fontWeight: 800, color: '#1e3a8a', margin: 0, textTransform: 'uppercase' }}>{member.nama}</p>
                  <p className="info-index" style={{ fontSize: `${localLayoutMerged.fontIndex || 2.5}mm`, fontWeight: 700, color: '#1e3a8a', margin: '0.5mm 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1mm' }}>
                    {member.kode_lokal || '-'}
                  </p>
                  <p className="info-dept" style={{ fontSize: `${localLayoutMerged.fontDept || 2}mm`, fontWeight: 700, color: '#1e3a8a', margin: 0, textTransform: 'uppercase' }}>{member.bagian}</p>
                </div>
              )}
            </div>

            {/* SCAN JURNAL INSTANT BARCODE/QR ACCENT FOR RECEIPT */}
            <div className="w-full max-w-sm bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-3">
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 shrink-0">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + '/jurnal?member_id=' + member.id)}`} 
                  alt="QR Tanda Tangan" 
                  className="w-14 h-14 object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Isi Buku Jurnal Instan
                </h4>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-0.5 leading-snug">
                  Minta anggota scan QR ini untuk tanda tangan serah terima kartu.
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <a 
                    href={`${window.location.origin}/jurnal?member_id=${member.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-indigo-500 font-bold hover:underline font-mono truncate max-w-[150px] bg-indigo-50 dark:bg-indigo-950/40 py-0.5 px-1.5 rounded border border-indigo-100 dark:border-indigo-900"
                    title="Buka Link Jurnal Member"
                  >
                    Buka Link
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(`${window.location.origin}/jurnal?member_id=${member.id}`, `member_${member.id}`)}
                    className="text-[10px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold bg-slate-100 dark:bg-slate-700 py-0.5 px-1.5 rounded flex items-center gap-1 transition-colors"
                  >
                    {copiedLink === `member_${member.id}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isEditMode && (
            <div className={`w-full md:w-80 p-4 border-t md:border-t-0 md:border-l ${themeClasses.border} overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/30`}>
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

              {/* PHOTO CONTROLLER */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b pb-1">
                  <div className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                  <span className="font-black text-xs text-indigo-500 uppercase tracking-wider">Foto</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70">Posisi X:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, photoX: Math.max(0, Number(((prev.photoX ?? 59.6) - 0.5).toFixed(2)))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        step="0.5" 
                        value={localLayoutMerged.photoX} 
                        onChange={e => setLocalLayout({...localLayout, photoX: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, photoX: Number(((prev.photoX ?? 59.6) + 0.5).toFixed(2))}))}
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
                        onClick={() => setLocalLayout(prev => ({...prev, photoY: Math.max(0, Number(((prev.photoY ?? 15) - 0.5).toFixed(2)))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        step="0.5" 
                        value={localLayoutMerged.photoY} 
                        onChange={e => setLocalLayout({...localLayout, photoY: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, photoY: Number(((prev.photoY ?? 15) + 0.5).toFixed(2))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">mm</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70">Lebar:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, photoW: Math.max(0.5, Number(((prev.photoW ?? 20) - 0.5).toFixed(2)))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        step="0.5" 
                        value={localLayoutMerged.photoW} 
                        onChange={e => setLocalLayout({...localLayout, photoW: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, photoW: Number(((prev.photoW ?? 20) + 0.5).toFixed(2))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">mm</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70">Tinggi:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, photoH: Math.max(0.5, Number(((prev.photoH ?? 25) - 0.5).toFixed(2)))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        step="0.5" 
                        value={localLayoutMerged.photoH} 
                        onChange={e => setLocalLayout({...localLayout, photoH: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, photoH: Number(((prev.photoH ?? 25) + 0.5).toFixed(2))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">mm</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70 font-semibold text-indigo-500">Zoom Scale:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, photoScale: Math.max(0.1, Number(((prev.photoScale ?? 1) - 0.1).toFixed(2)))}))}
                        className="w-6 h-6 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                        title="Zoom Out Foto"
                      >
                        <ZoomOut className="w-3 h-3" />
                      </button>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={localLayoutMerged.photoScale} 
                        onChange={e => setLocalLayout({...localLayout, photoScale: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, photoScale: Number(((prev.photoScale ?? 1) + 0.1).toFixed(2))}))}
                        className="w-6 h-6 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                        title="Zoom In Foto"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">x</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70 font-semibold text-indigo-500">Geser X (%):</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, photoOffsetX: Number(((prev.photoOffsetX ?? 50) - 1).toFixed(0))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        step="1" 
                        value={localLayoutMerged.photoOffsetX} 
                        onChange={e => setLocalLayout({...localLayout, photoOffsetX: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, photoOffsetX: Number(((prev.photoOffsetX ?? 50) + 1).toFixed(0))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70 font-semibold text-indigo-500">Geser Y (%):</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, photoOffsetY: Number(((prev.photoOffsetY ?? 50) - 1).toFixed(0))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        step="1" 
                        value={localLayoutMerged.photoOffsetY} 
                        onChange={e => setLocalLayout({...localLayout, photoOffsetY: Number(e.target.value)})}
                        className={`w-12 py-0.5 text-center rounded border ${themeClasses.input} text-xs font-semibold`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setLocalLayout(prev => ({...prev, photoOffsetY: Number(((prev.photoOffsetY ?? 50) + 1).toFixed(0))}))}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center font-bold active:scale-95 transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-slate-400 ml-1">%</span>
                    </div>
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
                  onClick={() => onSaveLayout(localLayoutMerged, {
                    scale: localLayout.photoScale ?? 1,
                    offsetX: localLayout.photoOffsetX ?? 50,
                    offsetY: localLayout.photoOffsetY ?? 50
                  })}
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
