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
  Image as ImageIcon
} from 'lucide-react';
import { IAdminUser } from '../types';

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
            className={`flex flex-col items-center justify-center w-1/6 gap-1 ${viewMode === 'all' ? activeTextClass : textClass}`}
          >
            <ClipboardList className={`w-5 h-5 ${viewMode === 'all' ? 'stroke-[2.5px]' : 'stroke-2'}`} style={{ color: viewMode === 'all' ? primaryColor : undefined }} />
            <span className="text-[10px] font-bold">Semua</span>
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewMode('my_tickets')}
            className={`flex flex-col items-center justify-center w-1/6 gap-1 ${viewMode === 'my_tickets' ? activeTextClass : textClass}`}
          >
            <UserCog className={`w-5 h-5 ${viewMode === 'my_tickets' ? 'stroke-[2.5px]' : 'stroke-2'}`} style={{ color: viewMode === 'my_tickets' ? primaryColor : undefined }} />
            <span className="text-[10px] font-bold">Saya</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowForm(true)}
            className={`flex flex-col items-center justify-center w-1/6 gap-1 ${textClass}`}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1],
                filter: ["drop-shadow(0 0 0px rgba(0,0,0,0))", `drop-shadow(0 0 8px ${primaryColor}44)`, "drop-shadow(0 0 0px rgba(0,0,0,0))"]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut"
              }}
            >
              <Send className="w-5 h-5 stroke-[2.5px]" style={{ color: primaryColor }} />
            </motion.div>
            <span className="text-[10px] font-bold" style={{ color: primaryColor }}>Buat</span>
          </motion.button>

          {setShowImageManager && (
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowImageManager(true)}
              className={`flex flex-col items-center justify-center w-1/6 gap-1 ${textClass}`}
            >
              <ImageIcon className="w-5 h-5 stroke-2" />
              <span className="text-[10px] font-bold">Gambar</span>
            </motion.button>
          )}

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSettings(true)}
            className={`flex flex-col items-center justify-center w-1/6 gap-1 ${textClass}`}
          >
            <Settings2 className="w-5 h-5 stroke-2" />
            <span className="text-[10px] font-bold">Seting</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            className={`flex flex-col items-center justify-center w-1/6 gap-1 ${textClass}`}
          >
            <LogOut className="w-5 h-5 stroke-2" />
            <span className="text-[10px] font-bold">Keluar</span>
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
          <span className="text-[10px] font-bold">Beranda</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowForm(true)}
          className={`flex flex-col items-center justify-center w-1/3 gap-1 ${textClass}`}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              filter: ["drop-shadow(0 0 0px rgba(0,0,0,0))", `drop-shadow(0 0 12px ${primaryColor}66)`, "drop-shadow(0 0 0px rgba(0,0,0,0))"]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
            className="relative"
          >
            <Send className="w-7 h-7 stroke-[2.5px]" style={{ color: primaryColor }} />
          </motion.div>
          <span className="text-[10px] font-bold" style={{ color: primaryColor }}>Buat Tiket</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowLogin(true)}
          className={`flex flex-col items-center justify-center w-1/3 gap-1 ${textClass}`}
        >
          <ShieldCheck className="w-6 h-6 stroke-2" />
          <span className="text-[10px] font-bold">Login IT</span>
        </motion.button>
      </div>
    </div>
  );
};
