import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Package, Smartphone, Monitor, Printer, Server, Laptop, Activity, Box } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const assets = await api.getAssets();
        // Asset ID from QR is usually device_code or asset_id. Let's find it.
        const found = assets.find(a => String(a.device_code) === assetId || String(a.asset_id) === assetId || String(a.id) === assetId);
        setAsset(found);
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
        <div className="flex items-center gap-4 mb-8">
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            {getCategoryIcon(asset.category)}
          </div>
          <div>
            <h1 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.name || asset.category}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                {asset.category}
              </span>
              {getStatusBadge(asset.status)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <DetailRow label="Kode Perangkat" value={asset.device_code || '-'} isDark={isDark} />
          <DetailRow label="Kode Aset" value={asset.asset_id || '-'} isDark={isDark} />
          <DetailRow label="Pengguna" value={asset.assigned_to || '-'} isDark={isDark} />
          <DetailRow label="Departemen" value={asset.department || '-'} isDark={isDark} />
          <DetailRow label="Merk / Brand" value={asset.brand || '-'} isDark={isDark} />
          <DetailRow label="Serial Number" value={asset.serial_number || '-'} isDark={isDark} />
          <DetailRow label="Tanggal Pembelian" value={asset.purchase_date || '-'} isDark={isDark} />
          <DetailRow label="Kondisi" value={asset.condition || 'Good'} isDark={isDark} />
          
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
  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-800 last:border-0 gap-1 sm:gap-4">
    <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
    <span className={`text-sm font-bold text-right ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{value}</span>
  </div>
);
