import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Search, Plus, Filter, Edit2, Trash2, 
  Monitor, Smartphone, Printer, Server, Laptop, X, Save,
  User, Building2, Download, Upload, FileSpreadsheet,
  ChevronLeft, ChevronRight, Users, Layers, Eye, CheckCircle2, PieChart,
  ClipboardList, RotateCcw, PenTool, Calendar, Check, AlertCircle, FileSignature
} from 'lucide-react';
import * as xlsx from 'xlsx';
import toast from 'react-hot-toast';
import { IAsset, IBorrowedAsset } from '../types';
import { api } from '../services/api';

interface AssetManagementProps {
  isDark: boolean;
  themeClasses: any;
  primaryColor: string;
  activeSubTab?: 'all' | 'Capex' | 'Opex' | 'borrowed';
  setActiveSubTab?: (tab: 'all' | 'Capex' | 'Opex' | 'borrowed') => void;
}

export const getCategoryCodePrefix = (categoryName: string) => {
  if (!categoryName) return 'ASTKDK-';
  const cat = categoryName.toLowerCase().trim();
  if (cat.includes('komputer') || cat.includes('pc') || cat.includes('desktop')) return 'PCKDK-';
  if (cat.includes('laptop') || cat.includes('notebook')) return 'LPKDK-';
  if (cat.includes('printer') || cat.includes('cetak') || cat.includes('scanner')) return 'PRTKDK-';
  if (cat.includes('tablet') || cat.includes('tab') || cat.includes('ipad')) return 'TBKDK-';
  if (cat.includes('smartphone') || cat.includes('handphone') || cat.includes('hp') || cat.includes('mobile') || cat.includes('telepon')) return 'SMKDK-';
  if (cat.includes('network') || cat.includes('jaringan') || cat.includes('router') || cat.includes('switch')) return 'NETKDK-';
  if (cat.includes('server')) return 'SVKDK-';
  if (cat.includes('monitor') || cat.includes('layar') || cat.includes('tv')) return 'MNKDK-';
  
  const cleaned = cat.replace(/[^a-z0-9]/gi, '').toUpperCase();
  const prefix = cleaned.length >= 3 ? cleaned.substring(0, 3) : (cleaned || 'AST');
  return `${prefix}KDK-`;
};

