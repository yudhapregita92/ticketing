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
import { api } from '../services/api';
import toast from 'react-hot-toast';

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
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onDutyChange?: (nextDuty: number) => void;
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
  toggleTheme,
  unreadCount = 0,
  onOpenNotifications,
  onDutyChange,
}) => {
  const [dutyStatus, setDutyStatus] = useState<number>(() => {
    if (!adminUser) return 1;
    return Number(adminUser.is_on_duty) === 0 ? 0 : 1;
  });

  useEffect(() => {
    if (adminUser) {
      setDutyStatus(Number(adminUser.is_on_duty) === 0 ? 0 : 1);
    }
  }, [adminUser?.is_on_duty, adminUser?.username]);

  const handleToggleDuty = async () => {
    if (!adminUser) return;
    const nextDuty = dutyStatus === 1 ? 0 : 1;
    setDutyStatus(nextDuty);
    adminUser.is_on_duty = nextDuty;

    try {
      await api.updateDutyStatus(adminUser.username, nextDuty);
      toast.success(nextDuty === 1 ? 'Status: SIAP KERJA (ON)' : 'Status: OFF DUTY (OFF)');
      window.dispatchEvent(new Event('duty_status_changed'));
      if (onDutyChange) onDutyChange(nextDuty);
    } catch (err) {
      const prev = nextDuty === 1 ? 0 : 1;
      setDutyStatus(prev);
      adminUser.is_on_duty = prev;
      toast.error('Gagal memperbarui status kerja');
    }
  };
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
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md transition-colors ${
      adminUser
        ? (isDark ? 'bg-zinc-900/80 border-b border-zinc-800' : 'bg-zinc-100/80 border-b border-zinc-200')
        : (isDark ? 'bg-slate-900/80' : 'bg-white/80')
    }`}>
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 min-h-[3.5rem] sm:min-h-[4rem] py-2 flex items-center justify-between gap-1.5 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {adminUser && (
            <>
              <div 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-md transition-all shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {appSettings.custom_logo ? (
                  <img src={appSettings.custom_logo} alt="Logo" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  appSettings.logo_type === 'Send' ? (
                    <Logo className="text-white w-5 h-5 sm:w-6 sm:h-6" color="white" />
                  ) : (
                    <CurrentLogo className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                  )
                )}
              </div>
              <div className="min-w-0 flex-1 flex items-center gap-1.5">
                <h1 className={`text-xs xs:text-sm sm:text-base md:text-lg font-black tracking-tight leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{appSettings.app_name}</h1>
                <div 
                  className={`hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all shrink-0 ${
                    isOnline 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                  }`}
                  title={isOnline ? 'Online' : 'Offline'}
                >
                  {isOnline ? <Wifi className="w-2 h-2" /> : <WifiOff className="w-2 h-2" />}
                  <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
                  <span className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <RealTimeClock isDark={isDark} />
          
          <div className="hidden md:flex items-center gap-2 sm:gap-4">
            {adminUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end mr-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold capitalize tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>{adminUser.full_name}</span>
                  <button
                    type="button"
                    onClick={handleToggleDuty}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                      dutyStatus === 1
                        ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
                        : 'bg-rose-600 text-white border-rose-500 hover:bg-rose-500'
                    }`}
                    title="Klik untuk mengubah status (Siap Kerja / Off Duty)"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      dutyStatus === 1 ? 'bg-white animate-pulse' : 'bg-white/90'
                    }`} />
                    <span>{dutyStatus === 1 ? 'SIAP KERJA' : 'OFF DUTY'}</span>
                  </button>
                </div>
                <span className={`text-[8px] font-extrabold capitalize tracking-widest ${
                  dutyStatus === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {adminUser.role}
                </span>
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
                  onClick={() => {
                    if (notificationPermission !== 'granted') {
                      requestNotificationPermission();
                    }
                    if (onOpenNotifications) {
                      onOpenNotifications();
                    }
                  }}
                  className={`relative p-1.5 rounded-lg transition-all ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Pemberitahuan & Notifikasi"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[16px] h-[16px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center leading-none shadow-sm animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
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
            <div className="flex items-center gap-2">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (notificationPermission !== 'granted') {
                    requestNotificationPermission();
                  }
                  if (onOpenNotifications) {
                    onOpenNotifications();
                  }
                }}
                className={`relative p-2 rounded-xl border transition-all shadow-sm ${
                  isDark 
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Pemberitahuan & Notifikasi"
              >
                <Bell className="w-4 h-4 text-emerald-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[16px] h-[16px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center leading-none shadow-sm animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </motion.button>

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
            </div>
          )}
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              style={{ backgroundColor: primaryColor }}
              className="text-white p-1.5 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold shadow-md flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-all"
              title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="font-bold hidden sm:inline">Mode</span>
            </motion.button>

            {(adminUser || currentUser) && (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 py-0.5">
                <span className={`text-xs sm:text-sm font-bold whitespace-nowrap capitalize tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {adminUser ? adminUser.full_name : currentUser?.full_name}
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800">
                  {adminUser ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
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
