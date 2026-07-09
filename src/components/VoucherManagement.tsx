import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Printer, 
  Image as ImageIcon, 
  Settings, 
  Layers, 
  Type, 
  FileSpreadsheet, 
  Sparkles, 
  Upload, 
  Download, 
  Check, 
  Copy, 
  PlusCircle, 
  X, 
  FileText, 
  QrCode,
  Grid,
  RotateCcw,
  RefreshCw,
  Search,
  Clock,
  ClipboardList,
  Share2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';

interface IVoucherTemplate {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  category: string;
  slogan: string;
  value: string;
  validity: string;
  authorizedByLabel: string;
  authorizedName: string;
  authorizedTitle: string;
  serialPrefix: string;
  footerText: string;
  terms: string[];
  
  // Styling
  bgColor: string;
  bgGradient: string;
  bgType: 'color' | 'gradient' | 'image';
  bgImageUrl: string;
  titleColor: string;
  subtitleColor: string;
  textColor: string;
  valueColor: string;
  accentColor: string;
  footerBgColor: string;
  footerTextColor: string;
  fontFamily: 'font-sans' | 'font-mono' | 'font-serif';
  
  // Sizes & Positions
  width: number; // in pixels for preview, mapped to standard print size
  height: number;
  titleSize: number;
  subtitleSize: number;
  valueSize: number;
  termsSize: number;

  // Dynamic coordinates and extra sizes
  titleX?: number;
  titleY?: number;
  subtitleX?: number;
  subtitleY?: number;
  categoryX?: number;
  categoryY?: number;
  categorySize?: number;
  sloganX?: number;
  sloganY?: number;
  sloganSize?: number;
  valueX?: number;
  valueY?: number;
  validityX?: number;
  validityY?: number;
  validitySize?: number;
  authorizedX?: number;
  authorizedY?: number;
  authorizedByLabelSize?: number;
  authorizedByLabelX?: number;
  authorizedByLabelY?: number;
  authorizedNameSize?: number;
  authorizedNameX?: number;
  authorizedNameY?: number;
  authorizedTitleSize?: number;
  authorizedTitleX?: number;
  authorizedTitleY?: number;
  qrSerialX?: number;
  qrSerialY?: number;
  qrSize?: number;
  showQr?: boolean;
  qrX?: number;
  qrY?: number;
  serialX?: number;
  serialY?: number;
  serialSize?: number;
  termsX?: number;
  termsY?: number;
  footerX?: number;
  footerY?: number;
  footerSize?: number;
}

interface IVoucherRecord {
  id: string;
  serialNumber: string;
  recipientName: string;
  department: string;
  status: 'Belum Dicetak' | 'Dicetak' | 'Digunakan';
  printedAt?: string;
}

const formatRupiah = (val: string | number) => {
  if (val === undefined || val === null) return '';
  const valStr = String(val).trim();
  if (/^rp/i.test(valStr)) {
    return valStr;
  }
  const digits = valStr.replace(/[^0-9]/g, '');
  if (!digits) return valStr;
  
  const num = parseInt(digits, 10);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
  
  return formatted.replace(/IDR\s?|Rp\s?/, 'Rp ');
};

const formatVoucherValidityDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `berlaku sampai ${day} ${months[monthIndex]} ${year}`;
    }
  }
  return dateStr;
};

