import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  HardDrive,
  X, 
  Loader2, 
  ShieldCheck,
  Info,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

interface BulkPhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDark: boolean;
  themeClasses: any;
}

export const BulkPhotoUploadModal: React.FC<BulkPhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isDark
}) => {
  const [serverFolderPath, setServerFolderPath] = useState('C:\\upload\\members');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    totalFiles: 0,
    updated: 0,
    skipped: 0,
    notFound: 0,
    notFoundList: [] as string[]
  });
  const [isFinished, setIsFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const startServerSync = async () => {
    if (!serverFolderPath.trim()) {
      setErrorMessage('Silakan masukkan path folder server yang valid.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setIsFinished(false);

    try {
      const res = await api.syncServerPhotos(serverFolderPath.trim(), overwriteExisting);
      if (res && res.success) {
        setStats({
          totalFiles: res.totalFiles || 0,
          updated: res.updated || 0,
          skipped: res.skipped || 0,
          notFound: res.notFound || 0,
          notFoundList: res.notFoundList || []
        });
        setIsFinished(true);
        onSuccess();
      } else {
        setErrorMessage(res?.error || 'Gagal melakukan sinkronisasi foto dari server.');
      }
    } catch (err: any) {
      console.error('Error server photo sync:', err);
      setErrorMessage(err.message || 'Gagal terhubung ke folder server. Pastikan folder tersebut ada.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStats({ totalFiles: 0, updated: 0, skipped: 0, notFound: 0, notFoundList: [] });
    setIsFinished(false);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Sync Foto Server (Kode Lokal)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sinkronisasi foto anggota massal dari folder Windows Server</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
          {!isProcessing && !isFinished && (
            <>
              {/* Path Input Container */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-emerald-500" />
                      Path Folder di Windows Server
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-mono font-semibold">
                      Fast Direct Disk Read
                    </span>
                  </div>

                  <input
                    type="text"
                    value={serverFolderPath}
                    onChange={(e) => setServerFolderPath(e.target.value)}
                    placeholder="C:\upload\members"
                    className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border transition-colors focus:ring-2 focus:ring-emerald-500/40 outline-hidden ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Sistem server akan langsung membaca seluruh file foto di folder ini secara lokal dan mencocokkannya ke database berdasarkan Kode Lokal.
                  </p>
                </div>
              </div>

              {/* Data Protection Rule Box */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Aturan Keamanan Data (Proteksi Foto Anggota)</span>
                    <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={!overwriteExisting}
                        onChange={(e) => setOverwriteExisting(!e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600"
                      />
                      <span><strong>Proteksi Foto Aktif:</strong> Hanya isi anggota yang <u>belum memiliki foto</u> (foto lama tidak akan menimpa foto yang sudah ada).</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Format Info */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-[11px] leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Nama file di folder murni berupa <strong>Kode Lokal</strong> (misal: <code>40660.jpg</code>, <code>230019.jpg</code>). File yang kodenya tidak ada di database akan dilewatkan secara aman.
                </span>
              </div>
            </>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin flex items-center justify-center">
                  <HardDrive className="w-6 h-6 text-emerald-500 animate-pulse" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Sedang Memproses Folder Server...</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Membaca foto dari folder <code>{serverFolderPath}</code> dan mencocokkan ke database anggota.
                </p>
              </div>
            </div>
          )}

          {/* Finished State */}
          {isFinished && (
            <div className="space-y-4 py-1">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-7 h-7 shrink-0 text-emerald-500" />
                <div>
                  <h4 className="text-sm font-bold">Sinkronisasi Foto Server Selesai!</h4>
                  <p className="text-xs opacity-90">
                    Total {stats.totalFiles.toLocaleString('id-ID')} file foto di folder server telah diproses.
                  </p>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">Foto Berhasil Diisi</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stats.updated.toLocaleString('id-ID')}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">Dilewati (Sudah Ada)</span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400">{stats.skipped.toLocaleString('id-ID')}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">Kode Tidak Ditemukan</span>
                  <span className="text-lg font-black text-slate-600 dark:text-slate-400">{stats.notFound.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Unmatched Files Listing */}
              {stats.notFoundList.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    File dengan Kode Lokal Tidak Terdaftar ({stats.notFoundList.length}):
                  </span>
                  <div className={`p-3 rounded-xl border max-h-32 overflow-y-auto text-[11px] font-mono ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {stats.notFoundList.slice(0, 90).map((name, idx) => (
                        <span key={idx} className="truncate">• {name}</span>
                      ))}
                    </div>
                    {stats.notFoundList.length > 90 && (
                      <p className="mt-2 text-slate-500 italic text-[10px]">...dan {stats.notFoundList.length - 90} file lainnya</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`flex items-center justify-end gap-3 px-5 py-4 border-t ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50/80'
        }`}>
          {isFinished ? (
            <button
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              Selesai & Tutup
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${
                  isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-600'
                }`}
              >
                Batal
              </button>
              <button
                onClick={startServerSync}
                disabled={isProcessing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-4 h-4" />
                    <span>Proses Sync Folder Server</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
