import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Search, Plus, Filter, Edit2, Trash2, 
  Monitor, Smartphone, Printer, Server, Laptop, X, Save,
  User, Building2, Download, Upload, FileSpreadsheet
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
    try {
      if (editingAsset) {
        await api.updateAsset(editingAsset.id, formData);
      } else {
        await api.addAsset(formData);
      }
      
      setShowModal(false);
      setEditingAsset(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error saving asset:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      device_code: '',
      asset_id: '',
      name: '',
      category: assetCategories.length > 0 ? assetCategories[0].name : '',
      brand: '',
      specs: '',
      serial_number: '',
      department: '',
      usage_status: 'karyawan',
      assigned_to: '',
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

  // Extract unique departments from master users
  const masterDepartments = Array.from(new Set(masterUsers.map(u => u.department).filter(Boolean))).sort();

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Kode Perangkat': 'AST-001',
        'Nama Aset': 'Laptop Dell Latitude 5420',
        'Kategori': 'Laptop',
        'Merk / Brand': 'Dell',
        'Spesifikasi': 'Core i5 Gen 11, RAM 16GB, SSD 512GB',
        'Serial Number': 'SN123456789',
        'Departemen': 'IT Support',
        'Status Penggunaan': 'karyawan',
        'Penanggung Jawab / User': 'Budi Santoso',
        'Status Aset': 'Active',
        'Kondisi': 'Good',
        'Tanggal Pembelian': '2024-01-15',
        'Catatan': 'Unit baru garansi resmi'
      },
      {
        'Kode Perangkat': 'AST-002',
        'Nama Aset': 'PC Desktop HP ProDesk',
        'Kategori': 'Komputer',
        'Merk / Brand': 'HP',
        'Spesifikasi': 'Core i7, RAM 32GB, SSD 1TB',
        'Serial Number': 'HP987654321',
        'Departemen': 'CE Business',
        'Status Penggunaan': 'shared department',
        'Penanggung Jawab / User': 'Guntur',
        'Status Aset': 'Active',
        'Kondisi': 'Good',
        'Tanggal Pembelian': '2023-11-20',
        'Catatan': 'Aset bersama operasional tim'
      }
    ];

    const ws = xlsx.utils.json_to_sheet(templateData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Template Aset');
    xlsx.writeFile(wb, 'Template_Import_Aset.xlsx');
    toast.success('Template Excel berhasil diunduh');
  };

  const handleExportExcel = () => {
    if (assets.length === 0) {
      toast.error('Tidak ada data aset untuk diexport');
      return;
    }
    const exportData = filteredAssets.map(asset => ({
      'Kode Perangkat': asset.asset_id || asset.device_code,
      'Nama Aset': asset.name,
      'Kategori': asset.category,
      'Merk / Brand': asset.brand || '-',
      'Spesifikasi': asset.specs || '-',
      'Serial Number': asset.serial_number || '-',
      'Departemen': asset.department || '-',
      'Status Penggunaan': asset.usage_status || 'karyawan',
      'Penanggung Jawab / User': asset.assigned_to || '-',
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
        for (const row of rawData) {
          const asset_id = row['Kode Perangkat'] || row['Kode Aset'] || row['asset_id'] || row['device_code'];
          const name = row['Nama Aset'] || row['name'];
          const category = row['Kategori'] || row['category'];
          if (!asset_id || !name || !category) continue;

          const assetPayload = {
            asset_id: String(asset_id),
            name: String(name),
            category: String(category),
            device_code: String(row['Kode Perangkat'] || row['device_code'] || asset_id),
            brand: row['Merk / Brand'] || row['brand'] || '',
            specs: row['Spesifikasi'] || row['specs'] || '',
            serial_number: row['Serial Number'] || row['serial_number'] || '',
            department: row['Departemen'] || row['department'] || '',
            usage_status: row['Status Penggunaan'] || row['usage_status'] || 'karyawan',
            assigned_to: row['Penanggung Jawab / User'] || row['assigned_to'] || '',
            status: row['Status Aset'] || row['status'] || 'Active',
            condition: row['Kondisi'] || row['condition'] || 'Good',
            purchase_date: row['Tanggal Pembelian'] || row['purchase_date'] || '',
            notes: row['Catatan'] || row['notes'] || ''
          };

          await api.addAsset(assetPayload);
          count++;
        }
        toast.success(`Berhasil mengimpor ${count} data aset.`);
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

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari aset (Kode, Nama)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm font-medium border focus:ring-2 focus:outline-none transition-all ${
              isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`pl-10 pr-8 py-2.5 rounded-2xl text-sm font-medium border appearance-none focus:ring-2 focus:outline-none transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
              }`}
            >
              <option value="">Semua Kategori</option>
              {assetCategories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadTemplate}
            title="Download Template XLS"
            className={`px-3 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Template XLS</span>
          </button>

          <button
            onClick={() => document.getElementById('import-asset-excel')?.click()}
            title="Import File XLS"
            className={`px-3 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">Import XLS</span>
          </button>

          <button
            onClick={handleExportExcel}
            title="Export ke XLS"
            className={`px-3 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Export XLS</span>
          </button>

          <button
            onClick={() => {
              setDeleteAllPassword('');
              setShowDeleteAllModal(true);
            }}
            title="Hapus Semua Data Aset"
            className="px-3 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 transition-all bg-rose-500/10 border-rose-500/30 text-rose-600 hover:bg-rose-500 hover:text-white dark:text-rose-400"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Hapus Semua Aset</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setEditingAsset(null);
              setShowModal(true);
            }}
            style={{ backgroundColor: primaryColor }}
            className="px-4 py-2.5 rounded-2xl text-white text-sm font-bold flex items-center gap-2 transition-all hover:brightness-110 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Aset</span>
          </button>
        </div>
      </div>

      {/* Asset Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className={`text-center py-20 rounded-3xl border ${themeClasses.bgCard}`}>
          <Package className="w-16 h-16 text-slate-400 mx-auto mb-4 opacity-50" />
          <h3 className={`text-lg font-bold mb-2 ${themeClasses.heading}`}>Tidak Ada Aset</h3>
          <p className={themeClasses.textMuted}>Belum ada data aset yang tersimpan atau sesuai dengan filter.</p>
        </div>
      ) : (
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${themeClasses.card}`}>
          <div className="overflow-x-auto">
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
                {filteredAssets.map((asset) => (
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
        </div>
      )}

      

      {/* Asset Form Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto ${
                isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
              }`}
            >
              <div className={`px-6 py-4 border-b flex items-center justify-between sticky top-0 z-10 ${
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
              }`}>
                <h2 className={`text-lg font-black flex items-center gap-2 ${themeClasses.heading}`}>
                  <Package className="w-5 h-5 text-emerald-500" />
                  {editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-200/50 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Kode Perangkat */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Kode Perangkat</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. PC-IT-01"
                      value={formData.device_code}
                      onChange={(e) => setFormData({...formData, device_code: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  
                  {/* Kode ASET */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Kode Aset</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. AST-2026-001"
                      value={formData.asset_id}
                      onChange={(e) => setFormData({...formData, asset_id: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>

                  {/* Nama Perangkat */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Nama Perangkat</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Laptop Lenovo Thinkpad"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>

                  {/* Kategori */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Kategori</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    >
                      <option value="">Pilih Kategori...</option>
                      {assetCategories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Merk */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Merk</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Lenovo, Epson"
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
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
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>

                  {/* Spesifikasi */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Spesifikasi</label>
                    <textarea 
                      placeholder="e.g. Core i7, 16GB RAM, 512GB SSD"
                      rows={2}
                      value={formData.specs}
                      onChange={(e) => setFormData({...formData, specs: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
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
                            department: selectedUser && selectedUser.department ? selectedUser.department : (userName ? prev.department : '')
                          }));
                        }}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
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

                  {/* Departemen */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Departemen</label>
                      {Boolean(formData.assigned_to) && (
                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                          🔒 Terkunci (Sesuai User)
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        disabled={Boolean(formData.assigned_to)}
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
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
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
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
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
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

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
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