const formatIndonesianDateOnly = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${months[monthIndex]} ${year}`;
    }
  }
  return dateStr;
};

const DEFAULT_TEMPLATES: IVoucherTemplate[] = [
  {
    id: '1',
    name: 'Voucher Konsumsi Dwi Karya',
    title: 'VOUCHER KONSUMSI',
    subtitle: 'General Meeting & Halal Bihalal',
    category: 'All Estate Plantation',
    slogan: 'Silaturahmi & Sinergi Untuk Kebersamaan yang Lebih Kuat',
    value: 'Rp 50.000',
    validity: 'BERLAKU SAMPAI 30 SEPTEMBER 2026',
    authorizedByLabel: 'Disahkan oleh',
    authorizedName: 'PUJI SULASTIANA',
    authorizedTitle: 'Bag. Finance',
    serialPrefix: 'No.',
    footerText: 'KOPERASI KONSUMEN KARYAWAN DWI KARYA - GREAT GIANT FOODS',
    terms: [
      'Hanya berlaku jika ada cap dan tanda tangan petugas',
      'Tidak berlaku bila rusak (sobek, tercuci, coretan, dll)',
      'Tidak dapat diuangkan, hanya untuk transaksi di Toko Konsumsi K3DK'
    ],
    bgType: 'gradient',
    bgColor: '#ffffff',
    bgGradient: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 50%, #fefce8 100%)',
    bgImageUrl: '',
    titleColor: '#15803d',
    subtitleColor: '#15803d',
    textColor: '#334155',
    valueColor: '#15803d',
    accentColor: '#15803d',
    footerBgColor: '#15803d',
    footerTextColor: '#ffffff',
    fontFamily: 'font-sans',
    width: 800,
    height: 320,
    titleSize: 32,
    subtitleSize: 14,
    valueSize: 48,
    termsSize: 9,
    showQr: false,
    qrX: 0,
    qrY: 0,
    serialX: 0,
    serialY: 0,
    serialSize: 11,
    authorizedByLabelX: 0,
    authorizedByLabelY: 0,
    authorizedNameX: 0,
    authorizedNameY: 0,
    authorizedTitleX: 0,
    authorizedTitleY: 0
  },
  {
    id: '2',
    name: 'Voucher Makan Siang Sederhana',
    title: 'VOUCHER MAKAN SIANG',
    subtitle: 'Rapat Kerja Tahunan',
    category: 'Kantor Pusat',
    slogan: 'Meningkatkan Integritas & Produktivitas Kerja',
    value: 'Rp 35.000',
    validity: 'BERLAKU HARI INI SAJA',
    authorizedByLabel: 'Disetujui oleh',
    authorizedName: 'ADMIN IT SUPPORT',
    authorizedTitle: 'KDK Dept.',
    serialPrefix: 'VMC-',
    footerText: 'KDK COOPERATIVE & CATERING SERVICE',
    terms: [
      'Tunjukkan voucher ini ke kasir kantin',
      'Hanya berlaku untuk 1x porsi makanan + minuman',
      'Tidak dapat digabungkan dengan promo lainnya'
    ],
    bgType: 'gradient',
    bgColor: '#ffffff',
    bgGradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    bgImageUrl: '',
    titleColor: '#1d4ed8',
    subtitleColor: '#1e3a8a',
    textColor: '#1e293b',
    valueColor: '#1d4ed8',
    accentColor: '#1d4ed8',
    footerBgColor: '#1d4ed8',
    footerTextColor: '#ffffff',
    fontFamily: 'font-sans',
    width: 800,
    height: 320,
    titleSize: 30,
    subtitleSize: 14,
    valueSize: 44,
    termsSize: 9,
    showQr: false,
    qrX: 0,
    qrY: 0,
    serialX: 0,
    serialY: 0,
    serialSize: 11,
    authorizedByLabelX: 0,
    authorizedByLabelY: 0,
    authorizedNameX: 0,
    authorizedNameY: 0,
    authorizedTitleX: 0,
    authorizedTitleY: 0
  }
];

export const VoucherManagement: React.FC<{
  isDark: boolean;
  themeClasses: any;
  primaryColor: string;
  adminUser?: any;
  currentUser?: any;
  loggedInMasterUser?: any;
}> = ({
  isDark,
  themeClasses,
  primaryColor,
  adminUser,
  currentUser,
  loggedInMasterUser
}) => {
  // State for templates
  const [templates, setTemplates] = useState<IVoucherTemplate[]>(() => {
    const saved = localStorage.getItem('voucher_templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Force showQr to false on load to hide the barcode as requested
        return parsed.map((t: any) => ({ ...t, showQr: false }));
      } catch (e) {
        return DEFAULT_TEMPLATES;
      }
    }
    return DEFAULT_TEMPLATES;
  });
  
  const [activeTemplateId, setActiveTemplateId] = useState<string>(() => {
    return templates[0]?.id || '1';
  });
  
  // State for active template form fields
  const activeTemplate = templates.find(t => t.id === activeTemplateId) || templates[0];
  
  // State for records / serial numbers
  const [records, setRecords] = useState<IVoucherRecord[]>(() => {
    const saved = localStorage.getItem(`voucher_records_${activeTemplateId}`);
    if (saved) return JSON.parse(saved);
    
    // Generate default sample records if none exist
    const samples: IVoucherRecord[] = [
      { id: 'r1', serialNumber: '2011248', recipientName: 'Budi Santoso', department: 'Plantation III', status: 'Belum Dicetak' },
      { id: 'r2', serialNumber: '2011249', recipientName: 'Siti Rahma', department: 'Finance HQ', status: 'Belum Dicetak' },
      { id: 'r3', serialNumber: '2011250', recipientName: 'Joko Widodo', department: 'QA Lab', status: 'Belum Dicetak' }
    ];
    return samples;
  });

  // Save templates
  useEffect(() => {
    localStorage.setItem('voucher_templates', JSON.stringify(templates));
  }, [templates]);

  // Load records on template change
  useEffect(() => {
    const saved = localStorage.getItem(`voucher_records_${activeTemplateId}`);
    if (saved) {
      setRecords(JSON.parse(saved));
    } else {
      // Default sample records
      const prefixNum = activeTemplateId === '2' ? '500100' : '2011248';
      const startNum = parseInt(prefixNum) || 2011248;
      const samples: IVoucherRecord[] = Array.from({ length: 5 }, (_, i) => ({
        id: `r_${Date.now()}_${i}`,
        serialNumber: (startNum + i).toString(),
        recipientName: i === 0 ? 'Budi Santoso' : i === 1 ? 'Siti Rahma' : i === 2 ? 'Yusuf Habibi' : i === 3 ? 'Megawati' : 'Prabowo',
        department: i % 2 === 0 ? 'Plantation III' : 'Finance HQ',
        status: 'Belum Dicetak'
      }));
      setRecords(samples);
      localStorage.setItem(`voucher_records_${activeTemplateId}`, JSON.stringify(samples));
    }
  }, [activeTemplateId]);

  // Save records when updated
  useEffect(() => {
    if (activeTemplateId) {
      localStorage.setItem(`voucher_records_${activeTemplateId}`, JSON.stringify(records));
    }
  }, [records, activeTemplateId]);

  // Global automatic numbering states
  const [globalVoucherEnabled, setGlobalVoucherEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('global_voucher_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [globalVoucherPrefix, setGlobalVoucherPrefix] = useState<string>(() => {
    return localStorage.getItem('global_voucher_prefix') || 'VMC-';
  });
  const [globalVoucherNextNumber, setGlobalVoucherNextNumber] = useState<number>(() => {
    const saved = localStorage.getItem('global_voucher_next_number');
    return saved ? parseInt(saved, 10) : 2011251;
  });
  const [globalVoucherPadding, setGlobalVoucherPadding] = useState<number>(() => {
    const saved = localStorage.getItem('global_voucher_padding');
    return saved ? parseInt(saved, 10) : 7;
  });

  useEffect(() => {
    localStorage.setItem('global_voucher_enabled', String(globalVoucherEnabled));
  }, [globalVoucherEnabled]);

  useEffect(() => {
    localStorage.setItem('global_voucher_prefix', globalVoucherPrefix);
  }, [globalVoucherPrefix]);

  useEffect(() => {
    localStorage.setItem('global_voucher_next_number', String(globalVoucherNextNumber));
  }, [globalVoucherNextNumber]);

  useEffect(() => {
    localStorage.setItem('global_voucher_padding', String(globalVoucherPadding));
  }, [globalVoucherPadding]);

  // Tabs: 'content' | 'design' | 'recipients' | 'print' | 'requests'
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'recipients' | 'print' | 'requests'>(
    'requests'
  );
  
  // Bulk generation inputs
  const [bulkStart, setBulkStart] = useState<string>('2011251');
  const [bulkCount, setBulkCount] = useState<number>(10);
  const [bulkPrefix, setBulkPrefix] = useState<string>('');
  
  // Single record inputs
  const [newSerial, setNewSerial] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newDept, setNewDept] = useState<string>('');
  
  // Edit record state
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editSerial, setEditSerial] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editDept, setEditDept] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'Belum Dicetak' | 'Dicetak' | 'Digunakan'>('Belum Dicetak');

  // Print settings
  const [printLayout, setPrintLayout] = useState<'4-per-a4' | '2-col' | '1-col' | 'custom'>(() => {
    return (localStorage.getItem('print_layout') as any) || '4-per-a4';
  });
  const [customPrintWidthCm, setCustomPrintWidthCm] = useState<number>(() => {
    const saved = localStorage.getItem('custom_print_width_cm');
    return saved ? Number(saved) : 16.93;
  });
  const [customPrintHeightCm, setCustomPrintHeightCm] = useState<number>(() => {
    const saved = localStorage.getItem('custom_print_height_cm');
    return saved ? Number(saved) : 5.08;
  });
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [searchRecordQuery, setSearchRecordQuery] = useState('');

  // Logo uploads (stored in local storage as base64)
  const [logoLeft, setLogoLeft] = useState<string>(() => {
    return localStorage.getItem('voucher_logo_left') || '/ggf-logo.png';
  });
  const [logoRight, setLogoRight] = useState<string>(() => {
    return localStorage.getItem('voucher_logo_right') || '/kdk-logo.png';
  });

  const printRef = useRef<HTMLDivElement>(null);
  
  // Real-size preview scale controller states
  const [previewScale, setPreviewScale] = useState<'fit' | '100' | '75' | '50'>('fit');
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  // Voucher request workflow states
  const [voucherRequests, setVoucherRequests] = useState<any[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqRequesterName, setReqRequesterName] = useState('');
  const [reqDept, setReqDept] = useState('');
  const [reqDeadline, setReqDeadline] = useState('');
  const [reqTheme, setReqTheme] = useState('');
  const [reqSlogan, setReqSlogan] = useState('');
  const [reqValidity, setReqValidity] = useState('');
  const [reqQty, setReqQty] = useState(10);
  const [reqVoucherValue, setReqVoucherValue] = useState('');
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [globalTemplatesBackup, setGlobalTemplatesBackup] = useState<IVoucherTemplate[] | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('Semua');

  const handleDesignForRequest = async (req: any) => {
    if (req.status === 'Baru Diminta') {
      try {
        await api.updateVoucherRequestStatus(req.id, 'Proses');
        toast.success(`Status pengajuan otomatis diubah menjadi: Proses`);
        fetchRequests();
      } catch (err) {
        console.error('Failed to auto update status to Proses', err);
      }
    }

    // Backup global templates if not already done
    if (!globalTemplatesBackup) {
      setGlobalTemplatesBackup(templates);
    }

    setActiveRequestId(req.id);

    // Get starting template based on whether design_data exists
    let baseTpl: IVoucherTemplate;
    if (req.design_data) {
      try {
        baseTpl = JSON.parse(req.design_data);
      } catch (e) {
        console.error('Failed to parse design_data, using default', e);
        baseTpl = activeTemplate;
      }
    } else {
      // Opsi A: Mewarisi tata letak dan posisi yang sudah ideal dari template aktif saat ini
      // agar admin tidak perlu mengatur ulang posisi teks dari awal untuk tiket baru.
      baseTpl = activeTemplate;
    }

    // Overwrite fields of active template in memory
    setTemplates(prev => prev.map(t => {
      if (t.id === activeTemplateId) {
        return {
          ...baseTpl,
          id: activeTemplateId,
          subtitle: req.theme.toUpperCase(),
          category: req.department.toUpperCase(),
          slogan: req.slogan || baseTpl.slogan || '',
          value: req.voucher_value || baseTpl.value || '',
          validity: req.validity_date ? formatVoucherValidityDate(req.validity_date) : '',
          authorizedName: 'PUJI SULASTIANA'
        };
      }
      return t;
    }));

    // Generate matching records qty
    let generatedRecords: IVoucherRecord[] = [];
    if (globalVoucherEnabled) {
      const currentNext = globalVoucherNextNumber;
      generatedRecords = Array.from({ length: req.qty }, (_, i) => {
        const generatedNum = (currentNext + i).toString().padStart(globalVoucherPadding, '0');
        return {
          id: `r_${Date.now()}_${i}`,
          serialNumber: `${globalVoucherPrefix}${generatedNum}`,
          recipientName: 'Peserta Event',
          department: req.department,
          status: 'Belum Dicetak' as const
        };
      });
      const nextNum = currentNext + req.qty;
      setGlobalVoucherNextNumber(nextNum);
      localStorage.setItem('global_voucher_next_number', String(nextNum));
      toast.success(`Nomor seri otomatis dialokasikan: ${globalVoucherPrefix}${currentNext.toString().padStart(globalVoucherPadding, '0')} s.d ${globalVoucherPrefix}${(nextNum - 1).toString().padStart(globalVoucherPadding, '0')}`);
    } else {
      const startNum = 500000 + Math.floor(Math.random() * 400000);
      generatedRecords = Array.from({ length: req.qty }, (_, i) => ({
        id: `r_${Date.now()}_${i}`,
        serialNumber: (startNum + i).toString(),
        recipientName: 'Peserta Event',
        department: req.department,
        status: 'Belum Dicetak' as const
      }));
    }
    setRecords(generatedRecords);
    localStorage.setItem(`voucher_records_${activeTemplateId}`, JSON.stringify(generatedRecords));

    setActiveTab('content');
    toast(`Formulir diisi otomatis berdasarkan pengajuan: "${req.theme}"`);
  };

  const handleManualSave = async () => {
    try {
      // 1. Save templates
      localStorage.setItem('voucher_templates', JSON.stringify(templates));
      // 2. Save records
      if (activeTemplateId) {
        localStorage.setItem(`voucher_records_${activeTemplateId}`, JSON.stringify(records));
      }
      
      // 3. Save print settings
      localStorage.setItem('print_layout', printLayout);
      localStorage.setItem('custom_print_width_cm', String(customPrintWidthCm));
      localStorage.setItem('custom_print_height_cm', String(customPrintHeightCm));

      // 4. Save global settings
      localStorage.setItem('global_voucher_enabled', String(globalVoucherEnabled));
      localStorage.setItem('global_voucher_prefix', globalVoucherPrefix);
      localStorage.setItem('global_voucher_next_number', String(globalVoucherNextNumber));
      localStorage.setItem('global_voucher_padding', String(globalVoucherPadding));

      // 5. Backend sync if requested
      if (activeRequestId) {
        const designJson = JSON.stringify(activeTemplate);
        await api.updateVoucherRequestDesign(activeRequestId, designJson, 'Proses');
        fetchRequests();
        toast.success('Desain Pengajuan & Template berhasil disimpan!');
      } else {
        toast.success('Semua perubahan data voucher berhasil disimpan!');
      }
    } catch (err: any) {
      toast.error('Gagal menyimpan perubahan: ' + err.message);
    }
  };

  const handleSaveDesignDraft = async () => {
    if (!activeRequestId) return;
    try {
      const designJson = JSON.stringify(activeTemplate);
      await api.updateVoucherRequestDesign(activeRequestId, designJson, 'Proses');
      toast.success('Draft desain voucher berhasil disimpan!');
      setActiveRequestId(null);
      if (globalTemplatesBackup) {
        setTemplates(globalTemplatesBackup);
        setGlobalTemplatesBackup(null);
      }
      fetchRequests();
      setActiveTab('requests');
    } catch (err: any) {
      toast.error('Gagal menyimpan draft desain: ' + err.message);
    }
  };

  const handleShareDesignToUser = async () => {
    if (!activeRequestId) return;
    try {
      const designJson = JSON.stringify(activeTemplate);
      await api.updateVoucherRequestDesign(activeRequestId, designJson, 'Done');
      toast.success('Desain voucher berhasil dibagikan ke pemohon!');
      setActiveRequestId(null);
      if (globalTemplatesBackup) {
        setTemplates(globalTemplatesBackup);
        setGlobalTemplatesBackup(null);
      }
      fetchRequests();
      setActiveTab('requests');
    } catch (err: any) {
      toast.error('Gagal membagikan desain: ' + err.message);
    }
  };

  const handleCancelDesignMode = () => {
    setActiveRequestId(null);
    if (globalTemplatesBackup) {
      setTemplates(globalTemplatesBackup);
      setGlobalTemplatesBackup(null);
    }
    toast('Keluar dari mode desain pengajuan');
  };

  const fetchRequests = async () => {
    setReqLoading(true);
    try {
      const data = await api.getVoucherRequests();
      setVoucherRequests(data);
    } catch (err) {
      console.error('Error fetching voucher requests:', err);
    } finally {
      setReqLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqRequesterName || !reqDept || !reqDeadline || !reqTheme || !reqValidity || !reqQty || !reqVoucherValue) {
      toast.error('Mohon lengkapi semua field form!');
      return;
    }
    setReqSubmitting(true);
    try {
      await api.createVoucherRequest({
        requester_name: reqRequesterName,
        department: reqDept,
        deadline: reqDeadline,
        theme: reqTheme,
        slogan: reqSlogan,
        validity_date: reqValidity,
        qty: Number(reqQty) || 10,
        voucher_value: reqVoucherValue,
        created_by: loggedInMasterUser?.full_name || currentUser?.full_name || 'Umum'
      });
      toast.success('Permintaan voucher berhasil dikirim!');
      setReqRequesterName('');
      setReqDept('');
      setReqTheme('');
      setReqSlogan('');
      setReqDeadline('');
      setReqValidity('');
      setReqQty(10);
      setReqVoucherValue('');
      fetchRequests();
    } catch (err: any) {
      toast.error('Gagal mengirim permintaan: ' + err.message);
    } finally {
      setReqSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.updateVoucherRequestStatus(id, status);
      toast.success(`Status berhasil diubah menjadi: ${status}`);
      fetchRequests();
    } catch (err: any) {
      toast.error('Gagal mengubah status: ' + err.message);
    }
  };

  const handleDeleteRequest = async (id: number) => {
    if (!confirm('Hapus permintaan voucher ini?')) return;
    try {
      await api.deleteVoucherRequest(id);
      toast.success('Permintaan voucher berhasil dihapus');
      fetchRequests();
    } catch (err: any) {
      toast.error('Gagal menghapus: ' + err.message);
    }
  };

  const handlePrintUserVoucher = (req: any) => {
    let tempTemplate: IVoucherTemplate;
    if (req.design_data) {
      try {
        tempTemplate = JSON.parse(req.design_data);
        tempTemplate.authorizedName = 'PUJI SULASTIANA'; // Force to Puji Sulastiana
      } catch (e) {
        console.error('Gagal mem-parse design_data, menggunakan default', e);
        tempTemplate = {
          id: `temp_${req.id}`,
          name: req.theme,
          title: 'VOUCHER EVENT',
          subtitle: req.theme.toUpperCase(),
          category: req.department,
          slogan: req.slogan || 'Silaturahmi & Sinergi Untuk Kebersamaan yang Lebih Kuat',
          value: 'Rp 50.000',
          validity: req.validity_date ? formatVoucherValidityDate(req.validity_date) : '',
          authorizedByLabel: 'Disahkan oleh',
          authorizedName: 'PUJI SULASTIANA',
          authorizedTitle: 'Bag. Panitia',
          serialPrefix: 'EVT-',
          footerText: 'KOPERASI KONSUMEN KARYAWAN DWI KARYA - GREAT GIANT FOODS',
          terms: [
            'Hanya berlaku jika ada cap dan tanda tangan petugas',
            'Tidak berlaku bila rusak (sobek, tercuci, coretan, dll)',
            'Tidak dapat diuangkan, hanya untuk transaksi di Toko Konsumsi K3DK'
          ],
          bgColor: '#ffffff',
          bgGradient: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 50%, #fefce8 100%)',
          bgType: 'gradient',
          bgImageUrl: '',
          titleColor: '#15803d',
          subtitleColor: '#15803d',
          textColor: '#334155',
          valueColor: '#15803d',
          accentColor: '#15803d',
          footerBgColor: '#15803d',
          footerTextColor: '#ffffff',
          fontFamily: 'font-sans',
          width: 800,
          height: 320,
          titleSize: 32,
          subtitleSize: 14,
          valueSize: 48,
          termsSize: 9,
          showQr: false,
          qrX: 0,
          qrY: 0,
          serialX: 0,
          serialY: 0,
          serialSize: 11
        };
      }
    } else {
      tempTemplate = {
        id: `temp_${req.id}`,
        name: req.theme,
        title: 'VOUCHER EVENT',
        subtitle: req.theme.toUpperCase(),
        category: req.department,
        slogan: req.slogan || 'Silaturahmi & Sinergi Untuk Kebersamaan yang Lebih Kuat',
        value: 'Rp 50.000',
        validity: req.validity_date ? formatVoucherValidityDate(req.validity_date) : '',
        authorizedByLabel: 'Disahkan oleh',
        authorizedName: 'PUJI SULASTIANA',
        authorizedTitle: 'Bag. Panitia',
        serialPrefix: 'EVT-',
        footerText: 'KOPERASI KONSUMEN KARYAWAN DWI KARYA - GREAT GIANT FOODS',
        terms: [
          'Hanya berlaku jika ada cap dan tanda tangan petugas',
          'Tidak berlaku bila rusak (sobek, tercuci, coretan, dll)',
          'Tidak dapat diuangkan, hanya untuk transaksi di Toko Konsumsi K3DK'
        ],
        bgColor: '#ffffff',
        bgGradient: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 50%, #fefce8 100%)',
        bgType: 'gradient',
        bgImageUrl: '',
        titleColor: '#15803d',
        subtitleColor: '#15803d',
        textColor: '#334155',
        valueColor: '#15803d',
        accentColor: '#15803d',
        footerBgColor: '#15803d',
        footerTextColor: '#ffffff',
        fontFamily: 'font-sans',
        width: 800,
        height: 320,
        titleSize: 32,
        subtitleSize: 14,
        valueSize: 48,
        termsSize: 9,
        showQr: false,
        qrX: 0,
        qrY: 0,
        serialX: 0,
        serialY: 0,
        serialSize: 11
      };
    }

    let tempRecords: IVoucherRecord[] = [];
    if (globalVoucherEnabled) {
      const currentNext = globalVoucherNextNumber;
      tempRecords = Array.from({ length: req.qty }, (_, i) => {
        const generatedNum = (currentNext + i).toString().padStart(globalVoucherPadding, '0');
        return {
          id: `temp_rec_${i}`,
          serialNumber: `${globalVoucherPrefix}${generatedNum}`,
          recipientName: 'Peserta Event',
          department: req.department,
          status: 'Belum Dicetak'
        };
      });
      setGlobalVoucherNextNumber(prev => prev + req.qty);
      toast.success(`Mengalokasikan nomor seri global ${globalVoucherPrefix}${currentNext.toString().padStart(globalVoucherPadding, '0')} s.d ${globalVoucherPrefix}${(currentNext + req.qty - 1).toString().padStart(globalVoucherPadding, '0')}!`);
    } else {
      const startNum = 100001 + Math.floor(Math.random() * 80000);
      tempRecords = Array.from({ length: req.qty }, (_, i) => ({
        id: `temp_rec_${i}`,
        serialNumber: (startNum + i).toString(),
        recipientName: 'Peserta Event',
        department: req.department,
        status: 'Belum Dicetak'
      }));
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Gagal membuka jendela cetak. Izinkan pop-up.');
      return;
    }

    const cssRules = `${printGlobalCssRules}\n${generateCardCssRules(tempTemplate)}`;
    let htmlContent = '';

    if (printLayout === '4-per-a4') {
      const chunked: IVoucherRecord[][] = [];
      for (let i = 0; i < tempRecords.length; i += 4) {
        chunked.push(tempRecords.slice(i, i + 4));
      }

      const pagesHtml = chunked.map((pageVouchers) => {
        const vouchersHtml = pageVouchers.map((rec) => {
          const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(rec.serialNumber)}`;
          return `
            <div class="card-print-scale-wrapper-4">
              <div class="print-voucher-card ${tempTemplate.fontFamily}">
                <div class="voucher-header">
                  ${logoLeft ? `<img src="${logoLeft}" class="logo-img" alt="GGF Logo" />` : '<div style="width:40px"></div>'}
                  <div class="header-title-container">
                    <h1 class="voucher-main-title">${tempTemplate.title}</h1>
                    <div class="voucher-subtitle">${tempTemplate.subtitle}</div>
                    <div class="voucher-category">${tempTemplate.category}</div>
                  </div>
                  ${logoRight ? `<img src="${logoRight}" class="logo-img" alt="KDK Logo" />` : '<div style="width:40px"></div>'}
                </div>

                <div class="voucher-body">
                  <div class="body-left">
                    <div class="voucher-slogan">"${tempTemplate.slogan}"</div>
                    <div class="voucher-value">${formatRupiah(tempTemplate.value)}</div>
                    <div class="voucher-validity-box">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #dc2626"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      <span>${tempTemplate.validity}</span>
                    </div>
                  </div>

                  <div class="body-right">
                    <div class="authorized-section">
                      <span class="auth-label">${tempTemplate.authorizedByLabel}</span>
                      <span class="auth-name">${tempTemplate.authorizedName}</span>
                      <span class="auth-title">${tempTemplate.authorizedTitle}</span>
                    </div>
                    
                    <div style="display:flex; justify-content: space-between; align-items: flex-end; transform: translate(${tempTemplate.qrSerialX ?? 0}px, ${tempTemplate.qrSerialY ?? 0}px); position: relative; width: 100%;">
                      ${tempTemplate.showQr !== false ? `
                        <div style="background: white; padding: 3px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.1); display: flex; transform: translate(${tempTemplate.qrX ?? 0}px, ${tempTemplate.qrY ?? 0}px); position: relative;">
                          <img src="${qrDataUrl}" alt="QR Code" width="${tempTemplate.qrSize ?? 40}" height="${tempTemplate.qrSize ?? 40}" />
                        </div>
                      ` : '<div style="width: 0; height: 0; overflow: hidden;"></div>'}
                      
                      <div class="serial-box">
                        ${tempTemplate.serialPrefix}${rec.serialNumber}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="terms-section">
                  <div class="terms-title">Syarat & Ketentuan :</div>
                  <ul class="terms-list">
                    ${tempTemplate.terms.map(t => `<li class="terms-item">${t}</li>`).join('')}
                  </ul>
                </div>

                <div class="voucher-footer">
                  ${tempTemplate.footerText}
                </div>
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="print-page">
            ${vouchersHtml}
          </div>
        `;
      }).join('');

      htmlContent = `
        <html>
          <head>
            <title>Cetak Voucher Event - ${req.theme}</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap">
            <style>${cssRules}</style>
          </head>
          <body>
            <button class="print-btn-floating no-print" onclick="window.print()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Mulai Cetak Sekarang (Print / Save PDF)
            </button>
            
            <div class="print-pages-container">
              ${pagesHtml}
            </div>
          </body>
        </html>
      `;
    } else {
      const vouchersHtml = tempRecords.map((rec, idx) => {
        const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(rec.serialNumber)}`;
        const wrapperClass = printLayout === 'custom' ? 'card-print-scale-wrapper-custom' : `card-print-scale-wrapper-${printLayout === '2-col' ? '2' : '1'}`;
        return `
          <div class="${wrapperClass} ${idx > 0 && idx % (printLayout === '2-col' ? 6 : 3) === 0 ? 'page-break' : ''}">
            <div class="print-voucher-card ${tempTemplate.fontFamily}">
              <div class="voucher-header">
                ${logoLeft ? `<img src="${logoLeft}" class="logo-img" alt="GGF Logo" />` : '<div style="width:40px"></div>'}
                <div class="header-title-container">
                  <h1 class="voucher-main-title">${tempTemplate.title}</h1>
                  <div class="voucher-subtitle">${tempTemplate.subtitle}</div>
                  <div class="voucher-category">${tempTemplate.category}</div>
                </div>
                ${logoRight ? `<img src="${logoRight}" class="logo-img" alt="KDK Logo" />` : '<div style="width:40px"></div>'}
              </div>

              <div class="voucher-body">
                <div class="body-left">
                  <div class="voucher-slogan">"${tempTemplate.slogan}"</div>
                  <div class="voucher-value">${formatRupiah(tempTemplate.value)}</div>
                  <div class="voucher-validity-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #dc2626"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>${tempTemplate.validity}</span>
                  </div>
                </div>

                <div class="body-right">
                  <div class="authorized-section">
                    <span class="auth-label">${tempTemplate.authorizedByLabel}</span>
                    <span class="auth-name">${tempTemplate.authorizedName}</span>
                    <span class="auth-title">${tempTemplate.authorizedTitle}</span>
                  </div>
                  
                  <div style="display:flex; justify-content: space-between; align-items: flex-end; transform: translate(${tempTemplate.qrSerialX ?? 0}px, ${tempTemplate.qrSerialY ?? 0}px); position: relative; width: 100%;">
                    ${tempTemplate.showQr !== false ? `
                      <div style="background: white; padding: 3px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.1); display: flex; transform: translate(${tempTemplate.qrX ?? 0}px, ${tempTemplate.qrY ?? 0}px); position: relative;">
                        <img src="${qrDataUrl}" alt="QR Code" width="${tempTemplate.qrSize ?? 40}" height="${tempTemplate.qrSize ?? 40}" />
                      </div>
                    ` : '<div style="width:0;height:0;overflow:hidden;"></div>'}
                    
                    <div class="serial-box">
                      ${tempTemplate.serialPrefix}${rec.serialNumber}
                    </div>
                  </div>
                </div>
              </div>

              <div class="terms-section">
                <div class="terms-title">Syarat & Ketentuan :</div>
                <ul class="terms-list">
                  ${tempTemplate.terms.map(t => `<li class="terms-item">${t}</li>`).join('')}
                </ul>
              </div>

              <div class="voucher-footer">
                ${tempTemplate.footerText}
              </div>
            </div>
          </div>
        `;
      }).join('');

      htmlContent = `
        <html>
          <head>
            <title>Cetak Voucher Event - ${req.theme}</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap">
            <style>${cssRules}</style>
          </head>
          <body>
            <button class="print-btn-floating no-print" onclick="window.print()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Mulai Cetak Sekarang (Print / Save PDF)
            </button>
            
            <div class="print-grid">
              ${vouchersHtml}
            </div>
          </body>
        </html>
      `;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmBtnClass?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleTemplateChange = (field: keyof IVoucherTemplate, value: any) => {
    setTemplates(prev => prev.map(t => {
      if (t.id === activeTemplateId) {
        return { ...t, [field]: value };
      }
      return t;
    }));
  };

  const handleAddTemplate = () => {
    const newId = `t_${Date.now()}`;
    const newTpl: IVoucherTemplate = {
      ...activeTemplate,
      id: newId,
      name: `Template Baru (${templates.length + 1})`,
      title: 'VOUCHER BARU'
    };
    setTemplates(prev => [...prev, newTpl]);
    setActiveTemplateId(newId);
    toast.success('Template voucher baru berhasil ditambahkan!');
  };

  const handleDeleteTemplate = (id: string) => {
    if (templates.length <= 1) {
      toast.error('Minimal harus ada 1 template voucher!');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Template Voucher',
      message: 'Apakah Anda yakin ingin menghapus template ini beserta semua datanya? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus',
      confirmBtnClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/10',
      onConfirm: () => {
        const remaining = templates.filter(t => t.id !== id);
        setTemplates(remaining);
        setActiveTemplateId(remaining[0].id);
        localStorage.removeItem(`voucher_records_${id}`);
        toast.success('Template berhasil dihapus.');
      }
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (side === 'left') {
          setLogoLeft(base64);
          localStorage.setItem('voucher_logo_left', base64);
        } else {
          setLogoRight(base64);
          localStorage.setItem('voucher_logo_right', base64);
        }
        toast.success(`Logo ${side === 'left' ? 'Kiri' : 'Kanan'} berhasil diunggah!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        handleTemplateChange('bgImageUrl', base64);
        handleTemplateChange('bgType', 'image');
        toast.success('Background voucher berhasil diunggah!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTerm = () => {
    const currentTerms = activeTemplate.terms || [];
    handleTemplateChange('terms', [...currentTerms, 'Syarat & ketentuan baru']);
  };

  const handleUpdateTerm = (index: number, text: string) => {
    const currentTerms = [...activeTemplate.terms];
    currentTerms[index] = text;
    handleTemplateChange('terms', currentTerms);
  };

  const handleRemoveTerm = (index: number) => {
    const currentTerms = activeTemplate.terms.filter((_, i) => i !== index);
    handleTemplateChange('terms', currentTerms);
  };

  // Record actions
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    let serialToUse = newSerial.trim();
    if (globalVoucherEnabled) {
      serialToUse = `${globalVoucherPrefix}${globalVoucherNextNumber.toString().padStart(globalVoucherPadding, '0')}`;
    }

    if (!serialToUse) {
      toast.error('Nomor Seri / Kode harus diisi!');
      return;
    }
    if (records.some(r => r.serialNumber === serialToUse)) {
      toast.error('Nomor Seri sudah terdaftar! Harap sesuaikan nomor urut berikutnya agar tidak bertabrakan.');
      return;
    }
    const newRec: IVoucherRecord = {
      id: `r_${Date.now()}`,
      serialNumber: serialToUse,
      recipientName: newName.trim() || 'Umum / Guest',
      department: newDept.trim() || '-',
      status: 'Belum Dicetak'
    };
    setRecords(prev => [newRec, ...prev]);
    
    if (globalVoucherEnabled) {
      setGlobalVoucherNextNumber(prev => prev + 1);
    } else {
      setNewSerial('');
    }
    setNewName('');
    setNewDept('');
    toast.success('Penerima voucher berhasil ditambahkan!');
  };

  const handleGenerateBulk = () => {
    const count = parseInt(bulkCount as any);
    if (isNaN(count) || count <= 0) {
      toast.error('Jumlah pembuatan seri massal tidak valid!');
      return;
    }

    const newRecs: IVoucherRecord[] = [];
    let duplicateCount = 0;

    if (globalVoucherEnabled) {
      let currentNext = globalVoucherNextNumber;
      for (let i = 0; i < count; i++) {
        const generatedNum = currentNext.toString().padStart(globalVoucherPadding, '0');
        const finalSerial = `${globalVoucherPrefix}${generatedNum}`;
        
        if (records.some(r => r.serialNumber === finalSerial)) {
          duplicateCount++;
          currentNext++;
          i--; // retry with next number to ensure we get 'count' vouchers
          if (currentNext > globalVoucherNextNumber + count + 1000) {
            toast.error('Mencapai batas pencarian duplikasi nomor seri global!');
            break;
          }
          continue;
        }

        newRecs.push({
          id: `r_bulk_${Date.now()}_${i}`,
          serialNumber: finalSerial,
          recipientName: `Penerima Massal ${i + 1}`,
          department: '-',
          status: 'Belum Dicetak'
        });
        currentNext++;
      }

      if (newRecs.length > 0) {
        setGlobalVoucherNextNumber(currentNext);
        setRecords(prev => [...newRecs, ...prev]);
        toast.success(`${newRecs.length} seri voucher global berhasil di-generate secara massal!`);
        if (duplicateCount > 0) {
          toast(`${duplicateCount} nomor seri dilewati karena sudah terdaftar.`);
        }
      } else {
        toast.error('Gagal men-generate nomor seri massal global.');
      }
    } else {
      if (!bulkStart.trim()) {
        toast.error('Lengkapi data pembuatan seri massal!');
        return;
      }
      
      const startNumMatch = bulkStart.match(/\d+$/);
      if (!startNumMatch) {
        toast.error('Nomor seri awal harus diakhiri dengan angka agar bisa di-generate berurutan!');
        return;
      }
      
      const startNumStr = startNumMatch[0];
      const prefixStr = bulkStart.substring(0, bulkStart.length - startNumStr.length);
      let startNum = parseInt(startNumStr);
      const paddingLength = startNumStr.length;

      for (let i = 0; i < count; i++) {
        const generatedNum = (startNum + i).toString().padStart(paddingLength, '0');
        const finalSerial = `${bulkPrefix}${prefixStr}${generatedNum}`;
        
        if (records.some(r => r.serialNumber === finalSerial)) {
          duplicateCount++;
          continue;
        }

        newRecs.push({
          id: `r_bulk_${Date.now()}_${i}`,
          serialNumber: finalSerial,
          recipientName: `Penerima Massal ${i + 1}`,
          department: '-',
          status: 'Belum Dicetak'
        });
      }

      if (newRecs.length > 0) {
        setRecords(prev => [...newRecs, ...prev]);
        toast.success(`${newRecs.length} seri voucher berhasil di-generate secara massal!`);
        if (duplicateCount > 0) {
          toast.error(`${duplicateCount} nomor seri dilewati karena duplikat.`);
        }
      } else {
        toast.error('Semua nomor seri hasil generate sudah terdaftar sebelumnya!');
      }
    }
  };

  const handleDeleteRecord = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Penerima Voucher',
      message: 'Apakah Anda yakin ingin menghapus data penerima voucher ini?',
      confirmText: 'Ya, Hapus',
      confirmBtnClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/10',
      onConfirm: () => {
        setRecords(prev => prev.filter(r => r.id !== id));
        setSelectedRecordIds(prev => prev.filter(rid => rid !== id));
        toast.success('Data penerima dihapus.');
      }
    });
  };

  const handleClearAllRecords = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Semua Data',
      message: 'Apakah Anda yakin ingin menghapus SEMUA data penerima voucher untuk template ini?',
      confirmText: 'Ya, Hapus Semua',
      confirmBtnClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/10',
      onConfirm: () => {
        setRecords([]);
        setSelectedRecordIds([]);
        toast.success('Semua data dibersihkan.');
      }
    });
  };

  const handleSelectAllRecords = () => {
    if (selectedRecordIds.length === filteredRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(filteredRecords.map(r => r.id));
    }
  };

  const handleToggleSelectRecord = (id: string) => {
    setSelectedRecordIds(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const handleStartEditRecord = (rec: IVoucherRecord) => {
    setEditingRecordId(rec.id);
    setEditSerial(rec.serialNumber);
    setEditName(rec.recipientName);
    setEditDept(rec.department);
    setEditStatus(rec.status);
  };

  const handleSaveEditRecord = () => {
    if (!editSerial.trim()) {
      toast.error('Nomor seri tidak boleh kosong!');
      return;
    }
    setRecords(prev => prev.map(r => {
      if (r.id === editingRecordId) {
        return {
          ...r,
          serialNumber: editSerial.trim(),
          recipientName: editName.trim(),
          department: editDept.trim(),
          status: editStatus
        };
      }
      return r;
    }));
    setEditingRecordId(null);
    toast.success('Perubahan data berhasil disimpan!');
  };

  // Import / Export Excel Simulator
  const handleExportCSV = () => {
    const headers = ['No Seri', 'Nama Penerima', 'Departemen', 'Status'];
    const rows = records.map(r => [r.serialNumber, r.recipientName, r.department, r.status]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Voucher_${activeTemplate.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data voucher berhasil diunduh sebagai CSV!');
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          toast.error('File CSV kosong atau format salah!');
          return;
        }

        const newRecs: IVoucherRecord[] = [];
        let dupCount = 0;

        // Skip headers
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 1) {
            const serial = cols[0];
            const name = cols[1] || 'Umum';
            const dept = cols[2] || '-';
            const statusVal = (cols[3] || 'Belum Dicetak') as any;

            if (records.some(r => r.serialNumber === serial) || newRecs.some(r => r.serialNumber === serial)) {
              dupCount++;
              continue;
            }

            newRecs.push({
              id: `r_csv_${Date.now()}_${i}`,
              serialNumber: serial,
              recipientName: name,
              department: dept,
              status: statusVal
            });
          }
        }

        if (newRecs.length > 0) {
          setRecords(prev => [...newRecs, ...prev]);
          toast.success(`Berhasil mengimpor ${newRecs.length} data voucher dari CSV!`);
          if (dupCount > 0) {
            toast(`${dupCount} data di-skip karena nomor seri duplikat.`);
          }
        } else {
          toast.error('Tidak ada data baru yang valid untuk diimpor.');
        }
      } catch (err) {
        toast.error('Gagal membaca file CSV. Pastikan format kolom sesuai.');
      }
    };
    reader.readAsText(file);
  };

  // Filtering records
  const filteredRecords = records.filter(r => {
    const q = searchRecordQuery.toLowerCase();
    return r.serialNumber.toLowerCase().includes(q) || 
           r.recipientName.toLowerCase().includes(q) || 
           r.department.toLowerCase().includes(q);
  });

  // Printing Trigger
  const generateCardCssRules = (activeTemplate: IVoucherTemplate) => `
    .font-sans {
      font-family: 'Inter', system-ui, sans-serif !important;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace !important;
    }
    .font-serif {
      font-family: Georgia, serif !important;
    }
    .print-voucher-card {
      width: 800px !important;
      height: 320px !important;
      max-width: 800px !important;
      border: 2px solid ${activeTemplate.accentColor};
      border-radius: 0px;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      background: ${activeTemplate.bgType === 'image' ? `url(${activeTemplate.bgImageUrl})` : activeTemplate.bgType === 'gradient' ? activeTemplate.bgGradient : activeTemplate.bgColor};
      background-size: cover;
      background-position: center;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin: 0 auto;
      page-break-inside: avoid;
      box-shadow: none !important;
    }
    .voucher-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .logo-img {
      height: 44px;
      object-fit: contain;
    }
    .header-title-container {
      text-align: center;
      flex: 1;
    }
    .voucher-main-title {
      font-size: ${activeTemplate.titleSize}px;
      font-weight: 900;
      letter-spacing: -0.05em;
      text-transform: uppercase;
      margin: 0;
      line-height: 1;
      color: ${activeTemplate.titleColor};
      transform: translate(${activeTemplate.titleX ?? 0}px, ${activeTemplate.titleY ?? 0}px);
      position: relative;
    }
    .voucher-subtitle {
      font-size: ${activeTemplate.subtitleSize}px;
      font-weight: 800;
      margin-top: 4px;
      color: ${activeTemplate.subtitleColor};
      transform: translate(${activeTemplate.subtitleX ?? 0}px, ${activeTemplate.subtitleY ?? 0}px);
      position: relative;
    }
    .voucher-category {
      display: inline-block;
      background-color: ${activeTemplate.accentColor};
      color: #fff;
      font-weight: 800;
      font-size: ${activeTemplate.categorySize ?? 10}px;
      padding: 3px 14px;
      border-radius: 9999px;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transform: translate(${activeTemplate.categoryX ?? 0}px, ${activeTemplate.categoryY ?? 0}px);
      position: relative;
    }
    .voucher-body {
      flex: 1;
      display: flex;
      padding: 10px 24px;
      gap: 16px;
      min-height: 0;
      position: relative;
      z-index: 10;
    }
    .body-left {
      flex: 1.5;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
    }
    .voucher-slogan {
      font-size: ${activeTemplate.sloganSize ?? 10}px;
      font-weight: 700;
      font-style: italic;
      color: ${activeTemplate.textColor};
      opacity: 0.85;
      transform: translate(${activeTemplate.sloganX ?? 0}px, ${activeTemplate.sloganY ?? 0}px);
      position: relative;
    }
    .voucher-value {
      font-size: ${activeTemplate.valueSize}px;
      font-weight: 900;
      color: ${activeTemplate.valueColor};
      line-height: 1;
      margin: 6px 0;
      text-shadow: 2px 2px 0px rgba(254, 240, 138, 0.4);
      transform: translate(${activeTemplate.valueX ?? 0}px, ${activeTemplate.valueY ?? 0}px);
      position: relative;
    }
    .voucher-validity-box {
      border: 1px dashed ${activeTemplate.accentColor};
      background: rgba(255,255,255,0.6);
      padding: 5px 12px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: ${activeTemplate.validitySize ?? 9}px;
      font-weight: 800;
      color: #b91c1c;
      align-self: flex-start;
      transform: translate(${activeTemplate.validityX ?? 0}px, ${activeTemplate.validityY ?? 0}px);
      position: relative;
    }
    .body-right {
      flex: 1;
      border-left: 1px dashed rgba(0,0,0,0.1);
      padding-left: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: right;
    }
    .authorized-section {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      transform: translate(${activeTemplate.authorizedX ?? 0}px, ${activeTemplate.authorizedY ?? 0}px);
      position: relative;
    }
    .auth-label {
      font-size: ${activeTemplate.authorizedByLabelSize ?? 10}px;
      font-weight: 600;
      color: ${activeTemplate.textColor};
      opacity: 0.7;
      transform: translate(${activeTemplate.authorizedByLabelX ?? 0}px, ${activeTemplate.authorizedByLabelY ?? 0}px);
      position: relative;
      display: block;
    }
    .auth-name {
      font-size: ${activeTemplate.authorizedNameSize ?? 12}px;
      font-weight: 900;
      text-decoration: underline;
      margin-top: 24px;
      color: ${activeTemplate.textColor};
      transform: translate(${activeTemplate.authorizedNameX ?? 0}px, ${activeTemplate.authorizedNameY ?? 0}px);
      position: relative;
      display: block;
    }
    .auth-title {
      font-size: ${activeTemplate.authorizedTitleSize ?? 9}px;
      font-weight: 700;
      color: ${activeTemplate.textColor};
      opacity: 0.8;
      transform: translate(${activeTemplate.authorizedTitleX ?? 0}px, ${activeTemplate.authorizedTitleY ?? 0}px);
      position: relative;
      display: block;
    }
    .serial-box {
      background: #fcd34d;
      color: #0f172a;
      font-weight: 900;
      font-size: ${activeTemplate.serialSize ?? 11}px;
      padding: 4px 10px;
      border-radius: 6px;
      display: inline-block;
      font-family: monospace;
      letter-spacing: 0.1em;
      transform: translate(${activeTemplate.serialX ?? 0}px, ${activeTemplate.serialY ?? 0}px);
      position: relative;
    }
    .terms-section {
      border-top: 1px solid rgba(0,0,0,0.06);
      padding: 8px 24px;
      background: rgba(255,255,255,0.3);
      transform: translate(${activeTemplate.termsX ?? 0}px, ${activeTemplate.termsY ?? 0}px);
      position: relative;
      z-index: 1;
    }
    .terms-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: ${activeTemplate.accentColor};
      margin-bottom: 2px;
    }
    .terms-list {
      margin: 0;
      padding-left: 12px;
      list-style-type: disc;
    }
    .terms-item {
      font-size: ${activeTemplate.termsSize}px;
      font-weight: 600;
      color: ${activeTemplate.textColor};
      opacity: 0.9;
      line-height: 1.2;
    }
    .voucher-footer {
      background-color: ${activeTemplate.footerBgColor};
      color: ${activeTemplate.footerTextColor};
      font-size: ${activeTemplate.footerSize ?? 8}px;
      font-weight: 900;
      text-align: center;
      padding: 4px 0;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      transform: translate(${activeTemplate.footerX ?? 0}px, ${activeTemplate.footerY ?? 0}px);
      position: relative;
    }
    .print-btn-floating {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #10b981;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 9999px;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 9999;
    }
    .print-btn-floating:hover {
      background: #059669;
    }

    /* Precision scale wrappers to ensure 100% identical layout in print vs editor */
    .card-print-scale-wrapper-4 {
      width: 160mm;
      height: 64mm;
      position: relative;
      overflow: visible;
      margin: 0 auto;
    }
    .card-print-scale-wrapper-4 .print-voucher-card {
      transform: scale(0.75);
      transform-origin: top left;
      position: absolute;
      top: 0;
      left: 0;
      box-shadow: none !important;
    }
    
    .card-print-scale-wrapper-1 {
      width: 180mm;
      height: 72mm;
      position: relative;
      overflow: visible;
      margin: 15px auto;
    }
    .card-print-scale-wrapper-1 .print-voucher-card {
      transform: scale(0.85);
      transform-origin: top left;
      position: absolute;
      top: 0;
      left: 0;
      box-shadow: none !important;
    }
    
    .card-print-scale-wrapper-2 {
      width: 90mm;
      height: 36mm;
      position: relative;
      overflow: visible;
      margin: 10px auto;
    }
    .card-print-scale-wrapper-2 .print-voucher-card {
      transform: scale(0.425);
      transform-origin: top left;
      position: absolute;
      top: 0;
      left: 0;
      box-shadow: none !important;
    }
    .card-print-scale-wrapper-custom {
      width: ${customPrintWidthCm * 10}mm;
      height: ${customPrintHeightCm * 10}mm;
      position: relative;
      overflow: visible;
      margin: 15px auto;
    }
    .card-print-scale-wrapper-custom .print-voucher-card {
      transform: scale(${customPrintWidthCm / 21.166666}, ${customPrintHeightCm / 8.466666});
      transform-origin: top left;
      position: absolute;
      top: 0;
      left: 0;
      box-shadow: none !important;
    }
  `;

  const printGlobalCssRules = `
    @media print {
      @page {
        size: ${printLayout === '4-per-a4' ? 'A4 portrait' : 'auto'};
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print { display: none !important; }
      .page-break { page-break-after: always; }
    }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: #f1f5f9;
      margin: ${printLayout === '4-per-a4' ? '0' : '20px'};
    }
    .print-page {
      width: 210mm;
      height: 297mm;
      box-sizing: border-box;
      padding: 8mm;
      display: flex;
      flex-direction: column;
      gap: 2mm;
      background: #fff;
      page-break-after: always;
      page-break-inside: avoid;
    }
    @media print {
      .print-page {
        border: none;
        box-shadow: none;
      }
      .print-page:last-child {
        page-break-after: avoid;
      }
    }
    @media screen {
      .print-page {
        margin: 20px auto;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        border: 1px solid #e2e8f0;
        border-radius: 12px;
      }
    }
    .print-grid {
      display: grid;
      grid-template-columns: ${printLayout === '2-col' ? '1fr 1fr' : '1fr'};
      gap: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
  `;

  const handlePrint = () => {
    const idsToPrint = selectedRecordIds.length > 0 ? selectedRecordIds : records.map(r => r.id);
    if (idsToPrint.length === 0) {
      toast.error('Tidak ada voucher yang dipilih untuk dicetak!');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Gagal membuka jendela cetak. Izinkan pop-up untuk aplikasi ini.');
      return;
    }

    const vouchersToPrint = records.filter(r => idsToPrint.includes(r.id));

    // Update status to 'Dicetak' for printed records
    setRecords(prev => prev.map(r => {
      if (idsToPrint.includes(r.id)) {
        return { ...r, status: 'Dicetak', printedAt: new Date().toLocaleString('id-ID') };
      }
      return r;
    }));

    const cssRules = `${printGlobalCssRules}\n${generateCardCssRules(activeTemplate)}`;

    let htmlContent = '';

    if (printLayout === '4-per-a4') {
      // Chunk vouchers to 4 per page
      const chunked: IVoucherRecord[][] = [];
      for (let i = 0; i < vouchersToPrint.length; i += 4) {
        chunked.push(vouchersToPrint.slice(i, i + 4));
      }

      const pagesHtml = chunked.map((pageVouchers, pageIdx) => {
        const vouchersHtml = pageVouchers.map((rec) => {
          const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(rec.serialNumber)}`;
          return `
            <div class="card-print-scale-wrapper-4">
              <div class="print-voucher-card ${activeTemplate.fontFamily}">
                <!-- Header -->
                <div class="voucher-header">
                  ${logoLeft ? `<img src="${logoLeft}" class="logo-img" alt="GGF Logo" />` : '<div style="width:40px"></div>'}
                  <div class="header-title-container">
                    <h1 class="voucher-main-title">${activeTemplate.title}</h1>
                    <div class="voucher-subtitle">${activeTemplate.subtitle}</div>
                    <div class="voucher-category">${activeTemplate.category}</div>
                  </div>
                  ${logoRight ? `<img src="${logoRight}" class="logo-img" alt="KDK Logo" />` : '<div style="width:40px"></div>'}
                </div>

                <!-- Body -->
                <div class="voucher-body">
                  <!-- Left Body -->
                  <div class="body-left">
                    <div class="voucher-slogan">"${activeTemplate.slogan}"</div>
                    <div class="voucher-value">${formatRupiah(activeTemplate.value)}</div>
                    <div class="voucher-validity-box">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #dc2626"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      <span>${activeTemplate.validity}</span>
                    </div>
                  </div>

                  <!-- Right Body (QR + Signature) -->
                  <div class="body-right">
                    <div class="authorized-section">
                      <span class="auth-label">${activeTemplate.authorizedByLabel}</span>
                      <span class="auth-name">${activeTemplate.authorizedName}</span>
                      <span class="auth-title">${activeTemplate.authorizedTitle}</span>
                    </div>
                    
                    <div style="display:flex; justify-content: space-between; align-items: flex-end; transform: translate(${activeTemplate.qrSerialX ?? 0}px, ${activeTemplate.qrSerialY ?? 0}px); position: relative; width: 100%;">
                      <!-- Mini QR representing voucher number -->
                      ${activeTemplate.showQr !== false ? `
                      <div style="background: white; padding: 3px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.1); display: flex; transform: translate(${activeTemplate.qrX ?? 0}px, ${activeTemplate.qrY ?? 0}px); position: relative;">
                        <img src="${qrDataUrl}" style="width: ${activeTemplate.qrSize ?? 40}px; height: ${activeTemplate.qrSize ?? 40}px;" alt="QR Code" />
                      </div>
                      ` : '<div style="width:0;height:0;overflow:hidden;"></div>'}
                      
                      <div class="serial-box">
                        ${activeTemplate.serialPrefix}${rec.serialNumber}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Syarat & Ketentuan -->
                <div class="terms-section">
                  <div class="terms-title">Syarat & Ketentuan :</div>
                  <ul class="terms-list">
                    ${activeTemplate.terms.map(t => `<li class="terms-item">${t}</li>`).join('')}
                  </ul>
                </div>

                <!-- Footer Running text -->
                <div class="voucher-footer">
                  ${activeTemplate.footerText}
                </div>
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="print-page">
            ${vouchersHtml}
          </div>
        `;
      }).join('');

      htmlContent = `
        <html>
          <head>
            <title>Cetak Voucher - ${activeTemplate.name}</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap">
            <style>${cssRules}</style>
          </head>
          <body>
            <button class="print-btn-floating no-print" onclick="window.print()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Mulai Cetak Sekarang (Print / Save PDF)
            </button>
            
            <div class="print-pages-container">
              ${pagesHtml}
            </div>
          </body>
        </html>
      `;
    } else {
      const vouchersHtml = vouchersToPrint.map((rec, idx) => {
        const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(rec.serialNumber)}`;
        const wrapperClass = printLayout === 'custom' ? 'card-print-scale-wrapper-custom' : `card-print-scale-wrapper-${printLayout === '2-col' ? '2' : '1'}`;
        return `
          <div class="${wrapperClass} ${idx > 0 && idx % (printLayout === '2-col' ? 6 : 3) === 0 ? 'page-break' : ''}">
            <div class="print-voucher-card ${activeTemplate.fontFamily}">
              <!-- Header -->
              <div class="voucher-header">
                ${logoLeft ? `<img src="${logoLeft}" class="logo-img" alt="GGF Logo" />` : '<div style="width:40px"></div>'}
                <div class="header-title-container">
                  <h1 class="voucher-main-title">${activeTemplate.title}</h1>
                  <div class="voucher-subtitle">${activeTemplate.subtitle}</div>
                  <div class="voucher-category">${activeTemplate.category}</div>
                </div>
                ${logoRight ? `<img src="${logoRight}" class="logo-img" alt="KDK Logo" />` : '<div style="width:40px"></div>'}
              </div>

              <!-- Body -->
              <div class="voucher-body">
                <!-- Left Body -->
                <div class="body-left">
                  <div class="voucher-slogan">"${activeTemplate.slogan}"</div>
                  <div class="voucher-value">${formatRupiah(activeTemplate.value)}</div>
                  <div class="voucher-validity-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #dc2626"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>${activeTemplate.validity}</span>
                  </div>
                </div>

                <!-- Right Body (QR + Signature) -->
                <div class="body-right">
                  <div class="authorized-section">
                    <span class="auth-label">${activeTemplate.authorizedByLabel}</span>
                    <span class="auth-name">${activeTemplate.authorizedName}</span>
                    <span class="auth-title">${activeTemplate.authorizedTitle}</span>
                  </div>
                  
                  <div style="display:flex; justify-content: space-between; align-items: flex-end; transform: translate(${activeTemplate.qrSerialX ?? 0}px, ${activeTemplate.qrSerialY ?? 0}px); position: relative; width: 100%;">
                    <!-- Mini QR representing voucher number -->
                    ${activeTemplate.showQr !== false ? `
                    <div style="background: white; padding: 3px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.1); display: flex; transform: translate(${activeTemplate.qrX ?? 0}px, ${activeTemplate.qrY ?? 0}px); position: relative;">
                      <img src="${qrDataUrl}" style="width: ${activeTemplate.qrSize ?? 40}px; height: ${activeTemplate.qrSize ?? 40}px;" alt="QR Code" />
                    </div>
                    ` : '<div style="width:0;height:0;overflow:hidden;"></div>'}
                    
                    <div class="serial-box">
                      ${activeTemplate.serialPrefix}${rec.serialNumber}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Syarat & Ketentuan -->
              <div class="terms-section">
                <div class="terms-title">Syarat & Ketentuan :</div>
                <ul class="terms-list">
                  ${activeTemplate.terms.map(t => `<li class="terms-item">${t}</li>`).join('')}
                </ul>
              </div>

              <!-- Footer Running text -->
              <div class="voucher-footer">
                ${activeTemplate.footerText}
              </div>
            </div>
          </div>
        `;
      }).join('');

      htmlContent = `
        <html>
          <head>
            <title>Cetak Voucher - ${activeTemplate.name}</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap">
            <style>${cssRules}</style>
          </head>
          <body>
            <button class="print-btn-floating no-print" onclick="window.print()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Mulai Cetak Sekarang (Print / Save PDF)
            </button>
            
            <div class="print-grid">
              ${vouchersHtml}
            </div>
          </body>
        </html>
      `;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const scaleFactor = (() => {
    if (previewScale === '100') return 1;
    if (previewScale === '75') return 0.75;
    if (previewScale === '50') return 0.5;
    const availableWidth = containerWidth - 48;
    return Math.min(1, Math.max(0.35, availableWidth / 800));
  })();

  if (!adminUser) {
    const handleExportMyRequestsExcel = (filteredRequests: any[]) => {
      if (filteredRequests.length === 0) {
        toast.error("Tidak ada data untuk diexport.");
        return;
      }

      // Headers
      const headers = [
        "No",
        "ID Pengajuan",
        "Pemohon",
        "Departemen",
        "Tema / Agenda Event",
        "Slogan",
        "Nilai Voucher (Rp)",
        "Jumlah (Qty)",
        "Masa Berlaku",
        "Deadline Pembuatan",
        "Status",
        "Tanggal Pengajuan"
      ];

      // Build CSV Content (semicolon delimited for perfect Excel auto-column parsing on Indonesian/European locales, and quoted strings)
      const csvRows = [headers.join(";")];

      filteredRequests.forEach((req, idx) => {
        const row = [
          idx + 1,
          req.id,
          `"${(req.requester_name || '').replace(/"/g, '""')}"`,
          `"${(req.department || '').replace(/"/g, '""')}"`,
          `"${(req.theme || '').replace(/"/g, '""')}"`,
          `"${(req.slogan || '').replace(/"/g, '""')}"`,
          `"${formatRupiah(req.voucher_value).replace(/"/g, '""')}"`,
          req.qty,
          req.validity_date ? formatIndonesianDateOnly(req.validity_date) : '',
          req.deadline ? formatIndonesianDateOnly(req.deadline) : '',
          req.status,
          req.created_at ? new Date(req.created_at).toLocaleDateString('id-ID') : ''
        ];
        csvRows.push(row.join(";"));
      });

      // Use UTF-8 BOM so Excel opens it with correct encoding
      const csvContent = "\uFEFF" + csvRows.join("\r\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Riwayat_Pengajuan_Voucher_${currentUser?.full_name || 'User'}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Berhasil mengunduh file export Excel (CSV)!");
    };

    const allMyRequests = voucherRequests
      .filter(r => 
        r.created_by === (loggedInMasterUser?.full_name || currentUser?.full_name || 'Umum') ||
        r.requester_name === (loggedInMasterUser?.full_name || currentUser?.full_name || 'Umum')
      )
      .sort((a, b) => b.id - a.id);

    const myRequests = allMyRequests.filter(r => {
      // 1. Status Filter
      if (historyStatusFilter !== 'Semua' && r.status !== historyStatusFilter) {
        return false;
      }
      // 2. Keyword Search
      if (historySearchQuery) {
        const query = historySearchQuery.toLowerCase();
        const themeMatch = (r.theme || '').toLowerCase().includes(query);
        const sloganMatch = (r.slogan || '').toLowerCase().includes(query);
        const deptMatch = (r.department || '').toLowerCase().includes(query);
        const requesterMatch = (r.requester_name || '').toLowerCase().includes(query);
        const valueMatch = (r.voucher_value || '').toLowerCase().includes(query);
        const statusMatch = (r.status || '').toLowerCase().includes(query);
        return themeMatch || sloganMatch || deptMatch || requesterMatch || valueMatch || statusMatch;
      }
      return true;
    });

    return (
      <div className="space-y-6 text-left animate-fade-in">
        {/* Top Banner */}
        <div className={`p-6 rounded-3xl ${themeClasses.card} border shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          <div>
            <h1 className="text-xl font-black flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Printer className="w-6 h-6" />
              Layanan Mandiri Cetak Voucher Event
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-2xl font-semibold">
              Kirim permintaan pencetakan voucher untuk event / agenda bagian Anda. Setelah disetujui (Status: Done) oleh Admin, Anda dapat langsung mencetak voucher tersebut secara mandiri dengan format halaman A4 yang rapi dan presisi.
            </p>
          </div>
          <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider shrink-0">
            Hak Akses: Pemohon Voucher
          </div>
        </div>

        {/* Form and List Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Side: Request Form (col-span-5) */}
          <div className="xl:col-span-5 space-y-4">
            <div className={`${themeClasses.card} border rounded-3xl p-6 shadow-xs space-y-4`}>
              <div>
                <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Formulir Pengajuan Baru</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Lengkapi data berikut untuk mengajukan pencetakan voucher.</p>
              </div>

              <form onSubmit={handleCreateRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pemohon / Instansi Luar</label>
                  <input
                    type="text"
                    value={reqRequesterName}
                    onChange={(e) => setReqRequesterName(e.target.value)}
                    placeholder="Contoh: Panitia Event / Nama Pemohon"
                    className="w-full px-3 py-2 text-xs font-bold border rounded-xl dark:bg-slate-800 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bagian / Departemen Pengaju</label>
                  <input
                    type="text"
                    value={reqDept}
                    onChange={(e) => setReqDept(e.target.value)}
                    placeholder="Contoh: Plantation III / Finance HQ"
                    className="w-full px-3 py-2 text-xs font-bold border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tema / Agenda Event</label>
                  <input
                    type="text"
                    value={reqTheme}
                    onChange={(e) => setReqTheme(e.target.value)}
                    placeholder="Contoh: Pembagian Sembako Karyawan"
                    className="w-full px-3 py-2 text-xs font-bold border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Slogan Event / Bagian</label>
                  <input
                    type="text"
                    value={reqSlogan}
                    onChange={(e) => setReqSlogan(e.target.value)}
                    placeholder="Contoh: Silaturahmi & Sinergi Untuk Kebersamaan"
                    className="w-full px-3 py-2 text-xs font-bold border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="h-8 flex items-end text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pb-1">Deadline Pembuatan</label>
                    <input
                      type="date"
                      value={reqDeadline}
                      onChange={(e) => setReqDeadline(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="h-8 flex items-end text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pb-1">Masa Berlaku Voucher</label>
                    <input
                      type="date"
                      value={reqValidity}
                      onChange={(e) => setReqValidity(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nilai Voucher (Rp)</label>
                  <input
                    type="text"
                    value={reqVoucherValue}
                    onChange={(e) => setReqVoucherValue(e.target.value)}
                    placeholder="Contoh: Rp 50.000"
                    className="w-full px-3 py-2 text-xs font-bold border rounded-xl dark:bg-slate-800 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jumlah Voucher (Qty)</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={reqQty}
                    onChange={(e) => setReqQty(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs font-bold border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reqSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-center"
                >
                  {reqSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Kirim Pengajuan Sekarang
                </button>
              </form>
            </div>
          </div>

          {/* Right Side: Requests History (col-span-7) */}
          <div className="xl:col-span-7 space-y-4">
            <div className={`${themeClasses.card} border rounded-3xl p-6 shadow-xs space-y-4`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    Riwayat Pengajuan Saya ({myRequests.length})
                    {allMyRequests.length !== myRequests.length && (
                      <span className="text-[10px] text-indigo-500 font-bold">
                        (Difilter dari {allMyRequests.length})
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Pantau status permintaan voucher Anda di bawah ini.</p>
                </div>
                
                {/* Export Button */}
                <button
                  type="button"
                  onClick={() => handleExportMyRequestsExcel(myRequests)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 self-start md:self-auto shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Export Excel (CSV)
                </button>
              </div>

              {/* Filter Controls Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                {/* Search Keyword */}
                <div className="md:col-span-7 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Cari tema, slogan, bagian, nilai..."
                    className="w-full pl-8 pr-8 py-1.5 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 bg-white"
                  />
                  {historySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute right-2.5 top-2 hover:text-red-500 transition-colors text-slate-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter Dropdown */}
                <div className="md:col-span-5 flex items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">Status:</span>
                  <select
                    value={historyStatusFilter}
                    onChange={(e) => setHistoryStatusFilter(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-bold border rounded-xl dark:bg-slate-800 dark:border-slate-700 bg-white"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Baru Diminta">Baru Diminta</option>
                    <option value="Proses">Proses</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              {reqLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-bold">Memuat data permintaan...</span>
                </div>
              ) : myRequests.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed rounded-2xl text-slate-400 space-y-2">
                  <ClipboardList className="w-10 h-10 mx-auto opacity-30" />
                  {allMyRequests.length > 0 ? (
                    <>
                      <p className="text-xs font-bold text-slate-500">Tidak ada pengajuan yang cocok dengan filter aktif.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setHistorySearchQuery('');
                          setHistoryStatusFilter('Semua');
                        }}
                        className="mt-2 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-lg text-[10px] font-bold transition-all"
                      >
                        Atur Ulang Filter
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold">Belum ada riwayat pengajuan voucher.</p>
                      <p className="text-[10px] text-slate-400 font-normal mt-1">Silakan buat pengajuan pertama Anda melalui formulir di sebelah kiri.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {myRequests.map((req) => (
                    <div 
                      key={req.id}
                      className="p-4 border rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/30 transition-all text-left"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">{req.theme}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            req.status === 'Baru Diminta'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : req.status === 'Proses'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        {req.slogan && (
                          <p className="text-[10px] text-indigo-500 italic font-bold">Slogan: "{req.slogan}"</p>
                        )}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] text-slate-500 font-semibold">
                          <div>Departemen: <span className="font-bold text-slate-700 dark:text-slate-300">{req.department}</span></div>
                          <div>Jumlah: <span className="font-bold text-slate-700 dark:text-slate-300">{req.qty} Pcs</span></div>
                          <div>Nilai Voucher: <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatRupiah(req.voucher_value)}</span></div>
                          <div>Masa Berlaku: <span className="font-bold text-slate-700 dark:text-slate-300">{req.validity_date ? formatIndonesianDateOnly(req.validity_date) : ''}</span></div>
                          <div className="col-span-2">Deadline: <span className="font-bold text-slate-700 dark:text-slate-300">{req.deadline ? formatIndonesianDateOnly(req.deadline) : ''}</span></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {req.status === 'Done' ? (
                          <button
                            type="button"
                            onClick={() => handlePrintUserVoucher(req)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black flex items-center gap-1 shadow-sm transition-all active:scale-95"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Cetak Mandiri
                          </button>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            Cetak dikunci s.d disetujui
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className={`p-6 rounded-3xl ${themeClasses.card} border shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <h1 className="text-xl font-black flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Printer className="w-6 h-6" />
            Cetak Voucher Event Dinamis
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-2xl font-semibold">
            Kelola template voucher kustom secara fleksibel. Edit teks, warna, ukuran font, syarat & ketentuan, serta upload background kustom. Generate nomor seri massal dan cetak layout A4 dengan presisi.
          </p>
        </div>

        {/* Template Selector dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <select
            value={activeTemplateId}
            onChange={(e) => setActiveTemplateId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold shadow-sm"
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <button
            onClick={handleAddTemplate}
            className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            title="Tambah Template Baru"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Baru</span>
          </button>

          <button
            onClick={() => handleDeleteTemplate(activeTemplateId)}
            className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all"
            title="Hapus Template Aktif"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Layout: Left Edit Panel, Right Interactive Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Side: Dynamic Editor Forms (6 columns) */}
        <div className="xl:col-span-5 space-y-6">
          {activeRequestId && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl border border-indigo-100 dark:border-indigo-900/60 flex flex-col gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider block">⚡ Mode Pembuatan Voucher</span>
                <span className="text-xs font-black text-slate-800 dark:text-white leading-tight block">
                  Mengedit Desain Pengajuan: "{voucherRequests.find(r => r.id === activeRequestId)?.theme}"
                </span>
                <span className="text-[10px] text-slate-500 font-bold block">
                  Silakan sesuaikan Isi Konten, Desain, dan Daftar Seri. Setelah selesai, bagikan hasil desain ke pemohon.
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleCancelDesignMode}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-black transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveDesignDraft}
                  className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-200 rounded-xl text-[10px] font-black transition-all flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan Draft
                </button>
                <button
                  type="button"
                  onClick={handleShareDesignToUser}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 shadow-sm transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share ke User
                </button>
              </div>
            </div>
          )}

          {/* Tabs header */}
          <div className={`flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto`}>
            {([
              { id: 'requests', label: `Permintaan (${voucherRequests.filter(r => r.status === 'Baru Diminta').length})` },
              { id: 'content', label: 'Isi Konten' },
              { id: 'design', label: 'Desain' },
              { id: 'recipients', label: 'Daftar Seri' },
              { id: 'print', label: 'Siap Cetak' }
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-xs font-black capitalize rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={`${themeClasses.card} border rounded-3xl p-5 shadow-sm`}>
            {/* CONTENT TAB */}
            {activeTab === 'content' && (
              <div className="space-y-4 text-left">
                <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Isi Konten Voucher</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Template (Internal)</label>
                  <input
                    type="text"
                    value={activeTemplate.name}
                    onChange={(e) => handleTemplateChange('name', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>

                {/* 1. Judul Utama */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Judul Utama</label>
                  <input
                    type="text"
                    value={activeTemplate.title}
                    onChange={(e) => handleTemplateChange('title', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                  />
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Ukuran (px)</label>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={activeTemplate.titleSize}
                        onChange={(e) => handleTemplateChange('titleSize', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi X (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.titleX ?? 0}
                        onChange={(e) => handleTemplateChange('titleX', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi Y (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.titleY ?? 0}
                        onChange={(e) => handleTemplateChange('titleY', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Sub Judul */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sub Judul</label>
                  <input
                    type="text"
                    value={activeTemplate.subtitle}
                    onChange={(e) => handleTemplateChange('subtitle', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                  />
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Ukuran (px)</label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={activeTemplate.subtitleSize}
                        onChange={(e) => handleTemplateChange('subtitleSize', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi X (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.subtitleX ?? 0}
                        onChange={(e) => handleTemplateChange('subtitleX', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi Y (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.subtitleY ?? 0}
                        onChange={(e) => handleTemplateChange('subtitleY', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Kategori / Unit Kerja */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori / Unit Kerja</label>
                  <input
                    type="text"
                    value={activeTemplate.category}
                    onChange={(e) => handleTemplateChange('category', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                  />
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Ukuran (px)</label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={activeTemplate.categorySize ?? 11}
                        onChange={(e) => handleTemplateChange('categorySize', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi X (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.categoryX ?? 0}
                        onChange={(e) => handleTemplateChange('categoryX', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi Y (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.categoryY ?? 0}
                        onChange={(e) => handleTemplateChange('categoryY', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Nilai Voucher (Rp) */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nilai Voucher (Rp)</label>
                  <input
                    type="text"
                    value={activeTemplate.value}
                    onChange={(e) => handleTemplateChange('value', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                  />
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Ukuran (px)</label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={activeTemplate.valueSize}
                        onChange={(e) => handleTemplateChange('valueSize', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi X (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.valueX ?? 0}
                        onChange={(e) => handleTemplateChange('valueX', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi Y (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.valueY ?? 0}
                        onChange={(e) => handleTemplateChange('valueY', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Slogan / Tema */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slogan / Tema</label>
                  <input
                    type="text"
                    value={activeTemplate.slogan}
                    onChange={(e) => handleTemplateChange('slogan', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                  />
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Ukuran (px)</label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={activeTemplate.sloganSize ?? 10}
                        onChange={(e) => handleTemplateChange('sloganSize', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi X (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.sloganX ?? 0}
                        onChange={(e) => handleTemplateChange('sloganX', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi Y (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.sloganY ?? 0}
                        onChange={(e) => handleTemplateChange('sloganY', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Teks Masa Berlaku */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teks Masa Berlaku</label>
                  <input
                    type="text"
                    value={activeTemplate.validity}
                    onChange={(e) => handleTemplateChange('validity', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                  />
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Ukuran (px)</label>
                      <input
                        type="number"
                        min="5"
                        max="40"
                        value={activeTemplate.validitySize ?? 9}
                        onChange={(e) => handleTemplateChange('validitySize', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi X (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.validityX ?? 0}
                        onChange={(e) => handleTemplateChange('validityX', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi Y (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.validityY ?? 0}
                        onChange={(e) => handleTemplateChange('validityY', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Barcode (QR) & Nomor Seri */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <div className="flex items-center justify-between border-b pb-1.5 border-slate-200/50 dark:border-slate-700/50">
                    <h4 className="text-[11px] font-black uppercase text-indigo-500">Barcode (QR) & Nomor Seri</h4>
                  </div>

                  {/* Barcode/QR Settings Sub-section */}
                  <div className="space-y-1.5 border-b pb-2 border-slate-200/40 dark:border-slate-700/40">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Barcode (QR Code)</label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeTemplate.showQr !== false}
                          onChange={(e) => handleTemplateChange('showQr', e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Tampilkan Barcode</span>
                      </label>
                    </div>

                    {activeTemplate.showQr !== false && (
                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase">Ukuran (px)</label>
                          <input
                            type="number"
                            min="10"
                            max="120"
                            value={activeTemplate.qrSize ?? 40}
                            onChange={(e) => handleTemplateChange('qrSize', Number(e.target.value))}
                            className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi X (px)</label>
                          <input
                            type="number"
                            value={activeTemplate.qrX ?? 0}
                            onChange={(e) => handleTemplateChange('qrX', Number(e.target.value))}
                            className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi Y (px)</label>
                          <input
                            type="number"
                            value={activeTemplate.qrY ?? 0}
                            onChange={(e) => handleTemplateChange('qrY', Number(e.target.value))}
                            className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Serial Number Settings Sub-section */}
                  <div className="space-y-1.5 border-b pb-2 border-slate-200/40 dark:border-slate-700/40">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nomor Seri Voucher</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Prefix Teks</label>
                        <input
                          type="text"
                          value={activeTemplate.serialPrefix}
                          onChange={(e) => handleTemplateChange('serialPrefix', e.target.value)}
                          className="w-full px-2 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Ukuran Font (px)</label>
                        <input
                          type="number"
                          min="5"
                          max="24"
                          value={activeTemplate.serialSize ?? 11}
                          onChange={(e) => handleTemplateChange('serialSize', Number(e.target.value))}
                          className="w-full px-2 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi X (px)</label>
                        <input
                          type="number"
                          value={activeTemplate.serialX ?? 0}
                          onChange={(e) => handleTemplateChange('serialX', Number(e.target.value))}
                          className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi Y (px)</label>
                        <input
                          type="number"
                          value={activeTemplate.serialY ?? 0}
                          onChange={(e) => handleTemplateChange('serialY', Number(e.target.value))}
                          className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Global coordinates for QR + Serial Block */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block">Posisi Offset Blok QR & Seri (Global)</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[8px] text-slate-400">X Grup</label>
                        <input
                          type="number"
                          value={activeTemplate.qrSerialX ?? 0}
                          onChange={(e) => handleTemplateChange('qrSerialX', Number(e.target.value))}
                          className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] text-slate-400">Y Grup</label>
                        <input
                          type="number"
                          value={activeTemplate.qrSerialY ?? 0}
                          onChange={(e) => handleTemplateChange('qrSerialY', Number(e.target.value))}
                          className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 8. Tanda Tangan & Pengesahan */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <div className="flex items-center justify-between border-b pb-1.5 border-slate-200/50 dark:border-slate-700/50">
                    <h4 className="text-[11px] font-black uppercase text-indigo-500">Tanda Tangan & Pengesahan</h4>
                  </div>

                  {/* Global block position */}
                  <div className="bg-slate-100/50 dark:bg-slate-800/30 p-1.5 rounded-lg grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="block text-[8px] font-bold text-indigo-400 uppercase">Posisi X Blok (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.authorizedX ?? 0}
                        onChange={(e) => handleTemplateChange('authorizedX', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-indigo-400 uppercase">Posisi Y Blok (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.authorizedY ?? 0}
                        onChange={(e) => handleTemplateChange('authorizedY', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  {/* 8a. Label (e.g. Disahkan oleh) */}
                  <div className="space-y-1 p-2 bg-white/40 dark:bg-slate-800/10 rounded-lg border border-slate-100/60 dark:border-slate-800/60">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Bagian 1: Label</span>
                    <input
                      type="text"
                      value={activeTemplate.authorizedByLabel}
                      onChange={(e) => handleTemplateChange('authorizedByLabel', e.target.value)}
                      placeholder="Disahkan oleh"
                      className="w-full px-2 py-1 text-[11px] font-bold border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                    />
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Ukuran (px)</label>
                        <input
                          type="number"
                          min="5"
                          max="30"
                          value={activeTemplate.authorizedByLabelSize ?? 10}
                          onChange={(e) => handleTemplateChange('authorizedByLabelSize', Number(e.target.value))}
                          className="w-full px-1 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi X</label>
                        <input
                          type="number"
                          value={activeTemplate.authorizedByLabelX ?? 0}
                          onChange={(e) => handleTemplateChange('authorizedByLabelX', Number(e.target.value))}
                          className="w-full px-1 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi Y</label>
                        <input
                          type="number"
                          value={activeTemplate.authorizedByLabelY ?? 0}
                          onChange={(e) => handleTemplateChange('authorizedByLabelY', Number(e.target.value))}
                          className="w-full px-1 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 8b. Nama Pengesah (e.g. PUJI SULASTIANA) */}
                  <div className="space-y-1 p-2 bg-white/40 dark:bg-slate-800/10 rounded-lg border border-slate-100/60 dark:border-slate-800/60">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Bagian 2: Nama</span>
                    <input
                      type="text"
                      value="PUJI SULASTIANA"
                      disabled
                      className="w-full px-2 py-1 text-[11px] font-bold border rounded-lg bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 cursor-not-allowed"
                    />
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Ukuran (px)</label>
                        <input
                          type="number"
                          min="5"
                          max="30"
                          value={activeTemplate.authorizedNameSize ?? 12}
                          onChange={(e) => handleTemplateChange('authorizedNameSize', Number(e.target.value))}
                          className="w-full px-1 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi X</label>
                        <input
                          type="number"
                          value={activeTemplate.authorizedNameX ?? 0}
                          onChange={(e) => handleTemplateChange('authorizedNameX', Number(e.target.value))}
                          className="w-full px-1 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi Y</label>
                        <input
                          type="number"
                          value={activeTemplate.authorizedNameY ?? 0}
                          onChange={(e) => handleTemplateChange('authorizedNameY', Number(e.target.value))}
                          className="w-full px-1 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 8c. Jabatan (e.g. Bag. Finance) */}
                  <div className="space-y-1 p-2 bg-white/40 dark:bg-slate-800/10 rounded-lg border border-slate-100/60 dark:border-slate-800/60">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Bagian 3: Jabatan / Gelar</span>
                    <input
                      type="text"
                      value={activeTemplate.authorizedTitle}
                      onChange={(e) => handleTemplateChange('authorizedTitle', e.target.value)}
                      placeholder="Jabatan"
                      className="w-full px-2 py-1 text-[11px] font-bold border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                    />
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Ukuran (px)</label>
                        <input
                          type="number"
                          min="5"
                          max="30"
                          value={activeTemplate.authorizedTitleSize ?? 10}
                          onChange={(e) => handleTemplateChange('authorizedTitleSize', Number(e.target.value))}
                          className="w-full px-1 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi X</label>
                        <input
                          type="number"
                          value={activeTemplate.authorizedTitleX ?? 0}
                          onChange={(e) => handleTemplateChange('authorizedTitleX', Number(e.target.value))}
                          className="w-full px-1 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi Y</label>
                        <input
                          type="number"
                          value={activeTemplate.authorizedTitleY ?? 0}
                          onChange={(e) => handleTemplateChange('authorizedTitleY', Number(e.target.value))}
                          className="w-full px-1 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 9. Syarat & Ketentuan */}
                <div className="border-t pt-3 space-y-2 bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase text-indigo-500">Syarat & Ketentuan</h4>
                    <button
                      type="button"
                      onClick={handleAddTerm}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Tambah Baris
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {activeTemplate.terms.map((term, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">{idx + 1}.</span>
                        <input
                          type="text"
                          value={term}
                          onChange={(e) => handleUpdateTerm(idx, e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTerm(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 mt-1">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Ukuran (px)</label>
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={activeTemplate.termsSize}
                        onChange={(e) => handleTemplateChange('termsSize', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi X (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.termsX ?? 0}
                        onChange={(e) => handleTemplateChange('termsX', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi Y (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.termsY ?? 0}
                        onChange={(e) => handleTemplateChange('termsY', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 10. Running Footer Text */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Running Footer Text</label>
                  <input
                    type="text"
                    value={activeTemplate.footerText}
                    onChange={(e) => handleTemplateChange('footerText', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                  />
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Ukuran (px)</label>
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={activeTemplate.footerSize ?? 8}
                        onChange={(e) => handleTemplateChange('footerSize', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi X (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.footerX ?? 0}
                        onChange={(e) => handleTemplateChange('footerX', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Posisi Y (px)</label>
                      <input
                        type="number"
                        value={activeTemplate.footerY ?? 0}
                        onChange={(e) => handleTemplateChange('footerY', Number(e.target.value))}
                        className="w-full px-1.5 py-0.5 text-[10px] border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={handleManualSave}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/15 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Perubahan Konten
                  </button>
                </div>
              </div>
            )}

            {/* DESIGN TAB */}
            {activeTab === 'design' && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Styling & Tata Letak</h3>

                {/* Upload Section */}
                <div className="border p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Aset Logo & Background</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-1">Logo Kiri (e.g. GGF)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(e, 'left')}
                        className="hidden"
                        id="logo-left-file"
                      />
                      <label
                        htmlFor="logo-left-file"
                        className="w-full h-10 border border-dashed rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold bg-white dark:bg-slate-800 cursor-pointer hover:border-indigo-500"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Logo Kiri
                      </label>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-1">Logo Kanan (e.g. KDK)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(e, 'right')}
                        className="hidden"
                        id="logo-right-file"
                      />
                      <label
                        htmlFor="logo-right-file"
                        className="w-full h-10 border border-dashed rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold bg-white dark:bg-slate-800 cursor-pointer hover:border-indigo-500"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Logo Kanan
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Background Template Kustom</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBgImageUpload}
                      className="hidden"
                      id="bg-image-file"
                    />
                    <label
                      htmlFor="bg-image-file"
                      className="w-full h-14 border border-dashed rounded-xl flex flex-col items-center justify-center text-[10px] font-bold bg-white dark:bg-slate-800 cursor-pointer hover:border-indigo-500"
                    >
                      <ImageIcon className="w-4 h-4 text-slate-400 mb-0.5" />
                      <span>Unggah File Background</span>
                      <span className="text-[9px] text-slate-400 font-normal">Format PNG/JPG kustom Anda</span>
                    </label>
                  </div>
                </div>

                {/* Color and Font Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipe Background</label>
                    <select
                      value={activeTemplate.bgType}
                      onChange={(e) => handleTemplateChange('bgType', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800"
                    >
                      <option value="color">Warna Solid</option>
                      <option value="gradient">Gradien Warna</option>
                      {activeTemplate.bgImageUrl && <option value="image">Gambar Kustom</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gaya Huruf (Font)</label>
                    <select
                      value={activeTemplate.fontFamily}
                      onChange={(e) => handleTemplateChange('fontFamily', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800"
                    >
                      <option value="font-sans">Standard UI (Sans)</option>
                      <option value="font-mono">JetBrains Tech (Mono)</option>
                      <option value="font-serif">Playfair Elegant (Serif)</option>
                    </select>
                  </div>
                </div>

                {activeTemplate.bgType === 'color' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Warna Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeTemplate.bgColor}
                        onChange={(e) => handleTemplateChange('bgColor', e.target.value)}
                        className="w-10 h-8 rounded border p-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={activeTemplate.bgColor}
                        onChange={(e) => handleTemplateChange('bgColor', e.target.value)}
                        className="flex-1 px-3 py-1 text-xs font-mono border rounded-lg dark:bg-slate-800"
                      />
                    </div>
                  </div>
                )}

                {activeTemplate.bgType === 'gradient' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kode CSS Gradien</label>
                    <input
                      type="text"
                      value={activeTemplate.bgGradient}
                      onChange={(e) => handleTemplateChange('bgGradient', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono border rounded-lg dark:bg-slate-800"
                    />
                    <div className="flex gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => handleTemplateChange('bgGradient', 'linear-gradient(135deg, #fefce8 0%, #fef3c7 50%, #fefce8 100%)')}
                        className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[9px] font-bold"
                      >
                        Hijau/Kuning GGF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTemplateChange('bgGradient', 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)')}
                        className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-bold"
                      >
                        Soft Blue
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTemplateChange('bgGradient', 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)')}
                        className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-bold"
                      >
                        Soft Rose
                      </button>
                    </div>
                  </div>
                )}

                {/* Accent and Font Colors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Warna Judul</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={activeTemplate.titleColor}
                        onChange={(e) => handleTemplateChange('titleColor', e.target.value)}
                        className="w-8 h-8 rounded border p-0 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={activeTemplate.titleColor}
                        onChange={(e) => handleTemplateChange('titleColor', e.target.value)}
                        className="w-full px-2 py-1 text-[11px] font-mono border rounded-lg dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Warna Nilai Rp</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={activeTemplate.valueColor}
                        onChange={(e) => handleTemplateChange('valueColor', e.target.value)}
                        className="w-8 h-8 rounded border p-0 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={activeTemplate.valueColor}
                        onChange={(e) => handleTemplateChange('valueColor', e.target.value)}
                        className="w-full px-2 py-1 text-[11px] font-mono border rounded-lg dark:bg-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Warna Aksen</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={activeTemplate.accentColor}
                        onChange={(e) => handleTemplateChange('accentColor', e.target.value)}
                        className="w-8 h-8 rounded border p-0 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={activeTemplate.accentColor}
                        onChange={(e) => handleTemplateChange('accentColor', e.target.value)}
                        className="w-full px-2 py-1 text-[11px] font-mono border rounded-lg dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Warna Footer</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={activeTemplate.footerBgColor}
                        onChange={(e) => handleTemplateChange('footerBgColor', e.target.value)}
                        className="w-8 h-8 rounded border p-0 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={activeTemplate.footerBgColor}
                        onChange={(e) => handleTemplateChange('footerBgColor', e.target.value)}
                        className="w-full px-2 py-1 text-[11px] font-mono border rounded-lg dark:bg-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Font Sizes Sliders */}
                <div className="space-y-3 border-t pt-3">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ukuran Elemen (Sizing)</h4>
                  
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Ukuran Judul</span>
                      <span>{activeTemplate.titleSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="48"
                      value={activeTemplate.titleSize}
                      onChange={(e) => handleTemplateChange('titleSize', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Ukuran Nilai Voucher</span>
                      <span>{activeTemplate.valueSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="28"
                      max="64"
                      value={activeTemplate.valueSize}
                      onChange={(e) => handleTemplateChange('valueSize', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Ukuran Syarat & Ketentuan</span>
                      <span>{activeTemplate.termsSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="7"
                      max="14"
                      value={activeTemplate.termsSize}
                      onChange={(e) => handleTemplateChange('termsSize', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={handleManualSave}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/15 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Perubahan Desain
                  </button>
                </div>
              </div>
            )}

            {/* RECIPIENTS TAB */}
            {activeTab === 'recipients' && (
              <div className="space-y-4">
                {/* Global Sequential Serial Settings */}
                <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                      <Settings className="w-4 h-4" />
                      Urutan Nomor Seri Global
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        id="global-numbering-toggle"
                        checked={globalVoucherEnabled} 
                        onChange={(e) => setGlobalVoucherEnabled(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ml-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        {globalVoucherEnabled ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </label>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Jika aktif, semua jenis voucher akan menggunakan satu urutan nomor seri global yang sama secara berurutan. Sangat cocok jika Anda ingin mengatur/setup nomor awal voucher di sistem (misal setelah migrasi dari manual).
                  </p>

                  {globalVoucherEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Prefix Global</label>
                        <input
                          type="text"
                          id="global-prefix-input"
                          value={globalVoucherPrefix}
                          onChange={(e) => setGlobalVoucherPrefix(e.target.value)}
                          placeholder="Misal: VMC-"
                          className="w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                          Nomor Urut Berikutnya
                        </label>
                        <input
                          type="number"
                          id="global-next-number-input"
                          value={globalVoucherNextNumber}
                          onChange={(e) => setGlobalVoucherNextNumber(parseInt(e.target.value) || 0)}
                          placeholder="Misal: 2011251"
                          className="w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Panjang Digit (Padding)</label>
                        <input
                          type="number"
                          id="global-padding-input"
                          min="1"
                          max="15"
                          value={globalVoucherPadding}
                          onChange={(e) => setGlobalVoucherPadding(parseInt(e.target.value) || 7)}
                          placeholder="Misal: 7"
                          className="w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {globalVoucherEnabled && (
                    <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 p-2 rounded-xl border border-indigo-100/40 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                      <span>Preview Seri Berikutnya:</span>
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 rounded font-mono text-xs font-black tracking-wider">
                        {globalVoucherPrefix}{globalVoucherNextNumber.toString().padStart(globalVoucherPadding, '0')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Manual input */}
                <form onSubmit={handleAddRecord} className="space-y-3 border-b pb-4">
                  <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Tambah Seri Penerima</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Nomor Seri / Kode</label>
                      <input
                        type="text"
                        value={globalVoucherEnabled ? `${globalVoucherPrefix}${globalVoucherNextNumber.toString().padStart(globalVoucherPadding, '0')}` : newSerial}
                        onChange={(e) => !globalVoucherEnabled && setNewSerial(e.target.value)}
                        placeholder="Contoh: 2011248"
                        disabled={globalVoucherEnabled}
                        className={`w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg ${
                          globalVoucherEnabled 
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 cursor-not-allowed font-mono' 
                            : 'dark:bg-slate-800'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Nama Penerima</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Puji Sulastiana"
                        className="w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      placeholder="Departemen (Opsional)"
                      className="flex-1 px-2.5 py-1.5 text-xs font-bold border rounded-lg dark:bg-slate-800"
                    />
                    <button
                      type="submit"
                      className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah
                    </button>
                  </div>
                </form>

                {/* Bulk automatic generator */}
                <div className="border-b pb-4 space-y-3">
                  <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Buat Nomor Seri Massal
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Mulai Seri</label>
                      <input
                        type="text"
                        value={globalVoucherEnabled ? globalVoucherNextNumber.toString().padStart(globalVoucherPadding, '0') : bulkStart}
                        onChange={(e) => !globalVoucherEnabled && setBulkStart(e.target.value)}
                        disabled={globalVoucherEnabled}
                        className={`w-full px-2 py-1.5 text-xs font-mono font-bold border rounded-lg ${
                          globalVoucherEnabled 
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 cursor-not-allowed' 
                            : 'dark:bg-slate-800'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Jumlah</label>
                      <input
                        type="number"
                        value={bulkCount}
                        onChange={(e) => setBulkCount(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-xs font-bold border rounded-lg dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Prefix</label>
                      <input
                        type="text"
                        value={globalVoucherEnabled ? globalVoucherPrefix : bulkPrefix}
                        onChange={(e) => !globalVoucherEnabled && setBulkPrefix(e.target.value)}
                        placeholder="Opsional"
                        disabled={globalVoucherEnabled}
                        className={`w-full px-2 py-1.5 text-xs font-bold border rounded-lg ${
                          globalVoucherEnabled 
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 cursor-not-allowed' 
                            : 'dark:bg-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateBulk}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 text-indigo-600 dark:text-indigo-400"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
                    Simulasikan Massal Sekarang
                  </button>
                </div>

                {/* Excel CSV Import/Export */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Impor / Ekspor Excel</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="py-1.5 border border-dashed rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download CSV
                    </button>
                    <div>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleImportCSV}
                        className="hidden"
                        id="csv-file-import"
                      />
                      <label
                        htmlFor="csv-file-import"
                        className="w-full py-1.5 border border-dashed rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload CSV
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={handleManualSave}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/15 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Daftar Seri & Urutan
                  </button>
                </div>
              </div>
            )}

            {/* PRINT TAB */}
            {activeTab === 'print' && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Pengaturan Format Cetak</h3>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Format / Layout Cetak</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setPrintLayout('4-per-a4')}
                      className={`py-2.5 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                        printLayout === '4-per-a4'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Grid className="w-4 h-4 text-emerald-500" />
                        <div className="text-left">
                          <p className="font-extrabold text-[12px]">4 Voucher per Halaman A4 [Rekomendasi]</p>
                          <p className="text-[10px] font-normal text-slate-400">Pas persis untuk kertas A4 (4 baris x 1 kolom)</p>
                        </div>
                      </div>
                      {printLayout === '4-per-a4' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPrintLayout('1-col')}
                      className={`py-2.5 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                        printLayout === '1-col'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <div className="text-left">
                          <p className="font-extrabold text-[12px]">1 Kolom (A4 Penuh)</p>
                          <p className="text-[10px] font-normal text-slate-400">1 voucher lebar penuh per baris</p>
                        </div>
                      </div>
                      {printLayout === '1-col' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPrintLayout('2-col')}
                      className={`py-2.5 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                        printLayout === '2-col'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Grid className="w-4 h-4 text-indigo-500" />
                        <div className="text-left">
                          <p className="font-extrabold text-[12px]">2 Kolom (Berdampingan)</p>
                          <p className="text-[10px] font-normal text-slate-400">Tata letak grid 2 kolom berdampingan</p>
                        </div>
                      </div>
                      {printLayout === '2-col' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintLayout('custom')}
                      className={`py-2.5 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                        printLayout === 'custom'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <div className="text-left">
                          <p className="font-extrabold text-[12px]">Ukuran Kustom (Manual)</p>
                          <p className="text-[10px] font-normal text-slate-400">Tentukan ukuran cetak sendiri</p>
                        </div>
                      </div>
                      {printLayout === 'custom' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </button>
                    {printLayout === 'custom' && (
                      <div className="pl-8 py-3 space-y-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Lebar Cetak (cm)</label>
                            <input
                              type="number"
                              min="5"
                              max="30"
                              step="0.01"
                              value={customPrintWidthCm}
                              onChange={(e) => setCustomPrintWidthCm(Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 text-indigo-600 dark:text-indigo-400"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Tinggi Cetak (cm)</label>
                            <input
                              type="number"
                              min="2"
                              max="20"
                              step="0.01"
                              value={customPrintHeightCm}
                              onChange={(e) => setCustomPrintHeightCm(Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 text-indigo-600 dark:text-indigo-400"
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">PILIHAN PRESISI QUICK-SELECT</p>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setCustomPrintWidthCm(16.93);
                                setCustomPrintHeightCm(5.08);
                                toast.success("Ukuran 16.93 x 5.08 cm diterapkan!");
                              }}
                              className={`px-2 py-1 text-[10px] font-black rounded-md border transition-all ${
                                customPrintWidthCm === 16.93 && customPrintHeightCm === 5.08
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              16.93 x 5.08 cm
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomPrintWidthCm(18);
                                setCustomPrintHeightCm(7.2);
                              }}
                              className={`px-2 py-1 text-[10px] font-black rounded-md border transition-all ${
                                customPrintWidthCm === 18 && customPrintHeightCm === 7.2
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              18.00 x 7.20 cm
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomPrintWidthCm(15);
                                setCustomPrintHeightCm(6);
                              }}
                              className={`px-2 py-1 text-[10px] font-black rounded-md border transition-all ${
                                customPrintWidthCm === 15 && customPrintHeightCm === 6
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              15.00 x 6.00 cm
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ringkasan Cetak</h4>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Voucher Terdaftar:</span>
                      <span className="font-bold">{records.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pilihan Terpilih:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {selectedRecordIds.length > 0 ? `${selectedRecordIds.length} Voucher` : 'Semua Voucher'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 pb-1">
                  <button
                    type="button"
                    onClick={handleManualSave}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/15 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Format Cetak
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <Printer className="w-5 h-5" />
                  Mulai Proses Cetak / Print PDF
                </button>
              </div>
            )}

            {/* REQUESTS TAB */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Kelola Pengajuan Voucher Event</h3>
                
                {/* Request Stats summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Total</p>
                    <p className="text-sm font-black text-slate-800 dark:text-white">{voucherRequests.length}</p>
                  </div>
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <p className="text-[9px] font-bold text-amber-500 uppercase">Baru</p>
                    <p className="text-sm font-black text-amber-600 dark:text-amber-400">
                      {voucherRequests.filter(r => r.status === 'Baru Diminta').length}
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-[9px] font-bold text-emerald-500 uppercase">Done</p>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {voucherRequests.filter(r => r.status === 'Done').length}
                    </p>
                  </div>
                </div>

                {reqLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-bold">Memuat pengajuan...</span>
                  </div>
                ) : voucherRequests.length === 0 ? (
                  <div className="py-8 text-center border border-dashed rounded-xl text-slate-400 text-xs font-bold">
                    Tidak ada pengajuan voucher event dari karyawan saat ini.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {voucherRequests.map((req) => (
                      <div 
                        key={req.id}
                        className="p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900/20 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white block">{req.theme}</span>
                            {req.slogan && (
                              <p className="text-[10px] text-indigo-500 italic font-bold">Slogan: "{req.slogan}"</p>
                            )}
                            <span className="text-[9px] text-slate-400 font-bold">
                              Oleh: <span className="text-slate-600 dark:text-slate-300 font-extrabold">{req.requester_name}</span> ({req.department})
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-slate-500 font-semibold border-t pt-1.5">
                          <div>Qty: <span className="font-bold text-slate-700 dark:text-slate-300">{req.qty} Pcs</span></div>
                          <div>Nilai Voucher: <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatRupiah(req.voucher_value)}</span></div>
                          <div>Masa Berlaku: <span className="font-bold text-slate-700 dark:text-slate-300">{req.validity_date ? formatIndonesianDateOnly(req.validity_date) : ''}</span></div>
                          <div>Deadline: <span className="font-bold text-slate-700 dark:text-slate-300">{req.deadline ? formatIndonesianDateOnly(req.deadline) : ''}</span></div>
                          <div className="col-span-2">Dibuat: <span className="font-bold text-slate-700 dark:text-slate-300">{req.created_at ? new Date(req.created_at).toLocaleDateString('id-ID') : ''}</span></div>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t pt-2 mt-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-slate-400 font-bold">Status:</span>
                            <select
                              value={req.status}
                              onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                              className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${
                                req.status === 'Baru Diminta'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : req.status === 'Proses'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              <option value="Baru Diminta">Baru Diminta</option>
                              <option value="Proses">Proses</option>
                              <option value="Done">Done</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {(req.status === 'Baru Diminta' || req.status === 'Proses') && (
                              <button
                                type="button"
                                onClick={() => handleDesignForRequest(req)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black flex items-center gap-1 shadow-xs transition-all active:scale-95"
                              >
                                <Sparkles className="w-3 h-3" />
                                Desain Voucher
                              </button>
                            )}
                            
                            <button
                              type="button"
                              onClick={() => handlePrintUserVoucher(req)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black flex items-center gap-1 shadow-xs transition-all active:scale-95"
                            >
                              <Printer className="w-3 h-3" />
                              Cetak
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Live Print Preview (7 columns) */}
        <div className="xl:col-span-7 space-y-6">
          {/* Card Preview Container */}
          <div className="space-y-2 xl:sticky xl:top-6 z-10">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Preview Tampilan Voucher Aktif</span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Live Editor
              </span>
            </div>

            {/* Virtual Voucher Card render matching the uploaded sample structure! */}
            <div 
              ref={containerRef}
              className="flex flex-col bg-slate-100 dark:bg-slate-900/30 p-6 rounded-[2rem] border overflow-auto min-h-[380px] items-center justify-center relative"
            >
              {/* Preview Scale controller */}
              <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xs z-20">
                <button
                  type="button"
                  onClick={() => setPreviewScale('fit')}
                  className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${
                    previewScale === 'fit'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Fit Kertas
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewScale('100')}
                  className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${
                    previewScale === '100'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  100% (Real)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewScale('75')}
                  className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${
                    previewScale === '75'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewScale('50')}
                  className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${
                    previewScale === '50'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  50%
                </button>
              </div>              {/* Scaled wrapper container to keep original aspect ratio layout */}
              <style dangerouslySetInnerHTML={{ __html: generateCardCssRules(activeTemplate) }} />
              <div 
                style={{ 
                  width: `${(printLayout === 'custom' ? (800 * (customPrintWidthCm / 21.166666)) : 800) * scaleFactor}px`, 
                  height: `${(printLayout === 'custom' ? (320 * (customPrintHeightCm / 8.466666)) : 320) * scaleFactor}px`,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }} 
                className="relative overflow-visible flex items-center justify-center shrink-0 mt-6"
              >
                <div
                  ref={printRef}
                  style={{
                    transform: `scale(${scaleFactor * (printLayout === 'custom' ? (customPrintWidthCm / 21.166666) : 1)}, ${scaleFactor * (printLayout === 'custom' ? (customPrintHeightCm / 8.466666) : 1)})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '800px',
                    height: '320px',
                    maxWidth: '800px',
                  }}
                  className={`print-voucher-card ${activeTemplate.fontFamily}`}
                >
                  {/* Header */}
                  <div className="voucher-header">
                    {logoLeft ? (
                      <img src={logoLeft} className="logo-img" alt="GGF Logo" referrerPolicy="no-referrer" />
                    ) : (
                      <div style={{ width: '40px' }}></div>
                    )}
                    <div className="header-title-container">
                      <h1 className="voucher-main-title">{activeTemplate.title}</h1>
                      <div className="voucher-subtitle">{activeTemplate.subtitle}</div>
                      <div className="voucher-category">{activeTemplate.category}</div>
                    </div>
                    {logoRight ? (
                      <img src={logoRight} className="logo-img" alt="KDK Logo" referrerPolicy="no-referrer" />
                    ) : (
                      <div style={{ width: '40px' }}></div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="voucher-body">
                    {/* Left Body */}
                    <div className="body-left">
                      <div className="voucher-slogan">"{activeTemplate.slogan}"</div>
                      <div className="voucher-value">{formatRupiah(activeTemplate.value)}</div>
                      <div className="voucher-validity-box">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#dc2626' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>{activeTemplate.validity}</span>
                      </div>
                    </div>

                    {/* Right Body */}
                    <div className="body-right">
                      <div className="authorized-section">
                        <span className="auth-label">{activeTemplate.authorizedByLabel}</span>
                        <span className="auth-name">{activeTemplate.authorizedName}</span>
                        <span className="auth-title">{activeTemplate.authorizedTitle}</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', transform: `translate(${activeTemplate.qrSerialX ?? 0}px, ${activeTemplate.qrSerialY ?? 0}px)`, position: 'relative', width: '100%' }}>
                        {activeTemplate.showQr !== false ? (
                          <div style={{ background: 'white', padding: '3px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', transform: `translate(${activeTemplate.qrX ?? 0}px, ${activeTemplate.qrY ?? 0}px)`, position: 'relative' }}>
                            <QrCode style={{ width: `${activeTemplate.qrSize ?? 40}px`, height: `${activeTemplate.qrSize ?? 40}px` }} className="text-slate-800" />
                          </div>
                        ) : (
                          <div style={{ width: 0, height: 0, overflow: 'hidden' }}></div>
                        )}
                        
                        <div className="serial-box">
                          {records.length > 0 
                            ? records[0].serialNumber 
                            : (globalVoucherEnabled 
                              ? `${globalVoucherPrefix}${globalVoucherNextNumber.toString().padStart(globalVoucherPadding, '0')}` 
                              : `${activeTemplate.serialPrefix}2011248`
                            )
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Syarat & Ketentuan */}
                  <div className="terms-section">
                    <div className="terms-title">Syarat & Ketentuan :</div>
                    <ul className="terms-list">
                      {activeTemplate.terms.slice(0, 3).map((term, i) => (
                        <li key={i} className="terms-item">{term}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer */}
                  <div className="voucher-footer">
                    {activeTemplate.footerText}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Record / Recipient Management List */}
          <div className={`${themeClasses.card} border rounded-3xl p-5 shadow-sm space-y-4`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Daftar Nomor Seri Voucher Aktif ({filteredRecords.length})</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Pilih nomor seri tertentu untuk dicetak, atau biarkan kosong untuk mencetak semua.</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllRecords}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold"
                >
                  {selectedRecordIds.length === filteredRecords.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
                <button
                  type="button"
                  onClick={handleClearAllRecords}
                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg text-[10px] font-bold"
                >
                  Hapus Semua
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nomor seri, nama penerima, atau departemen..."
                value={searchRecordQuery}
                onChange={(e) => setSearchRecordQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border rounded-xl dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            {/* Table or grid representation of voucher records */}
            <div className="border rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b font-black text-[10px] uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="p-3 w-8 text-center">Pilih</th>
                    <th className="p-3">No Seri / Voucher</th>
                    <th className="p-3">Penerima</th>
                    <th className="p-3">Departemen</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                  <AnimatePresence>
                    {filteredRecords.map(rec => (
                      <tr 
                        key={rec.id} 
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all ${
                          selectedRecordIds.includes(rec.id) ? 'bg-indigo-500/5 dark:bg-indigo-500/10' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRecordIds.includes(rec.id)}
                            onChange={() => handleToggleSelectRecord(rec.id)}
                            className="rounded text-indigo-600 w-4 h-4"
                          />
                        </td>
                        <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                          {editingRecordId === rec.id ? (
                            <input
                              type="text"
                              value={editSerial}
                              onChange={(e) => setEditSerial(e.target.value)}
                              className="px-2 py-1 border rounded w-28 font-mono text-xs dark:bg-slate-700"
                            />
                          ) : (
                            `${activeTemplate.serialPrefix}${rec.serialNumber}`
                          )}
                        </td>
                        <td className="p-3">
                          {editingRecordId === rec.id ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="px-2 py-1 border rounded w-full text-xs dark:bg-slate-700"
                            />
                          ) : (
                            rec.recipientName
                          )}
                        </td>
                        <td className="p-3">
                          {editingRecordId === rec.id ? (
                            <input
                              type="text"
                              value={editDept}
                              onChange={(e) => setEditDept(e.target.value)}
                              className="px-2 py-1 border rounded w-full text-xs dark:bg-slate-700"
                            />
                          ) : (
                            rec.department
                          )}
                        </td>
                        <td className="p-3">
                          {editingRecordId === rec.id ? (
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as any)}
                              className="px-2 py-1 border rounded text-xs dark:bg-slate-700"
                            >
                              <option value="Belum Dicetak">Belum Dicetak</option>
                              <option value="Dicetak">Dicetak</option>
                              <option value="Digunakan">Digunakan</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              rec.status === 'Belum Dicetak'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : rec.status === 'Dicetak'
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}>
                              {rec.status}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {editingRecordId === rec.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={handleSaveEditRecord}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                  title="Simpan"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingRecordId(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditRecord(rec)}
                                  className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700/60"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecord(rec.id)}
                                  className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700/60"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-slate-400 font-semibold">
                          Belum ada data penerima voucher atau tidak ada yang cocok dengan pencarian.
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Kustom Konfirmasi Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className={`relative w-full max-w-md overflow-hidden rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              } p-6 shadow-2xl z-10`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {confirmModal.title}
                  </h3>
                  <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {confirmModal.message}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                    isDark
                      ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-lg ${
                    confirmModal.confirmBtnClass || 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {confirmModal.confirmText || 'Ya, Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
