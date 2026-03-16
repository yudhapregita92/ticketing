import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Search, Plus, Filter, MoreVertical, Edit2, Trash2, 
  Monitor, Smartphone, Printer, Server, Laptop, X, Save, AlertCircle,
  Calendar, User, Building2, Info
} from 'lucide-react';
import { IAsset } from '../types';

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
  const [departments, setDepartments] = useState<any[]>([]);
  const [masterUsers, setMasterUsers] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    asset_id: '',
    name: '',
    category: 'Laptop',
    status: 'Active',
    assigned_to: '',
    department: '',
    purchase_date: '',
    condition: 'Good',
    notes: ''
  });

  useEffect(() => {
    fetchAssets();
    fetchMetadata();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/assets');
      const data = await res.json();
      setAssets(data);
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [deptRes, userRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/master-users')
      ]);
      setDepartments(await deptRes.json());
      setMasterUsers(await userRes.json());
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : '/api/assets';
      const method = editingAsset ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        setEditingAsset(null);
        setFormData({
          asset_id: '',
          name: '',
          category: 'Laptop',
          status: 'Active',
          assigned_to: '',
          department: '',
          purchase_date: '',
          condition: 'Good',
          notes: ''
        });
        fetchAssets();
      }
    } catch (err) {
      console.error('Error saving asset:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus aset ini?')) return;
    try {
      const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAssets();
    } catch (err) {
      console.error('Error deleting asset:', err);
    }
  };

  const openEditModal = (asset: IAsset) => {
    setEditingAsset(asset);
    setFormData({
      asset_id: asset.asset_id,
      name: asset.name,
      category: asset.category,
      status: asset.status,
      assigned_to: asset.assigned_to || '',
      department: asset.department || '',
      purchase_date: asset.purchase_date || '',
      condition: asset.condition || 'Good',
      notes: asset.notes || ''
    });
    setShowModal(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Laptop': return <Laptop className="w-4 h-4" />;
      case 'Monitor': return <Monitor className="w-4 h-4" />;
      case 'Smartphone': return <Smartphone className="w-4 h-4" />;
      case 'Printer': return <Printer className="w-4 h-4" />;
      case 'Server': return <Server className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
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
                          (asset.assigned_to && asset.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory ? asset.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6 pb-20 lg:pb-0"
    >
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${themeClasses.text}`}>Manajemen Aset</h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">Kelola dan pantau inventaris perangkat IT perusahaan.</p>
        </div>
        <button 
          onClick={() => {
            setEditingAsset(null);
            setFormData({
              asset_id: '',
              name: '',
              category: 'Laptop',
              status: 'Active',
              assigned_to: '',
              department: '',
              purchase_date: '',
              condition: 'Good',
              notes: ''
            });
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Aset</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className={`${themeClasses.card} p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row gap-3`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari ID, nama aset, atau pengguna..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border focus:ring-2 focus:outline-none transition-all ${
              isDark 
                ? 'bg-slate-900 border-slate-700 text-white focus:ring-emerald-500/50' 
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
            }`}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
              isDark 
                ? 'bg-slate-900 border-slate-700 text-white focus:ring-emerald-500/50' 
                : 'bg-white border-slate-200 text-slate-700 focus:ring-emerald-500/20'
            }`}
          >
            <option value="">Semua Kategori</option>
            <option value="Laptop">Laptop</option>
            <option value="Monitor">Monitor</option>
            <option value="Smartphone">Smartphone</option>
            <option value="Printer">Printer</option>
            <option value="Server">Server</option>
          </select>
          <button className={`p-2.5 rounded-xl border transition-all ${
            isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}>
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Assets Table */}
      <div className={`${themeClasses.card} rounded-2xl border shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">ID Aset</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Nama Aset</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Kategori</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Pengguna</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Departemen</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-medium">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-slate-500">{asset.asset_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${themeClasses.text}`}>{asset.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        {getCategoryIcon(asset.category)}
                        <span className="text-xs font-medium">{asset.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(asset.status)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${themeClasses.text}`}>{asset.assigned_to || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-500">{asset.department || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => openEditModal(asset)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(asset.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Package className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-xs font-medium">Tidak ada aset yang ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit Aset */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-2xl overflow-hidden rounded-3xl border shadow-2xl ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <Package className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h2 className={`text-lg font-black tracking-tight ${themeClasses.text}`}>
                    {editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}
                  </h2>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ID Aset */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">ID Aset</label>
                    <div className="relative">
                      <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required
                        type="text"
                        placeholder="Contoh: AST-001"
                        value={formData.asset_id}
                        onChange={(e) => setFormData({...formData, asset_id: e.target.value})}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Nama Aset */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Nama Aset</label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required
                        type="text"
                        placeholder="Contoh: MacBook Pro M2"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                        }`}
                      />
                    </div>
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
                      <option value="Laptop">Laptop</option>
                      <option value="Monitor">Monitor</option>
                      <option value="Smartphone">Smartphone</option>
                      <option value="Printer">Printer</option>
                      <option value="Server">Server</option>
                      <option value="Other">Lainnya</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Status</label>
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

                  {/* Pengguna */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Pengguna</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        value={formData.assigned_to}
                        onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                        }`}
                      >
                        <option value="">Pilih Pengguna</option>
                        {masterUsers.map(u => (
                          <option key={u.id} value={u.full_name}>{u.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Departemen */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Departemen</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                        }`}
                      >
                        <option value="">Pilih Departemen</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tanggal Pembelian */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Tanggal Pembelian</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Kondisi */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Kondisi</label>
                    <select 
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    >
                      <option value="Good">Bagus</option>
                      <option value="Fair">Cukup</option>
                      <option value="Poor">Buruk</option>
                      <option value="Damaged">Rusak</option>
                    </select>
                  </div>
                </div>

                {/* Catatan */}
                <div className="mt-4 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Catatan</label>
                  <div className="relative">
                    <Info className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea 
                      placeholder="Tambahkan catatan tambahan..."
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-bold border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                      }`}
                    />
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
    </motion.div>
  );
};
