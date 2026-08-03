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
    <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-medium tracking-tight shadow-xs transition-all ${
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
        ? 'bg-[#337AB7] border-b border-blue-600/50 text-white shadow-xs'
        : 'bg-transparent border-none'
    }`}>
      <div className="w-full px-3 sm:px-6 lg:px-8 h-10 sm:h-11 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {adminUser ? (
            <div className="min-w-0 flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold tracking-tight leading-none truncate text-white">
                {appSettings.app_name}
              </h1>
              <div 
                className={`hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border transition-all shrink-0 ${
                  isOnline 
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                }`}
                title={isOnline ? 'Online' : 'Offline'}
              >
                {isOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                <span className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              </div>
            </div>
          ) : (
            <div className="min-w-0 flex items-center gap-2">
              {/* App name hidden for non-admin users */}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <RealTimeClock isDark={isDark} />
          
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {adminUser ? (
              <div className="flex items-center gap-2">
                {/* User Info & Duty Status (SAP Style: Single clean row) */}
                <div className="hidden sm:flex items-center gap-2 mr-0.5">
                  <span className="text-[11px] font-semibold text-white/90 tracking-tight whitespace-nowrap">
                    {adminUser.full_name}
                  </span>
                  <span className="text-[9px] font-medium text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wide">
                    {adminUser.role}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleDuty}
                    className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border flex items-center gap-1 transition-all cursor-pointer ${
                      dutyStatus === 1
                        ? 'bg-emerald-600 text-white border-emerald-400 hover:bg-emerald-500'
                        : 'bg-rose-600 text-white border-rose-400 hover:bg-rose-500'
                    }`}
                    title="Klik untuk mengubah status (Siap Kerja / Off Duty)"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      dutyStatus === 1 ? 'bg-white animate-pulse' : 'bg-white/80'
                    }`} />
                    <span>{dutyStatus === 1 ? 'SIAP KERJA' : 'OFF DUTY'}</span>
                  </button>
                </div>
                
                {/* Action Icons Row */}
                <div className="flex items-center gap-0.5">
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
                    className="w-7 h-7 rounded-md flex items-center justify-center transition-all text-white/80 hover:text-white hover:bg-white/10 cursor-pointer relative shrink-0"
                    title="Pemberitahuan & Notifikasi"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 px-1 min-w-[12px] h-[12px] rounded-full bg-rose-500 text-white text-[7px] font-bold flex items-center justify-center leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSettings(true)}
                    className="w-7 h-7 rounded-md flex items-center justify-center transition-all text-white/80 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
                    title="Settings"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </motion.button>

                  {setShowImageManager && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowImageManager(true)}
                      className="w-7 h-7 rounded-md flex items-center justify-center transition-all text-white/80 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
                      title="Manage Images"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </motion.button>
                  )}

                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowResetConfirm(true)}
                    className="w-7 h-7 rounded-md flex items-center justify-center transition-all text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 cursor-pointer shrink-0"
                    title="Reset Data"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="w-7 h-7 rounded-md flex items-center justify-center transition-all text-white/80 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
                    title="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
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
                  className={`relative w-7 h-7 rounded-md border flex items-center justify-center transition-all shadow-xs ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Pemberitahuan & Notifikasi"
                >
                  <Bell className="w-3.5 h-3.5 text-emerald-500" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 px-1 min-w-[12px] h-[12px] rounded-full bg-rose-500 text-white text-[7px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </motion.button>
              </div>
            )}

            {/* Mode / Theme Toggle Button */}
            <motion.button 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={toggleTheme}
              className={`px-2 py-0.5 rounded text-[11px] font-medium shadow-xs flex items-center gap-1 shrink-0 cursor-pointer transition-all border h-6 ${
                adminUser 
                  ? 'bg-white/15 hover:bg-white/25 active:bg-white/30 text-white border-white/25'
                  : (isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-300')
              }`}
              title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            >
              {isDark ? <Sun className="w-3 h-3 text-amber-300" /> : <Moon className={`w-3 h-3 ${adminUser ? 'text-white' : 'text-slate-700'}`} />}
              <span className="hidden sm:inline">Mode</span>
            </motion.button>

            {/* User Avatar / Profile Icon */}
            {(adminUser || currentUser) && (
              <div className="flex items-center gap-1.5 shrink-0 pl-1">
                {!adminUser && currentUser && (
                  <span className={`text-xs font-semibold whitespace-nowrap capitalize tracking-tight ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}>
                    {currentUser.full_name || currentUser.name}
                  </span>
                )}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                  adminUser 
                    ? 'bg-white/10 dark:bg-slate-800 border-white/20 dark:border-slate-700'
                    : (isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300')
                }`}>
                  {adminUser ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
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