export const generateNextDeviceCode = (categoryName: string, currentAssets: IAsset[], excludeAssetId?: number) => {
  const prefix = getCategoryCodePrefix(categoryName);
  
  let maxSeq = 0;
  currentAssets.forEach(a => {
    if (excludeAssetId && a.id === excludeAssetId) return;
    const code = a.device_code || '';
    if (code.startsWith(prefix)) {
      const numPart = code.replace(prefix, '');
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    } else if (a.category && a.category.toLowerCase() === categoryName.toLowerCase()) {
      const match = code.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const paddedSeq = String(nextSeq).padStart(3, '0');
  return `${prefix}${paddedSeq}`;
};

export const AssetManagement: React.FC<AssetManagementProps> = ({ 
  isDark, 
  themeClasses, 
  primaryColor,
  activeSubTab: externalSubTab,
  setActiveSubTab: setExternalSubTab
}) => {
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [borrowedAssets, setBorrowedAssets] = useState<IBorrowedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterUsageStatus, setFilterUsageStatus] = useState('');
  const [filterAssetStatus, setFilterAssetStatus] = useState('');
  const [internalSubTab, setInternalSubTab] = useState<'all' | 'Capex' | 'Opex' | 'borrowed'>('all');
  
  const activeSubTab = externalSubTab !== undefined ? externalSubTab : internalSubTab;
  const setActiveSubTab = (tab: 'all' | 'Capex' | 'Opex' | 'borrowed') => {
    setInternalSubTab(tab);
    if (setExternalSubTab) setExternalSubTab(tab);
  };
  const [showModal, setShowModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItem, setReturnItem] = useState<IBorrowedAsset | null>(null);
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receivedBy, setReceivedBy] = useState<string>('yudha');
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('');
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);
  const [borrowerSearchQuery, setBorrowerSearchQuery] = useState('');
  const [isBorrowerDropdownOpen, setIsBorrowerDropdownOpen] = useState(false);
  const [onlyITDepartment, setOnlyITDepartment] = useState(true);
  const [showSignaturePreview, setShowSignaturePreview] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<IAsset | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [masterUsers, setMasterUsers] = useState<any[]>([]);
  const [assetCategories, setAssetCategories] = useState<any[]>([]);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllPassword, setDeleteAllPassword] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterDepartment, filterUsageStatus, filterAssetStatus, activeSubTab]);
  
  // Form State
  const [formData, setFormData] = useState({
    device_code: '',
    asset_id: '',
    name: '',
    category: '',
    brand: '',
    specs: '',
    serial_number: '',
    department: '',
    usage_status: 'karyawan',
    assigned_to: '',
    user_index: '',
    status: 'Active',
    condition: 'Good',
    notes: '',
    budget_type: 'Capex'
  });

  // Borrow Form State
  const [borrowFormData, setBorrowFormData] = useState({
    asset_id: null as number | null,
    device_name: '',
    device_code: '',
    budget_type: 'Capex',
    borrower_name: '',
    borrower_department: '',
    borrow_date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    notes: '',
    signature: ''
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0284c7';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setBorrowFormData(prev => ({ ...prev, signature: canvas.toDataURL() }));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setBorrowFormData(prev => ({ ...prev, signature: '' }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsData, users, categories, borrowedData] = await Promise.all([
        api.getAssets(),
        api.getMasterUsers(),
        api.getAssetCategories(),
        api.getBorrowedAssets()
      ]);
      setAssets(assetsData);
      setMasterUsers(users);
      setAssetCategories(categories);
      setBorrowedAssets(borrowedData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowFormData.device_name?.trim()) {
      toast.error('Nama Perangkat wajib diisi atau dipilih!');
      return;
    }
    if (!borrowFormData.borrower_name?.trim()) {
      toast.error('Nama Peminjam wajib diisi!');
      return;
    }
    if (!borrowFormData.borrow_date) {
      toast.error('Tanggal Pinjam wajib diisi!');
      return;
    }

    try {
      await api.addBorrowedAsset(borrowFormData);
      toast.success('Data peminjaman perangkat berhasil disimpan!');
      setShowBorrowModal(false);
      setBorrowFormData({
        asset_id: null,
        device_name: '',
        device_code: '',
        budget_type: 'Capex',
        borrower_name: '',
        borrower_department: '',
        borrow_date: new Date().toISOString().split('T')[0],
        expected_return_date: '',
        notes: '',
        signature: ''
      });
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan data peminjaman');
    }
  };

  const handleOpenReturnModal = (item: IBorrowedAsset) => {
    setReturnItem(item);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setReceivedBy('yudha');
    setShowReturnModal(true);
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnItem) return;
    if (!receivedBy.trim()) {
      toast.error('Penerima barang wajib diisi!');
      return;
    }

    try {
      await api.returnBorrowedAsset(returnItem.id, returnDate, receivedBy.trim());
      toast.success(`Perangkat berhasil dikembalikan (Diterima oleh ${receivedBy.trim()})`);
      setShowReturnModal(false);
      setReturnItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memproses pengembalian perangkat');
    }
  };

  const handleDeleteBorrow = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan peminjaman ini?')) return;
    try {
      await api.deleteBorrowedAsset(id);
      toast.success('Catatan peminjaman berhasil dihapus');
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus data');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      toast.error('Kategori wajib dipilih!');
      return;
    }
    if (!formData.device_code?.trim()) {
      toast.error('Kode Perangkat wajib diisi!');
      return;
    }

    const deviceCodeClean = formData.device_code.trim();
    const finalAssetId = formData.asset_id?.trim() || `AST-${deviceCodeClean}`;
    const finalName = formData.name?.trim() || formData.category || 'Perangkat';

    const payload = {
      ...formData,
      device_code: deviceCodeClean,
      asset_id: finalAssetId,
      name: finalName
    };

    try {
      if (editingAsset) {
        await api.updateAsset(editingAsset.id, payload);
        toast.success('Aset berhasil diperbarui');
      } else {
        await api.addAsset(payload);
        toast.success('Aset baru berhasil ditambahkan');
      }
      
      setShowModal(false);
      setEditingAsset(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error saving asset:', err);
      toast.error('Gagal menyimpan data aset');
    }
  };

  const resetForm = () => {
    const defaultCat = assetCategories.length > 0 ? assetCategories[0].name : 'Komputer';
    const autoDeviceCode = generateNextDeviceCode(defaultCat, assets);

    setFormData({
      device_code: autoDeviceCode,
      asset_id: '',
      name: '',
      category: defaultCat,
      brand: '',
      specs: '',
      serial_number: '',
      department: '',
      usage_status: 'karyawan',
      assigned_to: '',
      user_index: '',
      status: 'Active',
      condition: 'Good',
      notes: '',
      budget_type: activeSubTab !== 'all' ? activeSubTab : 'Capex'
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus aset ini?')) return;
    try {
      await api.deleteAsset(id);
      fetchData();
    } catch (err) {
      console.error('Error deleting asset:', err);
    }
  };

  
  
  const openEditModal = (asset: IAsset, view: boolean = false) => {
    setEditingAsset(asset);
    setFormData({
      device_code: asset.device_code || '',
      asset_id: asset.asset_id,
      name: asset.name,
      category: asset.category,
      brand: asset.brand || '',
      specs: asset.specs || '',
      serial_number: asset.serial_number || '',
      department: asset.department || '',
      usage_status: asset.usage_status || 'karyawan',
      assigned_to: asset.assigned_to || '',
      user_index: asset.user_index || '',
      status: asset.status || 'Active',
      condition: asset.condition || 'Good',
      notes: asset.notes || '',
      budget_type: asset.budget_type || 'Capex'
    });
    setIsViewMode(view);
    setShowModal(true);
  };

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('laptop')) return <Laptop className="w-4 h-4" />;
    if (c.includes('monitor')) return <Monitor className="w-4 h-4" />;
    if (c.includes('smartphone') || c.includes('hp') || c.includes('tablet')) return <Smartphone className="w-4 h-4" />;
    if (c.includes('printer')) return <Printer className="w-4 h-4" />;
    if (c.includes('server') || c.includes('jaringan')) return <Server className="w-4 h-4" />;
    return <Package className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">Aktif</span>;
      case 'In Repair':
        return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">Diperbaiki</span>;
      case 'Retired':
        return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">Pensiun</span>;
      default:
        return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const filteredAssets = assets.filter(asset => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || [
      asset.asset_id,
      asset.name,
      asset.device_code,
      asset.category,
      asset.brand,
      asset.specs,
      asset.serial_number,
      asset.department,
      asset.usage_status,
      asset.assigned_to,
      asset.user_index,
      asset.status,
      asset.condition,
      asset.notes,
      asset.budget_type
    ].some(field => field && String(field).toLowerCase().includes(q));

    const matchesCategory = filterCategory ? asset.category === filterCategory : true;
    const matchesDepartment = filterDepartment ? asset.department === filterDepartment : true;
    const matchesUsageStatus = filterUsageStatus ? (asset.usage_status || '').toLowerCase() === filterUsageStatus.toLowerCase() : true;
    const matchesAssetStatus = filterAssetStatus ? (asset.status || '').toLowerCase() === filterAssetStatus.toLowerCase() : true;
    const matchesSubTab = activeSubTab === 'all' ? true : (asset.budget_type || 'Capex') === activeSubTab;

    return matchesSearch && matchesCategory && matchesDepartment && matchesUsageStatus && matchesAssetStatus && matchesSubTab;
  });

  // Stats summary calculations
  const totalAssetsCount = assets.length;
  const totalCategoriesCount = assetCategories.length > 0 ? assetCategories.length : new Set(assets.map(a => a.category).filter(Boolean)).size;
  const totalUsersCount = new Set(assets.map(a => a.assigned_to).filter(Boolean)).size;
  const totalDepartmentsCount = new Set(assets.map(a => a.department).filter(Boolean)).size;

  // Pagination calculations
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage) || 1;
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Extract unique departments from master users
  const masterDepartments = Array.from(new Set(masterUsers.map(u => u.department).filter(Boolean))).sort();

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Kategori': 'Laptop',
        'Kode Perangkat': 'LPKDK-001',
        'Kode Aset': 'AST-LPKDK-001',
        'Nama Perangkat': 'Laptop Dell Latitude 5420',
        'Merk / Brand': 'Dell',
        'Spesifikasi': 'Core i5 Gen 11, RAM 16GB, SSD 512GB',
        'Serial Number': 'SN123456789',
        'Departemen': 'IT Support',
        'Status Penggunaan': 'karyawan',
        'Penanggung Jawab / User': 'Budi Santoso',
        'Index': '1001',
        'Tipe Anggaran': 'Capex',
        'Status Aset': 'Active',
        'Kondisi': 'Good',
        'Tanggal Pembelian': '2024-01-15',
        'Catatan': 'Unit baru garansi resmi'
      },
      {
        'Kategori': 'Komputer',
        'Kode Perangkat': 'PCKDK-001',
        'Kode Aset': 'AST-PCKDK-001',
        'Nama Perangkat': 'PC Desktop HP ProDesk',
        'Merk / Brand': 'HP',
        'Spesifikasi': 'Core i7, RAM 32GB, SSD 1TB',
        'Serial Number': 'HP987654321',
        'Departemen': 'CE Business',
        'Status Penggunaan': 'shared department',
        'Penanggung Jawab / User': 'Guntur',
        'Index': '1002',
        'Tipe Anggaran': 'Capex',
        'Status Aset': 'Active',
        'Kondisi': 'Good',
        'Tanggal Pembelian': '2023-11-20',
        'Catatan': 'Aset bersama operasional tim'
      },
      {
        'Kategori': 'Printer',
        'Kode Perangkat': 'PRTKDK-001',
        'Kode Aset': 'AST-PRTKDK-001',
        'Nama Perangkat': 'Printer Epson L3210',
        'Merk / Brand': 'Epson',
        'Spesifikasi': 'All-in-One InkTank',
        'Serial Number': 'EPS778899',
        'Departemen': 'Finance',
        'Status Penggunaan': 'shared department',
        'Penanggung Jawab / User': 'Finance Dept',
        'Index': '1003',
        'Tipe Anggaran': 'Opex',
        'Status Aset': 'Active',
        'Kondisi': 'Good',
        'Tanggal Pembelian': '2024-02-10',
        'Catatan': 'Printer sewa operasional'
      }
    ];

    const ws = xlsx.utils.json_to_sheet(templateData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Template Aset');
    xlsx.writeFile(wb, 'Template_Import_Aset.xlsx');
    toast.success('Template Excel (format KDK) berhasil diunduh');
  };

  
  const printAssets = (assetsToPrint: IAsset[]) => {
    if (assetsToPrint.length === 0) {
      toast.error('Tidak ada aset untuk dicetak');
      return;
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      toast.error("Browser memblokir pop-up. Izinkan pop-up untuk mencetak label.");
      return;
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Label Aset</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { 
              margin: 0; 
              padding: 0;
              font-family: sans-serif;
              background-color: white;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              width: 100%;
            }
            .label-box {
              border: 1px dashed #ccc;
              padding: 12px;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              page-break-inside: avoid;
              min-height: 90px;
              border-radius: 8px;
            }
            .label-content {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: flex-start;
              flex: 1;
              padding-right: 10px;
            }
            .title {
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 4px;
              color: #111;
            }
            .jabatan {
              font-size: 11px;
              color: #555;
              margin-bottom: 2px;
            }
            .departemen {
              font-size: 11px;
              color: #555;
              margin-bottom: 8px;
            }
            .kode {
              font-size: 12px;
              border: 1px solid #333;
              padding: 3px 6px;
              border-radius: 4px;
              display: inline-block;
              font-weight: bold;
            }
            .qr-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              flex-shrink: 0;
            }
            .qr-container {
              width: 66px;
              height: 66px;
              border: 1px solid #eee;
              padding: 2px;
              background: white;
              border-radius: 6px;
              margin-bottom: 4px;
            }
            .qr-container img {
              width: 100%;
              height: 100%;
              display: block;
              object-fit: contain;
            }
            .koperasi-text {
              font-size: 6.5px;
              text-align: center;
              color: #333;
              font-weight: 800;
              line-height: 1.5;
              width: 100%;
              margin-top: 2px;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${assetsToPrint.map(asset => {
              const matchedUser = masterUsers.find(u => u.full_name === asset.assigned_to);
              const jabatan = matchedUser?.jabatan || '-';
              const departemen = asset.department || '-';
              
              // Generate QR URL pointing to the public asset detail page
              const assetId = asset.device_code || asset.asset_id || asset.id;
              const qrData = `${window.location.origin}?asset=${assetId}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;
              
              return `
              <div class="label-box">
                <div class="label-content">
                  <div class="title">${asset.name || asset.category}</div>
                  <div class="jabatan">${jabatan}</div>
                  <div class="departemen">${departemen}</div>
                  <div class="kode">${asset.device_code || asset.asset_id || '-'}</div>
                </div>
                <div class="qr-wrapper">
                  <div class="qr-container">
                    <img src="${qrUrl}" alt="QR" />
                  </div>
                  <div class="koperasi-text">Koperasi Konsumen<br/>Karyawan Dwi Karya</div>
                </div>
              </div>
              `;
            }).join('')}
          </div>
          <script>
            window.onload = function() {
              // Wait a bit for images to load before printing
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 1000);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handlePrintAllLabels = () => {
    printAssets(filteredAssets);
  };
  
  const handlePrintSingleLabel = (asset: IAsset) => {
    printAssets([asset]);
  };


  const handleExportExcel = () => {
    if (assets.length === 0) {
      toast.error('Tidak ada data aset untuk diexport');
      return;
    }
    const exportData = filteredAssets.map(asset => ({
      'Kategori': asset.category || '-',
      'Kode Perangkat': asset.device_code || '-',
      'Kode Aset': asset.asset_id || '-',
      'Nama Perangkat': asset.name || '-',
      'Merk / Brand': asset.brand || '-',
      'Spesifikasi': asset.specs || '-',
      'Serial Number': asset.serial_number || '-',
      'Departemen': asset.department || '-',
      'Status Penggunaan': asset.usage_status || 'karyawan',
      'Penanggung Jawab / User': asset.assigned_to || '-',
      'Index': asset.user_index || '-',
      'Tipe Anggaran': asset.budget_type || 'Capex',
      'Status Aset': asset.status || 'Active',
      'Kondisi': asset.condition || 'Good',
      'Tanggal Pembelian': asset.purchase_date || '-',
      'Catatan': asset.notes || '-'
    }));

    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Data Aset');
    xlsx.writeFile(wb, 'Export_Data_Aset.xlsx');
    toast.success('Data aset berhasil diexport ke Excel');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = xlsx.utils.sheet_to_json(ws);

        let count = 0;
        const tempAssetsTracker = [...assets];

        for (const row of rawData) {
          const category = row['Kategori'] || row['category'] || 'Komputer';

          let device_code = row['Kode Perangkat'] || row['device_code'];
          if (!device_code || !String(device_code).trim()) {
            device_code = generateNextDeviceCode(category, tempAssetsTracker);
          }

          let asset_id = row['Kode Aset'] || row['asset_id'];
          if (!asset_id || !String(asset_id).trim()) {
            asset_id = `AST-${device_code}`;
          }

          let name = row['Nama Perangkat'] || row['Nama Aset'] || row['name'];
          if (!name || !String(name).trim()) {
            name = category;
          }

          const userIndexValue = row['Index'] || row['Index / NIK'] || row['user_index'] || row['employee_index'] || '';
          const rawBudgetType = row['Tipe Anggaran'] || row['Budget Type'] || row['Tipe'] || row['budget_type'] || 'Capex';
          const cleanBudgetType = String(rawBudgetType).toLowerCase().includes('opex') ? 'Opex' : 'Capex';

          const assetPayload = {
            device_code: String(device_code),
            asset_id: String(asset_id),
            name: String(name),
            category: String(category),
            brand: row['Merk / Brand'] || row['Merk'] || row['brand'] || '',
            specs: row['Spesifikasi'] || row['specs'] || '',
            serial_number: row['Serial Number'] || row['serial_number'] || '',
            department: row['Departemen'] || row['department'] || '',
            usage_status: row['Status Penggunaan'] || row['usage_status'] || 'karyawan',
            assigned_to: row['Penanggung Jawab / User'] || row['assigned_to'] || '',
            user_index: String(userIndexValue),
            budget_type: cleanBudgetType,
            status: row['Status Aset'] || row['status'] || 'Active',
            condition: row['Kondisi'] || row['condition'] || 'Good',
            purchase_date: row['Tanggal Pembelian'] || row['purchase_date'] || '',
            notes: row['Catatan'] || row['notes'] || ''
          };

          await api.addAsset(assetPayload);
          tempAssetsTracker.push({ ...assetPayload, id: Date.now() + count } as IAsset);
          count++;
        }

        if (count > 0) {
          toast.success(`Berhasil mengimpor ${count} data aset.`);
        } else {
          toast.error('Tidak ada data valid yang diimpor.');
        }
        fetchData();
      } catch (err: any) {
        console.error('Import error:', err);
        toast.error('Gagal mengimpor file Excel: ' + (err.message || 'Error'));
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteAllAssets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteAllPassword) {
      toast.error('Masukkan password konfirmasi');
      return;
    }
    if (deleteAllPassword !== 'root') {
      toast.error('Password konfirmasi tidak valid (harus root)');
      return;
    }

    try {
      setIsDeletingAll(true);
      await api.deleteAllAssets(deleteAllPassword);
      toast.success('Seluruh data aset berhasil dihapus');
      setShowDeleteAllModal(false);
      setDeleteAllPassword('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal menghapus seluruh data aset');
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Excel Import */}
      <input 
        type="file" 
        id="import-asset-excel" 
        accept=".xlsx, .xls" 
        onChange={handleImportExcel} 
        className="hidden" 
      />

      {/* Top Header & Submenu Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            {activeSubTab !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveSubTab('all')}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all flex items-center gap-1 text-xs font-bold"
                title="Kembali ke Dashboard Overview"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}
            <h2 className={`text-xl sm:text-2xl font-black ${themeClasses.heading}`}>
              {activeSubTab === 'all' && 'Dashboard Overview Manajemen Aset'}
              {activeSubTab === 'Capex' && 'Manajemen Aset Capex (Belanja Modal)'}
              {activeSubTab === 'Opex' && 'Manajemen Aset Opex (Belanja Operasional)'}
              {activeSubTab === 'borrowed' && 'Perangkat Dipinjam (IT Device Loans)'}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
              activeSubTab === 'all' 
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                : activeSubTab === 'Capex' 
                  ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' 
                  : activeSubTab === 'Opex'
                    ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
            }`}>
              {activeSubTab === 'all' ? 'Dashboard Summary' : activeSubTab === 'borrowed' ? 'Peminjaman IT' : activeSubTab}
            </span>
          </div>
          <p className={`text-xs sm:text-sm mt-1 ${themeClasses.textMuted}`}>
            {activeSubTab === 'all' && 'Ringkasan sebaran statistik, kategori, & alokasi anggaran aset perusahaan'}
            {activeSubTab === 'Capex' && 'Kelola daftar inventaris aset modal (pembelian permanen/investasi perusahaan)'}
            {activeSubTab === 'Opex' && 'Kelola daftar inventaris aset operasional (sewa/layanan/berkala)'}
            {activeSubTab === 'borrowed' && 'Pendataan dan riwayat peminjaman perangkat IT oleh karyawan dengan tanda tangan digital'}
          </p>
        </div>

        {/* Submenu Navigation Capex, Opex & Borrowed (Hanya tampil di Dashboard Overview) */}
        {activeSubTab === 'all' && (
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 w-full md:w-fit overflow-x-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('all')}
              className="px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap bg-emerald-600 text-white shadow-md"
            >
              <Package className="w-4 h-4" />
              <span>Dashboard Overview</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-700 text-white">
                {assets.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('Capex')}
              className="px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              <Building2 className="w-4 h-4" />
              <span>Aset Capex</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {assets.filter(a => (a.budget_type || 'Capex') === 'Capex').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('Opex')}
              className="px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              <Layers className="w-4 h-4" />
              <span>Aset Opex</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {assets.filter(a => a.budget_type === 'Opex').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('borrowed')}
              className="px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Perangkat Dipinjam</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white">
                {borrowedAssets.filter(b => b.status === 'Dipinjam').length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* DASHBOARD OVERVIEW VIEW (activeSubTab === 'all') */}
      {activeSubTab === 'all' ? (
        <div className="space-y-6">
          {/* Card Informasi Stats Overview Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Keseluruhan Aset</p>
                <h3 className="text-2xl sm:text-3xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{totalAssetsCount}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1">
                  Capex: {assets.filter(a => (a.budget_type || 'Capex') === 'Capex').length} | Opex: {assets.filter(a => a.budget_type === 'Opex').length}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Package className="w-6 h-6" />
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Aset Capex</p>
                  <h3 className="text-2xl sm:text-3xl font-black mt-1 text-blue-600 dark:text-blue-400">
                    {assets.filter(a => (a.budget_type || 'Capex') === 'Capex').length}
                  </h3>
                </div>
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('Capex')}
                className="mt-3 text-left text-xs font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 group"
              >
                <span>Halaman Aset Capex</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Aset Opex</p>
                  <h3 className="text-2xl sm:text-3xl font-black mt-1 text-purple-600 dark:text-purple-400">
                    {assets.filter(a => a.budget_type === 'Opex').length}
                  </h3>
                </div>
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
                  <Layers className="w-6 h-6" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('Opex')}
                className="mt-3 text-left text-xs font-black text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 group"
              >
                <span>Halaman Aset Opex</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Kategori & Dept</p>
                <h3 className="text-2xl sm:text-3xl font-black mt-1 text-amber-600 dark:text-amber-400">{totalCategoriesCount}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{totalDepartmentsCount} Departemen Terdaftar</p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Grid Cards Analisis Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Distribusi Anggaran Capex vs Opex */}
            <div className={`p-5 rounded-3xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">Sebaran Anggaran Aset</h3>
                  <p className="text-xs text-slate-400 font-medium">Perbandingan unit Capex (Modal) dan Opex (Operasional)</p>
                </div>
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Building2 className="w-5 h-5" />
                </span>
              </div>

              {/* Progress bar */}
              {(() => {
                const capexCount = assets.filter(a => (a.budget_type || 'Capex') === 'Capex').length;
                const opexCount = assets.filter(a => a.budget_type === 'Opex').length;
                const total = totalAssetsCount || 1;
                const capexPct = Math.round((capexCount / total) * 100);
                const opexPct = Math.round((opexCount / total) * 100);

                return (
                  <div className="space-y-4">
                    <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      <div style={{ width: `${capexPct}%` }} className="bg-blue-600 h-full transition-all" title={`Capex: ${capexPct}%`} />
                      <div style={{ width: `${opexPct}%` }} className="bg-purple-600 h-full transition-all" title={`Opex: ${opexPct}%`} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('Capex')}
                        className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-left hover:bg-blue-500/10 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Capex</span>
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400">{capexPct}%</span>
                        </div>
                        <div className="text-lg font-black mt-1 text-slate-800 dark:text-white">{capexCount} <span className="text-xs font-normal text-slate-400">Unit</span></div>
                        <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                          <span>Buka Halaman Capex</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSubTab('Opex')}
                        className="p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-left hover:bg-purple-500/10 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">Opex</span>
                          <span className="text-xs font-black text-purple-600 dark:text-purple-400">{opexPct}%</span>
                        </div>
                        <div className="text-lg font-black mt-1 text-slate-800 dark:text-white">{opexCount} <span className="text-xs font-normal text-slate-400">Unit</span></div>
                        <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-1">
                          <span>Buka Halaman Opex</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Card 2: Ringkasan Kondisi & Status Aset */}
            <div className={`p-5 rounded-3xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">Status Operational Aset</h3>
                  <p className="text-xs text-slate-400 font-medium">Kondisi siap pakai vs perbaikan/pensiun</p>
                </div>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Aktif</span>
                  <div className="text-xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
                    {assets.filter(a => a.status === 'Active').length}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">Siap Digunakan</span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center">
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Diperbaiki</span>
                  <div className="text-xl font-black mt-1 text-amber-600 dark:text-amber-400">
                    {assets.filter(a => a.status === 'In Repair').length}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">Proses Perbaikan</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-500/5 border border-slate-500/20 text-center">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Pensiun/Rusak</span>
                  <div className="text-xl font-black mt-1 text-slate-600 dark:text-slate-300">
                    {assets.filter(a => a.status === 'Retired' || a.status === 'Broken' || a.status === 'Lost').length}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">Non-Aktif</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pratinjau Tabel Aset Terbaru */}
          <div className={`p-5 rounded-3xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white">Aset Terbaru Didata</h3>
                <p className="text-xs text-slate-400">Menampilkan 5 data inventaris aset yang baru didaftarkan</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('Capex')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all"
                >
                  Lihat Semua Capex →
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('Opex')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all"
                >
                  Lihat Semua Opex →
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2.5 px-3 font-black text-slate-400 uppercase text-[9px]">Perangkat / Aset</th>
                    <th className="py-2.5 px-3 font-black text-slate-400 uppercase text-[9px]">Kode Aset</th>
                    <th className="py-2.5 px-3 font-black text-slate-400 uppercase text-[9px]">Tipe Anggaran</th>
                    <th className="py-2.5 px-3 font-black text-slate-400 uppercase text-[9px]">Pengguna</th>
                    <th className="py-2.5 px-3 font-black text-slate-400 uppercase text-[9px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {assets.slice(0, 5).map(asset => (
                    <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800 dark:text-white">{asset.name || asset.category}</div>
                        <div className="text-[10px] text-slate-400">{asset.category}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {asset.device_code || asset.asset_id}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                          (asset.budget_type || 'Capex') === 'Opex'
                            ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        }`}>
                          {asset.budget_type || 'Capex'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">
                        {asset.assigned_to || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        {getStatusBadge(asset.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'borrowed' ? (
        /* DEDICATED PERANGKAT DIPINJAM (LOAN) VIEW */
        <div className="space-y-6">
          {/* Information Cards Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sedang Dipinjam</p>
                <h3 className="text-2xl sm:text-3xl font-black mt-1 text-amber-600 dark:text-amber-400">
                  {borrowedAssets.filter(b => b.status === 'Dipinjam').length}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Status Perangkat Aktif Dipinjam</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-500">
                <ClipboardList className="w-7 h-7" />
              </div>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sudah Dikembalikan</p>
                <h3 className="text-2xl sm:text-3xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
                  {borrowedAssets.filter(b => b.status === 'Dikembalikan').length}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Perangkat Telah Kembali ke IT</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Riwayat Peminjaman</p>
                <h3 className="text-2xl sm:text-3xl font-black mt-1 text-blue-600 dark:text-blue-400">
                  {borrowedAssets.length}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Keseluruhan Catatan Transaksi</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-500">
                <FileSignature className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Search, Filter, and Action Bar */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3`}>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari peminjam, perangkat, kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm font-medium border focus:ring-2 focus:outline-none transition-all ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-amber-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-amber-500/20'
                }`}
              />
            </div>

            <button
              onClick={() => {
                setBorrowFormData({
                  asset_id: null,
                  device_name: '',
                  device_code: '',
                  budget_type: 'Capex',
                  borrower_name: '',
                  borrower_department: '',
                  borrow_date: new Date().toISOString().split('T')[0],
                  expected_return_date: '',
                  notes: '',
                  signature: ''
                });
                setDeviceSearchQuery('');
                setIsDeviceDropdownOpen(false);
                setShowBorrowModal(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Pinjamkan Perangkat</span>
            </button>
          </div>

          {/* Mobile Card Layout (Visible on small screens < md) */}
          <div className="block md:hidden space-y-3">
            {borrowedAssets.filter(item => {
              const query = searchQuery.toLowerCase();
              return !searchQuery || 
                item.device_name?.toLowerCase().includes(query) ||
                item.device_code?.toLowerCase().includes(query) ||
                item.borrower_name?.toLowerCase().includes(query) ||
                item.borrower_department?.toLowerCase().includes(query) ||
                item.notes?.toLowerCase().includes(query);
            }).length === 0 ? (
              <div className={`p-8 rounded-2xl border text-center text-slate-400 text-xs font-semibold ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                Belum ada data peminjaman perangkat.
              </div>
            ) : (
              borrowedAssets.filter(item => {
                const query = searchQuery.toLowerCase();
                return !searchQuery || 
                  item.device_name?.toLowerCase().includes(query) ||
                  item.device_code?.toLowerCase().includes(query) ||
                  item.borrower_name?.toLowerCase().includes(query) ||
                  item.borrower_department?.toLowerCase().includes(query) ||
                  item.notes?.toLowerCase().includes(query);
              }).map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-all ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {/* Card Header: Device Name & Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                        <span>{item.device_name}</span>
                        {item.budget_type && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                            item.budget_type === 'Opex'
                              ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          }`}>
                            {item.budget_type}
                          </span>
                        )}
                      </div>
                      {item.device_code && (
                        <div className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                          Kode: {item.device_code}
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border shrink-0 ${
                      item.status === 'Dipinjam'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    }`}>
                      {item.status === 'Dipinjam' ? <ClipboardList className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                      <span>{item.status}</span>
                    </span>
                  </div>

                  {/* Card Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Peminjam</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 block">{item.borrower_name}</span>
                      <span className="text-[10px] text-slate-400 block">{item.borrower_department || '-'}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                        {item.status === 'Dikembalikan' ? 'Pengembalian' : 'Tgl Dipinjam'}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 block">
                        {item.borrow_date ? new Date(item.borrow_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </span>
                      {item.status === 'Dikembalikan' ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                          Penerima: {item.received_by || '-'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Est: {item.expected_return_date ? new Date(item.expected_return_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.notes && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-[10px] text-slate-400 uppercase block mb-0.5">Keterangan:</span>
                      {item.notes}
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                    <div>
                      {item.signature ? (
                        <button
                          onClick={() => setShowSignaturePreview(item.signature!)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-all cursor-pointer min-h-[38px]"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>Lihat TTD</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs italic px-1">Tanpa TTD</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'Dipinjam' && (
                        <button
                          onClick={() => handleOpenReturnModal(item)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer min-h-[38px]"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Kembalikan</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBorrow(item.id)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center border border-rose-500/20"
                        title="Hapus Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (Visible on medium screens & larger) */}
          <div className={`hidden md:block rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${isDark ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                    <th className="px-4 py-3">Nama & Kode Perangkat</th>
                    <th className="px-4 py-3">Peminjam</th>
                    <th className="px-4 py-3">Tgl Dipinjam</th>
                    <th className="px-4 py-3">Estimasi Kembali</th>
                    <th className="px-4 py-3">Keterangan</th>
                    <th className="px-4 py-3 text-center">Tanda Tangan</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                  {borrowedAssets.filter(item => {
                    const query = searchQuery.toLowerCase();
                    return !searchQuery || 
                      item.device_name?.toLowerCase().includes(query) ||
                      item.device_code?.toLowerCase().includes(query) ||
                      item.borrower_name?.toLowerCase().includes(query) ||
                      item.borrower_department?.toLowerCase().includes(query) ||
                      item.notes?.toLowerCase().includes(query);
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 text-xs font-semibold">
                        Belum ada data peminjaman perangkat.
                      </td>
                    </tr>
                  ) : (
                    borrowedAssets.filter(item => {
                      const query = searchQuery.toLowerCase();
                      return !searchQuery || 
                        item.device_name?.toLowerCase().includes(query) ||
                        item.device_code?.toLowerCase().includes(query) ||
                        item.borrower_name?.toLowerCase().includes(query) ||
                        item.borrower_department?.toLowerCase().includes(query) ||
                        item.notes?.toLowerCase().includes(query);
                    }).map((item) => (
                      <tr key={item.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors text-xs`}>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{item.device_name}</span>
                            {item.budget_type && (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                                item.budget_type === 'Opex'
                                  ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                  : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              }`}>
                                {item.budget_type}
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            {item.device_code || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{item.borrower_name}</div>
                          <div className="text-[10px] text-slate-400">{item.borrower_department || '-'}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                          {item.borrow_date ? new Date(item.borrow_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                          {item.status === 'Dikembalikan' ? (
                            <div>
                              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                {item.actual_return_date ? new Date(item.actual_return_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                              </div>
                              {item.received_by && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                                  Penerima: <span className="capitalize text-slate-800 dark:text-slate-200 font-bold">{item.received_by}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span>
                              {item.expected_return_date ? new Date(item.expected_return_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[180px] truncate" title={item.notes || ''}>
                          {item.notes || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.signature ? (
                            <button
                              onClick={() => setShowSignaturePreview(item.signature!)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-[10px] font-bold transition-all cursor-pointer"
                            >
                              <PenTool className="w-3 h-3" />
                              <span>Lihat TTD</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            item.status === 'Dipinjam'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          }`}>
                            {item.status === 'Dipinjam' ? <ClipboardList className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            <span>{item.status}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status === 'Dipinjam' && (
                              <button
                                onClick={() => handleOpenReturnModal(item)}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                                title="Kembalikan Perangkat"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Kembalikan</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteBorrow(item.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                              title="Hapus Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* DEDICATED CAPEX & OPEX PAGE VIEW */
        <div className="space-y-6">
          {/* Top Summary Cards specific to Capex / Opex */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Aset {activeSubTab}</p>
                <h3 className={`text-2xl sm:text-3xl font-black mt-1 ${activeSubTab === 'Capex' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`}>
                  {filteredAssets.length}
                </h3>
              </div>
              <div className={`p-3 rounded-2xl ${activeSubTab === 'Capex' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                {activeSubTab === 'Capex' ? <Building2 className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Aset Aktif</p>
                <h3 className="text-2xl sm:text-3xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
                  {filteredAssets.filter(a => a.status === 'Active').length}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Proses Perbaikan</p>
                <h3 className="text-2xl sm:text-3xl font-black mt-1 text-amber-600 dark:text-amber-400">
                  {filteredAssets.filter(a => a.status === 'In Repair').length}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                <Filter className="w-6 h-6" />
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pengguna Terkait</p>
                <h3 className="text-2xl sm:text-3xl font-black mt-1 text-violet-600 dark:text-violet-400">
                  {new Set(filteredAssets.map(a => a.assigned_to).filter(Boolean)).size}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-500">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Header Actions & Filter Toolbar */}
          <div className="flex flex-col gap-3">
            {/* Search and Filter */}
            <div className="flex flex-col gap-2.5">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={`Cari aset ${activeSubTab} (Kode, Nama, Pengguna)...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border focus:ring-2 focus:outline-none transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                  }`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[140px]">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className={`w-full pl-9 pr-7 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border appearance-none focus:ring-2 focus:outline-none transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                    }`}
                  >
                    <option value="">Semua Kategori</option>
                    {assetCategories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="relative flex-1 min-w-[140px]">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className={`w-full pl-9 pr-7 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border appearance-none focus:ring-2 focus:outline-none transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                    }`}
                  >
                    <option value="">Semua Departemen</option>
                    {Array.from(new Set(assets.map(a => a.department).filter(Boolean))).sort().map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                
                <div className="relative flex-1 min-w-[140px]">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <select
                    value={filterUsageStatus}
                    onChange={(e) => setFilterUsageStatus(e.target.value)}
                    className={`w-full pl-9 pr-7 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border appearance-none focus:ring-2 focus:outline-none transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                    }`}
                  >
                    <option value="">Semua Status Pengguna</option>
                    <option value="karyawan">Karyawan</option>
                    <option value="shared department">Shared Dept</option>
                  </select>
                </div>
                
                <div className="relative flex-1 min-w-[140px]">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <select
                    value={filterAssetStatus}
                    onChange={(e) => setFilterAssetStatus(e.target.value)}
                    className={`w-full pl-9 pr-7 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border appearance-none focus:ring-2 focus:outline-none transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                    }`}
                  >
                    <option value="">Semua Status Aset</option>
                    <option value="Active">Aktif</option>
                    <option value="In Repair">Diperbaiki</option>
                    <option value="Retired">Pensiun</option>
                    <option value="Broken">Rusak</option>
                    <option value="Lost">Hilang</option>
                  </select>
                </div>

                {(searchQuery || filterCategory || filterDepartment || filterUsageStatus || filterAssetStatus) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterCategory('');
                      setFilterDepartment('');
                      setFilterUsageStatus('');
                      setFilterAssetStatus('');
                    }}
                    className="px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all whitespace-nowrap"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={handleDownloadTemplate}
                title="Download Template XLS"
                className={`px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                <span>Template XLS</span>
              </button>

              <button
                onClick={() => document.getElementById('import-asset-excel')?.click()}
                title="Import File XLS"
                className={`px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                <span>Import XLS</span>
              </button>

              <button
                onClick={handleExportExcel}
                title="Export ke XLS"
                className={`px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                <span>Export XLS</span>
              </button>

              <button
                onClick={handlePrintAllLabels}
                title="Cetak Label Aset"
                className={`px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                <span>Cetak Label</span>
              </button>
              
              <button
                onClick={() => {
                  setDeleteAllPassword('');
                  setShowDeleteAllModal(true);
                }}
                title="Hapus Semua Data Aset"
                className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap transition-all bg-rose-500/10 border-rose-500/30 text-rose-600 hover:bg-rose-500 hover:text-white dark:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Hapus Semua</span>
              </button>

              {/* Add Asset Button specific to Capex / Opex */}
              <button
                onClick={() => {
                  resetForm();
                  setFormData(prev => ({ ...prev, budget_type: activeSubTab }));
                  setEditingAsset(null);
                  setIsViewMode(false);
                  setShowModal(true);
                }}
                style={{ backgroundColor: primaryColor }}
                className="hidden sm:flex ml-auto px-4 py-2.5 rounded-2xl text-white text-xs sm:text-sm font-bold items-center gap-2 transition-all hover:brightness-110 shadow-lg whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Aset {activeSubTab}</span>
              </button>
            </div>
          </div>

      {/* Asset Grid / Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className={`text-center py-16 sm:py-20 rounded-3xl border ${themeClasses.bgCard}`}>
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-3 sm:mb-4 opacity-50" />
          <h3 className={`text-base sm:text-lg font-bold mb-1.5 ${themeClasses.heading}`}>Tidak Ada Aset</h3>
          <p className={`text-xs sm:text-sm ${themeClasses.textMuted}`}>Belum ada data aset yang tersimpan atau sesuai dengan filter.</p>
        </div>
      ) : (
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${themeClasses.card}`}>
          {/* Mobile Card Layout (md:hidden) */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedAssets.map((asset) => (
              <div key={asset.id} className="p-3.5 space-y-2.5">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      {getCategoryIcon(asset.category)}
                    </div>
                    <div className="min-w-0">
                      <div className={`font-bold text-xs sm:text-sm truncate ${themeClasses.heading}`}>{asset.name || asset.category}</div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {asset.category}
                        </span>
                        {getStatusBadge(asset.status)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button 
                      onClick={() => handlePrintSingleLabel(asset)}
                      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                      title="Cetak Label"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openEditModal(asset, true)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                      title="Lihat Aset"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(asset.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                      title="Hapus Aset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className={`p-2.5 rounded-xl grid grid-cols-2 gap-2 text-[11px] ${isDark ? 'bg-slate-800/40 border border-slate-800' : 'bg-slate-50 border border-slate-100'}`}>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Kode Perangkat</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{asset.device_code || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Kode Aset</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{asset.asset_id || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Pengguna / PJ</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.assigned_to || '-'}</span>
                    {asset.user_index && <span className="text-[9px] text-slate-400 block">Index: {asset.user_index}</span>}
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Departemen</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{asset.department || '-'}</span>
                  </div>
                  {(asset.brand || asset.specs) && (
                    <div className="col-span-2 border-t border-slate-200/50 dark:border-slate-700/50 pt-1.5 mt-0.5">
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Merk & Spesifikasi</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {asset.brand ? `${asset.brand} ` : ''}{asset.specs ? `• ${asset.specs}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Nama Perangkat</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Kategori</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">Kode Perangkat</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">Kode Aset</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Pengguna</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Departemen</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Tipe</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Status Pengguna</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Status Aset</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {paginatedAssets.map((asset) => (
                  <tr 
                    key={asset.id} 
                    className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          {getCategoryIcon(asset.category)}
                        </div>
                        <div className="min-w-0">
                          <div className={`font-bold text-xs truncate max-w-[150px] ${themeClasses.heading}`} title={asset.name}>{asset.name || '-'}</div>
                          {asset.brand && (
                            <div className={`text-[9px] truncate max-w-[150px] ${themeClasses.textMuted}`}>
                              {asset.brand}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap`}>
                        {asset.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {asset.device_code || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {asset.asset_id || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col">
                        <span className={`text-xs font-semibold truncate max-w-[120px] ${themeClasses.heading}`} title={asset.assigned_to || '-'}>
                          {asset.assigned_to || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-medium truncate block max-w-[120px] ${themeClasses.textMuted}`} title={asset.department || '-'}>
                        {asset.department || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                        (asset.budget_type || 'Capex') === 'Opex'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                      }`}>
                        {asset.budget_type || 'Capex'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap">
                        {asset.usage_status === 'shared department' ? 'Shared Dept' : 'Karyawan'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        {getStatusBadge(asset.status)}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handlePrintSingleLabel(asset)}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                          title="Cetak Label"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => openEditModal(asset, true)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                          title="Lihat Aset"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(asset.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="Hapus Aset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          {filteredAssets.length > 0 && (
            <div className={`px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium ${
              isDark ? 'border-slate-800 bg-slate-900/50 text-slate-400' : 'border-slate-100 bg-slate-50/50 text-slate-600'
            }`}>
              <div>
                Menampilkan <span className="font-bold text-slate-700 dark:text-slate-200">{filteredAssets.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-slate-700 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredAssets.length)}</span> dari <span className="font-bold text-slate-700 dark:text-slate-200">{filteredAssets.length}</span> aset
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark 
                      ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200' 
                      : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
                }`}>
                  Halaman {currentPage} dari {totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark 
                      ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200' 
                      : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
        </div>
      )}

      

      {/* Asset Form Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-6 sm:py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col ${
                isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
              }`}
            >
              <div className={`px-4 sm:px-6 py-3.5 sm:py-4 border-b flex items-center justify-between sticky top-0 z-10 flex-shrink-0 ${
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
              }`}>
                <h2 className={`text-base sm:text-lg font-black flex items-center gap-2 ${themeClasses.heading}`}>
                  {isViewMode ? (
                    <><Eye className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> Detail Aset</>
                  ) : (
                    <><Package className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> {editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}</>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  {isViewMode && (
                    <button 
                      onClick={() => setIsViewMode(false)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setShowModal(false)}
                    className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-200/50 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              
              {isViewMode && editingAsset ? (
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-3 rounded-2xl flex-shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      {getCategoryIcon(editingAsset.category)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{editingAsset.name || editingAsset.category}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {editingAsset.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                          (editingAsset.budget_type || 'Capex') === 'Opex'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        }`}>
                          {editingAsset.budget_type || 'Capex'}
                        </span>
                        {getStatusBadge(editingAsset.status)}
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 ${
                    isDark ? 'bg-slate-800/40 border border-slate-800' : 'bg-slate-50 border border-slate-100'
                  }`}>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Kode Perangkat</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{editingAsset.device_code || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Kode Aset</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{editingAsset.asset_id || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Merk</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{editingAsset.brand || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Serial Number</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{editingAsset.serial_number || '-'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Spesifikasi</span>
                      <span className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{editingAsset.specs || '-'}</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 ${
                    isDark ? 'bg-slate-800/40 border border-slate-800' : 'bg-slate-50 border border-slate-100'
                  }`}>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Pengguna / PJ</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{editingAsset.assigned_to || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Index / NIK</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block">{editingAsset.user_index || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Departemen</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{editingAsset.department || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Status Pengguna</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{editingAsset.usage_status || '-'}</span>
                    </div>
                  </div>

                  {(editingAsset.notes || editingAsset.condition) && (
                    <div className={`p-4 rounded-2xl space-y-3 ${
                      isDark ? 'bg-slate-800/40 border border-slate-800' : 'bg-slate-50 border border-slate-100'
                    }`}>
                      {editingAsset.condition && (
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Kondisi Fisik</span>
                          <span className="text-slate-700 dark:text-slate-300">{editingAsset.condition}</span>
                        </div>
                      )}
                      {editingAsset.notes && (
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Catatan Tambahan</span>
                          <span className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm">{editingAsset.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                  {/* 1. Kategori */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1 flex items-center justify-between">
                      <span>Kategori</span>
                      <span className="text-[9px] font-bold text-rose-500 lowercase">*wajib</span>
                    </label>
                    <select 
                      value={formData.category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        const autoDeviceCode = generateNextDeviceCode(newCat, assets, editingAsset?.id);
                        setFormData(prev => ({
                          ...prev,
                          category: newCat,
                          device_code: editingAsset ? prev.device_code : autoDeviceCode
                        }));
                      }}
                      className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    >
                      <option value="">Pilih Kategori...</option>
                      {assetCategories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Kode Perangkat (Otomatis) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        Kode Perangkat
                        <button
                          type="button"
                          onClick={() => {
                            const newCode = generateNextDeviceCode(formData.category || 'Komputer', assets, editingAsset?.id);
                            setFormData(prev => ({ 
                              ...prev, 
                              device_code: newCode
                            }));
                            toast.success(`Kode dibuat: ${newCode}`);
                          }}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
                          title="Generate Ulang Kode Otomatis dengan KDK"
                        >
                          ⚡ Otomatis
                        </button>
                      </span>
                      <span className="text-[9px] font-bold text-rose-500 lowercase">*wajib</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. PCKDK-001"
                      value={formData.device_code}
                      onChange={(e) => setFormData({...formData, device_code: e.target.value})}
                      className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  
                  {/* 3. Kode Aset (Opsional - Kosongkan jika otomatis/diisi manual) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1 flex items-center justify-between">
                      <span>Kode Aset</span>
                      <span className="text-[9px] font-medium text-slate-400 lowercase">(opsional)</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. AST-PCKDK-001 (opsional)"
                      value={formData.asset_id}
                      onChange={(e) => setFormData({...formData, asset_id: e.target.value})}
                      className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>

                  {/* 4. Nama Perangkat (Opsional / Tidak Wajib) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1 flex items-center justify-between">
                      <span>Nama Perangkat</span>
                      <span className="text-[9px] font-medium text-slate-400 lowercase">(opsional)</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Laptop Lenovo Thinkpad (opsional)"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  
                  {/* Merk */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Merk</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Lenovo, Epson"
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>

                  {/* Serial Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Serial Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. SN123456789"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                      className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>

                  {/* Spesifikasi */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Spesifikasi</label>
                    <textarea 
                      placeholder="e.g. Core i7, 16GB RAM, 512GB SSD"
                      rows={2}
                      value={formData.specs}
                      onChange={(e) => setFormData({...formData, specs: e.target.value})}
                      className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>

                  {/* User (Assigned To) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">User Pengguna</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        value={formData.assigned_to}
                        onChange={(e) => {
                          const userName = e.target.value;
                          const selectedUser = masterUsers.find(u => u.full_name === userName);
                          setFormData(prev => ({
                            ...prev,
                            assigned_to: userName,
                            department: selectedUser && selectedUser.department ? selectedUser.department : (userName ? prev.department : ''),
                            user_index: selectedUser && selectedUser.employee_index ? selectedUser.employee_index : (userName ? prev.user_index : '')
                          }));
                        }}
                        className={`w-full pl-9 pr-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                        }`}
                      >
                        <option value="">Pilih Pengguna...</option>
                        {masterUsers.map(u => (
                          <option key={u.id} value={u.full_name}>{u.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Index / NIK */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Index / NIK</label>
                      {Boolean(formData.assigned_to) && (
                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                          🔒 Terkunci
                        </span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      readOnly={Boolean(formData.assigned_to)}
                      placeholder="e.g. 1001"
                      value={formData.user_index}
                      onChange={(e) => setFormData({...formData, user_index: e.target.value})}
                      className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        formData.assigned_to ? 'opacity-70 cursor-not-allowed bg-slate-200/50 dark:bg-slate-800/50' : ''
                      } ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>

                  {/* Departemen */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Departemen</label>
                      {Boolean(formData.assigned_to) && (
                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                          🔒 Terkunci
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        disabled={Boolean(formData.assigned_to)}
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className={`w-full pl-9 pr-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                          formData.assigned_to ? 'opacity-70 cursor-not-allowed bg-slate-200/50 dark:bg-slate-800/50' : ''
                        } ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                        }`}
                      >
                        <option value="">Pilih Departemen...</option>
                        {masterDepartments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                        {formData.department && !masterDepartments.includes(formData.department) && (
                          <option value={formData.department}>{formData.department}</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Status Pengguna */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Status Pengguna</label>
                    <select 
                      value={formData.usage_status}
                      onChange={(e) => setFormData({...formData, usage_status: e.target.value})}
                      className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    >
                      <option value="karyawan">Karyawan</option>
                      <option value="share department">Share Department</option>
                    </select>
                  </div>
                  
                  {/* Tipe Anggaran (Capex / Opex) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Tipe Anggaran</label>
                    <select 
                      value={formData.budget_type}
                      onChange={(e) => setFormData({...formData, budget_type: e.target.value})}
                      className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    >
                      <option value="Capex">Capex (Capital Expenditure)</option>
                      <option value="Opex">Opex (Operational Expenditure)</option>
                    </select>
                  </div>

                  {/* Status Aset */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Status Aset</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    >
                      <option value="Active">Aktif</option>
                      <option value="In Repair">Diperbaiki</option>
                      <option value="Retired">Pensiun</option>
                      <option value="Lost">Hilang</option>
                    </select>
                  </div>

                </div>

                <div className="pt-4 flex gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                      isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 sm:py-3 rounded-xl text-white font-bold text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingAsset ? 'Simpan Perubahan' : 'Simpan Aset'}</span>
                  </button>
                </div>
              </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Borrow Asset Pop-up Modal */}
      <AnimatePresence>
        {showBorrowModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto py-4 sm:py-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col ${
                isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
              }`}
            >
              <div className={`px-4 sm:px-6 py-3.5 sm:py-4 border-b flex items-center justify-between sticky top-0 z-20 flex-shrink-0 ${
                isDark ? 'border-slate-800 bg-slate-900/95 backdrop-blur-md' : 'border-slate-100 bg-white/95 backdrop-blur-md'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-sm sm:text-base font-black ${themeClasses.heading}`}>
                      Pinjamkan Perangkat IT
                    </h2>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Isi formulir peminjaman & tanda tangan digital</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBorrowModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBorrow} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                {/* Integrated Searchable Device Combobox */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <label className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-amber-500" />
                      <span>Cari & Pilih Perangkat Aset</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={onlyITDepartment}
                        onChange={(e) => setOnlyITDepartment(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Hanya Dept IT</span>
                    </label>
                  </div>

                  {/* Single Searchable Input & Dropdown */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Ketik nama atau kode perangkat di sini..."
                      value={deviceSearchQuery}
                      onFocus={() => setIsDeviceDropdownOpen(true)}
                      onClick={() => setIsDeviceDropdownOpen(true)}
                      onChange={(e) => {
                        setDeviceSearchQuery(e.target.value);
                        setIsDeviceDropdownOpen(true);
                      }}
                      className={`w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white focus:ring-amber-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-amber-500/20'
                      }`}
                    />
                    {deviceSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeviceSearchQuery('');
                          setBorrowFormData(prev => ({ ...prev, asset_id: null, device_name: '', device_code: '' }));
                          setIsDeviceDropdownOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}

                    {/* Results Dropdown List */}
                    {isDeviceDropdownOpen && (
                      <div className={`absolute left-0 right-0 z-30 mt-1.5 max-h-56 overflow-y-auto rounded-2xl border shadow-2xl ${
                        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                      }`}>
                        {assets.filter(a => {
                          const isStatusValid = a.status === 'Active' || a.status === 'Dipinjam';
                          if (!isStatusValid) return false;

                          if (onlyITDepartment) {
                            const dept = (a.department || '').trim().toUpperCase();
                            const isIT = dept === 'IT' || dept.includes('IT') || dept.includes('INFORMATION TECHNOLOGY') || dept.includes('TEKNOLOGI INFORMASI');
                            if (!isIT) return false;
                          }

                          if (deviceSearchQuery.trim()) {
                            const q = deviceSearchQuery.toLowerCase();
                            const name = (a.name || '').toLowerCase();
                            const code = (a.device_code || '').toLowerCase();
                            const dept = (a.department || '').toLowerCase();
                            const cat = (a.category || '').toLowerCase();
                            return name.includes(q) || code.includes(q) || dept.includes(q) || cat.includes(q);
                          }
                          return true;
                        }).length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-xs font-medium">
                            Perangkat tidak ditemukan
                          </div>
                        ) : (
                          assets.filter(a => {
                            const isStatusValid = a.status === 'Active' || a.status === 'Dipinjam';
                            if (!isStatusValid) return false;

                            if (onlyITDepartment) {
                              const dept = (a.department || '').trim().toUpperCase();
                              const isIT = dept === 'IT' || dept.includes('IT') || dept.includes('INFORMATION TECHNOLOGY') || dept.includes('TEKNOLOGI INFORMASI');
                              if (!isIT) return false;
                            }

                            if (deviceSearchQuery.trim()) {
                              const q = deviceSearchQuery.toLowerCase();
                              const name = (a.name || '').toLowerCase();
                              const code = (a.device_code || '').toLowerCase();
                              const dept = (a.department || '').toLowerCase();
                              const cat = (a.category || '').toLowerCase();
                              return name.includes(q) || code.includes(q) || dept.includes(q) || cat.includes(q);
                            }
                            return true;
                          }).map(a => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => {
                                setBorrowFormData(prev => ({
                                  ...prev,
                                  asset_id: a.id,
                                  device_name: a.name,
                                  device_code: a.device_code || '',
                                  budget_type: a.budget_type || 'Capex',
                                  borrower_name: prev.borrower_name || a.assigned_to || '',
                                  borrower_department: prev.borrower_department || a.department || ''
                                }));
                                setDeviceSearchQuery(`${a.device_code ? `${a.device_code} - ` : ''}${a.name}`);
                                setIsDeviceDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-amber-500/10 transition-colors border-b last:border-b-0 text-xs flex items-center justify-between cursor-pointer ${
                                borrowFormData.asset_id === a.id
                                  ? 'bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400'
                                  : isDark ? 'border-slate-800 text-slate-200' : 'border-slate-100 text-slate-800'
                              }`}
                            >
                              <div>
                                <div className="font-extrabold flex items-center gap-1.5 text-xs sm:text-sm">
                                  <span>{a.name}</span>
                                  {a.device_code && <span className="font-mono text-[10px] text-slate-400">({a.device_code})</span>}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Dept: {a.department || 'General'}
                                </div>
                              </div>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                                a.budget_type === 'Opex'
                                  ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                  : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              }`}>
                                {a.budget_type || 'Capex'}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 px-1 pt-0.5">
                    <span>
                      Ditemukan:{' '}
                      <strong className="text-amber-600 dark:text-amber-400">
                        {assets.filter(a => {
                          const isStatusValid = a.status === 'Active' || a.status === 'Dipinjam';
                          if (!isStatusValid) return false;
                          if (onlyITDepartment) {
                            const dept = (a.department || '').trim().toUpperCase();
                            const isIT = dept === 'IT' || dept.includes('IT') || dept.includes('INFORMATION TECHNOLOGY') || dept.includes('TEKNOLOGI INFORMASI');
                            if (!isIT) return false;
                          }
                          if (deviceSearchQuery.trim()) {
                            const q = deviceSearchQuery.toLowerCase();
                            const name = (a.name || '').toLowerCase();
                            const code = (a.device_code || '').toLowerCase();
                            const dept = (a.department || '').toLowerCase();
                            const cat = (a.category || '').toLowerCase();
                            return name.includes(q) || code.includes(q) || dept.includes(q) || cat.includes(q);
                          }
                          return true;
                        }).length}
                      </strong>{' '}
                      perangkat
                    </span>
                    {onlyITDepartment && <span className="font-semibold text-blue-500">Filtered: IT Dept Only</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Nama Perangkat <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Laptop Lenovo ThinkPad"
                      value={borrowFormData.device_name}
                      onChange={(e) => setBorrowFormData({ ...borrowFormData, device_name: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-amber-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-amber-500/20'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Kode Perangkat
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LPKDK-001"
                      value={borrowFormData.device_code}
                      onChange={(e) => setBorrowFormData({ ...borrowFormData, device_code: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-amber-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-amber-500/20'
                      }`}
                    />
                  </div>
                </div>

                {/* Select Borrower from Master Users */}
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    <span>Cari & Pilih Karyawan Peminjam</span>
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Ketik nama karyawan..."
                      value={borrowerSearchQuery}
                      onFocus={() => setIsBorrowerDropdownOpen(true)}
                      onClick={() => setIsBorrowerDropdownOpen(true)}
                      onChange={(e) => {
                        setBorrowerSearchQuery(e.target.value);
                        setIsBorrowerDropdownOpen(true);
                      }}
                      className={`w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-amber-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-amber-500/20'
                      }`}
                    />
                    {borrowerSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setBorrowerSearchQuery('');
                          setBorrowFormData(prev => ({ ...prev, borrower_name: '', borrower_department: '' }));
                          setIsBorrowerDropdownOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                    {isBorrowerDropdownOpen && (
                      <div className={`absolute left-0 right-0 z-30 mt-1.5 max-h-56 overflow-y-auto rounded-2xl border shadow-2xl ${
                        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                      }`}>
                        {masterUsers.filter(u => {
                          if (borrowerSearchQuery.trim()) {
                            const q = borrowerSearchQuery.toLowerCase();
                            const name = (u.full_name || '').toLowerCase();
                            const dept = (u.department || '').toLowerCase();
                            return name.includes(q) || dept.includes(q);
                          }
                          return true;
                        }).length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-xs font-medium">
                            Karyawan tidak ditemukan
                          </div>
                        ) : (
                          masterUsers.filter(u => {
                            if (borrowerSearchQuery.trim()) {
                              const q = borrowerSearchQuery.toLowerCase();
                              const name = (u.full_name || '').toLowerCase();
                              const dept = (u.department || '').toLowerCase();
                              return name.includes(q) || dept.includes(q);
                            }
                            return true;
                          }).map(u => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setBorrowFormData(prev => ({
                                  ...prev,
                                  borrower_name: u.full_name,
                                  borrower_department: u.department || prev.borrower_department
                                }));
                                setBorrowerSearchQuery(u.full_name);
                                setIsBorrowerDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-amber-500/10 transition-colors border-b last:border-b-0 text-xs flex items-center justify-between cursor-pointer ${
                                borrowFormData.borrower_name === u.full_name
                                  ? 'bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400'
                                  : isDark ? 'border-slate-800 text-slate-200' : 'border-slate-100 text-slate-800'
                              }`}
                            >
                              <div className="font-extrabold flex items-center gap-1.5 text-xs sm:text-sm">
                                <span>{u.full_name}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Dept: {u.department || 'General'}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Nama Peminjam <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Budi Santoso"
                      value={borrowFormData.borrower_name}
                      onChange={(e) => setBorrowFormData({ ...borrowFormData, borrower_name: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-amber-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-amber-500/20'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Departemen
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Marketing"
                      value={borrowFormData.borrower_department}
                      onChange={(e) => setBorrowFormData({ ...borrowFormData, borrower_department: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-amber-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-amber-500/20'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Tanggal Dipinjamkan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={borrowFormData.borrow_date}
                      onChange={(e) => setBorrowFormData({ ...borrowFormData, borrow_date: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-amber-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-amber-500/20'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Tanggal Rencana Pengembalian
                    </label>
                    <input
                      type="date"
                      value={borrowFormData.expected_return_date}
                      onChange={(e) => setBorrowFormData({ ...borrowFormData, expected_return_date: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-amber-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-amber-500/20'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                    Keterangan / Keperluan Peminjaman
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Dipinjam sementara untuk presentasi client & dinas luar kota"
                    value={borrowFormData.notes}
                    onChange={(e) => setBorrowFormData({ ...borrowFormData, notes: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border focus:ring-2 focus:outline-none transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-amber-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-amber-500/20'
                    }`}
                  />
                </div>

                {/* Digital Signature Canvas */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1 flex items-center gap-1">
                      <PenTool className="w-3.5 h-3.5 text-amber-500" />
                      <span>Tanda Tangan Peminjam (Presisi)</span>
                    </label>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-[10px] font-extrabold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer p-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Bersihkan</span>
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-1 bg-white dark:bg-slate-950 touch-none flex justify-center">
                    <canvas
                      ref={canvasRef}
                      width={480}
                      height={140}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-32 cursor-crosshair rounded-xl bg-slate-50 dark:bg-slate-900/80"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    * Tanda tangan dapat digoreskan menggunakan jari pada layar sentuh smartphone atau mouse.
                  </p>
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowBorrowModal(false)}
                    className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-extrabold border transition-all min-h-[44px] cursor-pointer ${
                      isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-amber-500/20 cursor-pointer min-h-[44px]"
                  >
                    Simpan Peminjaman
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Signature Preview Modal */}
      <AnimatePresence>
        {showSignaturePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-blue-500" />
                  <span>Tanda Tangan Peminjam</span>
                </h3>
                <button
                  onClick={() => setShowSignaturePreview(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-center">
                <img src={showSignaturePreview} alt="Tanda Tangan" className="max-h-48 object-contain" />
              </div>

              <button
                onClick={() => setShowSignaturePreview(null)}
                className="w-full py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-extrabold transition-all min-h-[44px] cursor-pointer"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* Modal Pengembalian Perangkat */}
        {showReturnModal && returnItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in py-4 sm:py-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className={`w-full max-w-md rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border max-h-[90vh] overflow-y-auto ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold">Pengembalian Perangkat</h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Konfirmasi pengembalian aset ke tim IT</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Info Card */}
              <div className={`p-4 rounded-2xl border mb-4 space-y-2.5 text-xs ${
                isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Perangkat</span>
                    <span className="font-black text-sm text-slate-800 dark:text-slate-100">{returnItem.device_name}</span>
                    {returnItem.device_code && (
                      <span className="ml-1.5 text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                        ({returnItem.device_code})
                      </span>
                    )}
                  </div>
                  {returnItem.budget_type && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border shrink-0 ${
                      returnItem.budget_type === 'Opex'
                        ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                    }`}>
                      {returnItem.budget_type}
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Peminjam:</span>
                    <strong className="text-slate-700 dark:text-slate-200">{returnItem.borrower_name}</strong>
                    <span className="text-[10px] text-slate-400 ml-1">({returnItem.borrower_department || '-'})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Tgl Dipinjam:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {returnItem.borrow_date ? new Date(returnItem.borrow_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleConfirmReturn} className="space-y-4">
                {/* Penerima Barang (Yudha, Bayu, Dita, Chandra) */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Penerima Barang (Tim IT) <span className="text-rose-500">*</span>
                  </label>
                  
                  {/* Preset Options */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    {['yudha', 'bayu', 'dita', 'chandra'].map((person) => (
                      <button
                        key={person}
                        type="button"
                        onClick={() => setReceivedBy(person)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black capitalize transition-all border text-center min-h-[40px] flex items-center justify-center cursor-pointer ${
                          receivedBy.toLowerCase() === person
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20 scale-[1.02]'
                            : isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {person}
                      </button>
                    ))}
                  </div>

                  {/* Manual Input field if different */}
                  <input
                    type="text"
                    placeholder="Atau ketik nama penerima lain..."
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    required
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>

                {/* Tanggal Pengembalian */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Tanggal Pengembalian <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    required
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold border transition-all min-h-[44px] cursor-pointer ${
                      isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all min-h-[44px] cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Konfirmasi Kembali</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      {/* Modal Hapus Semua Data Aset */}
      <AnimatePresence>
        {showDeleteAllModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-rose-500">
                  <Trash2 className="w-5 h-5" />
                  <h3 className="text-xs font-black uppercase tracking-wider">Hapus Semua Data Aset</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteAllModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Peringatan: Tindakan ini akan menghapus <strong className="text-rose-500">SELURUH data aset</strong> secara permanen. Masukkan password konfirmasi untuk melanjutkan.
              </p>

              <form onSubmit={handleDeleteAllAssets} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Password Konfirmasi
                  </label>
                  <input
                    type="password"
                    placeholder="Masukkan password root"
                    value={deleteAllPassword}
                    onChange={(e) => setDeleteAllPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold border focus:ring-2 focus:outline-none transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-rose-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-rose-500/20'
                    }`}
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteAllModal(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                      isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isDeletingAll}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/20 disabled:opacity-50"
                  >
                    {isDeletingAll ? 'Menghapus...' : 'Ya, Hapus Semua'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
