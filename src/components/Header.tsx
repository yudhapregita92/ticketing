import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  Settings2, 
  Trash2, 
  LogOut, 
  LogIn, 
  Plus 
} from 'lucide-react';
import { IAppSettings, IAdminUser, ITicket, LOGO_OPTIONS } from '../types';

interface HeaderProps {
  appSettings: IAppSettings;
  adminUser: IAdminUser | null;
  primaryColor: string;
  isDark: boolean;
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => void;
  setShowSettings: (show: boolean) => void;
  setShowResetConfirm: (show: boolean) => void;
  handleLogout: () => void;
  setShowLogin: (show: boolean) => void;
  setShowForm: (show: boolean) => void;
  tickets: ITicket[];
}

export const Header: React.FC<HeaderProps> = ({
  appSettings,
  adminUser,
  primaryColor,
  isDark,
  notificationPermission,
  requestNotificationPermission,
  setShowSettings,
  setShowResetConfirm,
  handleLogout,
  setShowLogin,
  setShowForm,
  tickets
}) => {
  const CurrentLogo = LOGO_OPTIONS.find(l => l.id === appSettings.logo_type)?.icon || LOGO_OPTIONS[0].icon;

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
      adminUser
        ? (isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-100/80 border-zinc-200')
        : (isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200')
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            {appSettings.custom_logo ? (
              <img src={appSettings.custom_logo} alt="Logo" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <CurrentLogo className="text-white w-6 h-6" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className={`text-sm sm:text-lg font-bold tracking-tight leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{appSettings.app_name}</h1>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 sm:gap-4 shrink-0">
          {adminUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>{adminUser.full_name}</span>
                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">{adminUser.role}</span>
              </div>
              
              <div className="flex items-center gap-1">
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLogin(true)}
              className={`p-2 rounded-lg transition-all ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
              title="Login"
            >
              <LogIn className="w-5 h-5" />
            </motion.button>
          )}
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            style={{ backgroundColor: primaryColor }}
            className="text-white px-3 py-1.5 rounded-full text-[10px] sm:text-sm font-bold shadow-lg flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3 h-3 sm:w-4 h-4" />
            <span className="font-bold">New Ticket</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};
