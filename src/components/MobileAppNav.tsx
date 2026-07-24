import React, { useState, useRef, useEffect } from 'react';
import { ViewMode, IAdminUser } from '../types';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileAppNavProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isDark: boolean;
  adminUser: IAdminUser | null;
  userCanVoucher?: boolean;
}

export const MobileAppNav: React.FC<MobileAppNavProps> = ({
  viewMode,
  setViewMode,
  isDark,
  adminUser,
  userCanVoucher
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (mode: ViewMode) => {
    setViewMode(mode);
    setIsMenuOpen(false);
  };

  return (
    <div className="lg:hidden mb-4 relative" ref={menuRef}>
      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-900/40 p-1.5 rounded-2xl border border-slate-100/80 dark:border-zinc-800/60">
        
        {(adminUser || userCanVoucher) && (
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex-none p-2 rounded-xl transition-all ${
              isMenuOpen || ['dashboard', 'assets', 'network', 'ba', 'membership', 'evaluasi_project', 'voucher'].includes(viewMode)
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' 
                : isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
          >
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}

        <div className="flex-1 overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-1.5">
          <button 
            onClick={() => setViewMode('today')}
            className={`flex-none py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-center ${
              viewMode === 'today' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' 
                : isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
          >
            Hari Ini
          </button>
          <button 
            onClick={() => setViewMode('all')}
            className={`flex-none py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-center ${
              viewMode === 'all' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' 
                : isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
          >
            Semua
          </button>
          {adminUser && (
            <button 
              onClick={() => setViewMode('my_tickets')}
              className={`flex-none py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-center ${
                viewMode === 'my_tickets' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' 
                  : isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              Tiket Saya
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (adminUser || userCanVoucher) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full left-0 mt-2 w-48 rounded-xl shadow-lg border overflow-hidden z-50 ${
              isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col p-1.5 gap-1">
              {adminUser && (
                <>
                  <button 
                    onClick={() => handleMenuClick('dashboard')}
                    className={`text-left w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'dashboard' 
                        ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                        : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={() => handleMenuClick('assets')}
                    className={`text-left w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'assets' 
                        ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                        : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Manajemen Aset
                  </button>
                  <button 
                    onClick={() => handleMenuClick('membership')}
                    className={`text-left w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'membership' 
                        ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                        : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Membership
                  </button>
                </>
              )}

              {(adminUser || userCanVoucher) && (
                <button 
                  onClick={() => handleMenuClick('voucher')}
                  className={`text-left w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'voucher' 
                      ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                      : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {adminUser ? 'Cetak Voucher' : 'Buat Voucher'}
                </button>
              )}

              {adminUser && (
                <>
                  <button 
                    onClick={() => handleMenuClick('evaluasi_project')}
                    className={`text-left w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'evaluasi_project' 
                        ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                        : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Evaluasi Project
                  </button>

                  <button 
                    onClick={() => handleMenuClick('report_sla')}
                    className={`text-left w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'report_sla' 
                        ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                        : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Report SLA
                  </button>
                  
                  <button 
                    onClick={() => handleMenuClick('report_perangkat')}
                    className={`text-left w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'report_perangkat' 
                        ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                        : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Report Perangkat
                  </button>
                  
                  {(adminUser.role === 'Super Admin' || adminUser.role === 'Staff IT Support') && (
                    <>
                      <div className={`px-3 py-1 mt-1 text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        Master Data
                      </div>
                      <button 
                        onClick={() => handleMenuClick('master_user')}
                        className={`text-left w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
                          viewMode === 'master_user' 
                            ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                            : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        - Master Data (User)
                      </button>
                      <button 
                        onClick={() => handleMenuClick('master_perangkat')}
                        className={`text-left w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
                          viewMode === 'master_perangkat' 
                            ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                            : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        - Perangkat
                      </button>
                      <button 
                        onClick={() => handleMenuClick('network')}
                        className={`text-left w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all mt-1 ${
                          viewMode === 'network' 
                            ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                            : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Network
                      </button>
                    </>
                  )}
                  {adminUser.role === 'Super Admin' && (
                    <button 
                      onClick={() => handleMenuClick('ba')}
                      className={`text-left w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                        viewMode === 'ba' 
                          ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                          : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Surat Rekomendasi
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

