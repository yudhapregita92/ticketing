import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Package, Smartphone, Monitor, Printer, Server, Laptop, Activity, Box, Clock, ShieldAlert, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { calculateAssetDepreciation } from '../utils/assetUtils';

const getCategoryIcon = (category: string = '') => {
  if (!category) return <Package className="w-5 h-5" />;
  const c = String(category).toLowerCase();
  if (c.includes('komputer') || c.includes('pc')) return <Monitor className="w-5 h-5" />;
  if (c.includes('laptop')) return <Laptop className="w-5 h-5" />;
  if (c.includes('handphone') || c.includes('smartphone')) return <Smartphone className="w-5 h-5" />;
  if (c.includes('printer')) return <Printer className="w-5 h-5" />;
  if (c.includes('server')) return <Server className="w-5 h-5" />;
  if (c.includes('jaringan') || c.includes('network')) return <Activity className="w-5 h-5" />;
  return <Package className="w-5 h-5" />;
};

export const PublicAssetView = ({ assetId, isDark }: { assetId: string, isDark: boolean }) => {
  const [asset, setAsset] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const [assets, cats] = await Promise.all([
          api.getAssets(),
          api.getAssetCategories()
        ]);
        // Asset ID from QR is usually device_code or asset_id. Let's find it.
        const found = assets.find(a => String(a.device_code) === assetId || String(a.asset_id) === assetId || String(a.id) === assetId);
        setAsset(found);
        setCategories(cats || []);
      } catch (err) {
        console.error("Error fetching asset", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [assetId]);

  
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <Box className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Aset Tidak Ditemukan</h1>
        <p className="text-slate-500">Data aset dengan kode "{assetId}" tidak tersedia atau sudah dihapus.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active': return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-bold">Aktif</span>;
      case 'In Repair': return <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-bold">Diperbaiki</span>;
      case 'Retired': return <span className="px-3 py-1 bg-slate-500/10 text-slate-500 border border-slate-500/20 rounded-full text-xs font-bold">Pensiun</span>;
      case 'Lost': return <span className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full text-xs font-bold">Hilang</span>;
      default: return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-bold">Aktif</span>;
    }
  };

  return (
    <div className={`min-h-screen py-10 px-4 flex justify-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            {getCategoryIcon(asset.category)}
          </div>
          <div>
            <h1 className={`text-xl sm:text-2xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{asset.name || asset.category}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                {asset.category}
              </span>
              {getStatusBadge(asset.status)}
              {Boolean(asset.is_issued) && (
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full text-xs font-black flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" /> ISSUED
                </span>
              )}
            </div>
          </div>
        </div>

        {Boolean(asset.is_issued) && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-black uppercase text-[11px] tracking-wider text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              Status Penugasan Issued (Fasilitas Operasional)
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {asset.issued_reason || 'Di-issued secara khusus untuk kebutuhan operasional.'}
            </p>
          </div>
        )}

        {/* Status Replacement / Prosedur Tukar Unit */}
        {Boolean(asset.notes && (asset.notes.includes('[Unit Baru]') || asset.notes.includes('[Tukar Perangkat]') || asset.notes.includes('Pengganti') || asset.notes.includes('Replace'))) && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-black uppercase text-[11px] tracking-wider text-indigo-600 dark:text-indigo-400">
              <ArrowRightLeft className="w-4 h-4 text-indigo-500 shrink-0" />
              Riwayat / Informasi Replacement Perangkat
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {asset.notes}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <DetailRow label="Kode Perangkat" value={asset.device_code || '-'} isDark={isDark} />
          <DetailRow label="Kode Aset" value={asset.asset_id || '-'} isDark={isDark} />
          <DetailRow label="Pengguna" value={asset.assigned_to || '-'} isDark={isDark} />
          <DetailRow label="Departemen" value={asset.department || '-'} isDark={isDark} />
          <DetailRow label="Merk / Brand" value={asset.brand || '-'} isDark={isDark} />
          <DetailRow label="Serial Number" value={asset.serial_number || '-'} isDark={isDark} />
          <DetailRow label="Tanggal Pembelian" value={asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} isDark={isDark} />
          <DetailRow label="Kondisi" value={asset.condition || 'Good'} isDark={isDark} />
          
          {/* Section Penyusutan Aset berdasarkan Kategori */}
          {(() => {
            const catObj = categories.find(c => 
              (c.name && asset.category && c.name.toLowerCase() === asset.category.toLowerCase()) ||
              (c.kode_kategori && asset.category && c.kode_kategori.toLowerCase() === asset.category.toLowerCase())
            );
            const usefulYears = catObj?.tahun_penyusutan || 4;
            const dep = calculateAssetDepreciation(asset.purchase_date, usefulYears);
            return (
              <div className={`p-4 sm:p-5 my-4 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/80 border-slate-200/80'} shadow-2xs space-y-3`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-black uppercase tracking-wider truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      ESTIMASI PENYUSUTAN (STANDAR {usefulYears} TAHUN)
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${dep.badgeClass}`}>
                    {dep.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">USIA PEMAKAIAN</span>
                    <span className={`text-sm sm:text-base font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{dep.ageText}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">AKUMULASI DEPRESIASI</span>
                    <span className={`text-sm sm:text-base font-extrabold ${dep.isReplaceReady ? 'text-rose-500' : isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {dep.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar penyusutan */}
                <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      dep.percentage >= 100 
                        ? 'bg-rose-500' 
                        : dep.percentage >= 85 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                    }`} 
                    style={{ width: `${Math.min(dep.percentage, 100)}%` }}
                  />
                </div>
                {dep.isReplaceReady && (
                  <div className="mt-2 flex items-start gap-2 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Perangkat telah memenuhi masa pakai {usefulYears} tahun dan direkomendasikan untuk penggantian/replace.</span>
                  </div>
                )}
              </div>
            );
          })()}
          
          {asset.specs && (
            <div className="pt-2">
              <label className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Spesifikasi</label>
              <div className={`p-3 rounded-xl text-sm font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
                {asset.specs}
              </div>
            </div>
          )}

          {asset.notes && (
            <div className="pt-2">
              <label className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Catatan</label>
              <div className={`p-3 rounded-xl text-sm font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
                {asset.notes}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className={`text-[10px] font-bold tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            IT HELPDESK K3DK
          </p>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, isDark }: { label: string, value: string, isDark: boolean }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-dashed border-slate-200 dark:border-slate-800 last:border-0 gap-2">
    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
    <span className={`text-xs sm:text-sm font-extrabold text-right ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{value}</span>
  </div>
);
