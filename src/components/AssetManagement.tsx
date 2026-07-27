import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Search, Plus, Filter, Edit2, Trash2, 
  Monitor, Smartphone, Printer, Server, Laptop, X, Save,
  User, Building2, Download, Upload, FileSpreadsheet,
  ChevronLeft, ChevronRight, Users, Layers
} from 'lucide-react';
import * as xlsx from 'xlsx';
import toast from 'react-hot-toast';
import { IAsset } from '../types';
import { api } from '../services/api';

interface AssetManagementProps {
  isDark: boolean;
  themeClasses: any;
  primaryColor: string;
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

export const AssetManagement: React.FC<AssetManagementProps> = ({ isDark, themeClasses, primaryColor }) => {
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
    const [editingAsset, setEditingAsset] = useState<IAsset | null>(null);
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
  }, [searchQuery, filterCategory]);
  
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
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsData, users, categories] = await Promise.all([
        api.getAssets(),
        api.getMasterUsers(),
        api.getAssetCategories()
      ]);
      setAssets(assetsData);
      setMasterUsers(users);
      setAssetCategories(categories);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
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
      notes: ''
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

  
  
  const openEditModal = (asset: IAsset) => {
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
      notes: asset.notes || ''
    });
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
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.asset_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (asset.device_code && asset.device_code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory ? asset.category === filterCategory : true;
    return matchesSearch && matchesCategory;
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
        'Status Aset': 'Active',
        'Kondisi': 'Good',
        'Tanggal Pembelian': '2024-02-10',
        'Catatan': 'Printer bersama kantor'
      }
    ];

    const ws = xlsx.utils.json_to_sheet(templateData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Template Aset');
    xlsx.writeFile(wb, 'Template_Import_Aset.xlsx');
    toast.success('Template Excel (format KDK) berhasil diunduh');
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

      {/* Card Informasi Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className={`p-3 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Total Aset</p>
            <h3 className="text-xl sm:text-2xl font-black mt-0.5 sm:mt-1 text-emerald-600 dark:text-emerald-400">{totalAssetsCount}</h3>
          </div>
          <div className="p-2 sm:p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className={`p-3 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Kategori</p>
            <h3 className="text-xl sm:text-2xl font-black mt-0.5 sm:mt-1 text-blue-600 dark:text-blue-400">{totalCategoriesCount}</h3>
          </div>
          <div className="p-2 sm:p-3 rounded-2xl bg-blue-500/10 text-blue-500">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className={`p-3 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Pengguna</p>
            <h3 className="text-xl sm:text-2xl font-black mt-0.5 sm:mt-1 text-violet-600 dark:text-violet-400">{totalUsersCount}</h3>
          </div>
          <div className="p-2 sm:p-3 rounded-2xl bg-violet-500/10 text-violet-500">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className={`p-3 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Departemen</p>
            <h3 className="text-xl sm:text-2xl font-black mt-0.5 sm:mt-1 text-amber-600 dark:text-amber-400">{totalDepartmentsCount}</h3>
          </div>
          <div className="p-2 sm:p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Header Actions & Filter Toolbar */}
      <div className="flex flex-col gap-3">
        {/* Search and Category Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari aset (Kode, Nama, Pengguna)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border focus:ring-2 focus:outline-none transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
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

            {/* Mobile Primary Add Button */}
            <button
              onClick={() => {
                resetForm();
                setEditingAsset(null);
                setShowModal(true);
              }}
              style={{ backgroundColor: primaryColor }}
              className="sm:hidden px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Toolbar (Excel & Tools) */}
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

          {/* Desktop Primary Add Button */}
          <button
            onClick={() => {
              resetForm();
              setEditingAsset(null);
              setShowModal(true);
            }}
            style={{ backgroundColor: primaryColor }}
            className="hidden sm:flex ml-auto px-4 py-2.5 rounded-2xl text-white text-xs sm:text-sm font-bold items-center gap-2 transition-all hover:brightness-110 shadow-lg whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Aset</span>
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
                      onClick={() => openEditModal(asset)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Aset"
                    >
                      <Edit2 className="w-4 h-4" />
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
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Kode & Nama Aset</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Kategori & Merk</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Pengguna / PJ</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Departemen</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Status & Kondisi</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {paginatedAssets.map((asset) => (
                  <tr 
                    key={asset.id} 
                    className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl flex-shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          {getCategoryIcon(asset.category)}
                        </div>
                        <div>
                          <div className={`font-bold text-xs ${themeClasses.heading}`}>{asset.name}</div>
                          <div className={`text-[10px] font-mono ${themeClasses.textMuted}`}>
                            Kode: <span className="font-semibold text-slate-700 dark:text-slate-300">{asset.asset_id || asset.device_code}</span> {asset.device_code && asset.device_code !== asset.asset_id ? `(${asset.device_code})` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{asset.category}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{asset.brand ? `${asset.brand} ` : ''}{asset.specs ? `• ${asset.specs}` : ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className={`text-xs font-semibold ${themeClasses.heading}`}>
                          {asset.assigned_to || '-'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {asset.user_index ? `Index: ${asset.user_index} • ` : ''}
                          {asset.usage_status === 'shared department' ? 'Shared Dept' : 'Karyawan'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${themeClasses.textMuted}`}>
                        {asset.department || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        {getStatusBadge(asset.status)}
                        {asset.condition && (
                          <span className="text-[10px] text-slate-400">
                            Kondisi: {asset.condition}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => openEditModal(asset)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Aset"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                  {editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-200/50 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
