import React from 'react';
import { ViewMode, IAdminUser } from '../types';

interface MobileAppNavProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isDark: boolean;
  adminUser: IAdminUser | null;
}

export const MobileAppNav: React.FC<MobileAppNavProps> = ({
  viewMode,
  setViewMode,
  isDark,
  adminUser
}) => {
  return (
    <div className="lg:hidden mb-4">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth bg-slate-50 dark:bg-zinc-900/40 p-1.5 rounded-2xl border border-slate-100/80 dark:border-zinc-800/60">
        {adminUser && (
          <button 
            onClick={() => setViewMode('dashboard')}
            className={`flex-none py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-center ${
              viewMode === 'dashboard' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' 
                : isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
          >
            Dashboard
          </button>
        )}
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
        {adminUser && (
          <button 
            onClick={() => setViewMode('assets')}
            className={`flex-none py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-center ${
              viewMode === 'assets' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' 
                : isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
          >
            Manajemen Aset
          </button>
        )}
        {adminUser && (adminUser.role === 'Super Admin' || adminUser.role === 'Staff IT Support') && (
          <button 
            onClick={() => setViewMode('network')}
            className={`flex-none py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-center ${
              viewMode === 'network' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' 
                : isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
          >
            Network
          </button>
        )}
        {adminUser && adminUser.role === 'Super Admin' && (
          <button 
            onClick={() => setViewMode('ba')}
            className={`flex-none py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-center ${
              viewMode === 'ba' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' 
                : isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
          >
            Surat Rekomendasi
          </button>
        )}
      </div>
    </div>
  );
};
