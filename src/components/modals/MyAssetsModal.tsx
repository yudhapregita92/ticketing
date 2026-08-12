import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Laptop, X, HardDrive, Cpu, Tag, CheckCircle2, Clock, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { api } from '../../services/api';

interface MyAssetsModalProps {
  show: boolean;
  onClose: () => void;
  currentUser: any;
  isDark: boolean;
  themeClasses: any;
}

export const MyAssetsModal: React.FC<MyAssetsModalProps> = ({
  show,
  onClose,
  currentUser,
  isDark,
  themeClasses
}) => {
  const [assets, setAssets] = useState<any[]>([]);
  const [borrowedAssets, setBorrowedAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assigned' | 'borrowed'>('assigned');

  useEffect(() => {
    if (show && currentUser) {
      loadUserAssets();
    }
  }, [show, currentUser]);

  const loadUserAssets = async () => {
    setLoading(true);
    try {
      const [allAssets, allBorrowed] = await Promise.all([
        api.getAssets().catch(() => []),
        api.getBorrowedAssets().catch(() => [])
      ]);

      const myName = (currentUser?.full_name || currentUser?.username || '').toLowerCase().trim();
      const myIndex = (currentUser?.employee_index || '').toLowerCase().trim();

      // Filter main assigned assets
      const myMainAssets = (allAssets || []).filter((item: any) => {
        const uName = (item.user_name || item.assigned_to || '').toLowerCase().trim();
        const uIndex = (item.user_index || item.employee_index || '').toLowerCase().trim();
        return (myName && uName.includes(myName)) || (myIndex && uIndex === myIndex);
      });

      // Filter borrowed assets
      const myBorrowed = (allBorrowed || []).filter((item: any) => {
        const uName = (item.borrower_name || item.user_name || '').toLowerCase().trim();
        const uIndex = (item.borrower_index || item.employee_index || '').toLowerCase().trim();
        return (myName && uName.includes(myName)) || (myIndex && uIndex === myIndex);
      });

      setAssets(myMainAssets);
      setBorrowedAssets(myBorrowed);
    } catch (err) {
      console.error('Error loading user assets:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className={`relative w-full max-w-2xl rounded-2xl border shadow-xl overflow-hidden flex flex-col max-h-[85vh] ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center font-bold">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">Daftar Aset Saya</h3>
                <p className="text-xs text-slate-400">
                  Perangkat & unit piranti IT yang terdaftar atas nama {currentUser?.full_name || 'Anda'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-5 pt-3 pb-0 border-b border-slate-200/40 dark:border-slate-800 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('assigned')}
              className={`pb-2.5 px-3 text-xs font-black tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'assigned'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" /> Aset Utama ({assets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('borrowed')}
              className={`pb-2.5 px-3 text-xs font-black tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'borrowed'
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Unit Dipinjamkan ({borrowedAssets.length})
            </button>
          </div>

          {/* Content Body */}
          <div className="p-5 overflow-y-auto flex-1 space-y-3">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                <span className="text-xs font-medium">Memuat data aset...</span>
              </div>
            ) : activeTab === 'assigned' ? (
              assets.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Laptop className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2 opacity-50" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Belum Ada Aset Terdaftar</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tidak ada perangkat IT utama yang dikaitkan dengan akun atau Indeks Anda.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assets.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                            {item.category || item.jenis_piranti || 'Aset IT'}
                          </span>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white mt-1">
                            {item.asset_name || item.name || 'Perangkat IT'}
                          </h4>
                        </div>
                        {item.asset_code && (
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-200/50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                            {item.asset_code}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 border-t border-slate-200/40 dark:border-slate-700/40 pt-2 mt-2">
                        {item.brand && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Merk / Tipe:</span>
                            <span className="font-semibold">{item.brand} {item.model || ''}</span>
                          </div>
                        )}
                        {item.serial_number && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Serial Number:</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{item.serial_number}</span>
                          </div>
                        )}
                        {item.specifications && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Spesifikasi:</span>
                            <span className="font-medium text-right truncate max-w-[180px]">{item.specifications}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-400">Kondisi Fisik:</span>
                          <span className={`font-bold ${
                            item.condition === 'Baik' ? 'text-emerald-500' : 'text-amber-500'
                          }`}>
                            {item.condition || 'Baik'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              borrowedAssets.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2 opacity-50" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Tidak Ada Perangkat Pinjaman</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Saat ini Anda tidak memiliki unit perangkat pengganti yang dipinjam dari IT.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {borrowedAssets.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-violet-500 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded border border-violet-500/20">
                            Unit Pengganti
                          </span>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white mt-1">
                            {item.asset_name || 'Unit Laptop / PC Pinjaman'}
                          </h4>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          item.status === 'Dipinjam'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        }`}>
                          {item.status || 'Dipinjam'}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 border-t border-slate-200/40 dark:border-slate-700/40 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tanggal Pinjam:</span>
                          <span className="font-semibold">{item.borrow_date || '-'}</span>
                        </div>
                        {item.ticket_no && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Tiket Terkait:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">#{item.ticket_no}</span>
                          </div>
                        )}
                        {item.notes && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Catatan:</span>
                            <span className="font-medium text-right truncate max-w-[180px]">{item.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Footer */}
          <div className={`p-4 border-t flex justify-end ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-100'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
