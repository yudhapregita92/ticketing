import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  Settings2, 
  Trash2, 
  LogOut, 
  ShieldCheck, 
  Plus,
  Image as ImageIcon,
  Sun,
  Moon,
  Clock,
  Wifi,
  WifiOff,
  User
} from 'lucide-react';
import { IAppSettings, IAdminUser, ITicket } from '../types';
import { LOGO_OPTIONS } from '../constants';
import { Logo } from './Logo';

const RealTimeClock: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${dayName}, ${day} ${monthName} ${year} | ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold tracking-tight shadow-sm transition-all ${
      isDark 
        ? 'bg-zinc-800/50 border-zinc-700 text-zinc-300' 
        : 'bg-white border-slate-200 text-slate-600'
    }`}>
      <Clock className="w-3 h-3 text-emerald-500" />
      {formatTime(time)}
    </div>
  );
};

interface HeaderProps {
  appSettings: IAppSettings;
  adminUser: IAdminUser | null;
  currentUser: any;
  primaryColor: string;
  isDark: boolean;
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => void;
  setShowSettings: (show: boolean) => void;
  setShowImageManager?: (show: boolean) => void;
  setShowResetConfirm: (show: boolean) => void;
  handleLogout: () => void;
  setShowLogin: (show: boolean) => void;
  setShowForm: (show: boolean) => void;
  tickets: ITicket[];
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appSettings,
  adminUser,
  currentUser,
  primaryColor,
  isDark,
  notificationPermission,
  requestNotificationPermission,
  setShowSettings,
  setShowImageManager,
  setShowResetConfirm,
  handleLogout,
  setShowLogin,
  setShowForm,
  tickets,
  toggleTheme
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const CurrentLogo = LOGO_OPTIONS.find(l => l.id === appSettings.logo_type)?.icon || LOGO_OPTIONS[0].icon;

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
      adminUser
        ? (isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-100/80 border-zinc-200')
        : (isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200')
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[4rem] py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            {appSettings.custom_logo ? (
              <img src={appSettings.custom_logo} alt="Logo" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
            ) : (
              appSettings.logo_type === 'Send' ? (
                <Logo className="text-white w-6 h-6" color="white" />
              ) : (
                <CurrentLogo className="text-white w-6 h-6" />
              )
            )}
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <h1 className={`text-sm sm:text-lg font-bold tracking-tight leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{appSettings.app_name}</h1>
            <div 
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                isOnline 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
              }`}
              title={isOnline ? 'Online' : 'Offline'}
            >
              {isOnline ? <Wifi className="w-2 h-2" /> : <WifiOff className="w-2 h-2" />}
              <span className="hidden xs:inline">{isOnline ? 'Online' : 'Offline'}</span>
              <span className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <RealTimeClock isDark={isDark} />
          
          <div className="hidden md:flex items-center gap-2 sm:gap-4">
            {adminUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className={`text-[10px] font-bold capitalize tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>{adminUser.full_name}</span>
                <span className="text-[8px] font-bold text-emerald-500 capitalize tracking-widest">{adminUser.role}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTheme}
                  className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-amber-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={requestNotificationPermission}
                  className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Notifications"
                >
                  {notificationPermission === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettings(true)}
                  className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Settings"
                >
                  <Settings2 className="w-4 h-4" />
                </motion.button>

                {setShowImageManager && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowImageManager(true)}
                    className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Manage Images"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </motion.button>
                )}

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowResetConfirm(true)}
                  className={`p-1.5 rounded-lg transition-all text-rose-500 hover:bg-rose-50`}
                  title="Reset Data"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black capitalize tracking-wider transition-all shadow-sm border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-rose-500 dark:text-rose-400 hover:bg-slate-50 dark:hover:bg-zinc-700/50"
              title="Keluar"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Keluar</span>
            </motion.button>
          )}
          </div>
          
          <div className="flex flex-col items-end gap-1 shrink-0">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              style={{ backgroundColor: primaryColor }}
              className="text-white px-3 py-1.5 rounded-full text-[10px] sm:text-sm font-bold shadow-lg flex items-center gap-1.5 active:scale-95"
            >
              {isDark ? <Sun className="w-3 h-3 sm:w-4 sm:h-4" /> : <Moon className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span className="font-bold">Mode</span>
            </motion.button>

            {(adminUser || currentUser) && (
              <div className="flex items-center gap-1.5 mt-0.5 max-w-[120px] sm:max-w-[200px] truncate">
                <span className={`text-[9px] sm:text-[10px] font-black truncate leading-none capitalize tracking-wide ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {adminUser ? adminUser.full_name : currentUser?.full_name}
                </span>
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                  {adminUser ? (
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                  ) : (
                    <User className="w-2.5 h-2.5 text-slate-400 dark:text-zinc-500" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
