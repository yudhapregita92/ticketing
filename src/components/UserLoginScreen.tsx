import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Lock, LogIn, ChevronDown, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserLoginScreenProps {
  isDark: boolean;
  themeClasses: any;
  primaryColor: string;
  masterUsers: any[];
  onLogin: (user: any) => void;
  onAdminLoginClick: () => void;
  appSettings?: any;
  loginData?: any;
  setLoginData?: React.Dispatch<React.SetStateAction<any>>;
  handleAdminLogin?: (e: React.FormEvent) => void;
}

export const UserLoginScreen = React.memo(({
  isDark,
  themeClasses,
  primaryColor,
  masterUsers,
  onLogin,
  onAdminLoginClick,
  appSettings,
  loginData,
  setLoginData,
  handleAdminLogin
}: UserLoginScreenProps) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [indexCode, setIndexCode] = useState('');
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<any>(null);

  // Funny Egg states
  const [eggOffset, setEggOffset] = useState({ x: 0, y: 0 });
  const [eggCount, setEggCount] = useState(0);

  React.useEffect(() => {
    if (selectedUser) {
      setEggOffset({ x: 0, y: 0 });
      setEggCount(0);
    }
  }, [selectedUser]);

  const triggerEggMove = () => {
    if (selectedUser?.enable_funny_egg === 1) {
      if (eggCount >= 5) {
        setTimeout(() => {
          setEggOffset({ x: 0, y: 0 });
        }, 0);
        return;
      }
      
      const dist = 70;
      const angle = Math.random() * Math.PI * 2;
      const randomX = Math.cos(angle) * dist;
      const randomY = Math.sin(angle) * (dist / 2);
      
      setTimeout(() => {
        setEggOffset({ x: randomX, y: randomY });
        setEggCount(prev => {
          const next = prev + 1;
          if (next === 5) {
            setTimeout(() => {
              setEggOffset({ x: 0, y: 0 });
              toast('Ok ok, ampun! Silakan diketik sekarang... 😂✌️', { icon: '🫣' });
            }, 800);
          } else {
            toast.error('Kolomnya lari! 🏃‍♂️💨', { duration: 800 });
          }
          return next;
        });
      }, 0);
    }
  };

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    if (newCount >= 5) {
      setIsAdminMode(prev => !prev);
      setClickCount(0);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      return;
    }

    setClickCount(newCount);

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 1000);
  };

  const filteredUsers = masterUsers.filter(u => 
    u.full_name.toLowerCase().includes(searchName.toLowerCase()) || 
    (u.employee_index && u.employee_index.toLowerCase().includes(searchName.toLowerCase()))
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isAdminMode && handleAdminLogin) {
      handleAdminLogin(e);
      return;
    }

    if (!selectedUser) {
      setError('Silakan pilih nama Anda terlebih dahulu');
      return;
    }

    if (!indexCode) {
      setError(`Silakan masukkan ${appSettings?.login_index_label || "index (KDK/GGF)"} Anda`);
      return;
    }

    // Verify index
    if (selectedUser.employee_index !== indexCode) {
      setError(`${appSettings?.login_index_label || "Index"} yang Anda masukkan salah`);
      return;
    }

    // Success
    toast.success(`Selamat datang, ${selectedUser.full_name}!`);
    onLogin(selectedUser);
  };

  const loginTitle = isAdminMode ? "Portal Admin" : (appSettings?.login_title || "Masuk ke Aplikasi");
  const loginSubtitle = isAdminMode ? "Login untuk mengelola tiket" : (appSettings?.login_subtitle || "Silakan pilih nama dan masukkan index Anda");
  const nameLabel = appSettings?.login_name_label || "Nama Anda";
  const indexLabel = appSettings?.login_index_label || "Index (KDK/GGF)";
  const indexPlaceholder = appSettings?.login_index_placeholder || "Masukkan index Anda...";

  return (
    <div className={`min-h-screen flex items-center justify-center p-3 relative overflow-hidden ${themeClasses.bg}`}>
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-[340px] relative z-10 ${themeClasses.card} rounded-2xl p-5 shadow-xl border ${themeClasses.border}`}
      >
        <div className="text-center mb-5 flex flex-col items-center">
          <div 
            onClick={handleLogoClick}
            className="cursor-pointer select-none transition-transform active:scale-95"
          >
            {isAdminMode ? (
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm mb-2.5 mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
            ) : appSettings?.login_logo ? (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden mb-2.5 shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto">
                <img src={appSettings.login_logo} alt="Logo" className="w-full h-full object-cover" draggable={false} />
              </div>
            ) : appSettings?.custom_logo ? (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden mb-2.5 shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto">
                <img src={appSettings.custom_logo} alt="Logo" className="w-full h-full object-cover" draggable={false} />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 mb-2.5 transform -rotate-3 mx-auto">
                <User className="w-6 h-6 text-white transform rotate-3" />
              </div>
            )}
          </div>
          <h1 className={`text-base font-semibold ${themeClasses.text}`}>{loginTitle}</h1>
          <p className={`text-[11px] ${themeClasses.textMuted} mt-0.5 max-w-[240px] mx-auto leading-relaxed`}>{loginSubtitle}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3.5">
          <AnimatePresence mode="wait">
            {isAdminMode ? (
              <motion.div
                key="admin-form"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-3.5"
              >
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${themeClasses.textMuted}`}>
                    Username
                  </label>
                  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 ${themeClasses.input}`}>
                    <User className={`w-4 h-4 shrink-0 ${themeClasses.textMuted}`} />
                    <input 
                      required
                      type="text"
                      placeholder="Masukkan username"
                      value={loginData?.username || ''}
                      onChange={e => setLoginData?.(prev => ({...prev, username: e.target.value}))}
                      className="w-full bg-transparent border-none outline-none p-0 m-0 focus:ring-0 text-xs text-inherit"
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${themeClasses.textMuted}`}>
                    Password
                  </label>
                  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 ${themeClasses.input}`}>
                    <Lock className={`w-4 h-4 shrink-0 ${themeClasses.textMuted}`} />
                    <input 
                      required
                      type="password"
                      placeholder="Masukkan password"
                      value={loginData?.password || ''}
                      onChange={e => setLoginData?.(prev => ({...prev, password: e.target.value}))}
                      className="w-full bg-transparent border-none outline-none p-0 m-0 focus:ring-0 text-xs text-inherit"
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="user-form"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-3.5"
              >
                {/* User Selection */}
                <div className="relative">
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${themeClasses.textMuted}`}>
                    {nameLabel}
                  </label>
                  <div 
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                      showUserDropdown ? 'border-indigo-500 ring-2 ring-indigo-500/20' : themeClasses.input
                    } ${selectedUser ? themeClasses.bg : themeClasses.bgSecondary}`}
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    <User className={`w-4 h-4 shrink-0 ${selectedUser ? 'text-indigo-500' : themeClasses.textMuted}`} />
                    <div className="flex-1 truncate text-xs">
                      {selectedUser ? (
                        <span className={`font-medium ${themeClasses.text}`}>{selectedUser.full_name}</span>
                      ) : (
                        <span className={themeClasses.textMuted}>Pilih nama Anda...</span>
                      )}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${showUserDropdown ? 'rotate-180' : ''} ${themeClasses.textMuted}`} />
                  </div>

                  <AnimatePresence>
                    {showUserDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className={`absolute z-20 w-full mt-1 rounded-lg border shadow-lg overflow-hidden ${themeClasses.card} ${themeClasses.border}`}
                      >
                        <div className={`p-1.5 border-b ${themeClasses.border}`}>
                          <input 
                            type="text"
                            placeholder="Cari nama atau index..."
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            className={`w-full px-2 py-1 rounded bg-transparent border-none focus:ring-0 text-xs ${themeClasses.text}`}
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1.5 space-y-1">
                          {filteredUsers.length > 0 ? (
                            filteredUsers.map(u => (
                              <div 
                                key={u.id}
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowUserDropdown(false);
                                  setSearchName('');
                                }}
                                className={`px-2.5 py-1.5 rounded-md cursor-pointer flex items-center justify-between group transition-colors ${
                                  selectedUser?.id === u.id ? 'bg-indigo-500/10' : `hover:${themeClasses.bgSecondary}`
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div className={`font-medium text-xs ${themeClasses.text} truncate`}>{u.full_name}</div>
                                  <div className={`text-[10px] opacity-70 ${themeClasses.textMuted} truncate`}>{u.department}</div>
                                </div>
                                {selectedUser?.id === u.id && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                )}
                              </div>
                            ))
                          ) : (
                            <div className={`p-3 text-center text-xs ${themeClasses.textMuted}`}>
                              Nama tidak ditemukan
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Index Input */}
                <motion.div
                  animate={{ x: eggOffset.x, y: eggOffset.y }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  onMouseEnter={triggerEggMove}
                  onClick={triggerEggMove}
                >
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${themeClasses.textMuted}`}>
                    {indexLabel}
                  </label>
                  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 ${themeClasses.input}`}>
                    <Lock className={`w-4 h-4 shrink-0 ${themeClasses.textMuted}`} />
                    <input 
                      type="password"
                      placeholder={indexPlaceholder}
                      value={indexCode}
                      onChange={(e) => setIndexCode(e.target.value)}
                      className="w-full bg-transparent border-none outline-none p-0 m-0 focus:ring-0 text-xs text-inherit"
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-2 rounded-md bg-rose-500/10 text-rose-600 text-xs font-medium border border-rose-500/20 text-center"
            >
              {error}
            </motion.div>
          )}

          <button 
            type="submit"
            style={isAdminMode ? { backgroundColor: primaryColor } : {}}
            className={`w-full py-2.5 ${!isAdminMode ? 'bg-indigo-600 hover:bg-indigo-700' : ''} text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${!isAdminMode ? 'shadow-md shadow-indigo-600/10' : 'shadow-md shadow-emerald-900/10'}`}
          >
            {isAdminMode ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                Masuk Sekarang
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Masuk
              </>
            )}
          </button>

          {!isAdminMode && (appSettings?.login_guide_enabled === undefined || !!appSettings?.login_guide_enabled) && (
            <div className="text-center pt-1.5 space-y-2">
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className={`text-[10px] font-bold transition-all hover:underline outline-none focus:outline-none ${showGuide ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'}`}
              >
                {showGuide ? 'Sembunyikan Panduan Login' : 'Panduan Login'}
              </button>

              <AnimatePresence>
                {showGuide && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden text-left"
                  >
                    <div className={`p-3 rounded-xl border text-[10px] leading-relaxed whitespace-pre-line font-medium ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}>
                      {appSettings?.login_guide_content || 'Langkah-langkah Login:\n1. Pilih nama Anda pada pilihan "Nama Anda".\n2. Ketik Index KDK/GGF Anda dengan benar.\n3. Tekan tombol "Masuk" untuk masuk ke dashboard.\n\nJika nama Anda belum terdaftar, silakan hubungi tim Admin IT.'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
});
