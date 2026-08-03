import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, AlertCircle, CheckCircle2, Activity, ShieldCheck, Server, Key, Wifi, WifiOff } from 'lucide-react';
import { api } from '../services/api';

interface TestingViewProps {
  isDark: boolean;
  themeClasses: any;
}

export const TestingView: React.FC<TestingViewProps> = ({ isDark, themeClasses }) => {
  const [host, setHost] = useState('192.168.1.2');
  const [port, setPort] = useState('3306');
  const [user, setUser] = useState('root');
  const [password, setPassword] = useState('1234');
  const [database, setDatabase] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMessage('');
    setErrorDetails('');

    try {
      const response = await api.testDbConnection({
        host: host.trim(),
        port: port ? Number(port) : 3306,
        user: user.trim(),
        password,
        database: database.trim() || undefined
      });

      if (response.success) {
        setStatus('success');
        setMessage(response.message || 'Koneksi Berhasil Terhubung!');
      } else {
        setStatus('error');
        setMessage('Gagal Terhubung ke Database MySQL');
        setErrorDetails(response.error || 'Unknown error occurred.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage('Kesalahan Jaringan / Server');
      setErrorDetails(err.message || 'Gagal menghubungi server lokal untuk melakukan tes koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className={`p-6 rounded-3xl border ${themeClasses.border} ${themeClasses.card} shadow-sm overflow-hidden relative`}>
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Database className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Diagnostik Server</div>
            <h1 className={`text-2xl font-black tracking-tight ${themeClasses.text}`}>Menu Testing Koneksi</h1>
            <p className={`text-xs mt-1 ${themeClasses.textMuted}`}>
              Gunakan halaman ini untuk memverifikasi jalur komunikasi antara PC Server aplikasi (<span className="font-bold underline">192.168.1.5</span>) dengan PC Server Windows tujuan (<span className="font-bold underline">192.168.1.2</span>).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
              status === 'success' 
                ? 'bg-emerald-500/10 text-emerald-500' 
                : status === 'error' 
                  ? 'bg-rose-500/10 text-rose-500' 
                  : 'bg-slate-500/10 text-slate-500'
            }`}>
              {status === 'success' ? (
                <>
                  <Wifi className="w-3 h-3" /> ONLINE
                </>
              ) : status === 'error' ? (
                <>
                  <WifiOff className="w-3 h-3" /> OFFLINE
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3" /> READY TO TEST
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Connection Configuration */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border ${themeClasses.border} ${themeClasses.card} space-y-6 shadow-sm`}>
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Server className="w-5 h-5 text-emerald-500" />
            <h2 className={`text-sm font-black uppercase tracking-wider ${themeClasses.text}`}>Konfigurasi Koneksi MySQL</h2>
          </div>

          <form onSubmit={handleTestConnection} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`text-[10px] font-black ${themeClasses.textMuted} uppercase tracking-wider ml-1`}>
                  IP Address Host / Target PC
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Server className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="Contoh: 192.168.1.2"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.input} ${themeClasses.border} ${themeClasses.text}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-[10px] font-black ${themeClasses.textMuted} uppercase tracking-wider ml-1`}>
                  Port MySQL
                </label>
                <input
                  type="number"
                  required
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="Default: 3306"
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.input} ${themeClasses.border} ${themeClasses.text}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`text-[10px] font-black ${themeClasses.textMuted} uppercase tracking-wider ml-1`}>
                  Username Database
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="Contoh: root"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.input} ${themeClasses.border} ${themeClasses.text}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-[10px] font-black ${themeClasses.textMuted} uppercase tracking-wider ml-1`}>
                  Password Database
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contoh: 1234"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.input} ${themeClasses.border} ${themeClasses.text}`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-[10px] font-black ${themeClasses.textMuted} uppercase tracking-wider ml-1`}>
                Nama Database <span className="text-[9px] font-medium text-slate-400">(Opsional)</span>
              </label>
              <input
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                placeholder="Masukkan nama database untuk verifikasi penuh (Kosongkan jika hanya test koneksi server)"
                className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.input} ${themeClasses.border} ${themeClasses.text}`}
              />
            </div>

            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-2xl text-xs font-bold tracking-widest uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Mencoba Terhubung...
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    Test Koneksi Database
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>

        {/* Results Panel */}
        <div className="flex flex-col gap-4">
          <div className={`p-6 rounded-3xl border ${themeClasses.border} ${themeClasses.card} flex-1 flex flex-col justify-between shadow-sm`}>
            <div className="space-y-4">
              <h3 className={`text-xs font-black uppercase tracking-wider ${themeClasses.textMuted}`}>
                Status Hasil Diagnostik
              </h3>

              {status === 'idle' && (
                <div className="text-center py-8 space-y-2">
                  <Database className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">Belum ada tes koneksi yang dijalankan</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed px-4">
                    Isi detail konfigurasi server MySQL tujuan di sebelah kiri dan klik tombol untuk mendeteksi status konektivitas.
                  </p>
                </div>
              )}

              {status === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 space-y-2"
                >
                  <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Koneksi Sukses (Terhubung)
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed">
                    {message}
                  </p>
                  <div className="text-[9px] bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/10 font-mono mt-1 text-emerald-600 dark:text-emerald-300">
                    STATUS_OK: Database Windows Server MySQL pada IP {host} berhasil menerima instruksi ping TCP/IP dari server Anda.
                  </div>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/20 text-rose-700 dark:text-rose-400 space-y-2"
                >
                  <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    Koneksi Gagal (Terputus)
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed">
                    {message}
                  </p>
                  <div className="text-[9px] bg-rose-500/10 p-2 rounded-xl border border-rose-500/10 font-mono mt-2 break-all whitespace-pre-wrap leading-relaxed text-rose-600 dark:text-rose-300">
                    {errorDetails}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Info help */}
            <div className={`mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] ${themeClasses.textMuted} leading-relaxed`}>
              <p className="font-bold mb-1">💡 Tips Pemecahan Masalah:</p>
              <ul className="list-disc pl-3.5 space-y-1 text-[9px]">
                <li>Pastikan MySQL di PC Server Windows (192.168.1.2) diizinkan menerima koneksi remote (bind-address = 0.0.0.0).</li>
                <li>Periksa Windows Defender Firewall di PC 192.168.1.2, pastikan port <span className="font-bold text-slate-500 dark:text-slate-400">3306</span> telah di-allow.</li>
                <li>Verifikasi user <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">root</span> diizinkan login dari IP host remote (root@%).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
