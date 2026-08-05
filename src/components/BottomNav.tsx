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
  Search,
  BookOpen,
  BookOpenText,
  History,
  Ticket
} from 'lucide-react';
import { IAdminUser, ISettings, ViewMode } from '../types';
import { Logo } from './Logo';

interface BottomNavProps {
  adminUser: IAdminUser | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  setShowForm: (show: boolean) => void;
  handleLogout: () => void;
  primaryColor: string;
  setShowSettings: (show: boolean) => void;
  setShowImageManager?: (show: boolean) => void;
  isDark?: boolean;
  appSettings?: ISettings | any;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  adminUser,
  viewMode,
  setViewMode,
  setShowForm,
  handleLogout,
  primaryColor,
  setShowSettings,
  setShowImageManager,
  isDark = false,
  appSettings
}) => {
  const bgClass = isDark ? 'bg-slate-900/90 backdrop-blur-xl' : 'bg-white/90 backdrop-blur-xl';
  const textClass = isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-850';
  const activeTextClass = isDark ? 'text-white' : 'text-slate-900';

  const fabSize = Number(appSettings?.fab_size) || 58;
  const fabTopOffset = appSettings?.fab_top_offset !== undefined && appSettings?.fab_top_offset !== null && appSettings?.fab_top_offset !== '' ? Number(appSettings.fab_top_offset) : -29;
  const fabIconSize = Number(appSettings?.fab_icon_size) || 24;
  const navHeight = Number(appSettings?.nav_container_height) || 56;
  const navRadius = Number(appSettings?.nav_container_radius) || 22;

  const navTextSize = Number(appSettings?.nav_text_size) || 10;
  const navTextWeight = appSettings?.nav_text_weight || 'font-medium';
  const navTextColor = appSettings?.nav_text_color;
  const navOpacity = appSettings?.nav_bg_opacity !== undefined && appSettings?.nav_bg_opacity !== null && appSettings?.nav_bg_opacity !== '' ? Number(appSettings.nav_bg_opacity) : 100;

  const hexToRgba = (hex: string, opacityPercent: number = 100) => {
    if (!hex) return undefined;
    const alpha = Math.min(100, Math.max(0, opacityPercent)) / 100;
    let c = hex.trim().replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return hex;
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const userNavBgColor = appSettings?.nav_bg_color || primaryColor;
  const userNavBgStyle = hexToRgba(userNavBgColor, navOpacity);

  const fabBgColor = appSettings?.fab_bg_color || primaryColor || '#10b981';
  const fabIconColor = appSettings?.fab_icon_color || '#ffffff';
  const fabBorderColor = appSettings?.fab_border_color || (isDark ? '#1e293b' : '#ffffff');
  const fabBorderWidth = appSettings?.fab_border_width !== undefined && appSettings?.fab_border_width !== null && appSettings?.fab_border_width !== '' ? Number(appSettings.fab_border_width) : 3.5;

  if (adminUser) {
    const adminNavBg = appSettings?.nav_bg_color ? hexToRgba(appSettings.nav_bg_color, navOpacity) : undefined;

    return (
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 print:hidden pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.15)] max-w-md mx-auto">
        {/* Navbar Container */}
        <div 
          className={`relative ${!adminNavBg ? bgClass : ''} pointer-events-auto px-2 border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-all`}
          style={{ 
            height: `${navHeight}px`, 
            borderRadius: `${navRadius}px`,
            backgroundColor: adminNavBg || undefined
          }}
        >
          <div className="flex w-full h-full items-center">
            {/* Left Items */}
            <div className="flex w-[42%] justify-around items-center h-full">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewMode('all')}
                className={`flex flex-col items-center justify-center gap-[2px] ${viewMode === 'all' ? activeTextClass : textClass}`}
              >
                <ClipboardList className={`w-5 h-5 ${viewMode === 'all' ? 'stroke-[2.5px]' : 'stroke-2'}`} style={{ color: viewMode === 'all' ? primaryColor : undefined }} />
                <span className={`${navTextWeight}`} style={{ fontSize: `${navTextSize}px` }}>Semua</span>
              </motion.button>
              
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewMode('my_tickets')}
                className={`flex flex-col items-center justify-center gap-[2px] ${viewMode === 'my_tickets' ? activeTextClass : textClass}`}
              >
                <UserCog className={`w-5 h-5 ${viewMode === 'my_tickets' ? 'stroke-[2.5px]' : 'stroke-2'}`} style={{ color: viewMode === 'my_tickets' ? primaryColor : undefined }} />
                <span className={`${navTextWeight}`} style={{ fontSize: `${navTextSize}px` }}>Saya</span>
              </motion.button>

              {setShowImageManager && (
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowImageManager(true)}
                  className={`flex flex-col items-center justify-center gap-[2px] ${textClass}`}
                >
                  <ImageIcon className="w-5 h-5 stroke-2" />
                  <span className={`${navTextWeight}`} style={{ fontSize: `${navTextSize}px` }}>Gambar</span>
                </motion.button>
              )}
            </div>

            {/* Middle Spacer for FAB */}
            <div className="w-[16%] h-full" />

            {/* Right Items */}
            <div className="flex w-[42%] justify-around items-center h-full">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(true)}
                className={`flex flex-col items-center justify-center gap-[2px] ${textClass}`}
              >
                <Settings2 className="w-5 h-5 stroke-2" />
                <span className={`${navTextWeight}`} style={{ fontSize: `${navTextSize}px` }}>Seting</span>
              </motion.button>

              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewMode('panduan')}
                className={`flex flex-col items-center justify-center gap-[2px] ${viewMode === 'panduan' ? activeTextClass : textClass}`}
              >
                <BookOpen className={`w-5 h-5 ${viewMode === 'panduan' ? 'stroke-[2.5px]' : 'stroke-2'}`} style={{ color: viewMode === 'panduan' ? primaryColor : undefined }} />
                <span className={`${navTextWeight}`} style={{ fontSize: `${navTextSize}px` }}>Panduan</span>
              </motion.button>

              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleLogout}
                className={`flex flex-col items-center justify-center gap-[2px] ${textClass}`}
              >
                <LogOut className="w-5 h-5 stroke-2" />
                <span className={`${navTextWeight}`} style={{ fontSize: `${navTextSize}px` }}>Keluar</span>
              </motion.button>
            </div>
          </div>

          {/* Floating Action Button */}
          {(!adminUser || adminUser.role === 'Super Admin') && (
            <div 
              className="absolute left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center transition-all"
              style={{ top: `${fabTopOffset}px` }}
            >
              {/* Pulsing Outer Ring */}
              <motion.span 
                animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ backgroundColor: fabBgColor }}
              />

              <motion.button 
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowForm(true)}
                className="rounded-full flex items-center justify-center relative z-10 shadow-lg transition-all cursor-pointer"
                style={{ 
                  width: `${fabSize}px`, 
                  height: `${fabSize}px`,
                  backgroundColor: fabBgColor,
                  borderColor: fabBorderColor,
                  borderWidth: `${fabBorderWidth}px`,
                  borderStyle: 'solid'
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.22, 1], rotate: [0, -6, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                >
                  <Send 
                    className="ml-[-1px] mt-[1px]" 
                    strokeWidth={2.2} 
                    style={{ 
                      width: `${fabIconSize}px`, 
                      height: `${fabIconSize}px`,
                      color: fabIconColor
                    }} 
                  />
                </motion.div>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 print:hidden pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.15)] max-w-md mx-auto">
      {/* Navbar Container */}
      <div 
        className="relative pointer-events-auto px-2 border-[2px] border-white/20 dark:border-slate-800/80 shadow-xl flex items-center justify-between transition-all"
        style={{ 
          backgroundColor: userNavBgStyle, 
          height: `${navHeight}px`, 
          borderRadius: `${navRadius}px` 
        }}
      >
        <div className="flex w-full h-full items-center" style={{ color: navTextColor || '#ffffff' }}>
          {/* Left Items */}
          <div className="flex w-[42%] justify-around items-center h-full">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setViewMode('today')}
              className="flex flex-col items-center justify-center gap-[2px] opacity-90 hover:opacity-100 cursor-pointer"
            >
              <Home className="w-[22px] h-[22px]" fill="currentColor" strokeWidth={1} />
              <span className={`${navTextWeight} tracking-wide`} style={{ fontSize: `${navTextSize}px` }}>Beranda</span>
            </motion.button>
            
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setViewMode('my_tickets')}
              className="flex flex-col items-center justify-center gap-[2px] opacity-90 hover:opacity-100 cursor-pointer"
            >
              <Ticket className="w-[22px] h-[22px] stroke-[2.5px]" />
              <span className={`${navTextWeight} tracking-wide`} style={{ fontSize: `${navTextSize}px` }}>Tiket Saya</span>
            </motion.button>
          </div>

          {/* Middle Spacer for FAB */}
          <div className="w-[16%] h-full" />

          {/* Right Items */}
          <div className="flex w-[42%] justify-around items-center h-full">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setViewMode('panduan')}
              className="flex flex-col items-center justify-center gap-[2px] opacity-90 hover:opacity-100 cursor-pointer"
            >
              <BookOpenText className="w-[22px] h-[22px] stroke-[2.5px]" />
              <span className={`${navTextWeight} tracking-wide`} style={{ fontSize: `${navTextSize}px` }}>Panduan</span>
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-[2px] opacity-90 hover:opacity-100 cursor-pointer"
            >
              <LogOut className="w-[22px] h-[22px] stroke-[2.5px]" />
              <span className={`${navTextWeight} tracking-wide`} style={{ fontSize: `${navTextSize}px` }}>Keluar</span>
            </motion.button>
          </div>
        </div>

        {/* Floating Action Button */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center transition-all"
          style={{ top: `${fabTopOffset}px` }}
        >
          {/* Pulsing Outer Ring */}
          <motion.span 
            animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ backgroundColor: fabBgColor }}
          />

          <motion.button 
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowForm(true)}
            className="rounded-full flex items-center justify-center relative z-10 shadow-lg transition-all cursor-pointer"
            style={{ 
              width: `${fabSize}px`, 
              height: `${fabSize}px`,
              backgroundColor: fabBgColor,
              borderColor: fabBorderColor,
              borderWidth: `${fabBorderWidth}px`,
              borderStyle: 'solid'
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.22, 1], rotate: [0, -6, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            >
              <Send 
                className="ml-[-1px] mt-[1px]" 
                strokeWidth={2.2} 
                style={{ 
                  width: `${fabIconSize}px`, 
                  height: `${fabIconSize}px`,
                  color: fabIconColor
                }} 
              />
            </motion.div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
