import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Send, 
  ShieldCheck, 
  LogOut, 
  Settings2, 
  ClipboardList, 
  UserCog,
  Image as ImageIcon,
  Sun,
  Moon,
  Search
} from 'lucide-react';
import { IAdminUser } from '../types';
import { Logo } from './Logo';

interface BottomNavProps {
  adminUser: IAdminUser | null;
  viewMode: 'today' | 'all' | 'my_tickets';
  setViewMode: (mode: 'today' | 'all' | 'my_tickets') => void;
  setShowForm: (show: boolean) => void;
  setShowLogin: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowImageManager?: (show: boolean) => void;
  handleLogout: () => void;
  primaryColor: string;
  isDark: boolean;
  toggleTheme: () => void;
  onSearchClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  adminUser,
  viewMode,
  setViewMode,
  setShowForm,
  setShowLogin,
  setShowSettings,
  setShowImageManager,
  handleLogout,
  primaryColor,
  isDark,
  toggleTheme,
  onSearchClick
}) => {
  const bgClass = isDark ? 'bg-zinc-900/90 backdrop-blur-lg border-zinc-800/85' : 'bg-white/90 backdrop-blur-lg border-zinc-100';
  const textClass = isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-850';
  const activeTextClass = isDark ? 'text-white' : 'text-slate-900';

  if (adminUser) {
    const itemCount = setShowImageManager ? 7 : 6;
    const itemWidth = `w-1/${itemCount}`;

    return (
      <div className={`lg:hidden fixed bottom-4 left-4 right-4 z-50 border rounded-2xl ${bgClass} px-2 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.15)] print:hidden`}>
        <div className="flex justify-between items-center h-12">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewMode('all')}
            className={`flex flex-col items-center justify-center ${itemWidth} gap-0.5 ${viewMode === 'all' ? activeTextClass : textClass}`}
          >
            <ClipboardList className={`w-4.5 h-4.5 ${viewMode === 'all' ? 'stroke-[2.5px]' : 'stroke-2'}`} style={{ color: viewMode === 'all' ? primaryColor : undefined }} />
            <span className="text-[9px] font-bold">Semua</span>
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewMode('my_tickets')}
            className={`flex flex-col items-center justify-center ${itemWidth} gap-0.5 ${viewMode === 'my_tickets' ? activeTextClass : textClass}`}
          >
            <UserCog className={`w-4.5 h-4.5 ${viewMode === 'my_tickets' ? 'stroke-[2.5px]' : 'stroke-2'}`} style={{ color: viewMode === 'my_tickets' ? primaryColor : undefined }} />
            <span className="text-[9px] font-bold">Saya</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowForm(true)}
            className={`flex flex-col items-center justify-center ${itemWidth} gap-0.5 ${textClass}`}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1],
                filter: ["drop-shadow(0 0 0px rgba(0,0,0,0))", "drop-shadow(0 0 8px rgba(34,197,94,0.4))", "drop-shadow(0 0 0px rgba(0,0,0,0))"]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut"
              }}
            >
              <Send className="w-4.5 h-4.5 text-emerald-500" />
            </motion.div>
            <span className="text-[9px] font-bold text-emerald-500">Buat</span>
          </motion.button>

          {setShowImageManager && (
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowImageManager(true)}
              className={`flex flex-col items-center justify-center ${itemWidth} gap-0.5 ${textClass}`}
            >
              <ImageIcon className="w-4.5 h-4.5 stroke-2" />
              <span className="text-[9px] font-bold">Gambar</span>
            </motion.button>
          )}

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSettings(true)}
            className={`flex flex-col items-center justify-center ${itemWidth} gap-0.5 ${textClass}`}
          >
            <Settings2 className="w-4.5 h-4.5 stroke-2" />
            <span className="text-[9px] font-bold">Seting</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className={`flex flex-col items-center justify-center ${itemWidth} gap-0.5 ${isDark ? 'text-amber-400' : textClass}`}
          >
            {isDark ? <Sun className="w-4.5 h-4.5 stroke-2" /> : <Moon className="w-4.5 h-4.5 stroke-2" />}
            <span className="text-[9px] font-bold">Tema</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            className={`flex flex-col items-center justify-center ${itemWidth} gap-0.5 ${textClass}`}
          >
            <LogOut className="w-4.5 h-4.5 stroke-2" />
            <span className="text-[9px] font-bold">Keluar</span>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className={`lg:hidden fixed bottom-4 left-4 right-4 z-50 border rounded-2xl ${bgClass} px-4 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.15)] print:hidden`}>
      <div className="flex justify-between items-center h-12">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setViewMode('today')}
          className={`flex flex-col items-center justify-center w-1/5 gap-0.5 ${viewMode === 'today' ? activeTextClass : textClass}`}
        >
          <Home className={`w-5 h-5 ${viewMode === 'today' ? 'stroke-[2.5px]' : 'stroke-2'}`} style={{ color: viewMode === 'today' ? primaryColor : undefined }} />
          <span className="text-[9px] font-bold">Beranda</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setViewMode('my_tickets')}
          className={`flex flex-col items-center justify-center w-1/5 gap-0.5 ${viewMode === 'my_tickets' ? activeTextClass : textClass}`}
        >
          <ClipboardList className={`w-5 h-5 ${viewMode === 'my_tickets' ? 'stroke-[2.5px]' : 'stroke-2'}`} style={{ color: viewMode === 'my_tickets' ? primaryColor : undefined }} />
          <span className="text-[9px] font-bold">Riwayat</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowForm(true)}
          className={`flex flex-col items-center justify-center w-1/5 gap-0.5 ${textClass}`}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              filter: ["drop-shadow(0 0 0px rgba(0,0,0,0))", "drop-shadow(0 0 10px rgba(34,197,94,0.4))", "drop-shadow(0 0 0px rgba(0,0,0,0))"]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
            className="relative"
          >
            <Send className="w-5.5 h-5.5 text-emerald-500" />
          </motion.div>
          <span className="text-[9px] font-bold text-emerald-500">Buat Tiket</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className={`flex flex-col items-center justify-center w-1/5 gap-0.5 ${isDark ? 'text-amber-400' : textClass}`}
        >
          {isDark ? <Sun className="w-5 h-5 stroke-2" /> : <Moon className="w-5 h-5 stroke-2" />}
          <span className="text-[9px] font-bold">Tema</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowLogin(true)}
          className={`flex flex-col items-center justify-center w-1/5 gap-0.5 ${textClass}`}
        >
          <ShieldCheck className="w-5 h-5 stroke-2" />
          <span className="text-[9px] font-bold">Login IT</span>
        </motion.button>
      </div>
    </div>
  );
};
