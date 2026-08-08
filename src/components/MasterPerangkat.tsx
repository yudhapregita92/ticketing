import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutList, Search, Plus, Trash2, Edit2, X, Save, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export const MasterPerangkat = ({ isDark, primaryColor }: { isDark: boolean, primaryColor: string }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    kode_kategori: '',
    name: '',
    tahun_penyusutan: 4
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getAssetCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    try {
      if (editingId) {
        // Needs a new updateAssetCategory API method or just inline it
        await fetch(`/api/assets/categories/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await api.addAssetCategory(formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ kode_kategori: '', name: '', tahun_penyusutan: 4 });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Hapus kategori ini?')) return;
    try {
      await api.deleteAssetCategory(id);
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (cat: any) => {
    setEditingId(cat.id);
    setFormData({
      kode_kategori: cat.kode_kategori || '',
      name: cat.name,
      tahun_penyusutan: cat.tahun_penyusutan || 4
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Master Kategori Perangkat</h2>
          <p className="text-sm text-slate-500">Kelola kode, nama kategori, dan estimasi tahun penyusutan perangkat (asset).</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ kode_kategori: '', name: '', tahun_penyusutan: 4 });
            setShowModal(true);
          }}
          style={{ backgroundColor: primaryColor, borderRadius: 'var(--admin-btn-radius, 14px)' }}
          className="px-4 py-2.5 text-white font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-md shadow-blue-500/10 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Tambah Kategori
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <table className="w-full text-left text-sm">
            <thead className={`text-xs uppercase font-bold ${isDark ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="px-6 py-4">Kode Kategori</th>
                <th className="px-6 py-4">Nama Kategori</th>
                <th className="px-6 py-4">Tahun Penyusutan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Belum ada data kategori.</td>
                </tr>
              ) : categories.map((cat, idx) => (
                <tr key={`${cat.id || cat.name}-${idx}`} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                  <td className={`px-6 py-4 font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{cat.kode_kategori || '-'}</td>
                  <td className={`px-6 py-4 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{cat.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                      {cat.tahun_penyusutan || 4} Tahun
                    </span>
                  </td>
                  <td className="px-6 py-4 flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(cat)} className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-3xl shadow-xl overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border`}
            >
              <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {editingId ? 'Edit Kategori' : 'Tambah Kategori'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Kode Kategori</label>
                  <input
                    type="text"
                    value={formData.kode_kategori}
                    onChange={e => setFormData({...formData, kode_kategori: e.target.value})}
                    placeholder="Contoh: LT, PC, PR..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:outline-none transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nama Kategori</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Contoh: Laptop"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:outline-none transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tahun Penyusutan</label>
                  <select
                    value={formData.tahun_penyusutan}
                    onChange={e => setFormData({...formData, tahun_penyusutan: Number(e.target.value)})}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:outline-none transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value={1}>1 Tahun</option>
                    <option value={4}>4 Tahun</option>
                    <option value={8}>8 Tahun</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ borderRadius: 'var(--admin-btn-radius, 14px)' }}
                    className={`flex-1 py-3 font-bold text-sm transition-all active:scale-95 ${
                      isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: primaryColor, borderRadius: 'var(--admin-btn-radius, 14px)' }}
                    className="flex-1 py-3 text-white font-bold text-sm hover:opacity-90 transition-all active:scale-95 shadow-md shadow-blue-500/20"
                  >
                    {editingId ? 'Simpan' : 'Tambah'}
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
