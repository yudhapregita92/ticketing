import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Send, 
  LogIn, 
  LogOut, 
  Settings, 
  List, 
  UserCircle 
} from 'lucide-react';
import { IAdminUser } from '../types';

interface BottomNavProps {
  adminUser: IAdminUser | null;
  viewMode: 'today' | 'all' | 'my_tickets';
  setViewMode: (mode: 'today' | 'all' | 'my_tickets') => void;
  setShowForm: (show: boolean) => void;
  setShowLogin: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  handleLogout: () => void;
  primaryColor: string;
  isDark: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  adminUser,
  viewMode,
  setViewMode,
  setShowForm,
  setShowLogin,
  setShowSettings,
  handleLogout,
  primaryColor,
  isDark
}) => {
  const bgClass = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200';
  const textClass = isDark ? 'text-zinc-400' : 'text-slate-500';
  const activeTextClass = isDark ? 'text-zinc-100' : 'text-slate-900';

  if (adminUser) {
    return (
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t ${bgClass} px-4 pb-safe pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]`}>
        <div className="flex justify-between items-center h-14">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewMode('all')}
            className={`flex flex-col items-center justify-center w-1/5 gap-1 ${viewMode === 'all' ? activeTextClass : textClass}`}
          >
            <List className={`w-5 h-5 ${viewMode === 'all' ? 'stroke-[2.5px]' : 'stroke-2'}`} style={{ color: viewMode === 'all' ? primaryColor : undefined }} />
            <span className="text-[10px] font-medium">Semua Tiket</span>
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewMode('my_tickets')}
            className={`flex flex-col items-center justify-center w-1/5 gap-1 ${viewMode === 'my_tickets' ? activeTextClass : textClass}`}
          >
            <UserCircle className={`w-5 h-5 ${viewMode === 'my_tickets' ? 'stroke-[2.5px]' : 'stroke-2'}`} style={{ color: viewMode === 'my_tickets' ? primaryColor : undefined }} />
            <span className="text-[10px] font-medium">Tiket Saya</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowForm(true)}
            className={`flex flex-col items-center justify-center w-1/5 gap-1 ${textClass}`}
          >
            <Send className="w-5 h-5 stroke-2" style={{ color: primaryColor }} />
            <span className="text-[10px] font-medium" style={{ color: primaryColor }}>Buat Tiket</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSettings(true)}
            className={`flex flex-col items-center justify-center w-1/5 gap-1 ${textClass}`}
          >
            <Settings className="w-5 h-5 stroke-2" />
            <span className="text-[10px] font-medium">Pengaturan</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            className={`flex flex-col items-center justify-center w-1/5 gap-1 ${textClass}`}
          >
            <LogOut className="w-5 h-5 stroke-2" />
            <span className="text-[10px] font-medium">Logout</span>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t ${bgClass} px-6 pb-safe pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]`}>
      <div className="flex justify-between items-center h-14">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setViewMode('today')}
          className={`flex flex-col items-center justify-center w-1/3 gap-1 ${viewMode === 'today' ? activeTextClass : textClass}`}
        >
          <Home className={`w-6 h-6 ${viewMode === 'today' ? 'stroke-[2.5px]' : 'stroke-2'}`} style={{ color: viewMode === 'today' ? primaryColor : undefined }} />
          <span className="text-[10px] font-medium">Beranda</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowForm(true)}
          className={`flex flex-col items-center justify-center w-1/3 gap-1 ${textClass}`}
        >
          <Send className="w-6 h-6 stroke-2" style={{ color: primaryColor }} />
          <span className="text-[10px] font-medium" style={{ color: primaryColor }}>Buat Tiket</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowLogin(true)}
          className={`flex flex-col items-center justify-center w-1/3 gap-1 ${textClass}`}
        >
          <LogIn className="w-6 h-6 stroke-2" />
          <span className="text-[10px] font-medium">Login IT</span>
        </motion.button>
      </div>
    </div>
  );
};
